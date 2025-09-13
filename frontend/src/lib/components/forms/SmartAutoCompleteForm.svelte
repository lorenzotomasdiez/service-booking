<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import DOMPurify from 'dompurify';

	const dispatch = createEventDispatcher();

	export let formData: Record<string, any> = {};
	export let formSchema: FormField[] = [];
	export let enableAutocomplete = true;
	export let enableSmartSuggestions = true;
	export let enableArgentineValidation = true;
	export let saveProgress = true;
	export let suggestionLimit = 5;
	export let validationMode: 'onBlur' | 'onChange' | 'onSubmit' = 'onBlur';

	interface FormField {
		name: string;
		type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'dni' | 'cuil' | 'cuit' | 'address';
		label: string;
		placeholder?: string;
		required?: boolean;
		validation?: ValidationRule[];
		autocomplete?: string;
		suggestions?: string[] | (() => Promise<string[]>);
		dependsOn?: string[];
		conditional?: (formData: Record<string, any>) => boolean;
		argentineSpecific?: boolean;
		maxLength?: number;
		pattern?: string;
		options?: Array<{value: string; label: string}>;
	}

	interface ValidationRule {
		type: 'required' | 'email' | 'phone' | 'dni' | 'cuil' | 'cuit' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
		value?: any;
		message: string;
		argentineSpecific?: boolean;
	}

	interface FieldState {
		value: any;
		touched: boolean;
		focused: boolean;
		valid: boolean;
		errors: string[];
		suggestions: string[];
		showSuggestions: boolean;
		loading: boolean;
	}

	let fieldStates: Record<string, FieldState> = {};
	let formElement: HTMLFormElement;
	let suggestionCache = new Map<string, string[]>();
	let debounceTimers = new Map<string, NodeJS.Timeout>();
	let autocompleteData: Record<string, string[]> = {};
	let formProgress = 0;

	// Argentina-specific data
	const argentineProvinces = [
		'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
		'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
		'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
		'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
	];

	const argentineCities = {
		'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría'],
		'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María'],
		'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto'],
		'Mendoza': ['Mendoza', 'San Rafael', 'Malargüe', 'San Martín']
		// Add more as needed
	};

	const commonArgentineNames = [
		'Juan', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Antonio', 'Isabel',
		'Manuel', 'Dolores', 'Francisco', 'Pilar', 'Rafael', 'Mercedes', 'Miguel',
		'Rosa', 'Ángel', 'Josefa', 'Jesús', 'Teresa', 'Javier', 'Patricia'
	];

	const commonArgentineSurnames = [
		'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Martín', 'López', 'García',
		'Fernández', 'Álvarez', 'Gómez', 'Martínez', 'Ruiz', 'Jiménez', 'Díaz'
	];

	onMount(() => {
		initializeForm();
		loadAutocompleteData();
		if (saveProgress) {
			loadSavedProgress();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	function initializeForm() {
		// Initialize field states
		formSchema.forEach(field => {
			fieldStates[field.name] = {
				value: formData[field.name] || '',
				touched: false,
				focused: false,
				valid: true,
				errors: [],
				suggestions: [],
				showSuggestions: false,
				loading: false
			};
		});

		calculateFormProgress();
	}

	async function loadAutocompleteData() {
		if (!browser || !enableAutocomplete) return;

		try {
			// Load from localStorage
			const stored = localStorage.getItem('barberpro-autocomplete');
			if (stored) {
				autocompleteData = JSON.parse(stored);
			}

			// Load from server if available
			const response = await fetch('/api/autocomplete/data', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const serverData = await response.json();
				autocompleteData = { ...autocompleteData, ...serverData };
				
				// Save updated data
				localStorage.setItem('barberpro-autocomplete', JSON.stringify(autocompleteData));
			}

		} catch (error) {
			console.warn('Failed to load autocomplete data:', error);
		}
	}

	function loadSavedProgress() {
		if (!browser) return;

		try {
			const saved = localStorage.getItem(`barberpro-form-${window.location.pathname}`);
			if (saved) {
				const savedData = JSON.parse(saved);
				formData = { ...formData, ...savedData };
				
				// Update field states
				Object.keys(savedData).forEach(key => {
					if (fieldStates[key]) {
						fieldStates[key].value = savedData[key];
					}
				});

				dispatch('progress-loaded', savedData);
			}
		} catch (error) {
			console.warn('Failed to load saved progress:', error);
		}
	}

	function saveProgress() {
		if (!browser || !saveProgress) return;

		try {
			const progressData = Object.keys(fieldStates).reduce((acc, key) => {
				if (fieldStates[key].value) {
					acc[key] = fieldStates[key].value;
				}
				return acc;
			}, {} as Record<string, any>);

			localStorage.setItem(`barberpro-form-${window.location.pathname}`, JSON.stringify(progressData));
		} catch (error) {
			console.warn('Failed to save progress:', error);
		}
	}

	async function handleInput(fieldName: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		// Update field state
		fieldStates[fieldName].value = value;
		fieldStates[fieldName].touched = true;
		formData[fieldName] = value;

		// Clear existing debounce timer
		if (debounceTimers.has(fieldName)) {
			clearTimeout(debounceTimers.get(fieldName)!);
		}

		// Set new debounce timer for suggestions and validation
		debounceTimers.set(fieldName, setTimeout(async () => {
			if (enableSmartSuggestions && value.length > 0) {
				await loadSuggestions(fieldName, value);
			}
			
			if (validationMode === 'onChange') {
				validateField(fieldName);
			}

			calculateFormProgress();
			saveProgress();
		}, 300));

		dispatch('input', { fieldName, value, formData });
	}

	function handleFocus(fieldName: string) {
		fieldStates[fieldName].focused = true;
		
		// Show suggestions on focus if value exists
		if (fieldStates[fieldName].value && fieldStates[fieldName].suggestions.length > 0) {
			fieldStates[fieldName].showSuggestions = true;
		}
	}

	function handleBlur(fieldName: string) {
		fieldStates[fieldName].focused = false;
		
		// Hide suggestions after a delay to allow clicking
		setTimeout(() => {
			fieldStates[fieldName].showSuggestions = false;
		}, 150);

		if (validationMode === 'onBlur') {
			validateField(fieldName);
		}
	}

	async function loadSuggestions(fieldName: string, query: string) {
		const field = formSchema.find(f => f.name === fieldName);
		if (!field || query.length < 2) return;

		fieldStates[fieldName].loading = true;

		try {
			let suggestions: string[] = [];

			// Check cache first
			const cacheKey = `${fieldName}-${query.toLowerCase()}`;
			if (suggestionCache.has(cacheKey)) {
				suggestions = suggestionCache.get(cacheKey)!;
			} else {
				suggestions = await generateSuggestions(field, query);
				suggestionCache.set(cacheKey, suggestions);
			}

			fieldStates[fieldName].suggestions = suggestions.slice(0, suggestionLimit);
			fieldStates[fieldName].showSuggestions = suggestions.length > 0 && fieldStates[fieldName].focused;

		} catch (error) {
			console.error('Error loading suggestions:', error);
		} finally {
			fieldStates[fieldName].loading = false;
		}
	}

	async function generateSuggestions(field: FormField, query: string): Promise<string[]> {
		const normalizedQuery = query.toLowerCase().trim();
		let suggestions: string[] = [];

		// Field-specific suggestions
		if (typeof field.suggestions === 'function') {
			suggestions = await field.suggestions();
		} else if (Array.isArray(field.suggestions)) {
			suggestions = field.suggestions;
		} else {
			// Generate based on field type and Argentine data
			suggestions = generateDefaultSuggestions(field, normalizedQuery);
		}

		// Filter and sort suggestions
		suggestions = suggestions
			.filter(s => s.toLowerCase().includes(normalizedQuery))
			.sort((a, b) => {
				const aStarts = a.toLowerCase().startsWith(normalizedQuery);
				const bStarts = b.toLowerCase().startsWith(normalizedQuery);
				if (aStarts && !bStarts) return -1;
				if (!aStarts && bStarts) return 1;
				return a.localeCompare(b, 'es-AR');
			});

		// Add autocomplete data
		if (autocompleteData[field.name]) {
			const autoSuggestions = autocompleteData[field.name]
				.filter(s => s.toLowerCase().includes(normalizedQuery));
			suggestions = [...new Set([...suggestions, ...autoSuggestions])];
		}

		return suggestions;
	}

	function generateDefaultSuggestions(field: FormField, query: string): string[] {
		switch (field.type) {
			case 'text':
				if (field.name.includes('name') || field.name.includes('nombre')) {
					if (field.name.includes('first') || field.name.includes('primer')) {
						return commonArgentineNames.filter(name => 
							name.toLowerCase().includes(query)
						);
					} else if (field.name.includes('last') || field.name.includes('apellido')) {
						return commonArgentineSurnames.filter(surname => 
							surname.toLowerCase().includes(query)
						);
					}
				}
				break;

			case 'address':
				if (field.name.includes('province') || field.name.includes('provincia')) {
					return argentineProvinces.filter(province => 
						province.toLowerCase().includes(query)
					);
				} else if (field.name.includes('city') || field.name.includes('ciudad')) {
					// Get cities based on selected province
					const selectedProvince = formData.province || formData.provincia;
					if (selectedProvince && argentineCities[selectedProvince]) {
						return argentineCities[selectedProvince].filter(city => 
							city.toLowerCase().includes(query)
						);
					}
				}
				break;

			case 'email':
				const commonDomains = ['@gmail.com', '@hotmail.com', '@yahoo.com.ar', '@outlook.com'];
				if (query.includes('@')) {
					const [localPart] = query.split('@');
					return commonDomains.map(domain => localPart + domain);
				}
				break;

			case 'tel':
				if (query.startsWith('+54') || query.startsWith('54')) {
					// Argentina phone number suggestions
					const areaCodes = ['11', '351', '341', '261', '381', '223'];
					return areaCodes.map(code => `+54 9 ${code} ${query.slice(-4)}`);
				}
				break;
		}

		return [];
	}

	function selectSuggestion(fieldName: string, suggestion: string) {
		fieldStates[fieldName].value = suggestion;
		fieldStates[fieldName].showSuggestions = false;
		formData[fieldName] = suggestion;

		// Store in autocomplete data
		if (!autocompleteData[fieldName]) {
			autocompleteData[fieldName] = [];
		}
		if (!autocompleteData[fieldName].includes(suggestion)) {
			autocompleteData[fieldName].unshift(suggestion);
			autocompleteData[fieldName] = autocompleteData[fieldName].slice(0, 20); // Keep top 20
			
			if (browser) {
				localStorage.setItem('barberpro-autocomplete', JSON.stringify(autocompleteData));
			}
		}

		validateField(fieldName);
		calculateFormProgress();
		saveProgress();
	}

	function validateField(fieldName: string): boolean {
		const field = formSchema.find(f => f.name === fieldName);
		if (!field) return true;

		const value = fieldStates[fieldName].value;
		const errors: string[] = [];

		if (!field.validation) {
			fieldStates[fieldName].valid = true;
			fieldStates[fieldName].errors = [];
			return true;
		}

		for (const rule of field.validation) {
			const isValid = validateRule(value, rule);
			if (!isValid) {
				errors.push(rule.message);
			}
		}

		fieldStates[fieldName].valid = errors.length === 0;
		fieldStates[fieldName].errors = errors;

		return fieldStates[fieldName].valid;
	}

	function validateRule(value: any, rule: ValidationRule): boolean {
		switch (rule.type) {
			case 'required':
				return value != null && value.toString().trim() !== '';

			case 'email':
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				return !value || emailRegex.test(value);

			case 'phone':
				if (rule.argentineSpecific) {
					// Argentina phone validation
					const phoneRegex = /^(\+54\s?9?\s?)?(11|2\d{2,3}|3\d{2,3}|4\d{2})\s?\d{3,4}\s?\d{4}$/;
					return !value || phoneRegex.test(value.replace(/\s+/g, ''));
				}
				return true;

			case 'dni':
				if (enableArgentineValidation) {
					const dniRegex = /^\d{7,8}$/;
					return !value || dniRegex.test(value.replace(/\./g, ''));
				}
				return true;

			case 'cuil':
			case 'cuit':
				if (enableArgentineValidation) {
					const cuilRegex = /^(20|23|24|27|30|33|34)\d{8}\d$/;
					return !value || cuilRegex.test(value.replace(/[-\s]/g, ''));
				}
				return true;

			case 'minLength':
				return !value || value.length >= rule.value;

			case 'maxLength':
				return !value || value.length <= rule.value;

			case 'pattern':
				const regex = new RegExp(rule.value);
				return !value || regex.test(value);

			case 'custom':
				return typeof rule.value === 'function' ? rule.value(value, formData) : true;

			default:
				return true;
		}
	}

	function calculateFormProgress() {
		const totalFields = formSchema.length;
		const completedFields = formSchema.filter(field => {
			const value = fieldStates[field.name]?.value;
			return value && value.toString().trim() !== '';
		}).length;

		formProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
		dispatch('progress-change', { progress: formProgress, completed: completedFields, total: totalFields });
	}

	function validateForm(): boolean {
		let isValid = true;

		for (const field of formSchema) {
			const fieldValid = validateField(field.name);
			if (!fieldValid) {
				isValid = false;
			}
		}

		return isValid;
	}

	function handleSubmit(event: Event) {
		event.preventDefault();

		if (validationMode === 'onSubmit' || !validateForm()) {
			if (!validateForm()) {
				dispatch('validation-error', {
					errors: Object.keys(fieldStates).reduce((acc, key) => {
						if (!fieldStates[key].valid) {
							acc[key] = fieldStates[key].errors;
						}
						return acc;
					}, {} as Record<string, string[]>)
				});
				return;
			}
		}

		// Clear saved progress on successful submit
		if (browser && saveProgress) {
			localStorage.removeItem(`barberpro-form-${window.location.pathname}`);
		}

		dispatch('submit', formData);
	}

	function shouldShowField(field: FormField): boolean {
		if (!field.conditional) return true;
		return field.conditional(formData);
	}

	function getFieldAutocomplete(field: FormField): string {
		if (field.autocomplete) return field.autocomplete;

		// Argentina-specific autocomplete attributes
		switch (field.type) {
			case 'text':
				if (field.name.includes('first') || field.name.includes('primer')) return 'given-name';
				if (field.name.includes('last') || field.name.includes('apellido')) return 'family-name';
				return 'name';
			case 'email':
				return 'email';
			case 'tel':
				return 'tel';
			case 'address':
				if (field.name.includes('street')) return 'street-address';
				if (field.name.includes('city')) return 'address-level2';
				if (field.name.includes('province')) return 'address-level1';
				if (field.name.includes('postal')) return 'postal-code';
				return 'address-line1';
			default:
				return 'off';
		}
	}

	function cleanup() {
		debounceTimers.forEach(timer => clearTimeout(timer));
		debounceTimers.clear();
	}

	// Export functions
	export { validateForm, calculateFormProgress };
</script>

<!-- Smart Auto-Complete Form -->
<form 
	bind:this={formElement}
	on:submit={handleSubmit}
	class="smart-form space-y-6"
	novalidate
>
	<!-- Form Progress Bar -->
	{#if saveProgress}
		<div class="form-progress mb-6">
			<div class="flex justify-between items-center mb-2">
				<span class="text-sm font-medium text-neutral-700">Progreso del formulario</span>
				<span class="text-sm text-neutral-600">{Math.round(formProgress)}%</span>
			</div>
			<div class="w-full bg-neutral-200 rounded-full h-2">
				<div 
					class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
					style="width: {formProgress}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Form Fields -->
	{#each formSchema as field}
		{#if shouldShowField(field)}
			<div class="form-field relative">
				<!-- Field Label -->
				<label for={field.name} class="form-label">
					{field.label}
					{#if field.required}
						<span class="text-error-500 ml-1">*</span>
					{/if}
				</label>

				<!-- Field Input -->
				<div class="relative">
					{#if field.type === 'select'}
						<select
							id={field.name}
							bind:value={fieldStates[field.name].value}
							class="form-input"
							class:form-input-error={!fieldStates[field.name].valid}
							autocomplete={getFieldAutocomplete(field)}
							on:change={(e) => handleInput(field.name, e)}
							on:focus={() => handleFocus(field.name)}
							on:blur={() => handleBlur(field.name)}
						>
							<option value="">{field.placeholder || 'Seleccionar...'}</option>
							{#each field.options || [] as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>

					{:else if field.type === 'textarea'}
						<textarea
							id={field.name}
							bind:value={fieldStates[field.name].value}
							class="form-input"
							class:form-input-error={!fieldStates[field.name].valid}
							placeholder={field.placeholder}
							autocomplete={getFieldAutocomplete(field)}
							maxlength={field.maxLength}
							rows="4"
							on:input={(e) => handleInput(field.name, e)}
							on:focus={() => handleFocus(field.name)}
							on:blur={() => handleBlur(field.name)}
						></textarea>

					{:else}
						<input
							id={field.name}
							type={field.type === 'dni' || field.type === 'cuil' || field.type === 'cuit' ? 'text' : field.type}
							bind:value={fieldStates[field.name].value}
							class="form-input"
							class:form-input-error={!fieldStates[field.name].valid}
							placeholder={field.placeholder}
							autocomplete={getFieldAutocomplete(field)}
							maxlength={field.maxLength}
							pattern={field.pattern}
							on:input={(e) => handleInput(field.name, e)}
							on:focus={() => handleFocus(field.name)}
							on:blur={() => handleBlur(field.name)}
						/>
					{/if}

					<!-- Loading Indicator -->
					{#if fieldStates[field.name].loading}
						<div class="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div class="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
						</div>
					{/if}

					<!-- Suggestions Dropdown -->
					{#if enableSmartSuggestions && fieldStates[field.name].showSuggestions && fieldStates[field.name].suggestions.length > 0}
						<div class="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
							{#each fieldStates[field.name].suggestions as suggestion, index}
								<button
									type="button"
									class="w-full px-4 py-2 text-left hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 focus:text-primary-700 transition-colors"
									class:bg-primary-50={index === 0}
									on:click={() => selectSuggestion(field.name, suggestion)}
								>
									{@html DOMPurify.sanitize(
										suggestion.replace(
											new RegExp(`(${fieldStates[field.name].value})`, 'gi'),
											'<strong class="text-primary-600">$1</strong>'
										)
									)}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Field Errors -->
				{#if fieldStates[field.name].touched && !fieldStates[field.name].valid}
					<div class="form-error-container mt-1">
						{#each fieldStates[field.name].errors as error}
							<p class="form-error text-sm">{error}</p>
						{/each}
					</div>
				{/if}

				<!-- Argentina-specific help text -->
				{#if field.argentineSpecific}
					<div class="mt-1 text-xs text-neutral-500">
						{#if field.type === 'dni'}
							Formato: 12345678 (sin puntos)
						{:else if field.type === 'cuil' || field.type === 'cuit'}
							Formato: 20-12345678-9
						{:else if field.type === 'tel'}
							Formato: +54 9 11 1234-5678 o 11 1234-5678
						{/if}
					</div>
				{/if}

				<!-- Character Count -->
				{#if field.maxLength && fieldStates[field.name].value}
					<div class="mt-1 text-xs text-neutral-500 text-right">
						{fieldStates[field.name].value.length}/{field.maxLength}
					</div>
				{/if}
			</div>
		{/if}
	{/each}

	<!-- Form Actions Slot -->
	<slot name="actions">
		<div class="form-actions pt-6 border-t border-neutral-200">
			<button type="submit" class="btn btn-primary w-full">
				Enviar Formulario
			</button>
		</div>
	</slot>
</form>

<style>
	.smart-form {
		/* Argentina mobile optimization */
		--input-height: 48px; /* Touch-friendly height */
	}

	.form-field input,
	.form-field select,
	.form-field textarea {
		min-height: var(--input-height);
	}

	/* Argentina-specific input styling */
	.form-field input[type="tel"] {
		/* Font family that supports Argentine number formats */
		font-variant-numeric: tabular-nums;
	}

	.form-field input[pattern] {
		/* Visual indicator for pattern fields */
		background-image: linear-gradient(45deg, transparent 40%, rgba(37, 99, 235, 0.1) 40%, rgba(37, 99, 235, 0.1) 60%, transparent 60%);
		background-size: 8px 8px;
		background-position: right 8px center;
		background-repeat: no-repeat;
	}

	/* Suggestion dropdown styling */
	.smart-form [role="listbox"] {
		scrollbar-width: thin;
		scrollbar-color: theme('colors.neutral.400') theme('colors.neutral.100');
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.form-field input,
		.form-field select,
		.form-field textarea {
			border-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.form-progress > div > div {
			transition: none;
		}
		.animate-spin {
			animation: none;
		}
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.smart-form {
			--input-height: 52px; /* Larger touch targets on mobile */
		}
	}
</style>