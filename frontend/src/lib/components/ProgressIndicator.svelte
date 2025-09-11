<script lang="ts">
	export let percentage: number = 0;
	export let showLabel = true;
	export let label = 'Progreso';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'primary' | 'success' | 'warning' | 'danger' = 'primary';
	export let animate = true;
	export let className = '';

	// Clamp percentage between 0 and 100
	$: clampedPercentage = Math.max(0, Math.min(100, percentage));

	// Size classes
	const sizeClasses = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	};

	// Variant colors
	const variantClasses = {
		primary: 'bg-primary-500',
		success: 'bg-success-500',
		warning: 'bg-warning-500',
		danger: 'bg-error-500'
	};

	// Get status color for text
	$: statusColor = percentage >= 100 
		? 'text-success-600' 
		: percentage >= 75 
		? 'text-primary-600'
		: percentage >= 50 
		? 'text-warning-600'
		: 'text-neutral-600';

	// Get status message
	$: statusMessage = percentage >= 100 
		? '¡Perfil completo!' 
		: percentage >= 75 
		? 'Casi terminado'
		: percentage >= 50 
		? 'Buen progreso'
		: 'Completa tu perfil';
</script>

<div class="space-y-2 {className}">
	{#if showLabel}
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-neutral-700">
				{label}
			</span>
			<span class="text-sm font-medium {statusColor}">
				{Math.round(clampedPercentage)}%
			</span>
		</div>
	{/if}

	<!-- Progress bar -->
	<div class="w-full bg-neutral-200 rounded-full overflow-hidden {sizeClasses[size]}">
		<div
			class="h-full rounded-full transition-all duration-700 ease-out {variantClasses[variant]}"
			class:animate-pulse={animate && clampedPercentage < 100}
			style="width: {clampedPercentage}%"
		></div>
	</div>

	{#if showLabel && percentage < 100}
		<p class="text-xs {statusColor}">
			{statusMessage}
		</p>
	{/if}
</div>