<script lang="ts">
  // Provider Onboarding Flow Component
  // F11-001: Customer Experience Platform - Provider Onboarding Optimization
  
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import type {
    CustomerOnboardingStep,
    CustomerOnboardingProgress,
    ProviderOnboardingData,
    ArgentinaBusinessRegistration
  } from '../../types/customer-experience';
  
  const dispatch = createEventDispatcher();
  
  export let userId: string;
  export let initialData: Partial<ProviderOnboardingData> = {};
  
  let currentStep = 0;
  let onboardingData: ProviderOnboardingData = {
    businessInfo: {
      businessName: '',
      businessType: 'individual',
      address: '',
      phone: '',
      email: '',
      description: ''
    },
    verification: {
      identityDocument: null,
      bankAccount: {
        cbu: '',
        alias: '',
        bankName: ''
      }
    },
    services: {
      categories: [],
      priceRange: { min: 0, max: 0 },
      workingHours: {}
    },
    profile: {
      portfolio: [],
      socialProof: {
        testimonials: []
      }
    },
    ...initialData
  };
  
  let progress: CustomerOnboardingProgress = {
    userId,
    currentStep: 'business-info',
    completedSteps: [],
    totalSteps: 5,
    completionPercentage: 0,
    startedAt: new Date(),
    lastActiveAt: new Date(),
    estimatedCompletionTime: 15,
    personalizedRecommendations: []
  };
  
  let validationErrors: Record<string, string[]> = {};
  let isSubmitting = false;
  let showSocialProof = true;
  
  const steps: CustomerOnboardingStep[] = [
    {
      id: 'business-info',
      title: 'Información del Negocio',
      description: 'Cuéntanos sobre tu negocio para personalizar tu experiencia',
      component: 'BusinessInfo',
      isCompleted: false,
      isRequired: true,
      order: 0,
      estimatedMinutes: 3
    },
    {
      id: 'verification',
      title: 'Verificación de Identidad',
      description: 'Verifica tu identidad para comenzar a recibir reservas',
      component: 'Verification',
      isCompleted: false,
      isRequired: true,
      order: 1,
      estimatedMinutes: 5,
      dependsOn: ['business-info']
    },
    {
      id: 'services-setup',
      title: 'Configuración de Servicios',
      description: 'Define tus servicios y horarios de trabajo',
      component: 'ServicesSetup',
      isCompleted: false,
      isRequired: true,
      order: 2,
      estimatedMinutes: 4,
      dependsOn: ['business-info']
    },
    {
      id: 'profile-setup',
      title: 'Perfil y Portfolio',
      description: 'Crea un perfil atractivo para tus clientes',
      component: 'ProfileSetup',
      isCompleted: false,
      isRequired: false,
      order: 3,
      estimatedMinutes: 5
    },
    {
      id: 'final-review',
      title: 'Revisión Final',
      description: 'Revisa y confirma tu información antes de comenzar',
      component: 'FinalReview',
      isCompleted: false,
      isRequired: true,
      order: 4,
      estimatedMinutes: 2,
      dependsOn: ['business-info', 'verification', 'services-setup']
    }
  ];
  
  // Argentina-specific business categories
  const argentinianServiceCategories = [
    { id: 'barberia', name: 'Barbería', icon: '✂️', popular: true },
    { id: 'peluqueria', name: 'Peluquería', icon: '💇‍♀️', popular: true },
    { id: 'belleza', name: 'Belleza y Estética', icon: '💄', popular: true },
    { id: 'masajes', name: 'Masajes', icon: '💆‍♂️', popular: false },
    { id: 'psicologia', name: 'Psicología', icon: '🧠', popular: false },
    { id: 'medicina', name: 'Medicina General', icon: '👩‍⚕️', popular: false },
    { id: 'dentista', name: 'Odontología', icon: '🦷', popular: false },
    { id: 'fitness', name: 'Fitness Personal', icon: '💪', popular: false },
    { id: 'nutricion', name: 'Nutrición', icon: '🥗', popular: false }
  ];
  
  const socialProofData = {
    activeProviders: '2,847',
    monthlyBookings: '15,632',
    averageIncome: '$45,300',
    customerSatisfaction: '4.8/5'
  };
  
  onMount(() => {
    updateProgress();
    trackOnboardingStart();
  });
  
  function updateProgress() {
    const completedSteps = steps.filter(step => step.isCompleted).length;
    progress.completionPercentage = Math.round((completedSteps / steps.length) * 100);
    progress.currentStep = steps[currentStep].id;
    progress.lastActiveAt = new Date();
    
    // Calculate estimated completion time based on remaining steps
    const remainingSteps = steps.slice(currentStep);
    progress.estimatedCompletionTime = remainingSteps.reduce((total, step) => total + step.estimatedMinutes, 0);
  }
  
  function validateCurrentStep(): boolean {
    validationErrors = {};
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'business-info':
        return validateBusinessInfo();
      case 'verification':
        return validateVerification();
      case 'services-setup':
        return validateServices();
      case 'profile-setup':
        return true; // Optional step
      case 'final-review':
        return validateFinalReview();
      default:
        return true;
    }
  }
  
  function validateBusinessInfo(): boolean {
    const errors: string[] = [];
    const { businessInfo } = onboardingData;
    
    if (!businessInfo.businessName.trim()) {
      errors.push('El nombre del negocio es requerido');
    }
    
    if (!businessInfo.phone.trim() || !/^\+54[0-9]{10,11}$/.test(businessInfo.phone)) {
      errors.push('Número de teléfono argentino válido requerido (+54...)');
    }
    
    if (!businessInfo.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(businessInfo.email)) {
      errors.push('Email válido requerido');
    }
    
    if (!businessInfo.address.trim()) {
      errors.push('Dirección es requerida');
    }
    
    if (businessInfo.businessType === 'business' && businessInfo.cuit && !/^[0-9]{11}$/.test(businessInfo.cuit)) {
      errors.push('CUIT debe tener 11 dígitos');
    }
    
    if (errors.length > 0) {
      validationErrors['business-info'] = errors;
      return false;
    }
    
    return true;
  }
  
  function validateVerification(): boolean {
    const errors: string[] = [];
    const { verification } = onboardingData;
    
    if (!verification.identityDocument) {
      errors.push('Documento de identidad es requerido');
    }
    
    if (!verification.bankAccount.cbu || !/^[0-9]{22}$/.test(verification.bankAccount.cbu)) {
      errors.push('CBU válido requerido (22 dígitos)');
    }
    
    if (errors.length > 0) {
      validationErrors['verification'] = errors;
      return false;
    }
    
    return true;
  }
  
  function validateServices(): boolean {
    const errors: string[] = [];
    const { services } = onboardingData;
    
    if (services.categories.length === 0) {
      errors.push('Selecciona al menos una categoría de servicio');
    }
    
    if (services.priceRange.min <= 0 || services.priceRange.max <= 0) {
      errors.push('Rango de precios válido requerido');
    }
    
    if (services.priceRange.min > services.priceRange.max) {
      errors.push('El precio mínimo no puede ser mayor al máximo');
    }
    
    const workingDays = Object.values(services.workingHours).filter(day => day.isOpen);
    if (workingDays.length === 0) {
      errors.push('Configura al menos un día de trabajo');
    }
    
    if (errors.length > 0) {
      validationErrors['services-setup'] = errors;
      return false;
    }
    
    return true;
  }
  
  function validateFinalReview(): boolean {
    // Validate all previous steps
    return validateBusinessInfo() && validateVerification() && validateServices();
  }
  
  async function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }
    
    steps[currentStep].isCompleted = true;
    
    if (currentStep < steps.length - 1) {
      currentStep++;
      updateProgress();
      trackStepCompletion(steps[currentStep - 1].id);
    } else {
      await completeOnboarding();
    }
  }
  
  function previousStep() {
    if (currentStep > 0) {
      currentStep--;
      updateProgress();
    }
  }
  
  async function completeOnboarding() {
    if (!validateFinalReview()) {
      return;
    }
    
    isSubmitting = true;
    
    try {
      // Submit onboarding data to backend
      const response = await fetch('/api/onboarding/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          userId,
          onboardingData,
          progress
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      const result = await response.json();
      
      // Track successful onboarding completion
      trackOnboardingCompletion();
      
      // Dispatch completion event
      dispatch('completed', {
        providerId: result.providerId,
        onboardingData
      });
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      dispatch('error', {
        message: 'Error al completar el registro. Intenta nuevamente.',
        error
      });
    } finally {
      isSubmitting = false;
    }
  }
  
  function handleFileUpload(event: Event, field: string) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        alert('Formato de archivo no válido. Usa JPG, PNG o PDF.');
        return;
      }
      
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      
      // Update onboarding data
      if (field === 'identityDocument') {
        onboardingData.verification.identityDocument = file;
      } else if (field === 'businessLicense') {
        onboardingData.verification.businessLicense = file;
      }
    }
  }
  
  function addWorkingDay(dayOfWeek: string) {
    onboardingData.services.workingHours[dayOfWeek] = {
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00'
    };
  }
  
  function removeWorkingDay(dayOfWeek: string) {
    if (onboardingData.services.workingHours[dayOfWeek]) {
      onboardingData.services.workingHours[dayOfWeek].isOpen = false;
    }
  }
  
  function trackOnboardingStart() {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'onboarding_started', {
        event_category: 'provider_acquisition',
        event_label: 'onboarding_flow',
        user_id: userId
      });
    }
  }
  
  function trackStepCompletion(stepId: string) {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'onboarding_step_completed', {
        event_category: 'provider_acquisition',
        event_label: stepId,
        user_id: userId,
        step_number: currentStep
      });
    }
  }
  
  function trackOnboardingCompletion() {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'onboarding_completed', {
        event_category: 'provider_acquisition',
        event_label: 'onboarding_flow',
        user_id: userId,
        completion_time: Date.now() - progress.startedAt.getTime()
      });
    }
  }
  
  function getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
  
  const weekDays = [
    { key: 'monday', name: 'Lunes' },
    { key: 'tuesday', name: 'Martes' },
    { key: 'wednesday', name: 'Miércoles' },
    { key: 'thursday', name: 'Jueves' },
    { key: 'friday', name: 'Viernes' },
    { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' }
  ];
</script>

<div class="max-w-4xl mx-auto p-4 bg-white min-h-screen">
  <!-- Progress Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Configuración de Proveedor</h1>
      <div class="text-sm text-gray-500">
        Paso {currentStep + 1} de {steps.length}
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style="width: {progress.completionPercentage}%"
      ></div>
    </div>
    
    <div class="flex justify-between text-xs text-gray-500">
      <span>Tiempo estimado: {progress.estimatedCompletionTime} min</span>
      <span>{progress.completionPercentage}% completado</span>
    </div>
  </div>
  
  <!-- Social Proof (Argentina-focused) -->
  {#if showSocialProof && currentStep === 0}
    <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6" transition:slide>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Únete a miles de profesionales en Argentina</h3>
        <button 
          on:click={() => showSocialProof = false}
          class="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{socialProofData.activeProviders}</div>
          <div class="text-sm text-gray-600">Profesionales activos</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{socialProofData.monthlyBookings}</div>
          <div class="text-sm text-gray-600">Reservas mensuales</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{socialProofData.averageIncome}</div>
          <div class="text-sm text-gray-600">Ingreso promedio</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">{socialProofData.customerSatisfaction}</div>
          <div class="text-sm text-gray-600">Satisfacción</div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Current Step Content -->
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-6" transition:fade>
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {steps[currentStep].title}
      </h2>
      <p class="text-gray-600">{steps[currentStep].description}</p>
    </div>
    
    <!-- Step 1: Business Info -->
    {#if steps[currentStep].id === 'business-info'}
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              bind:value={onboardingData.businessInfo.businessName}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Barbería El Corte"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Negocio *
            </label>
            <select
              bind:value={onboardingData.businessInfo.businessType}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="individual">Individual</option>
              <option value="business">Empresa</option>
            </select>
          </div>
        </div>
        
        {#if onboardingData.businessInfo.businessType === 'business'}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              CUIT (opcional)
            </label>
            <input
              type="text"
              bind:value={onboardingData.businessInfo.cuit}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="20123456789"
              maxlength="11"
            />
          </div>
        {/if}
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              bind:value={onboardingData.businessInfo.phone}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+54 11 1234 5678"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              bind:value={onboardingData.businessInfo.email}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <input
            type="text"
            bind:value={onboardingData.businessInfo.address}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Av. Corrientes 1234, CABA"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Negocio
          </label>
          <textarea
            bind:value={onboardingData.businessInfo.description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe tu negocio y lo que ofreces..."
          ></textarea>
        </div>
      </div>
    {/if}
    
    <!-- Step 2: Verification -->
    {#if steps[currentStep].id === 'verification'}
      <div class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="text-blue-600 mr-3">ℹ️</div>
            <div>
              <h4 class="font-medium text-blue-900 mb-1">Verificación Segura</h4>
              <p class="text-blue-700 text-sm">Necesitamos verificar tu identidad para proteger tanto a proveedores como clientes. Todos los datos están protegidos.</p>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Documento de Identidad *
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            on:change={(e) => handleFileUpload(e, 'identityDocument')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">DNI, Cédula o Pasaporte (JPG, PNG o PDF, máx. 5MB)</p>
        </div>
        
        <div class="border-t pt-6">
          <h4 class="font-medium text-gray-900 mb-4">Información Bancaria</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                CBU *
              </label>
              <input
                type="text"
                bind:value={onboardingData.verification.bankAccount.cbu}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890123456789012"
                maxlength="22"
              />
              <p class="text-xs text-gray-500 mt-1">22 dígitos</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Alias CBU
              </label>
              <input
                type="text"
                bind:value={onboardingData.verification.bankAccount.alias}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="mi.barberia.cbu"
              />
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Banco
            </label>
            <input
              type="text"
              bind:value={onboardingData.verification.bankAccount.bankName}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Banco Santander"
            />
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Step 3: Services Setup -->
    {#if steps[currentStep].id === 'services-setup'}
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Categorías de Servicio *
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            {#each argentinianServiceCategories as category}
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50
                {onboardingData.services.categories.includes(category.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
                <input
                  type="checkbox"
                  bind:group={onboardingData.services.categories}
                  value={category.id}
                  class="sr-only"
                />
                <div class="flex items-center">
                  <span class="text-2xl mr-2">{category.icon}</span>
                  <div>
                    <div class="font-medium text-sm">{category.name}</div>
                    {#if category.popular}
                      <div class="text-xs text-blue-600">Popular</div>
                    {/if}
                  </div>
                </div>
              </label>
            {/each}
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Rango de Precios (ARS) *
          </label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                bind:value={onboardingData.services.priceRange.min}
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Precio mínimo"
              />
            </div>
            <div>
              <input
                type="number"
                bind:value={onboardingData.services.priceRange.max}
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Precio máximo"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Horarios de Trabajo *
          </label>
          <div class="space-y-3">
            {#each weekDays as day}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={onboardingData.services.workingHours[day.key]?.isOpen || false}
                    on:change={(e) => {
                      if (e.target.checked) {
                        addWorkingDay(day.key);
                      } else {
                        removeWorkingDay(day.key);
                      }
                    }}
                    class="mr-2"
                  />
                  <span class="font-medium">{day.name}</span>
                </label>
                
                {#if onboardingData.services.workingHours[day.key]?.isOpen}
                  <div class="flex items-center space-x-2">
                    <input
                      type="time"
                      bind:value={onboardingData.services.workingHours[day.key].openTime}
                      class="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span class="text-gray-500">a</span>
                    <input
                      type="time"
                      bind:value={onboardingData.services.workingHours[day.key].closeTime}
                      class="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Step 4: Profile Setup -->
    {#if steps[currentStep].id === 'profile-setup'}
      <div class="space-y-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="text-yellow-600 mr-3">💡</div>
            <div>
              <h4 class="font-medium text-yellow-900 mb-1">Perfil Atractivo</h4>
              <p class="text-yellow-700 text-sm">Un perfil completo puede aumentar tus reservas hasta un 60%. ¡Vale la pena invertir tiempo aquí!</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>
            <input
              type="file"
              accept="image/*"
              on:change={(e) => handleFileUpload(e, 'profileImage')}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Imagen de Portada
            </label>
            <input
              type="file"
              accept="image/*"
              on:change={(e) => handleFileUpload(e, 'coverImage')}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Redes Sociales
          </label>
          <div class="space-y-3">
            <input
              type="url"
              bind:value={onboardingData.profile.socialProof.instagramUrl}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instagram (opcional)"
            />
            <input
              type="url"
              bind:value={onboardingData.profile.socialProof.facebookUrl}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Facebook (opcional)"
            />
            <input
              type="url"
              bind:value={onboardingData.profile.socialProof.websiteUrl}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sitio Web (opcional)"
            />
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Step 5: Final Review -->
    {#if steps[currentStep].id === 'final-review'}
      <div class="space-y-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="text-green-600 mr-3">🎉</div>
            <div>
              <h4 class="font-medium text-green-900 mb-1">¡Casi Listo!</h4>
              <p class="text-green-700 text-sm">Revisa la información y confirma para comenzar a recibir reservas.</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">Información del Negocio</h4>
            <div class="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {onboardingData.businessInfo.businessName}</p>
              <p><strong>Tipo:</strong> {onboardingData.businessInfo.businessType === 'individual' ? 'Individual' : 'Empresa'}</p>
              <p><strong>Teléfono:</strong> {onboardingData.businessInfo.phone}</p>
              <p><strong>Email:</strong> {onboardingData.businessInfo.email}</p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">Servicios</h4>
            <div class="space-y-2 text-sm">
              <p><strong>Categorías:</strong> {onboardingData.services.categories.length}</p>
              <p><strong>Rango de precios:</strong> ${onboardingData.services.priceRange.min} - ${onboardingData.services.priceRange.max}</p>
              <p><strong>Días de trabajo:</strong> {Object.values(onboardingData.services.workingHours).filter(day => day.isOpen).length}</p>
            </div>
          </div>
        </div>
        
        <div class="border-t pt-6">
          <label class="flex items-start">
            <input type="checkbox" required class="mt-1 mr-3" />
            <div class="text-sm text-gray-700">
              Acepto los <a href="/terminos" class="text-blue-600 underline">Términos y Condiciones</a> y la 
              <a href="/privacidad" class="text-blue-600 underline">Política de Privacidad</a>
            </div>
          </label>
        </div>
      </div>
    {/if}
    
    <!-- Validation Errors -->
    {#if validationErrors[steps[currentStep].id]}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6" transition:slide>
        <div class="flex items-start">
          <div class="text-red-600 mr-3">⚠️</div>
          <div>
            <h4 class="font-medium text-red-900 mb-2">Por favor, corrige los siguientes errores:</h4>
            <ul class="text-red-700 text-sm space-y-1">
              {#each validationErrors[steps[currentStep].id] as error}
                <li>• {error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Navigation -->
  <div class="flex justify-between items-center">
    <button
      type="button"
      on:click={previousStep}
      disabled={currentStep === 0}
      class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Anterior
    </button>
    
    <button
      type="button"
      on:click={nextStep}
      disabled={isSubmitting}
      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
    >
      {#if isSubmitting}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      {/if}
      {currentStep === steps.length - 1 ? 'Completar' : 'Siguiente'}
    </button>
  </div>
</div>

<style>
  /* Custom styles for Argentina market */
  input:focus, select:focus, textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
