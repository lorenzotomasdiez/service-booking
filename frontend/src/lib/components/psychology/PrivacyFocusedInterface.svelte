<!--
  Privacy-Focused Interface for Psychology Vertical - Day 8 Design Specialization
  Enhanced privacy controls, confidential session management, therapy booking workflows
  Argentina compliance and mental health accessibility standards
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  export let sessionType: 'individual' | 'couple' | 'family' | 'group' = 'individual';
  export let userAge: number | null = null;
  export let isMinor: boolean = false;
  export let privacyLevel: 'standard' | 'enhanced' | 'maximum' = 'enhanced';
  export let showConsentForms: boolean = true;
  
  const dispatch = createEventDispatcher<{
    privacySettingsUpdated: { settings: any };
    consentGiven: { type: string; timestamp: number };
    emergencyContactAdded: { contact: any };
    sessionBooked: { sessionData: any; privacyPreferences: any };
  }>();
  
  // Privacy and consent management
  let privacySettings = writable({
    dataSharing: {
      anonymizedResearch: false,
      qualityImprovement: false,
      platformAnalytics: false,
      marketingCommunications: false
    },
    communication: {
      preferredMethod: 'platform', // platform, email, whatsapp
      allowReminders: true,
      allowFollowUp: false,
      emergencyContactOnly: false
    },
    sessionRecording: {
      allowNotes: true,
      allowAudioRecording: false,
      allowVideoRecording: false,
      notesRetention: 'legal_minimum' // legal_minimum, 1_year, 3_years, indefinite
    },
    visibility: {
      profileVisibility: 'therapist_only',
      allowTestimonials: false,
      allowCaseStudies: false,
      allowReferrals: true
    }
  });
  
  // Therapy-specific booking data
  let therapyBookingData = {
    sessionDuration: 60, // minutes
    frequency: 'weekly', // weekly, biweekly, monthly
    preferredDays: [],
    preferredTimes: [],
    sessionGoals: [],
    previousTherapyExperience: false,
    currentMedications: false,
    emergencyContacts: [],
    crisisProtocol: {
      hasProtocol: false,
      contacts: [],
      preferredHospital: '',
      medications: []
    }
  };
  
  // Argentina-specific therapy considerations
  const argentinaTherapyData = {
    legalRequirements: {
      minorConsent: 'Menores de 18 años requieren consentimiento de tutor legal',
      dataProtection: 'Protección de datos personales según Ley 25.326',
      professionalSecret: 'Secreto profesional garantizado por Código de Ética',
      emergencyProtocol: 'Protocolo de emergencia disponible 24/7'
    },
    insuranceProviders: [
      { id: 'osde', name: 'OSDE', coverage: 'Completa', sessions: 12 },
      { id: 'swiss', name: 'Swiss Medical', coverage: 'Parcial', sessions: 8 },
      { id: 'galeno', name: 'Galeno', coverage: 'Completa', sessions: 10 },
      { id: 'medicus', name: 'Medicus', coverage: 'Parcial', sessions: 6 }
    ],
    commonConcerns: [
      'Ansiedad y estrés',
      'Depresión',
      'Problemas de pareja',
      'Duelo y pérdida',
      'Trastornos alimentarios',
      'Adicciones',
      'Trastornos del sueño',
      'Problemas familiares'
    ],
    sessionPricing: {
      individual: { min: 3000, max: 8000, average: 4500 },
      couple: { min: 4000, max: 12000, average: 6500 },
      family: { min: 5000, max: 15000, average: 8000 },
      group: { min: 2000, max: 5000, average: 3000 }
    }
  };
  
  // Mental health questionnaires and assessments
  let mentalHealthAssessment = {
    phq9: { // Depression screening
      completed: false,
      score: null,
      riskLevel: null
    },
    gad7: { // Anxiety screening
      completed: false,
      score: null,
      riskLevel: null
    },
    customQuestionnaire: {
      questions: [
        {
          id: 'current_mood',
          text: '¿Cómo describirías tu estado de ánimo actual?',
          type: 'scale',
          scale: { min: 1, max: 10, labels: ['Muy mal', 'Excelente'] },
          required: true
        },
        {
          id: 'sleep_quality',
          text: '¿Cómo has estado durmiendo últimamente?',
          type: 'multiple_choice',
          options: ['Muy bien', 'Bien', 'Regular', 'Mal', 'Muy mal'],
          required: true
        },
        {
          id: 'stress_level',
          text: '¿Qué nivel de estrés sientes actualmente?',
          type: 'scale',
          scale: { min: 1, max: 10, labels: ['Nada estresado', 'Muy estresado'] },
          required: true
        },
        {
          id: 'support_system',
          text: '¿Tienes un buen sistema de apoyo (familia, amigos)?',
          type: 'yes_no',
          required: false
        },
        {
          id: 'therapy_goals',
          text: '¿Qué esperas lograr con la terapia?',
          type: 'open_text',
          placeholder: 'Describe tus objetivos y expectativas...',
          required: false
        }
      ],
      responses: {}
    }
  };
  
  // Component state
  let currentStep = 'privacy_consent';
  let consentGiven = false;
  let emergencyContactsRequired = false;
  let assessmentCompleted = false;
  
  onMount(() => {
    checkMinorStatus();
    initializePrivacyDefaults();
  });
  
  function checkMinorStatus() {
    if (userAge && userAge < 18) {
      isMinor = true;
      emergencyContactsRequired = true;
      
      // Update privacy settings for minors
      privacySettings.update(settings => ({
        ...settings,
        dataSharing: {
          ...settings.dataSharing,
          anonymizedResearch: false,
          marketingCommunications: false
        },
        communication: {
          ...settings.communication,
          emergencyContactOnly: true
        }
      }));
    }
  }
  
  function initializePrivacyDefaults() {
    // Set enhanced privacy defaults for psychology vertical
    privacySettings.update(settings => ({
      ...settings,
      communication: {
        ...settings.communication,
        preferredMethod: 'platform' // Never WhatsApp for therapy by default
      },
      sessionRecording: {
        ...settings.sessionRecording,
        allowAudioRecording: false,
        allowVideoRecording: false
      }
    }));
  }
  
  function giveConsent(consentType: string) {
    consentGiven = true;
    
    dispatch('consentGiven', {
      type: consentType,
      timestamp: Date.now()
    });
    
    if (consentType === 'privacy_policy') {
      currentStep = 'privacy_settings';
    }
  }
  
  function updatePrivacySettings(category: string, setting: string, value: any) {
    privacySettings.update(settings => ({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    }));
    
    dispatch('privacySettingsUpdated', {
      settings: $privacySettings
    });
  }
  
  function addEmergencyContact(contact: any) {
    therapyBookingData.emergencyContacts.push({
      ...contact,
      id: Date.now(),
      verified: false
    });
    
    dispatch('emergencyContactAdded', { contact });
  }
  
  function completeAssessment(responses: any) {
    mentalHealthAssessment.customQuestionnaire.responses = responses;
    assessmentCompleted = true;
    
    // Calculate risk indicators
    const moodScore = responses.current_mood || 5;
    const stressScore = responses.stress_level || 5;
    
    if (moodScore <= 3 || stressScore >= 8) {
      // High-risk indicators - require emergency contact
      emergencyContactsRequired = true;
    }
  }
  
  function bookTherapySession() {
    const sessionData = {
      type: sessionType,
      duration: therapyBookingData.sessionDuration,
      frequency: therapyBookingData.frequency,
      isMinor,
      emergencyContacts: therapyBookingData.emergencyContacts,
      assessmentResults: mentalHealthAssessment,
      timestamp: Date.now()
    };
    
    dispatch('sessionBooked', {
      sessionData,
      privacyPreferences: $privacySettings
    });
  }
  
  function nextStep() {
    switch (currentStep) {
      case 'privacy_consent':
        currentStep = 'privacy_settings';
        break;
      case 'privacy_settings':
        currentStep = 'assessment';
        break;
      case 'assessment':
        currentStep = emergencyContactsRequired ? 'emergency_contacts' : 'booking';
        break;
      case 'emergency_contacts':
        currentStep = 'booking';
        break;
    }
  }
  
  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }
</script>

<div class="privacy-focused-interface bg-white rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto">
  <!-- Privacy-First Header -->
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
    <div class="flex items-center space-x-3 mb-4">
      <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM10 2a8 8 0 100 16 8 8 0 000-16zm0 11a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-bold text-green-800">Terapia Psicológica Privada</h2>
        <p class="text-green-700 text-sm">Tu privacidad y bienestar son nuestra prioridad</p>
      </div>
    </div>
    
    {#if isMinor}
      <div class="bg-blue-100 border border-blue-300 rounded-lg p-3">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span class="text-blue-800 text-sm font-medium">
            Paciente menor de edad - Se requiere consentimiento de tutor legal
          </span>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Step Indicator -->
  <div class="p-6 border-b border-gray-100">
    <div class="flex items-center justify-between">
      {#each ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'] as step, index}
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
               class:bg-green-500={currentStep === step || (index < ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'].indexOf(currentStep))}
               class:text-white={currentStep === step || (index < ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'].indexOf(currentStep))}
               class:bg-gray-200={currentStep !== step && !(index < ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'].indexOf(currentStep))}
               class:text-gray-600={currentStep !== step && !(index < ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'].indexOf(currentStep))}>
            {index + 1}
          </div>
          {#if index < 4}
            <div class="w-12 h-0.5 bg-gray-200 mx-2"
                 class:bg-green-500={index < ['privacy_consent', 'privacy_settings', 'assessment', 'emergency_contacts', 'booking'].indexOf(currentStep)}></div>
          {/if}
        </div>
      {/each}
    </div>
    
    <div class="mt-4 text-center">
      <h3 class="text-lg font-semibold text-gray-900">
        {#if currentStep === 'privacy_consent'}Consentimiento y Privacidad
        {:else if currentStep === 'privacy_settings'}Configuración de Privacidad
        {:else if currentStep === 'assessment'}Evaluación Inicial
        {:else if currentStep === 'emergency_contacts'}Contactos de Emergencia
        {:else if currentStep === 'booking'}Reservar Sesión
        {/if}
      </h3>
    </div>
  </div>
  
  <!-- Content Area -->
  <div class="p-6">
    {#if currentStep === 'privacy_consent'}
      <!-- Privacy Consent Step -->
      <div class="space-y-6" transition:fade>
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Política de Privacidad y Consentimiento</h3>
          <p class="text-gray-600 mb-6">Por favor, lee y acepta nuestra política de privacidad para continuar</p>
        </div>
        
        <!-- Privacy Policy Summary -->
        <div class="bg-gray-50 rounded-lg p-6 space-y-4">
          <h4 class="font-semibold text-gray-900">Resumen de Protección de Datos</h4>
          
          {#each Object.entries(argentinaTherapyData.legalRequirements) as [key, requirement]}
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-gray-700">{requirement}</p>
            </div>
          {/each}
        </div>
        
        <!-- Consent Checkboxes -->
        <div class="space-y-4">
          <label class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" class="form-checkbox h-5 w-5 text-green-600 mt-1" required>
            <div>
              <span class="font-medium text-gray-900">Acepto la Política de Privacidad</span>
              <p class="text-sm text-gray-600 mt-1">
                He leído y acepto cómo se recopilan, usan y protegen mis datos personales
              </p>
            </div>
          </label>
          
          <label class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" class="form-checkbox h-5 w-5 text-green-600 mt-1" required>
            <div>
              <span class="font-medium text-gray-900">Consentimiento para Tratamiento Psicológico</span>
              <p class="text-sm text-gray-600 mt-1">
                Entiendo los riesgos y beneficios del tratamiento psicológico y doy mi consentimiento
              </p>
            </div>
          </label>
          
          {#if isMinor}
            <label class="flex items-start space-x-3 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer">
              <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600 mt-1" required>
              <div>
                <span class="font-medium text-blue-900">Consentimiento de Tutor Legal</span>
                <p class="text-sm text-blue-700 mt-1">
                  Como tutor legal, autorizo el tratamiento psicológico del menor bajo mi responsabilidad
                </p>
              </div>
            </label>
          {/if}
        </div>
        
        <div class="text-center">
          <button 
            class="btn btn-primary btn-lg"
            on:click={() => giveConsent('privacy_policy')}
          >
            Acepto y Continuar
          </button>
        </div>
      </div>
      
    {:else if currentStep === 'privacy_settings'}
      <!-- Privacy Settings Step -->
      <div class="space-y-8" transition:fade>
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Configuración de Privacidad</h3>
          <p class="text-gray-600">Personaliza cómo manejas tu información y comunicación</p>
        </div>
        
        <!-- Data Sharing Settings -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-4">Compartir Datos</h4>
          <div class="space-y-4">
            {#each Object.entries($privacySettings.dataSharing) as [key, value]}
              <label class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <span class="font-medium text-gray-900">
                    {#if key === 'anonymizedResearch'}Investigación Anónima
                    {:else if key === 'qualityImprovement'}Mejora de Calidad
                    {:else if key === 'platformAnalytics'}Analytics de Plataforma
                    {:else if key === 'marketingCommunications'}Comunicaciones de Marketing
                    {:else}{key}
                    {/if}
                  </span>
                  <p class="text-sm text-gray-600">
                    {#if key === 'anonymizedResearch'}Contribuir a estudios de investigación (datos anonimizados)
                    {:else if key === 'qualityImprovement'}Ayudar a mejorar nuestros servicios
                    {:else if key === 'platformAnalytics'}Análisis de uso de la plataforma
                    {:else if key === 'marketingCommunications'}Recibir ofertas y promociones
                    {/if}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  class="form-checkbox h-5 w-5 text-green-600"
                  checked={value}
                  disabled={isMinor && (key === 'anonymizedResearch' || key === 'marketingCommunications')}
                  on:change={(e) => updatePrivacySettings('dataSharing', key, e.target.checked)}
                >
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Communication Preferences -->
        <div class="bg-green-50 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-4">Preferencias de Comunicación</h4>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Método de Comunicación Preferido</label>
              <div class="space-y-2">
                {#each [{ id: 'platform', label: 'Solo a través de la plataforma' }, { id: 'email', label: 'Email para notificaciones importantes' }, { id: 'whatsapp', label: 'WhatsApp (solo emergencias)' }] as method}
                  <label class="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="communication_method" 
                      value={method.id}
                      class="form-radio h-4 w-4 text-green-600"
                      checked={$privacySettings.communication.preferredMethod === method.id}
                      on:change={() => updatePrivacySettings('communication', 'preferredMethod', method.id)}
                    >
                    <span class="text-gray-700">{method.label}</span>
                  </label>
                {/each}
              </div>
            </div>
            
            <div class="space-y-3">
              <label class="flex items-center justify-between">
                <span class="text-gray-700">Recordatorios de citas</span>
                <input 
                  type="checkbox" 
                  class="form-checkbox h-5 w-5 text-green-600"
                  checked={$privacySettings.communication.allowReminders}
                  on:change={(e) => updatePrivacySettings('communication', 'allowReminders', e.target.checked)}
                >
              </label>
              
              <label class="flex items-center justify-between">
                <span class="text-gray-700">Seguimiento post-sesión</span>
                <input 
                  type="checkbox" 
                  class="form-checkbox h-5 w-5 text-green-600"
                  checked={$privacySettings.communication.allowFollowUp}
                  on:change={(e) => updatePrivacySettings('communication', 'allowFollowUp', e.target.checked)}
                >
              </label>
            </div>
          </div>
        </div>
        
        <!-- Session Recording Settings -->
        <div class="bg-yellow-50 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-4">Grabación y Notas de Sesión</h4>
          
          <div class="space-y-4">
            <label class="flex items-center justify-between">
              <div>
                <span class="font-medium text-gray-900">Permitir notas de sesión</span>
                <p class="text-sm text-gray-600">El terapeuta puede tomar notas durante la sesión</p>
              </div>
              <input 
                type="checkbox" 
                class="form-checkbox h-5 w-5 text-green-600"
                checked={$privacySettings.sessionRecording.allowNotes}
                on:change={(e) => updatePrivacySettings('sessionRecording', 'allowNotes', e.target.checked)}
              >
            </label>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Retención de notas</label>
              <select 
                class="w-full p-2 border border-gray-300 rounded-lg"
                bind:value={$privacySettings.sessionRecording.notesRetention}
                on:change={(e) => updatePrivacySettings('sessionRecording', 'notesRetention', e.target.value)}
              >
                <option value="legal_minimum">Mínimo legal (5 años)</option>
                <option value="1_year">1 año</option>
                <option value="3_years">3 años</option>
                <option value="indefinite">Indefinido</option>
              </select>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800">
                <strong>Importante:</strong> Las grabaciones de audio/video están deshabilitadas por defecto para proteger tu privacidad. 
                Solo las notas escritas están permitidas según la configuración de privacidad.
              </p>
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <button class="btn btn-primary btn-lg" on:click={nextStep}>
            Guardar y Continuar
          </button>
        </div>
      </div>
      
    {:else if currentStep === 'assessment'}
      <!-- Mental Health Assessment Step -->
      <div class="space-y-6" transition:fade>
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Evaluación Inicial</h3>
          <p class="text-gray-600">Esta información ayudará a tu terapeuta a entender mejor tu situación</p>
        </div>
        
        <!-- Assessment Questions -->
        <div class="space-y-6">
          {#each mentalHealthAssessment.customQuestionnaire.questions as question}
            <div class="bg-gray-50 rounded-lg p-6">
              <label class="block text-sm font-medium text-gray-900 mb-3">
                {question.text}
                {#if question.required}<span class="text-red-500">*</span>{/if}
              </label>
              
              {#if question.type === 'scale'}
                <div class="space-y-3">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>{question.scale.labels[0]}</span>
                    <span>{question.scale.labels[1]}</span>
                  </div>
                  <input 
                    type="range" 
                    min={question.scale.min} 
                    max={question.scale.max}
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    bind:value={mentalHealthAssessment.customQuestionnaire.responses[question.id]}
                  >
                  <div class="text-center">
                    <span class="text-lg font-semibold text-green-600">
                      {mentalHealthAssessment.customQuestionnaire.responses[question.id] || question.scale.min}
                    </span>
                  </div>
                </div>
                
              {:else if question.type === 'multiple_choice'}
                <div class="space-y-2">
                  {#each question.options as option}
                    <label class="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name={question.id}
                        value={option}
                        class="form-radio h-4 w-4 text-green-600"
                        bind:group={mentalHealthAssessment.customQuestionnaire.responses[question.id]}
                      >
                      <span class="text-gray-700">{option}</span>
                    </label>
                  {/each}
                </div>
                
              {:else if question.type === 'yes_no'}
                <div class="flex space-x-4">
                  <label class="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={question.id}
                      value="yes"
                      class="form-radio h-4 w-4 text-green-600"
                      bind:group={mentalHealthAssessment.customQuestionnaire.responses[question.id]}
                    >
                    <span class="text-gray-700">Sí</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={question.id}
                      value="no"
                      class="form-radio h-4 w-4 text-green-600"
                      bind:group={mentalHealthAssessment.customQuestionnaire.responses[question.id]}
                    >
                    <span class="text-gray-700">No</span>
                  </label>
                </div>
                
              {:else if question.type === 'open_text'}
                <textarea 
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="4"
                  placeholder={question.placeholder}
                  bind:value={mentalHealthAssessment.customQuestionnaire.responses[question.id]}
                ></textarea>
              {/if}
            </div>
          {/each}
        </div>
        
        <!-- Crisis Assessment Warning -->
        {#if (mentalHealthAssessment.customQuestionnaire.responses.current_mood && mentalHealthAssessment.customQuestionnaire.responses.current_mood <= 3) || (mentalHealthAssessment.customQuestionnaire.responses.stress_level && mentalHealthAssessment.customQuestionnaire.responses.stress_level >= 8)}
          <div class="bg-red-50 border border-red-300 rounded-lg p-4" transition:fly={{ y: 20 }}>
            <div class="flex items-center space-x-3">
              <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div>
                <h4 class="font-semibold text-red-800">Atención: Nivel de Riesgo Detectado</h4>
                <p class="text-red-700 text-sm">
                  Basado en tus respuestas, recomendamos programar una cita prioritaria y configurar contactos de emergencia.
                </p>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="text-center">
          <button 
            class="btn btn-primary btn-lg"
            on:click={() => { completeAssessment(mentalHealthAssessment.customQuestionnaire.responses); nextStep(); }}
          >
            Completar Evaluación
          </button>
        </div>
      </div>
      
    {:else if currentStep === 'emergency_contacts'}
      <!-- Emergency Contacts Step -->
      <div class="space-y-6" transition:fade>
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Contactos de Emergencia</h3>
          <p class="text-gray-600">Personas a contactar en caso de emergencia o crisis</p>
        </div>
        
        <!-- Add Emergency Contact Form -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 class="font-semibold text-red-800 mb-4">Agregar Contacto de Emergencia</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <input type="text" class="form-input w-full" placeholder="Ej: María González">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Relación</label>
              <select class="form-select w-full">
                <option value="">Seleccionar...</option>
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="esposo">Esposo/a</option>
                <option value="hermano">Hermano/a</option>
                <option value="amigo">Amigo/a cercano</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input type="tel" class="form-input w-full" placeholder="+54 11 1234-5678">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
              <input type="email" class="form-input w-full" placeholder="contacto@ejemplo.com">
            </div>
          </div>
          
          <div class="mt-4">
            <label class="flex items-center space-x-2">
              <input type="checkbox" class="form-checkbox h-4 w-4 text-red-600">
              <span class="text-sm text-gray-700">Esta persona está informada de su rol como contacto de emergencia</span>
            </label>
          </div>
          
          <button class="btn btn-secondary mt-4" on:click={() => addEmergencyContact({})}>Agregar Contacto</button>
        </div>
        
        <!-- Existing Emergency Contacts -->
        {#if therapyBookingData.emergencyContacts.length > 0}
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Contactos Configurados</h4>
            <div class="space-y-3">
              {#each therapyBookingData.emergencyContacts as contact}
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">{contact.name || 'Contacto sin nombre'}</p>
                    <p class="text-sm text-gray-600">{contact.relationship || 'Relación no especificada'} • {contact.phone || 'Teléfono no proporcionado'}</p>
                  </div>
                  <button class="text-red-600 hover:text-red-800">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Crisis Resources -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 class="font-semibold text-blue-800 mb-3">Recursos de Crisis 24/7</h4>
          <div class="space-y-2 text-sm">
            <p class="text-blue-700"><strong>Centro de Asistencia al Suicida:</strong> 135 (gratuito)</p>
            <p class="text-blue-700"><strong>Emergencias Médicas:</strong> 107</p>
            <p class="text-blue-700"><strong>Emergencias Generales:</strong> 911</p>
            <p class="text-blue-700"><strong>Violencia de Género:</strong> 144</p>
          </div>
        </div>
        
        <div class="text-center">
          <button class="btn btn-primary btn-lg" on:click={nextStep}>
            Continuar a Reserva
          </button>
        </div>
      </div>
      
    {:else if currentStep === 'booking'}
      <!-- Therapy Booking Step -->
      <div class="space-y-6" transition:fade>
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Reservar Tu Sesión</h3>
          <p class="text-gray-600">Configura tu primera sesión de terapia</p>
        </div>
        
        <!-- Session Type Selection -->
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-4">Tipo de Sesión</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each ['individual', 'couple', 'family', 'group'] as type}
              <label class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-white cursor-pointer"
                     class:border-green-300={sessionType === type}
                     class:bg-green-50={sessionType === type}>
                <input 
                  type="radio" 
                  name="sessionType" 
                  value={type}
                  class="form-radio h-4 w-4 text-green-600 mr-3"
                  bind:group={sessionType}
                >
                <div class="flex-1">
                  <div class="font-medium text-gray-900 capitalize">
                    {#if type === 'individual'}Terapia Individual
                    {:else if type === 'couple'}Terapia de Pareja
                    {:else if type === 'family'}Terapia Familiar
                    {:else if type === 'group'}Terapia Grupal
                    {:else}{type}
                    {/if}
                  </div>
                  <div class="text-sm text-gray-600">
                    {formatCurrency(argentinaTherapyData.sessionPricing[type].min)} - {formatCurrency(argentinaTherapyData.sessionPricing[type].max)}
                  </div>
                  <div class="text-xs text-green-600 font-medium">
                    Promedio: {formatCurrency(argentinaTherapyData.sessionPricing[type].average)}
                  </div>
                </div>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Session Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-green-50 rounded-lg p-6">
            <h4 class="font-semibold text-gray-900 mb-4">Duración y Frecuencia</h4>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Duración de Sesión</label>
                <select class="form-select w-full" bind:value={therapyBookingData.sessionDuration}>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (recomendado)</option>
                  <option value={90}>90 minutos</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
                <select class="form-select w-full" bind:value={therapyBookingData.frequency}>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 rounded-lg p-6">
            <h4 class="font-semibold text-gray-900 mb-4">Cobertura de Obra Social</h4>
            
            <div class="space-y-3">
              {#each argentinaTherapyData.insuranceProviders as provider}
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                  <input type="radio" name="insurance" value={provider.id} class="form-radio h-4 w-4 text-blue-600 mr-3">
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{provider.name}</div>
                    <div class="text-sm text-gray-600">
                      {provider.coverage} • {provider.sessions} sesiones anuales
                    </div>
                  </div>
                </label>
              {/each}
              
              <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                <input type="radio" name="insurance" value="private" class="form-radio h-4 w-4 text-blue-600 mr-3">
                <div class="font-medium text-gray-900">Pago particular</div>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Session Goals -->
        <div class="bg-yellow-50 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-4">Objetivos de la Terapia</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            {#each argentinaTherapyData.commonConcerns as concern}
              <label class="flex items-center space-x-2">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-yellow-600">
                <span class="text-sm text-gray-700">{concern}</span>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Privacy Summary -->
        <div class="bg-gray-100 rounded-lg p-6">
          <h4 class="font-semibold text-gray-900 mb-3">Resumen de Privacidad</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Comunicación:</span>
              <span class="font-medium">
                {#if $privacySettings.communication.preferredMethod === 'platform'}Solo plataforma
                {:else if $privacySettings.communication.preferredMethod === 'email'}Email + plataforma
                {:else if $privacySettings.communication.preferredMethod === 'whatsapp'}WhatsApp emergencias
                {/if}
              </span>
            </div>
            <div>
              <span class="text-gray-600">Notas de sesión:</span>
              <span class="font-medium">{$privacySettings.sessionRecording.allowNotes ? 'Permitidas' : 'No permitidas'}</span>
            </div>
            <div>
              <span class="text-gray-600">Contactos emergencia:</span>
              <span class="font-medium">{therapyBookingData.emergencyContacts.length} configurados</span>
            </div>
            <div>
              <span class="text-gray-600">Tipo paciente:</span>
              <span class="font-medium">{isMinor ? 'Menor de edad' : 'Adulto'}</span>
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <button class="btn btn-primary btn-lg" on:click={bookTherapySession}>
            Reservar Sesión de Terapia
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .privacy-focused-interface {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .btn {
    @apply inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-green-600 text-white shadow-sm hover:bg-green-700 focus:ring-green-500;
  }
  
  .btn-secondary {
    @apply text-gray-700 bg-white border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-gray-500;
  }
  
  .btn-lg {
    @apply px-8 py-4 text-lg;
  }
  
  .form-checkbox, .form-radio {
    @apply rounded border-gray-300 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50;
  }
  
  .form-input, .form-select {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent;
  }
</style>