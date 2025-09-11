<!-- Comprehensive Skeleton Loading Component -->
<script lang="ts">
	export let variant: 'text' | 'avatar' | 'card' | 'list' | 'button' | 'provider' | 'booking' | 'dashboard' = 'text';
	export let count = 1;
	export let class: string = '';
	export let animated = true;
	export let rounded = false;
	export let width: string | undefined = undefined;
	export let height: string | undefined = undefined;
</script>

<div class="skeleton-container {class}">
	{#each Array(count) as _, index}
		<div class="skeleton-item {variant} {animated ? 'animate-pulse' : ''}" class:rounded>
			{#if variant === 'text'}
				<div 
					class="bg-neutral-200 rounded {rounded ? 'rounded-full' : 'rounded'}"
					style="width: {width || '100%'}; height: {height || '1rem'};"
				></div>
			{:else if variant === 'avatar'}
				<div 
					class="bg-neutral-200 rounded-full"
					style="width: {width || '2.5rem'}; height: {height || '2.5rem'};"
				></div>
			{:else if variant === 'button'}
				<div 
					class="bg-neutral-200 rounded-lg"
					style="width: {width || '6rem'}; height: {height || '2.5rem'};"
				></div>
			{:else if variant === 'card'}
				<div class="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
					<div class="flex items-start space-x-4">
						<div class="w-12 h-12 bg-neutral-200 rounded-lg"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 bg-neutral-200 rounded w-3/4"></div>
							<div class="h-3 bg-neutral-200 rounded w-1/2"></div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="h-3 bg-neutral-200 rounded"></div>
						<div class="h-3 bg-neutral-200 rounded w-4/5"></div>
					</div>
				</div>
			{:else if variant === 'list'}
				<div class="space-y-3">
					{#each Array(3) as _}
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-neutral-200 rounded-full"></div>
							<div class="flex-1 space-y-1">
								<div class="h-4 bg-neutral-200 rounded w-2/3"></div>
								<div class="h-3 bg-neutral-200 rounded w-1/2"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if variant === 'provider'}
				<div class="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
					<!-- Provider Header -->
					<div class="flex items-start space-x-4">
						<div class="w-16 h-16 bg-neutral-200 rounded-lg"></div>
						<div class="flex-1 space-y-2">
							<div class="h-5 bg-neutral-200 rounded w-3/4"></div>
							<div class="h-4 bg-neutral-200 rounded w-1/2"></div>
							<div class="flex space-x-2">
								<div class="h-4 bg-neutral-200 rounded w-20"></div>
								<div class="h-4 bg-neutral-200 rounded w-16"></div>
							</div>
						</div>
						<div class="w-8 h-8 bg-neutral-200 rounded"></div>
					</div>
					
					<!-- Services -->
					<div class="space-y-3">
						<div class="h-4 bg-neutral-200 rounded w-32"></div>
						<div class="grid grid-cols-2 gap-3">
							{#each Array(4) as _}
								<div class="p-3 border border-neutral-200 rounded-lg space-y-2">
									<div class="h-4 bg-neutral-200 rounded w-3/4"></div>
									<div class="h-3 bg-neutral-200 rounded w-1/2"></div>
								</div>
							{/each}
						</div>
					</div>
					
					<!-- Action Buttons -->
					<div class="flex space-x-3 pt-4 border-t border-neutral-200">
						<div class="h-10 bg-neutral-200 rounded-lg flex-1"></div>
						<div class="h-10 bg-neutral-200 rounded-lg w-24"></div>
					</div>
				</div>
			{:else if variant === 'booking'}
				<div class="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
					<!-- Booking Header -->
					<div class="flex items-start justify-between">
						<div class="flex items-start space-x-4">
							<div class="w-12 h-12 bg-neutral-200 rounded-lg"></div>
							<div class="space-y-2">
								<div class="h-5 bg-neutral-200 rounded w-48"></div>
								<div class="h-4 bg-neutral-200 rounded w-32"></div>
								<div class="h-3 bg-neutral-200 rounded w-24"></div>
							</div>
						</div>
						<div class="text-right space-y-2">
							<div class="h-5 bg-neutral-200 rounded w-20"></div>
							<div class="h-6 bg-neutral-200 rounded-full w-24"></div>
						</div>
					</div>
					
					<!-- Booking Details -->
					<div class="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
						<div class="space-y-1">
							<div class="h-3 bg-neutral-200 rounded w-16"></div>
							<div class="h-4 bg-neutral-200 rounded w-20"></div>
						</div>
						<div class="space-y-1">
							<div class="h-3 bg-neutral-200 rounded w-20"></div>
							<div class="h-4 bg-neutral-200 rounded w-24"></div>
						</div>
						<div class="space-y-1">
							<div class="h-3 bg-neutral-200 rounded w-18"></div>
							<div class="h-4 bg-neutral-200 rounded w-16"></div>
						</div>
					</div>
					
					<!-- Actions -->
					<div class="flex space-x-2 pt-4 border-t border-neutral-200">
						<div class="h-8 bg-neutral-200 rounded w-20"></div>
						<div class="h-8 bg-neutral-200 rounded w-24"></div>
						<div class="h-8 bg-neutral-200 rounded w-16"></div>
					</div>
				</div>
			{:else if variant === 'dashboard'}
				<div class="space-y-6">
					<!-- Header -->
					<div class="flex justify-between items-start">
						<div class="space-y-2">
							<div class="h-8 bg-neutral-200 rounded w-64"></div>
							<div class="h-4 bg-neutral-200 rounded w-48"></div>
						</div>
						<div class="flex space-x-3">
							<div class="h-10 bg-neutral-200 rounded w-32"></div>
							<div class="h-10 bg-neutral-200 rounded w-24"></div>
						</div>
					</div>
					
					<!-- Stats Cards -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{#each Array(4) as _}
							<div class="bg-white border border-neutral-200 rounded-lg p-6 text-center space-y-3">
								<div class="w-12 h-12 bg-neutral-200 rounded-lg mx-auto"></div>
								<div class="h-4 bg-neutral-200 rounded w-24 mx-auto"></div>
								<div class="h-6 bg-neutral-200 rounded w-16 mx-auto"></div>
							</div>
						{/each}
					</div>
					
					<!-- Main Content -->
					<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<!-- Left Column -->
						<div class="lg:col-span-2 space-y-6">
							<div class="bg-white border border-neutral-200 rounded-lg p-6">
								<div class="flex justify-between items-center mb-6">
									<div class="h-6 bg-neutral-200 rounded w-32"></div>
									<div class="h-4 bg-neutral-200 rounded w-20"></div>
								</div>
								
								<div class="space-y-4">
									{#each Array(3) as _}
										<div class="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg">
											<div class="w-12 h-12 bg-neutral-200 rounded-lg"></div>
											<div class="flex-1 space-y-2">
												<div class="h-4 bg-neutral-200 rounded w-3/4"></div>
												<div class="h-3 bg-neutral-200 rounded w-1/2"></div>
												<div class="h-3 bg-neutral-200 rounded w-1/3"></div>
											</div>
											<div class="text-right space-y-2">
												<div class="h-4 bg-neutral-200 rounded w-20"></div>
												<div class="h-6 bg-neutral-200 rounded-full w-24"></div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
						
						<!-- Right Column -->
						<div class="space-y-6">
							<div class="bg-white border border-neutral-200 rounded-lg p-6">
								<div class="h-6 bg-neutral-200 rounded w-36 mb-4"></div>
								<div class="space-y-3">
									{#each Array(4) as _}
										<div class="h-10 bg-neutral-200 rounded w-full"></div>
									{/each}
								</div>
							</div>
							
							<div class="bg-white border border-neutral-200 rounded-lg p-6">
								<div class="h-6 bg-neutral-200 rounded w-32 mb-4"></div>
								<div class="space-y-4">
									{#each Array(4) as _}
										<div class="flex justify-between items-center">
											<div class="h-3 bg-neutral-200 rounded w-24"></div>
											<div class="h-4 bg-neutral-200 rounded w-16"></div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.skeleton-container {
		@apply space-y-4;
	}
	
	.skeleton-item.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: .5;
		}
	}
	
	/* Shimmer effect for enhanced loading experience */
	.skeleton-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
		animation: shimmer 1.5s ease-in-out infinite;
	}
	
	@keyframes shimmer {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}
	
	/* Disable shimmer on reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-item::before {
			animation: none;
		}
		
		.skeleton-item.animate-pulse {
			animation: none;
		}
	}
</style>