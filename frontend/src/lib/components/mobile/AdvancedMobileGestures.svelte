<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let enableSwipeGestures = true;
	export let enablePullToRefresh = true;
	export let enableLongPress = true;
	export let enablePinchZoom = false;
	export let enableShake = false;
	export let swipeThreshold = 50; // pixels
	export let longPressDelay = 500; // ms
	export let pullToRefreshThreshold = 80; // pixels

	interface TouchPoint {
		identifier: number;
		x: number;
		y: number;
		startX: number;
		startY: number;
		timestamp: number;
	}

	interface GestureState {
		touchPoints: Map<number, TouchPoint>;
		isTracking: boolean;
		isPullToRefresh: boolean;
		isLongPress: boolean;
		longPressTimer: NodeJS.Timeout | null;
		lastSwipeDirection: 'left' | 'right' | 'up' | 'down' | null;
		initialDistance: number;
		currentDistance: number;
		pullDistance: number;
	}

	let containerElement: HTMLElement;
	let gestureState: GestureState = {
		touchPoints: new Map(),
		isTracking: false,
		isPullToRefresh: false,
		isLongPress: false,
		longPressTimer: null,
		lastSwipeDirection: null,
		initialDistance: 0,
		currentDistance: 0,
		pullDistance: 0
	};

	// Shake detection variables
	let lastAcceleration = { x: 0, y: 0, z: 0 };
	let shakeThreshold = 15;
	let shakeCooldown = 1000;
	let lastShakeTime = 0;

	onMount(() => {
		setupTouchHandlers();
		if (enableShake) {
			setupShakeDetection();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	function setupTouchHandlers() {
		if (!containerElement) return;

		containerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
		containerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
		containerElement.addEventListener('touchend', handleTouchEnd, { passive: false });
		containerElement.addEventListener('touchcancel', handleTouchCancel, { passive: false });
	}

	function setupShakeDetection() {
		if (!window.DeviceMotionEvent) return;

		window.addEventListener('devicemotion', handleDeviceMotion);
	}

	function handleTouchStart(event: TouchEvent) {
		const touch = event.touches[0];
		const touchPoint: TouchPoint = {
			identifier: touch.identifier,
			x: touch.clientX,
			y: touch.clientY,
			startX: touch.clientX,
			startY: touch.clientY,
			timestamp: Date.now()
		};

		gestureState.touchPoints.set(touch.identifier, touchPoint);
		gestureState.isTracking = true;

		// Start long press timer
		if (enableLongPress && event.touches.length === 1) {
			gestureState.longPressTimer = setTimeout(() => {
				if (gestureState.isTracking) {
					handleLongPress(touchPoint);
				}
			}, longPressDelay);
		}

		// Handle multi-touch for pinch zoom
		if (event.touches.length === 2 && enablePinchZoom) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			gestureState.initialDistance = getDistance(touch1, touch2);
		}

		// Argentina mobile optimization: prevent default for certain gestures
		if (enableSwipeGestures || enablePullToRefresh) {
			event.preventDefault();
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!gestureState.isTracking) return;

		const touch = event.touches[0];
		const touchPoint = gestureState.touchPoints.get(touch.identifier);
		
		if (!touchPoint) return;

		// Update touch position
		touchPoint.x = touch.clientX;
		touchPoint.y = touch.clientY;

		// Cancel long press if moved too much
		if (gestureState.longPressTimer) {
			const moveDistance = Math.sqrt(
				Math.pow(touch.clientX - touchPoint.startX, 2) +
				Math.pow(touch.clientY - touchPoint.startY, 2)
			);
			
			if (moveDistance > 10) {
				clearTimeout(gestureState.longPressTimer);
				gestureState.longPressTimer = null;
			}
		}

		// Handle pull to refresh
		if (enablePullToRefresh && event.touches.length === 1) {
			const pullDistance = touch.clientY - touchPoint.startY;
			
			if (pullDistance > 0 && window.scrollY === 0) {
				gestureState.pullDistance = Math.min(pullDistance, pullToRefreshThreshold * 1.5);
				gestureState.isPullToRefresh = pullDistance > pullToRefreshThreshold;
				
				dispatch('pull-to-refresh-change', {
					distance: gestureState.pullDistance,
					threshold: pullToRefreshThreshold,
					active: gestureState.isPullToRefresh
				});
				
				event.preventDefault();
			}
		}

		// Handle pinch zoom
		if (event.touches.length === 2 && enablePinchZoom) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			gestureState.currentDistance = getDistance(touch1, touch2);
			
			const scale = gestureState.currentDistance / gestureState.initialDistance;
			
			dispatch('pinch-zoom', {
				scale,
				centerX: (touch1.clientX + touch2.clientX) / 2,
				centerY: (touch1.clientY + touch2.clientY) / 2
			});
			
			event.preventDefault();
		}

		// Handle swipe detection during move
		if (enableSwipeGestures && event.touches.length === 1) {
			const deltaX = touch.clientX - touchPoint.startX;
			const deltaY = touch.clientY - touchPoint.startY;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			
			if (distance > swipeThreshold) {
				const direction = getSwipeDirection(deltaX, deltaY);
				
				if (direction !== gestureState.lastSwipeDirection) {
					gestureState.lastSwipeDirection = direction;
					
					dispatch('swipe', {
						direction,
						startX: touchPoint.startX,
						startY: touchPoint.startY,
						currentX: touch.clientX,
						currentY: touch.clientY,
						deltaX,
						deltaY,
						distance,
						velocity: calculateVelocity(touchPoint, touch)
					});
				}
			}
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		// Clear long press timer
		if (gestureState.longPressTimer) {
			clearTimeout(gestureState.longPressTimer);
			gestureState.longPressTimer = null;
		}

		// Handle pull to refresh completion
		if (gestureState.isPullToRefresh && enablePullToRefresh) {
			dispatch('pull-to-refresh-trigger');
			gestureState.isPullToRefresh = false;
			gestureState.pullDistance = 0;
		}

		// Handle swipe completion
		if (enableSwipeGestures && gestureState.touchPoints.size === 1) {
			const touchPoint = Array.from(gestureState.touchPoints.values())[0];
			const finalTouch = event.changedTouches[0];
			
			const deltaX = finalTouch.clientX - touchPoint.startX;
			const deltaY = finalTouch.clientY - touchPoint.startY;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			const duration = Date.now() - touchPoint.timestamp;
			
			if (distance > swipeThreshold) {
				const direction = getSwipeDirection(deltaX, deltaY);
				const velocity = distance / duration; // px/ms
				
				dispatch('swipe-end', {
					direction,
					distance,
					velocity,
					duration,
					fast: velocity > 0.5 // Fast swipe threshold
				});
			}
		}

		// Handle tap
		if (event.changedTouches.length === 1 && gestureState.touchPoints.size === 1) {
			const touchPoint = Array.from(gestureState.touchPoints.values())[0];
			const finalTouch = event.changedTouches[0];
			const duration = Date.now() - touchPoint.timestamp;
			
			const deltaX = finalTouch.clientX - touchPoint.startX;
			const deltaY = finalTouch.clientY - touchPoint.startY;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			
			// Register tap if movement was minimal and duration was short
			if (distance < 10 && duration < 300) {
				dispatch('tap', {
					x: finalTouch.clientX,
					y: finalTouch.clientY,
					duration
				});
			}
		}

		// Clean up touch points
		for (const touch of event.changedTouches) {
			gestureState.touchPoints.delete(touch.identifier);
		}

		if (gestureState.touchPoints.size === 0) {
			gestureState.isTracking = false;
			gestureState.lastSwipeDirection = null;
		}
	}

	function handleTouchCancel(event: TouchEvent) {
		// Clean up on touch cancel
		if (gestureState.longPressTimer) {
			clearTimeout(gestureState.longPressTimer);
			gestureState.longPressTimer = null;
		}

		gestureState.isPullToRefresh = false;
		gestureState.pullDistance = 0;
		gestureState.isTracking = false;
		gestureState.touchPoints.clear();
		gestureState.lastSwipeDirection = null;

		dispatch('gesture-cancel');
	}

	function handleLongPress(touchPoint: TouchPoint) {
		gestureState.isLongPress = true;
		
		dispatch('long-press', {
			x: touchPoint.x,
			y: touchPoint.y,
			startX: touchPoint.startX,
			startY: touchPoint.startY,
			duration: Date.now() - touchPoint.timestamp
		});

		// Provide haptic feedback if available
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}
	}

	function handleDeviceMotion(event: DeviceMotionEvent) {
		if (!event.accelerationIncludingGravity) return;

		const { x, y, z } = event.accelerationIncludingGravity;
		if (x === null || y === null || z === null) return;

		// Calculate acceleration delta
		const deltaX = Math.abs(x - lastAcceleration.x);
		const deltaY = Math.abs(y - lastAcceleration.y);
		const deltaZ = Math.abs(z - lastAcceleration.z);

		const totalDelta = deltaX + deltaY + deltaZ;
		const now = Date.now();

		// Detect shake gesture
		if (totalDelta > shakeThreshold && now - lastShakeTime > shakeCooldown) {
			lastShakeTime = now;
			
			dispatch('shake', {
				intensity: totalDelta,
				acceleration: { x, y, z },
				delta: { deltaX, deltaY, deltaZ }
			});

			// Provide haptic feedback
			if (navigator.vibrate) {
				navigator.vibrate([100, 50, 100]);
			}
		}

		lastAcceleration = { x, y, z };
	}

	function getDistance(touch1: Touch, touch2: Touch): number {
		const deltaX = touch2.clientX - touch1.clientX;
		const deltaY = touch2.clientY - touch1.clientY;
		return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	}

	function getSwipeDirection(deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' {
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			return deltaX > 0 ? 'right' : 'left';
		} else {
			return deltaY > 0 ? 'down' : 'up';
		}
	}

	function calculateVelocity(touchPoint: TouchPoint, currentTouch: Touch): number {
		const deltaX = currentTouch.clientX - touchPoint.startX;
		const deltaY = currentTouch.clientY - touchPoint.startY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const duration = Date.now() - touchPoint.timestamp;
		
		return distance / Math.max(duration, 1); // px/ms
	}

	function cleanup() {
		if (gestureState.longPressTimer) {
			clearTimeout(gestureState.longPressTimer);
		}

		if (containerElement) {
			containerElement.removeEventListener('touchstart', handleTouchStart);
			containerElement.removeEventListener('touchmove', handleTouchMove);
			containerElement.removeEventListener('touchend', handleTouchEnd);
			containerElement.removeEventListener('touchcancel', handleTouchCancel);
		}

		if (enableShake) {
			window.removeEventListener('devicemotion', handleDeviceMotion);
		}
	}

	// Programmatic gesture methods
	export function simulateSwipe(direction: 'left' | 'right' | 'up' | 'down') {
		dispatch('swipe', {
			direction,
			startX: 0,
			startY: 0,
			currentX: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
			currentY: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
			deltaX: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
			deltaY: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
			distance: 100,
			velocity: 1,
			programmatic: true
		});
	}

	export function getGestureState() {
		return {
			isTracking: gestureState.isTracking,
			isPullToRefresh: gestureState.isPullToRefresh,
			isLongPress: gestureState.isLongPress,
			touchCount: gestureState.touchPoints.size,
			pullDistance: gestureState.pullDistance
		};
	}
</script>

<!-- Argentina Mobile Gesture Container -->
<div 
	bind:this={containerElement}
	class="gesture-container w-full h-full relative"
	class:tracking={gestureState.isTracking}
	class:pull-active={gestureState.isPullToRefresh}
	class:long-press-active={gestureState.isLongPress}
	role="region"
	aria-label="Área de gestos táctiles"
>
	<!-- Pull to Refresh Indicator -->
	{#if enablePullToRefresh && gestureState.pullDistance > 0}
		<div 
			class="pull-to-refresh-indicator absolute top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
			style="height: {Math.min(gestureState.pullDistance, pullToRefreshThreshold)}px; opacity: {Math.min(gestureState.pullDistance / pullToRefreshThreshold, 1)}"
		>
			<div class="flex items-center gap-2 text-primary-600">
				{#if gestureState.isPullToRefresh}
					<div class="animate-spin">🔄</div>
					<span class="text-sm font-medium">Suelta para actualizar</span>
				{:else}
					<div class="transform transition-transform" style="transform: rotate({gestureState.pullDistance}deg)">⬇️</div>
					<span class="text-sm">Desliza hacia abajo</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Long Press Indicator -->
	{#if enableLongPress && gestureState.isLongPress}
		<div class="long-press-indicator absolute inset-0 pointer-events-none z-40">
			<div class="absolute inset-0 bg-primary-600/10 animate-pulse"></div>
			<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-sm">
				Presión larga detectada
			</div>
		</div>
	{/if}

	<!-- Swipe Direction Indicator -->
	{#if enableSwipeGestures && gestureState.lastSwipeDirection}
		<div class="swipe-indicator absolute top-4 right-4 z-40 bg-white/90 rounded-full p-2 shadow-lg">
			<div class="w-6 h-6 flex items-center justify-center text-lg">
				{#if gestureState.lastSwipeDirection === 'left'}⬅️
				{:else if gestureState.lastSwipeDirection === 'right'}➡️
				{:else if gestureState.lastSwipeDirection === 'up'}⬆️
				{:else if gestureState.lastSwipeDirection === 'down'}⬇️
				{/if}
			</div>
		</div>
	{/if}

	<!-- Touch Points Visualization (Development Mode) -->
	{#if process.env.NODE_ENV === 'development'}
		{#each Array.from(gestureState.touchPoints.values()) as touchPoint}
			<div 
				class="touch-point absolute pointer-events-none z-50 w-12 h-12 border-2 border-red-500 rounded-full bg-red-500/20"
				style="left: {touchPoint.x - 24}px; top: {touchPoint.y - 24}px;"
			>
				<div class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-1 rounded">
					{touchPoint.identifier}
				</div>
			</div>
		{/each}
	{/if}

	<!-- Content Slot -->
	<slot />
</div>

<!-- Argentina-specific mobile gesture styles -->
<style>
	.gesture-container {
		/* Optimize for Argentina mobile touch performance */
		touch-action: manipulation;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		overscroll-behavior: contain;
	}

	.gesture-container.tracking {
		/* Disable text selection during gestures */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.pull-to-refresh-indicator {
		background: linear-gradient(to bottom, rgba(37, 99, 235, 0.1), transparent);
		backdrop-filter: blur(4px);
	}

	.long-press-indicator {
		animation: longPressIndicator 0.3s ease-out;
	}

	.swipe-indicator {
		animation: swipeIndicator 0.3s ease-out;
		animation-fill-mode: forwards;
	}

	@keyframes longPressIndicator {
		0% {
			opacity: 0;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes swipeIndicator {
		0% {
			opacity: 0;
			transform: scale(0.5) translateY(-10px);
		}
		50% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		100% {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
	}

	.touch-point {
		transition: all 0.1s ease-out;
	}

	/* Accessibility improvements for gesture feedback */
	@media (prefers-reduced-motion: reduce) {
		.pull-to-refresh-indicator,
		.long-press-indicator,
		.swipe-indicator,
		.touch-point {
			animation: none;
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.pull-to-refresh-indicator {
			background: rgba(0, 0, 0, 0.1);
			border: 1px solid currentColor;
		}
		
		.long-press-indicator {
			background: rgba(0, 0, 0, 0.2);
		}
	}

	/* Argentina mobile network optimization */
	@media (max-width: 768px) {
		.gesture-container {
			/* Optimize for slower mobile networks */
			contain: layout style paint;
			will-change: transform;
		}
	}
</style>