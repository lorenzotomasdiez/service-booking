<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' = 'text';
	export let value = '';
	export let placeholder = '';
	export let label = '';
	export let id = '';
	export let name = '';
	export let required = false;
	export let disabled = false;
	export let readonly = false;
	export let autocomplete: string | undefined = undefined;
	export let maxlength: number | undefined = undefined;
	export let minlength: number | undefined = undefined;
	export let min: string | number | undefined = undefined;
	export let max: string | number | undefined = undefined;
	export let step: string | number | undefined = undefined;
	export let pattern: string | undefined = undefined;
	export let error = '';
	export let success = '';
	export let hint = '';
	export let className = '';
	export let inputClassName = '';

	// Argentina-specific formatting
	export let format: 'none' | 'phone' | 'dni' | 'currency' = 'none';

	const dispatch = createEventDispatcher();

	// Generate unique ID if not provided
	const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

	// Base input classes
	const baseInputClasses = 'w-full px-4 py-3 text-base border-2 rounded-lg font-sans bg-white text-neutral-800 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-opacity-20 hover:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-neutral-400';

	// State classes
	$: stateClasses = error 
		? 'border-error-600 focus:border-error-600 focus:ring-error-600' 
		: success 
		? 'border-success-600 focus:border-success-600 focus:ring-success-600'
		: 'border-neutral-200 focus:border-primary-600 focus:ring-primary-600';

	// Format-specific classes
	const formatClasses = {
		none: '',
		phone: 'font-mono tracking-wide',
		dni: 'font-mono tracking-wider',
		currency: 'font-mono text-right'
	};

	$: inputClasses = [
		baseInputClasses,
		stateClasses,
		formatClasses[format],
		inputClassName
	].filter(Boolean).join(' ');

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let newValue = target.value;

		// Apply Argentina-specific formatting
		if (format === 'phone') {
			newValue = formatArgentinaPhone(newValue);
		} else if (format === 'dni') {
			newValue = formatArgentinaDNI(newValue);
		} else if (format === 'currency') {
			newValue = formatCurrency(newValue);
		}

		value = newValue;
		target.value = newValue;
		
		dispatch('input', { value: newValue, originalEvent: event });
	}

	function handleChange(event: Event) {
		dispatch('change', { value, originalEvent: event });
	}

	function handleFocus(event: FocusEvent) {
		dispatch('focus', { value, originalEvent: event });
	}

	function handleBlur(event: FocusEvent) {
		dispatch('blur', { value, originalEvent: event });
	}

	// Argentina phone formatting: +54 9 11 1234-5678
	function formatArgentinaPhone(input: string): string {
		// Remove all non-digits
		const digits = input.replace(/\D/g, '');
		
		// Limit to 13 digits (country code + area code + number)
		const limited = digits.substring(0, 13);
		
		// Format based on length
		if (limited.length <= 2) return limited;
		if (limited.length <= 3) return `+${limited}`;
		if (limited.length <= 4) return `+${limited.substring(0, 2)} ${limited.substring(2)}`;
		if (limited.length <= 6) return `+${limited.substring(0, 2)} ${limited.substring(2, 3)} ${limited.substring(3)}`;
		if (limited.length <= 10) return `+${limited.substring(0, 2)} ${limited.substring(2, 3)} ${limited.substring(3, 6)} ${limited.substring(6)}`;
		return `+${limited.substring(0, 2)} ${limited.substring(2, 3)} ${limited.substring(3, 6)} ${limited.substring(6, 10)}-${limited.substring(10)}`;
	}

	// Argentina DNI formatting: 12.345.678
	function formatArgentinaDNI(input: string): string {
		// Remove all non-digits
		const digits = input.replace(/\D/g, '');
		
		// Limit to 8 digits
		const limited = digits.substring(0, 8);
		
		// Format with dots
		if (limited.length <= 2) return limited;
		if (limited.length <= 5) return `${limited.substring(0, 2)}.${limited.substring(2)}`;
		return `${limited.substring(0, 2)}.${limited.substring(2, 5)}.${limited.substring(5)}`;
	}

	// Currency formatting (basic)
	function formatCurrency(input: string): string {
		// Remove all non-digits and non-decimal points
		const cleaned = input.replace(/[^0-9.]/g, '');
		
		// Ensure only one decimal point
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return `${parts[0]}.${parts.slice(1).join('')}`;
		}
		
		return cleaned;
	}
</script>

<div class="space-y-2 {className}">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-neutral-700">
			{label}
			{#if required}
				<span class="text-error-500 ml-1">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			{type}
			id={inputId}
			{name}
			{placeholder}
			{required}
			{disabled}
			{readonly}
			{autocomplete}
			{maxlength}
			{minlength}
			{min}
			{max}
			{step}
			{pattern}
			{value}
			class={inputClasses}
			on:input={handleInput}
			on:change={handleChange}
			on:focus={handleFocus}
			on:blur={handleBlur}
		/>

		{#if success && !error}
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
				<svg class="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
		{/if}

		{#if error}
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
				<svg class="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-sm text-error-600 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			{error}
		</p>
	{:else if success}
		<p class="text-sm text-success-600 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
			{success}
		</p>
	{:else if hint}
		<p class="text-sm text-neutral-500">
			{hint}
		</p>
	{/if}
</div>