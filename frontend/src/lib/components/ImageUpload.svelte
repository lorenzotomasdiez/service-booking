<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components';

	export let value: string | null = null;
	export let label = 'Subir imagen';
	export let placeholder = 'Selecciona una imagen';
	export let accept = 'image/*';
	export let maxSize = 5 * 1024 * 1024; // 5MB default
	export let maxWidth = 1920;
	export let maxHeight = 1920;
	export let quality = 0.8;
	export let disabled = false;
	export let required = false;
	export let error = '';
	export let hint = '';
	export let className = '';
	export let circular = false;
	export let aspectRatio: 'auto' | 'square' | '16:9' | '4:3' | '3:2' = 'auto';
	export let enableCrop = true;
	export let enableDragDrop = true;
	export let showPreview = true;

	const dispatch = createEventDispatcher();

	let fileInput: HTMLInputElement;
	let isDragging = false;
	let isUploading = false;
	let previewUrl = value;
	let cropModal = false;
	let originalFile: File | null = null;

	// Generate unique ID
	const inputId = `image-upload-${Math.random().toString(36).substr(2, 9)}`;

	$: previewUrl = value;

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		if (!enableDragDrop || disabled) return;
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		if (!enableDragDrop || disabled) return;
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		if (!enableDragDrop || disabled) return;
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
	}

	async function processFile(file: File) {
		error = '';

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Por favor selecciona un archivo de imagen válido';
			return;
		}

		// Validate file size
		if (file.size > maxSize) {
			error = `El archivo es muy grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`;
			return;
		}

		originalFile = file;

		// Show crop modal if cropping is enabled
		if (enableCrop && aspectRatio !== 'auto') {
			cropModal = true;
			return;
		}

		// Process without cropping
		await compressAndUpload(file);
	}

	async function compressAndUpload(file: File) {
		isUploading = true;
		
		try {
			// Compress image
			const compressedFile = await compressImage(file);
			
			// Create preview URL
			if (showPreview) {
				previewUrl = URL.createObjectURL(compressedFile);
			}

			// Dispatch file for upload
			dispatch('upload', { file: compressedFile, originalFile: file });
			
			value = previewUrl;
			dispatch('change', { value: previewUrl, file: compressedFile });
			
		} catch (err) {
			error = 'Error al procesar la imagen';
			console.error('Image processing error:', err);
		} finally {
			isUploading = false;
		}
	}

	async function compressImage(file: File): Promise<File> {
		return new Promise((resolve) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			const img = new Image();

			img.onload = () => {
				// Calculate new dimensions
				let { width, height } = img;
				
				if (width > maxWidth || height > maxHeight) {
					const ratio = Math.min(maxWidth / width, maxHeight / height);
					width *= ratio;
					height *= ratio;
				}

				// Set canvas size
				canvas.width = width;
				canvas.height = height;

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(new File([blob], file.name, {
								type: 'image/jpeg',
								lastModified: Date.now()
							}));
						} else {
							resolve(file);
						}
					},
					'image/jpeg',
					quality
				);
			};

			img.src = URL.createObjectURL(file);
		});
	}

	function removeImage() {
		value = null;
		previewUrl = null;
		originalFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
		dispatch('remove');
		dispatch('change', { value: null, file: null });
	}

	function openFileDialog() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}

	function handleCropComplete(event: CustomEvent) {
		const { file } = event.detail;
		cropModal = false;
		compressAndUpload(file);
	}

	function cancelCrop() {
		cropModal = false;
		originalFile = null;
	}

	// Aspect ratio classes
	const aspectRatioClasses = {
		auto: '',
		square: 'aspect-square',
		'16:9': 'aspect-video',
		'4:3': 'aspect-[4/3]',
		'3:2': 'aspect-[3/2]'
	};

	$: containerClasses = [
		'relative border-2 border-dashed border-neutral-300 rounded-lg transition-all duration-200',
		isDragging ? 'border-primary-500 bg-primary-50' : '',
		disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-neutral-400 cursor-pointer',
		error ? 'border-error-500' : '',
		className
	].filter(Boolean).join(' ');

	$: previewClasses = [
		'w-full h-full object-cover',
		circular ? 'rounded-full' : 'rounded-lg',
		aspectRatio !== 'auto' ? aspectRatioClasses[aspectRatio] : ''
	].filter(Boolean).join(' ');
</script>

<div class="space-y-2">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-neutral-700">
			{label}
			{#if required}
				<span class="text-error-500 ml-1">*</span>
			{/if}
		</label>
	{/if}

	<div
		class={containerClasses}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:click={openFileDialog}
		role="button"
		tabindex={disabled ? -1 : 0}
		on:keydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
				e.preventDefault();
				openFileDialog();
			}
		}}
	>
		{#if previewUrl && showPreview}
			<!-- Image Preview -->
			<div class="relative group">
				<div class={aspectRatio !== 'auto' ? aspectRatioClasses[aspectRatio] : 'h-48'}>
					<img
						src={previewUrl}
						alt="Preview"
						class={previewClasses}
					/>
				</div>
				
				<!-- Overlay with actions -->
				<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
					<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
						<Button
							variant="secondary"
							size="sm"
							on:click={(e) => {
								e.stopPropagation();
								openFileDialog();
							}}
							className="bg-white text-neutral-700 hover:bg-neutral-100"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Cambiar
						</Button>
						
						<Button
							variant="danger"
							size="sm"
							on:click={(e) => {
								e.stopPropagation();
								removeImage();
							}}
							className="bg-white text-error-600 hover:bg-error-50"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Eliminar
						</Button>
					</div>
				</div>

				{#if isUploading}
					<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
						<div class="text-white text-center">
							<svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							<p class="text-sm">Subiendo...</p>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Upload Area -->
			<div class="p-8 text-center">
				{#if isUploading}
					<div class="space-y-4">
						<svg class="animate-spin h-8 w-8 mx-auto text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<p class="text-sm text-neutral-600">Procesando imagen...</p>
					</div>
				{:else}
					<svg class="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					
					<div class="space-y-2">
						<p class="text-sm font-medium text-neutral-700">
							{enableDragDrop ? 'Arrastra una imagen aquí o' : placeholder}
						</p>
						{#if enableDragDrop}
							<p class="text-xs text-neutral-500">haz clic para seleccionar</p>
						{/if}
						<p class="text-xs text-neutral-400">
							Tamaño máximo: {Math.round(maxSize / 1024 / 1024)}MB
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		id={inputId}
		type="file"
		{accept}
		{required}
		{disabled}
		class="hidden"
		on:change={handleFileSelect}
	/>

	{#if error}
		<p class="text-sm text-error-600 flex items-center gap-1">
			<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			{error}
		</p>
	{:else if hint}
		<p class="text-sm text-neutral-500">{hint}</p>
	{/if}
</div>

<!-- Crop Modal -->
{#if cropModal && originalFile}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg p-6 max-w-md w-full">
			<h3 class="text-lg font-semibold text-neutral-800 mb-4">
				Recortar imagen
			</h3>
			
			<div class="space-y-4">
				<!-- Simple crop preview - In a real implementation, you'd use a crop library -->
				<div class="text-center">
					<p class="text-sm text-neutral-600 mb-4">
						La imagen será ajustada automáticamente al tamaño requerido.
					</p>
					
					<div class="border-2 border-dashed border-neutral-300 rounded-lg p-4">
						<div class={aspectRatio !== 'auto' ? aspectRatioClasses[aspectRatio] : 'h-32'}>
							<img
								src={URL.createObjectURL(originalFile)}
								alt="Crop preview"
								class="w-full h-full object-cover rounded"
							/>
						</div>
					</div>
				</div>

				<div class="flex space-x-3">
					<Button
						variant="secondary"
						fullWidth
						on:click={cancelCrop}
					>
						Cancelar
					</Button>
					<Button
						variant="primary"
						fullWidth
						on:click={() => handleCropComplete({ detail: { file: originalFile } })}
					>
						Aceptar
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}