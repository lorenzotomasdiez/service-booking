<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let open = false;
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let closable = true;
	export let closeOnEscape = true;
	export let closeOnBackdrop = true;
	export let title = '';
	export let className = '';
	export let backdropClassName = '';
	export let contentClassName = '';

	const dispatch = createEventDispatcher();

	let modal: HTMLDivElement;
	let previousActiveElement: HTMLElement | null = null;

	// Size classes
	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
	};

	$: if (browser) {
		if (open) {
			openModal();
		} else {
			closeModal();
		}
	}

	function openModal() {
		if (!browser) return;

		// Store the currently focused element
		previousActiveElement = document.activeElement as HTMLElement;

		// Prevent body scroll
		document.body.style.overflow = 'hidden';
		document.body.style.paddingRight = getScrollbarWidth() + 'px';

		// Focus the modal
		setTimeout(() => {
			if (modal) {
				modal.focus();
			}
		}, 100);

		dispatch('open');
	}

	function closeModal() {
		if (!browser) return;

		// Restore body scroll
		document.body.style.overflow = '';
		document.body.style.paddingRight = '';

		// Restore focus
		if (previousActiveElement) {
			previousActiveElement.focus();
			previousActiveElement = null;
		}

		dispatch('close');
	}

	function handleClose() {
		if (closable) {
			open = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			handleClose();
		}

		// Trap focus within modal
		if (event.key === 'Tab') {
			trapFocus(event);
		}
	}

	function trapFocus(event: KeyboardEvent) {
		if (!modal) return;

		const focusableElements = modal.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.shiftKey) {
			if (document.activeElement === firstElement) {
				lastElement?.focus();
				event.preventDefault();
			}
		} else {
			if (document.activeElement === lastElement) {
				firstElement?.focus();
				event.preventDefault();
			}
		}
	}

	function getScrollbarWidth(): number {
		if (!browser) return 0;
		const scrollDiv = document.createElement('div');
		scrollDiv.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;';
		document.body.appendChild(scrollDiv);
		const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
		document.body.removeChild(scrollDiv);
		return scrollbarWidth;
	}

	onMount(() => {
		if (open) {
			openModal();
		}
	});

	onDestroy(() => {
		if (browser) {
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		}
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden"
		aria-modal="true"
		role="dialog"
		bind:this={modal}
		tabindex="-1"
		on:keydown={handleKeydown}
	>
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 {backdropClassName}"
			on:click={handleBackdropClick}
		></div>

		<!-- Modal Container -->
		<div class="relative min-h-full flex items-center justify-center p-4">
			<!-- Modal Content -->
			<div
				class="relative bg-white rounded-2xl shadow-strong w-full {sizeClasses[size]} {className} animate-scale-in"
				on:click|stopPropagation
			>
				<!-- Header -->
				{#if title || closable || $$slots.header}
					<div class="flex items-center justify-between p-6 border-b border-neutral-200">
						{#if $$slots.header}
							<slot name="header" />
						{:else if title}
							<h2 class="text-xl font-semibold text-neutral-800">
								{title}
							</h2>
						{:else}
							<div></div>
						{/if}

						{#if closable}
							<button
								type="button"
								class="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors touch-manipulation"
								on:click={handleClose}
								aria-label="Cerrar modal"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/if}

				<!-- Body -->
				<div class="p-6 {contentClassName}">
					<slot />
				</div>

				<!-- Footer -->
				{#if $$slots.footer}
					<div class="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
						<slot name="footer" />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes scale-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-scale-in {
		animation: scale-in 0.2s ease-out;
	}
</style>