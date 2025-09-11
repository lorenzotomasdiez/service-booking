<script lang="ts">
  // Service Manager Component - Provider service creation and management
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { providerStore } from '$lib/stores/booking';
  import { bookingApi } from '$lib/api/booking';
  import Button from '../Button.svelte';
  import Input from '../Input.svelte';
  import Modal from '../Modal.svelte';
  import ImageUpload from '../ImageUpload.svelte';
  import Loading from '../Loading.svelte';
  import type { Service, ServiceFormData } from '$lib/types/booking';
  
  // Props
  export let providerId: string;
  
  const dispatch = createEventDispatcher<{
    serviceCreated: Service;
    serviceUpdated: Service;
    serviceDeleted: string;
  }>();
  
  // State
  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let editingService: Service | null = null;
  let deletingService: Service | null = null;
  let isSubmitting = false;
  
  // Form data
  let formData: ServiceFormData = {
    name: '',
    description: '',
    price: 0,
    duration: 60,
    category: '',
    requirements: '',
    cancellationPolicy: '',
    images: [],
    isActive: true
  };
  
  // Form validation
  let errors: Record<string, string> = {};
  
  // Subscribe to provider store
  $: ({ services, isLoading, error } = $providerStore);
  
  // Service categories (could be loaded from backend)
  const serviceCategories = [
    'Corte de cabello',
    'Barba y bigote',
    'Coloración',
    'Tratamientos',
    'Peinados',
    'Cejas',
    'Facial',
    'Masajes',
    'Otros'
  ];
  
  // Load services on mount
  onMount(() => {
    loadServices();
  });
  
  const loadServices = async () => {
    await providerStore.loadServices(providerId);
  };
  
  // Form validation
  const validateForm = () => {
    errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre del servicio es obligatorio';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }
    
    if (formData.price <= 0) {
      errors.price = 'El precio debe ser mayor a 0';
    }
    
    if (formData.duration <= 0 || formData.duration > 480) {
      errors.duration = 'La duración debe ser entre 1 y 480 minutos';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'La categoría es obligatoria';
    }
    
    return Object.keys(errors).length === 0;
  };
  
  // Create service
  const handleCreateService = async () => {
    if (!validateForm()) return;
    
    isSubmitting = true;
    
    try {
      const result = await providerStore.createService(formData);
      
      if (result.success) {
        dispatch('serviceCreated', result.service!);
        closeCreateModal();
        resetForm();
      } else {
        errors.general = result.error || 'Error al crear el servicio';
      }
    } catch (error: any) {
      errors.general = error.message || 'Error al crear el servicio';
    } finally {
      isSubmitting = false;
    }
  };
  
  // Update service
  const handleUpdateService = async () => {
    if (!editingService || !validateForm()) return;
    
    isSubmitting = true;
    
    try {
      const result = await providerStore.updateService(editingService.id, formData);
      
      if (result.success) {
        dispatch('serviceUpdated', result.service!);
        closeEditModal();
      } else {
        errors.general = result.error || 'Error al actualizar el servicio';
      }
    } catch (error: any) {
      errors.general = error.message || 'Error al actualizar el servicio';
    } finally {
      isSubmitting = false;
    }
  };
  
  // Delete service
  const handleDeleteService = async () => {
    if (!deletingService) return;
    
    isSubmitting = true;
    
    try {
      const result = await providerStore.deleteService(deletingService.id);
      
      if (result.success) {
        dispatch('serviceDeleted', deletingService.id);
        closeDeleteModal();
      } else {
        errors.general = result.error || 'Error al eliminar el servicio';
      }
    } catch (error: any) {
      errors.general = error.message || 'Error al eliminar el servicio';
    } finally {
      isSubmitting = false;
    }
  };
  
  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    showCreateModal = true;
  };
  
  const closeCreateModal = () => {
    showCreateModal = false;
    resetForm();
  };
  
  const openEditModal = (service: Service) => {
    editingService = service;
    formData = {
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      requirements: service.requirements || '',
      cancellationPolicy: service.cancellationPolicy || '',
      images: [],
      isActive: service.isActive
    };
    showEditModal = true;
  };
  
  const closeEditModal = () => {
    showEditModal = false;
    editingService = null;
    resetForm();
  };
  
  const openDeleteModal = (service: Service) => {
    deletingService = service;
    showDeleteModal = true;
  };
  
  const closeDeleteModal = () => {
    showDeleteModal = false;
    deletingService = null;
  };
  
  const resetForm = () => {
    formData = {
      name: '',
      description: '',
      price: 0,
      duration: 60,
      category: '',
      requirements: '',
      cancellationPolicy: '',
      images: [],
      isActive: true
    };
    errors = {};
  };
  
  // Formatting
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };
</script>

<div class="service-manager">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Gestión de Servicios</h2>
      <p class="text-gray-600 mt-1">
        Administra los servicios que ofreces a tus clientes
      </p>
    </div>
    
    <Button variant="primary" on:click={openCreateModal}>
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Nuevo Servicio
    </Button>
  </div>

  <!-- Services List -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <Loading size="lg" />
    </div>
  
  {:else if error}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar servicios</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button variant="outline" on:click={loadServices}>
        Intentar nuevamente
      </Button>
    </div>
  
  {:else if services.length === 0}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes servicios configurados</h3>
      <p class="text-gray-600 mb-6">
        Comienza creando tu primer servicio para que los clientes puedan reservar contigo.
      </p>
      <Button variant="primary" on:click={openCreateModal}>
        Crear primer servicio
      </Button>
    </div>
  
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3" in:fade={{ duration: 300 }}>
      {#each services as service (service.id)}
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
             in:fly={{ y: 20, duration: 200, delay: services.indexOf(service) * 50 }}>
          
          <!-- Service header -->
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">
                  {service.name}
                </h3>
                <p class="text-sm text-gray-600">{service.category}</p>
              </div>
              
              <!-- Status badge -->
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                           {service.isActive 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-gray-100 text-gray-800'}">
                {service.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <p class="text-gray-700 text-sm mb-4 line-clamp-3">
              {service.description}
            </p>
            
            <!-- Service details -->
            <div class="space-y-2 mb-6">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Precio</span>
                <span class="font-semibold text-gray-900">{formatPrice(service.price)}</span>
              </div>
              
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Duración</span>
                <span class="font-semibold text-gray-900">{formatDuration(service.duration)}</span>
              </div>
              
              {#if service.requirements}
                <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Requisitos:</strong> {service.requirements}
                </div>
              {/if}
            </div>
            
            <!-- Actions -->
            <div class="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                on:click={() => openEditModal(service)}
                class="flex-1"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                on:click={() => openDeleteModal(service)}
                class="text-red-600 border-red-300 hover:bg-red-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Service Modal -->
<Modal
  isOpen={showCreateModal}
  onClose={closeCreateModal}
  title="Crear Nuevo Servicio"
  size="lg"
>
  <form on:submit|preventDefault={handleCreateService} class="space-y-6">
    {#if errors.general}
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700">{errors.general}</p>
      </div>
    {/if}
    
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Nombre del servicio"
        bind:value={formData.name}
        error={errors.name}
        placeholder="Ej: Corte de cabello clásico"
        required
      />
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          bind:value={formData.category}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 {errors.category ? 'border-red-500' : ''}"
          required
        >
          <option value="">Seleccionar categoría</option>
          {#each serviceCategories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
        {#if errors.category}
          <p class="mt-1 text-sm text-red-600">{errors.category}</p>
        {/if}
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Precio (ARS)"
        type="number"
        bind:value={formData.price}
        error={errors.price}
        placeholder="0"
        min="0"
        step="0.01"
        required
      />
      
      <Input
        label="Duración (minutos)"
        type="number"
        bind:value={formData.duration}
        error={errors.duration}
        placeholder="60"
        min="1"
        max="480"
        required
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Descripción
      </label>
      <textarea
        bind:value={formData.description}
        rows="4"
        placeholder="Describe detalladamente qué incluye este servicio..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none
               {errors.description ? 'border-red-500' : ''}"
        required
      ></textarea>
      {#if errors.description}
        <p class="mt-1 text-sm text-red-600">{errors.description}</p>
      {/if}
    </div>
    
    <!-- Optional fields -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Requisitos (opcional)
      </label>
      <textarea
        bind:value={formData.requirements}
        rows="2"
        placeholder="Ej: Traer cabello limpio, no usar productos antes del servicio..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Política de cancelación (opcional)
      </label>
      <textarea
        bind:value={formData.cancellationPolicy}
        rows="2"
        placeholder="Ej: Cancelación gratuita hasta 24 horas antes..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
    
    <!-- Status -->
    <div class="flex items-center space-x-3">
      <input
        type="checkbox"
        id="isActive"
        bind:checked={formData.isActive}
        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label for="isActive" class="text-sm font-medium text-gray-700">
        Servicio activo (visible para clientes)
      </label>
    </div>
    
    <!-- Action buttons -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
      <Button variant="outline" on:click={closeCreateModal} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" loading={isSubmitting}>
        Crear servicio
      </Button>
    </div>
  </form>
</Modal>

<!-- Edit Service Modal -->
<Modal
  isOpen={showEditModal}
  onClose={closeEditModal}
  title="Editar Servicio"
  size="lg"
>
  <form on:submit|preventDefault={handleUpdateService} class="space-y-6">
    {#if errors.general}
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700">{errors.general}</p>
      </div>
    {/if}
    
    <!-- Same form fields as create modal -->
    <!-- (Reusing the same structure for brevity) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Nombre del servicio"
        bind:value={formData.name}
        error={errors.name}
        placeholder="Ej: Corte de cabello clásico"
        required
      />
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          bind:value={formData.category}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 {errors.category ? 'border-red-500' : ''}"
          required
        >
          <option value="">Seleccionar categoría</option>
          {#each serviceCategories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
        {#if errors.category}
          <p class="mt-1 text-sm text-red-600">{errors.category}</p>
        {/if}
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Precio (ARS)"
        type="number"
        bind:value={formData.price}
        error={errors.price}
        placeholder="0"
        min="0"
        step="0.01"
        required
      />
      
      <Input
        label="Duración (minutos)"
        type="number"
        bind:value={formData.duration}
        error={errors.duration}
        placeholder="60"
        min="1"
        max="480"
        required
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Descripción
      </label>
      <textarea
        bind:value={formData.description}
        rows="4"
        placeholder="Describe detalladamente qué incluye este servicio..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none
               {errors.description ? 'border-red-500' : ''}"
        required
      ></textarea>
      {#if errors.description}
        <p class="mt-1 text-sm text-red-600">{errors.description}</p>
      {/if}
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Requisitos (opcional)
      </label>
      <textarea
        bind:value={formData.requirements}
        rows="2"
        placeholder="Ej: Traer cabello limpio, no usar productos antes del servicio..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Política de cancelación (opcional)
      </label>
      <textarea
        bind:value={formData.cancellationPolicy}
        rows="2"
        placeholder="Ej: Cancelación gratuita hasta 24 horas antes..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      ></textarea>
    </div>
    
    <div class="flex items-center space-x-3">
      <input
        type="checkbox"
        id="isActiveEdit"
        bind:checked={formData.isActive}
        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label for="isActiveEdit" class="text-sm font-medium text-gray-700">
        Servicio activo (visible para clientes)
      </label>
    </div>
    
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
      <Button variant="outline" on:click={closeEditModal} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" loading={isSubmitting}>
        Guardar cambios
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
  isOpen={showDeleteModal}
  onClose={closeDeleteModal}
  title="Eliminar Servicio"
  size="sm"
>
  {#if deletingService}
    <div class="text-center">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        ¿Eliminar "{deletingService.name}"?
      </h3>
      
      <p class="text-gray-600 mb-6">
        Esta acción no se puede deshacer. El servicio será eliminado permanentemente
        y ya no estará disponible para nuevas reservas.
      </p>
      
      <div class="flex justify-center space-x-3">
        <Button variant="outline" on:click={closeDeleteModal} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          on:click={handleDeleteService} 
          loading={isSubmitting}
          class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        >
          Eliminar servicio
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>