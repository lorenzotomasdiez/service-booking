<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'default' | 'elevated' | 'outlined' | 'interactive' = 'default';
	export let padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let rounded: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xl';
	export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let hover = false;
	export let clickable = false;
	export let href: string | undefined = undefined;
	export let className = '';

	// For provider cards
	export let imageUrl: string | undefined = undefined;
	export let imageAlt = '';
	export let title = '';
	export let subtitle = '';
	export let rating: number | undefined = undefined;
	export let reviewCount: number | undefined = undefined;
	export let price: number | undefined = undefined;
	export let location = '';

	const dispatch = createEventDispatcher();

	// Base classes
	const baseClasses = 'bg-white border border-neutral-200 transition-all duration-200';

	// Variant classes
	const variantClasses = {
		default: '',
		elevated: 'shadow-medium',
		outlined: 'border-2',
		interactive: 'cursor-pointer hover:border-primary-600 hover:shadow-primary hover:-translate-y-1 active:scale-98'
	};

	// Padding classes
	const paddingClasses = {
		none: 'p-0',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8',
		xl: 'p-12'
	};

	// Rounded classes
	const roundedClasses = {
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		'2xl': 'rounded-2xl'
	};

	// Shadow classes
	const shadowClasses = {
		none: '',
		sm: 'shadow-sm',
		md: 'shadow-soft',
		lg: 'shadow-medium'
	};

	$: classes = [
		baseClasses,
		variantClasses[variant],
		paddingClasses[padding],
		roundedClasses[rounded],
		shadowClasses[shadow],
		hover ? 'hover:-translate-y-1 hover:shadow-medium' : '',
		clickable ? 'cursor-pointer' : '',
		className
	].filter(Boolean).join(' ');

	function handleClick(event: MouseEvent) {
		if (clickable) {
			dispatch('click', event);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (clickable && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			dispatch('click', event);
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function generateStars(rating: number): { filled: number; half: boolean; empty: number } {
		const filled = Math.floor(rating);
		const half = rating % 1 >= 0.5;
		const empty = 5 - filled - (half ? 1 : 0);
		return { filled, half, empty };
	}
</script>

{#if href}
	<a
		{href}
		class={classes}
		on:click={handleClick}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		{#if imageUrl}
			<!-- Image Header -->
			<div class="relative overflow-hidden rounded-t-{rounded} -m-6 mb-4">
				<img
					src={imageUrl}
					alt={imageAlt}
					class="w-full h-48 sm:h-56 object-cover"
					loading="lazy"
				/>
				{#if rating}
					<div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
						<div class="flex items-center gap-1 text-sm font-semibold">
							<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							<span class="text-neutral-800">{rating.toFixed(1)}</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content -->
		<div class="space-y-3">
			{#if title}
				<div>
					<h3 class="text-lg font-semibold text-neutral-800 line-clamp-2">
						{title}
					</h3>
					{#if subtitle}
						<p class="text-sm text-neutral-600 mt-1">
							{subtitle}
						</p>
					{/if}
				</div>
			{/if}

			{#if rating && reviewCount !== undefined}
				<div class="flex items-center gap-2">
					<div class="flex items-center">
						{#each { length: generateStars(rating).filled } as _}
							<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/each}
						{#if generateStars(rating).half}
							<svg class="w-4 h-4 text-yellow-400" viewBox="0 0 24 24">
								<defs>
									<linearGradient id="half">
										<stop offset="50%" stop-color="currentColor"/>
										<stop offset="50%" stop-color="transparent"/>
									</linearGradient>
								</defs>
								<path fill="url(#half)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/if}
						{#each { length: generateStars(rating).empty } as _}
							<svg class="w-4 h-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/each}
					</div>
					<span class="text-sm text-neutral-600">
						{rating.toFixed(1)} ({reviewCount} reseñas)
					</span>
				</div>
			{/if}

			{#if location}
				<div class="flex items-center gap-2 text-sm text-neutral-600">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
					</svg>
					{location}
				</div>
			{/if}

			{#if price !== undefined}
				<div class="flex items-center justify-between">
					<span class="text-lg font-bold text-primary-600 font-mono">
						Desde {formatCurrency(price)}
					</span>
					<div class="text-sm text-neutral-500">
						<slot name="price-suffix" />
					</div>
				</div>
			{/if}

			<slot />
		</div>
	</a>
{:else}
	<div
		class={classes}
		on:click={handleClick}
		on:keydown={handleKeydown}
		role={clickable ? 'button' : undefined}
		tabindex={clickable ? 0 : undefined}
	>
		{#if imageUrl}
			<!-- Image Header -->
			<div class="relative overflow-hidden rounded-t-{rounded} -m-6 mb-4">
				<img
					src={imageUrl}
					alt={imageAlt}
					class="w-full h-48 sm:h-56 object-cover"
					loading="lazy"
				/>
				{#if rating}
					<div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
						<div class="flex items-center gap-1 text-sm font-semibold">
							<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							<span class="text-neutral-800">{rating.toFixed(1)}</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content -->
		<div class="space-y-3">
			{#if title}
				<div>
					<h3 class="text-lg font-semibold text-neutral-800 line-clamp-2">
						{title}
					</h3>
					{#if subtitle}
						<p class="text-sm text-neutral-600 mt-1">
							{subtitle}
						</p>
					{/if}
				</div>
			{/if}

			{#if rating && reviewCount !== undefined}
				<div class="flex items-center gap-2">
					<div class="flex items-center">
						{#each { length: generateStars(rating).filled } as _}
							<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/each}
						{#if generateStars(rating).half}
							<svg class="w-4 h-4 text-yellow-400" viewBox="0 0 24 24">
								<defs>
									<linearGradient id="half">
										<stop offset="50%" stop-color="currentColor"/>
										<stop offset="50%" stop-color="transparent"/>
									</linearGradient>
								</defs>
								<path fill="url(#half)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/if}
						{#each { length: generateStars(rating).empty } as _}
							<svg class="w-4 h-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						{/each}
					</div>
					<span class="text-sm text-neutral-600">
						{rating.toFixed(1)} ({reviewCount} reseñas)
					</span>
				</div>
			{/if}

			{#if location}
				<div class="flex items-center gap-2 text-sm text-neutral-600">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
					</svg>
					{location}
				</div>
			{/if}

			{#if price !== undefined}
				<div class="flex items-center justify-between">
					<span class="text-lg font-bold text-primary-600 font-mono">
						Desde {formatCurrency(price)}
					</span>
					<div class="text-sm text-neutral-500">
						<slot name="price-suffix" />
					</div>
				</div>
			{/if}

			<slot />
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}
</style>