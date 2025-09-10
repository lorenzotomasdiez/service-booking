<script lang="ts">
	export let variant: 'spinner' | 'skeleton' | 'pulse' | 'dots' = 'spinner';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let color: 'primary' | 'secondary' | 'neutral' | 'white' = 'primary';
	export let text = '';
	export let fullScreen = false;
	export let className = '';

	// Skeleton-specific props
	export let lines = 3;
	export let avatar = false;
	export let image = false;

	// Size classes for different variants
	const spinnerSizes = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-12 h-12'
	};

	const dotSizes = {
		sm: 'w-1 h-1',
		md: 'w-2 h-2',
		lg: 'w-3 h-3',
		xl: 'w-4 h-4'
	};

	// Color classes
	const colorClasses = {
		primary: 'text-primary-600',
		secondary: 'text-secondary-600',
		neutral: 'text-neutral-600',
		white: 'text-white'
	};

	// Text size classes
	const textSizes = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

{#if fullScreen}
	<div class="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="text-center space-y-4">
			{#if variant === 'spinner'}
				<svg
					class="animate-spin {spinnerSizes[size]} {colorClasses[color]} mx-auto"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else if variant === 'dots'}
				<div class="flex items-center justify-center space-x-2">
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full"></div>
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full" style="animation-delay: 0.1s"></div>
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full" style="animation-delay: 0.2s"></div>
				</div>
			{/if}
			
			{#if text}
				<p class="{textSizes[size]} {colorClasses[color]} font-medium">
					{text}
				</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center {className}">
		{#if variant === 'spinner'}
			<div class="text-center space-y-3">
				<svg
					class="animate-spin {spinnerSizes[size]} {colorClasses[color]} mx-auto"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				
				{#if text}
					<p class="{textSizes[size]} {colorClasses[color]} font-medium">
						{text}
					</p>
				{/if}
			</div>
		{:else if variant === 'dots'}
			<div class="text-center space-y-3">
				<div class="flex items-center justify-center space-x-2">
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full"></div>
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full" style="animation-delay: 0.1s"></div>
					<div class="animate-bounce {dotSizes[size]} {colorClasses[color]} bg-current rounded-full" style="animation-delay: 0.2s"></div>
				</div>
				
				{#if text}
					<p class="{textSizes[size]} {colorClasses[color]} font-medium">
						{text}
					</p>
				{/if}
			</div>
		{:else if variant === 'pulse'}
			<div class="animate-pulse space-y-3 w-full">
				{#if avatar}
					<div class="flex items-center space-x-4">
						<div class="w-12 h-12 bg-neutral-200 rounded-full"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 bg-neutral-200 rounded w-3/4"></div>
							<div class="h-3 bg-neutral-200 rounded w-1/2"></div>
						</div>
					</div>
				{/if}
				
				{#if image}
					<div class="w-full h-48 bg-neutral-200 rounded-lg"></div>
				{/if}
				
				{#each Array(lines) as _, i}
					<div 
						class="h-4 bg-neutral-200 rounded"
						style="width: {100 - (i * 10)}%"
					></div>
				{/each}
			</div>
		{:else if variant === 'skeleton'}
			<div class="space-y-3 w-full">
				{#if avatar}
					<div class="flex items-center space-x-4">
						<div class="skeleton w-12 h-12 rounded-full"></div>
						<div class="flex-1 space-y-2">
							<div class="skeleton h-4 w-3/4"></div>
							<div class="skeleton h-3 w-1/2"></div>
						</div>
					</div>
				{/if}
				
				{#if image}
					<div class="skeleton w-full h-48 rounded-lg"></div>
				{/if}
				
				{#each Array(lines) as _, i}
					<div 
						class="skeleton h-4"
						style="width: {100 - (i * 10)}%"
					></div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-radius: 0.375rem;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Optimized for Argentina's 3G/4G networks */
	@media (prefers-reduced-motion: reduce) {
		.animate-spin,
		.animate-bounce,
		.animate-pulse,
		.skeleton {
			animation-duration: 2s;
		}
	}

	/* Performance optimization for mobile devices */
	.animate-spin,
	.animate-bounce {
		will-change: transform;
		backface-visibility: hidden;
	}
</style>