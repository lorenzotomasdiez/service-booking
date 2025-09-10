<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let href: string | undefined = undefined;
	export let target: string | undefined = undefined;
	export let fullWidth = false;
	export let className = '';

	const dispatch = createEventDispatcher();

	// Base classes for all buttons
	const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation tap-highlight-none';

	// Size classes
	const sizeClasses = {
		sm: 'px-4 py-2 text-sm rounded-lg min-h-[40px] gap-1.5',
		md: 'px-6 py-3 text-base rounded-lg min-h-[48px] gap-2',
		lg: 'px-8 py-4 text-lg rounded-lg min-h-[56px] gap-2'
	};

	// Variant classes
	const variantClasses = {
		primary: 'bg-primary-600 text-white border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700 focus:ring-primary-500 hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0 active:bg-primary-800',
		secondary: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700 focus:ring-primary-500',
		ghost: 'bg-transparent text-neutral-500 border-2 border-transparent hover:bg-neutral-100 hover:text-neutral-700 focus:ring-neutral-500',
		success: 'bg-success-600 text-white border-2 border-success-600 hover:bg-success-700 hover:border-success-700 focus:ring-success-500',
		danger: 'bg-error-600 text-white border-2 border-error-600 hover:bg-error-700 hover:border-error-700 focus:ring-error-500'
	};

	$: classes = [
		baseClasses,
		sizeClasses[size],
		variantClasses[variant],
		fullWidth ? 'w-full' : '',
		className
	].filter(Boolean).join(' ');

	function handleClick(event: MouseEvent) {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		dispatch('click', event);
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.key === 'Enter' || event.key === ' ') && !disabled && !loading) {
			event.preventDefault();
			dispatch('click', event);
		}
	}
</script>

{#if href}
	<a
		{href}
		{target}
		class={classes}
		class:pointer-events-none={disabled || loading}
		on:click={handleClick}
		on:keydown={handleKeydown}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-disabled={disabled || loading}
	>
		{#if loading}
			<svg
				class="animate-spin w-5 h-5"
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
		{/if}
		
		<slot />
	</a>
{:else}
	<button
		{type}
		{disabled}
		class={classes}
		on:click={handleClick}
	>
		{#if loading}
			<svg
				class="animate-spin w-5 h-5"
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
		{/if}
		
		<slot />
	</button>
{/if}