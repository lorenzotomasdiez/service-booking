<!--
  Therapist Provider Profile - Psychology Vertical Specialization
  Professional credentials, therapy specializations, trust signals
  Argentina psychology licensing and certification display
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  
  export let therapistId: string;
  export let showContactOptions: boolean = true;
  export let allowBooking: boolean = true;
  export let privacyMode: 'full' | 'limited' | 'anonymous' = 'full';
  
  const dispatch = createEventDispatcher<{
    bookingRequested: { therapistId: string; sessionType: string };
    contactRequested: { therapistId: string; method: string };
    profileViewed: { therapistId: string; timestamp: number };
  }>();
  
  // Therapist profile data with Argentina psychology specialization
  let therapistProfile = {
    id: therapistId,
    personalInfo: {
      name: 'Dra. Ana María Rodríguez',
      title: 'Psicóloga Clínica',
      profilePhoto: '/avatars/therapist-ana.jpg',
      yearsExperience: 12,
      languages: ['Español', 'Inglés'],
      gender: 'Femenino',
      ageRange: '35-45'
    },
    professionalInfo: {
      licenseNumber: 'MP 8456 - MN 12345',
      university: 'Universidad de Buenos Aires (UBA)',
      degree: 'Licenciada en Psicología',
      postgraduate: ['Especialista en Terapia Cognitivo-Conductual', 'Magister en Psicología Clínica'],
      professionalAssociations: [
        'Colegio de Psicólogos de la Provincia de Buenos Aires',
        'Asociación Argentina de Terapia Cognitiva'
      ],
      verificationStatus: {
        identity: { verified: true, date: '2024-01-15' },
        license: { verified: true, date: '2024-01-15' },
        education: { verified: true, date: '2024-01-20' },
        ethics: { verified: true, date: '2024-01-10' }
      }
    },
    specializations: [
      {
        area: 'Trastornos de Ansiedad',
        experience: '8 años',
        techniques: ['Terapia Cognitivo-Conductual', 'Mindfulness', 'Exposición Gradual'],
        certifications: ['Certificación en TCC para Ansiedad - AATC']
      },
      {
        area: 'Depresión',
        experience: '10 años',
        techniques: ['Terapia Cognitivo-Conductual', 'Terapia Interpersonal', 'Activación Conductual'],
        certifications: ['Especialista en Trastornos del Estado de Ánimo']
      },
      {
        area: 'Terapia de Pareja',
        experience: '6 años',
        techniques: ['Terapia Sistémmica', 'Comunicación Asertiva', 'Resolución de Conflictos'],
        certifications: ['Terapia de Pareja - Instituto de Familia']
      }
    ],
    sessionInfo: {
      types: [
        { type: 'individual', duration: 60, price: 4500, available: true },
        { type: 'couple', duration: 90, price: 6500, available: true },
        { type: 'family', duration: 90, price: 7500, available: true },
        { type: 'group', duration: 90, price: 3000, available: false }
      ],
      availability: {
        schedule: {
          monday: ['09:00', '10:30', '15:00', '16:30', '18:00'],
          tuesday: ['09:00', '10:30', '15:00', '16:30'],
          wednesday: ['09:00', '10:30', '15:00', '16:30', '18:00'],
          thursday: ['09:00', '10:30', '15:00', '16:30'],
          friday: ['09:00', '10:30', '15:00'],
          saturday: ['09:00', '10:30'],
          sunday: []
        },
        nextAvailable: '2024-09-14T15:00:00',
        timezone: 'America/Argentina/Buenos_Aires'
      },
      modalities: [
        { type: 'presencial', location: 'Palermo, CABA', available: true },
        { type: 'videollamada', platform: 'Plataforma segura', available: true },
        { type: 'telefonica', available: true }
      ]
    },
    reviews: {
      averageRating: 4.9,
      totalReviews: 127,
      distribution: {
        5: 98,
        4: 23,
        3: 4,
        2: 1,
        1: 1
      },
      recent: [
        {
          id: 1,
          rating: 5,
          comment: 'Excelente profesional. Me ayudó muchísimo con mi ansiedad. Muy recomendable.',
          initials: 'M.G.',
          date: '2024-09-10',
          verified: true,
          anonymous: true
        },
        {
          id: 2,
          rating: 5,
          comment: 'Muy empática y profesional. Las sesiones han sido muy útiles.',
          initials: 'C.R.',
          date: '2024-09-08',
          verified: true,
          anonymous: true
        },
        {
          id: 3,
          rating: 4,
          comment: 'Buena terapeuta, me gusta su enfoque práctico.',
          initials: 'L.M.',
          date: '2024-09-05',
          verified: true,
          anonymous: true
        }
      ]
    },
    insuranceAccepted: [
      { name: 'OSDE', plans: ['210', '310', '410'], coverage: 'Total' },
      { name: 'Swiss Medical', plans: ['SMG', 'Premium'], coverage: 'Parcial (80%)' },
      { name: 'Galeno', plans: ['Blue', 'Gold'], coverage: 'Total' },
      { name: 'Medicus', plans: ['Verde', 'Azul'], coverage: 'Parcial (70%)' }
    ],
    communicationPreferences: {
      whatsapp: { available: false, reason: 'Por privacidad profesional' },
      email: { available: true, responseTime: '24 horas' },
      platform: { available: true, responseTime: '2-4 horas' },
      phone: { available: true, emergencyOnly: true }
    },
    location: {
      area: 'Palermo',
      city: 'CABA',
      address: 'Av. Santa Fe 3456, Piso 5, Depto. B',
      nearbyTransport: ['Subte D - Estación Palermo', 'Varias líneas de colectivo'],
      parking: 'Disponible en la zona',
      accessibility: 'Edificio con ascensor, accesible para personas con movilidad reducida'
    },
    additionalInfo: {
      aboutMe: 'Soy psicóloga clínica con más de 12 años de experiencia ayudando a personas a superar dificultades emocionales y mejorar su bienestar. Me especializo en trastornos de ansiedad, depresión y terapia de pareja, utilizando enfoques basados en evidencia científica. Mi objetivo es crear un espacio seguro y empático donde cada persona pueda explorar sus pensamientos y emociones para lograr un cambio positivo.',
      approaches: [
        'Terapia Cognitivo-Conductual (TCC)',
        'Terapia de Aceptación y Compromiso (ACT)',
        'Mindfulness y Meditación',
        'Terapia Sistémica Familiar'
      ],
      treatmentPhilosophy: 'Creo en la importancia de un enfoque colaborativo donde terapeuta y paciente trabajen juntos hacia objetivos concretos y medibles. Cada persona es única y merece un tratamiento personalizado que respete sus valores y circunstancias.',
      continuingEducation: [
        'Curso de Actualización en Trauma y PTSD (2024)',
        'Entrenamiento en Terapia Online Efectiva (2023)',
        'Workshop Internacional de Mindfulness (2023)'
      ]
    }
  };
  
  onMount(() => {
    trackProfileView();
  });
  
  function trackProfileView() {
    dispatch('profileViewed', {
      therapistId,
      timestamp: Date.now()
    });
  }
  
  function requestBooking(sessionType: string) {
    dispatch('bookingRequested', {
      therapistId,
      sessionType
    });
  }
  
  function requestContact(method: string) {
    dispatch('contactRequested', {
      therapistId,
      method
    });
  }
  
  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }
  
  function getSessionTypeName(type: string): string {
    const names = {
      'individual': 'Individual',
      'couple': 'Pareja',
      'family': 'Familiar',
      'group': 'Grupal'
    };
    return names[type] || type;
  }
  
  function getDayName(day: string): string {
    const days = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return days[day] || day;
  }
</script>

<div class="therapist-profile bg-white rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto">
  <!-- Header Section -->
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
    <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
      <!-- Profile Photo -->
      <div class="relative">
        <div class="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
          {#if therapistProfile.personalInfo.profilePhoto}
            <img src={therapistProfile.personalInfo.profilePhoto} alt={therapistProfile.personalInfo.name} class="w-full h-full object-cover">
          {:else}
            <div class="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold">
              {therapistProfile.personalInfo.name.split(' ').map(n => n[0]).join('')}
            </div>
          {/if}
        </div>
        
        <!-- Verification Badge -->
        <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      
      <!-- Basic Info -->
      <div class="flex-1">
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-2xl font-bold text-gray-900">{therapistProfile.personalInfo.name}</h1>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Verificado
          </span>
        </div>
        
        <p class="text-green-700 font-medium mb-2">{therapistProfile.personalInfo.title}</p>
        <p class="text-gray-600 mb-3">{therapistProfile.professionalInfo.licenseNumber}</p>
        
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span class="flex items-center space-x-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>{therapistProfile.personalInfo.yearsExperience} años de experiencia</span>
          </span>
          
          <span class="flex items-center space-x-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span>{therapistProfile.location.area}, {therapistProfile.location.city}</span>
          </span>
          
          <span class="flex items-center space-x-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span>⭐ {therapistProfile.reviews.averageRating} ({therapistProfile.reviews.totalReviews} reseñas)</span>
          </span>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="flex flex-col space-y-2">
        {#if allowBooking}
          <button class="btn btn-primary" on:click={() => requestBooking('individual')}>
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            Reservar Cita
          </button>
        {/if}
        
        {#if showContactOptions}
          <button class="btn btn-secondary" on:click={() => requestContact('platform')}>
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" />
            </svg>
            Consultar
          </button>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Content Tabs/Sections -->
  <div class="p-6">
    <div class="space-y-8">
      
      <!-- Professional Credentials -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15v-3a1 1 0 011-1h2a1 1 0 011 1v3h1V8.41l-4-2.85L5 8.41V15h3z" clip-rule="evenodd" />
          </svg>
          Credenciales Profesionales
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Education -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Formación Académica</h4>
            <div class="space-y-2">
              <p class="text-gray-700">
                <strong>{therapistProfile.professionalInfo.degree}</strong><br>
                {therapistProfile.professionalInfo.university}
              </p>
              {#each therapistProfile.professionalInfo.postgraduate as degree}
                <p class="text-gray-600 text-sm">• {degree}</p>
              {/each}
            </div>
          </div>
          
          <!-- Verification Status -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Estado de Verificación</h4>
            <div class="space-y-2">
              {#each Object.entries(therapistProfile.professionalInfo.verificationStatus) as [type, status]}
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 capitalize">
                    {#if type === 'identity'}Identidad
                    {:else if type === 'license'}Matrícula
                    {:else if type === 'education'}Educación
                    {:else if type === 'ethics'}Ética Profesional
                    {:else}{type}
                    {/if}
                  </span>
                  <span class="flex items-center text-green-600 text-sm">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Verificado
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Professional Associations -->
        <div class="mt-4 pt-4 border-t border-blue-200">
          <h4 class="font-medium text-gray-900 mb-2">Asociaciones Profesionales</h4>
          <div class="flex flex-wrap gap-2">
            {#each therapistProfile.professionalInfo.professionalAssociations as association}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {association}
              </span>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Specializations -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Especializaciones</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each therapistProfile.specializations as spec}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 class="font-semibold text-gray-900 mb-2">{spec.area}</h4>
              <p class="text-sm text-gray-600 mb-3">{spec.experience}</p>
              
              <div class="mb-3">
                <p class="text-xs font-medium text-gray-700 mb-1">Técnicas:</p>
                <div class="flex flex-wrap gap-1">
                  {#each spec.techniques as technique}
                    <span class="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {technique}
                    </span>
                  {/each}
                </div>
              </div>
              
              {#if spec.certifications.length > 0}
                <div>
                  <p class="text-xs font-medium text-gray-700 mb-1">Certificaciones:</p>
                  {#each spec.certifications as cert}
                    <p class="text-xs text-green-600">✓ {cert}</p>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Session Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Types and Pricing -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-green-900 mb-4">Tipos de Sesión y Precios</h3>
          <div class="space-y-3">
            {#each therapistProfile.sessionInfo.types as session}
              <div class="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">Terapia {getSessionTypeName(session.type)}</p>
                  <p class="text-sm text-gray-600">{session.duration} minutos</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-green-700">{formatCurrency(session.price)}</p>
                  <p class="text-xs {session.available ? 'text-green-600' : 'text-gray-500'}">
                    {session.available ? 'Disponible' : 'No disponible'}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Modalities -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-purple-900 mb-4">Modalidades de Atención</h3>
          <div class="space-y-3">
            {#each therapistProfile.sessionInfo.modalities as modality}
              <div class="flex items-center p-3 bg-white border border-purple-200 rounded-lg">
                <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  {#if modality.type === 'presencial'}
                    <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                  {:else if modality.type === 'videollamada'}
                    <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  {:else}
                    <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  {/if}
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 capitalize">{modality.type}</p>
                  <p class="text-sm text-gray-600">
                    {#if modality.location}{modality.location}
                    {:else if modality.platform}{modality.platform}
                    {:else}Disponible
                    {/if}
                  </p>
                </div>
                <div class="text-green-600">
                  {#if modality.available}✓{:else}✗{/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- About Me -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Sobre Mí</h3>
        <div class="bg-gray-50 rounded-lg p-6">
          <p class="text-gray-700 leading-relaxed mb-4">{therapistProfile.additionalInfo.aboutMe}</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Enfoques Terapéuticos</h4>
              <ul class="space-y-1">
                {#each therapistProfile.additionalInfo.approaches as approach}
                  <li class="text-gray-600 text-sm flex items-center">
                    <svg class="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    {approach}
                  </li>
                {/each}
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Filosofía de Tratamiento</h4>
              <p class="text-gray-600 text-sm">{therapistProfile.additionalInfo.treatmentPhilosophy}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reviews -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Reseñas de Pacientes</h3>
        
        <!-- Rating Summary -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <div class="flex items-center space-x-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-yellow-600">{therapistProfile.reviews.averageRating}</div>
              <div class="text-sm text-gray-600">{therapistProfile.reviews.totalReviews} reseñas</div>
            </div>
            
            <div class="flex-1">
              {#each Object.entries(therapistProfile.reviews.distribution).reverse() as [stars, count]}
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm text-gray-600 w-8">{stars}★</span>
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="bg-yellow-400 h-2 rounded-full" style="width: {(count / therapistProfile.reviews.totalReviews) * 100}%"></div>
                  </div>
                  <span class="text-sm text-gray-600 w-8">{count}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Recent Reviews -->
        <div class="space-y-4">
          {#each therapistProfile.reviews.recent as review}
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {review.initials}
                  </div>
                  <div class="flex">
                    {#each Array(5) as _, i}
                      <svg class="w-4 h-4 {i < review.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    {/each}
                  </div>
                  {#if review.verified}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verificado
                    </span>
                  {/if}
                </div>
                <span class="text-sm text-gray-500">{review.date}</span>
              </div>
              <p class="text-gray-700 text-sm">{review.comment}</p>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Insurance Coverage -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-4">Obras Sociales Aceptadas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each therapistProfile.insuranceAccepted as insurance}
            <div class="bg-white border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">{insurance.name}</h4>
                <span class="text-sm text-blue-600 font-medium">{insurance.coverage}</span>
              </div>
              <p class="text-sm text-gray-600">
                Planes: {insurance.plans.join(', ')}
              </p>
            </div>
          {/each}
        </div>
        
        <div class="mt-4 p-3 bg-blue-100 rounded-lg">
          <p class="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Verifica tu cobertura específica contactando directamente a tu obra social antes de la consulta.
          </p>
        </div>
      </div>
      
      <!-- Location & Accessibility -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Ubicación y Accesibilidad</h3>
        <div class="bg-gray-50 rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Dirección</h4>
              <p class="text-gray-700 mb-4">{therapistProfile.location.address}</p>
              
              <h4 class="font-medium text-gray-900 mb-2">Transporte Público</h4>
              <ul class="space-y-1">
                {#each therapistProfile.location.nearbyTransport as transport}
                  <li class="text-gray-600 text-sm flex items-center">
                    <svg class="w-3 h-3 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    {transport}
                  </li>
                {/each}
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Estacionamiento</h4>
              <p class="text-gray-600 text-sm mb-4">{therapistProfile.location.parking}</p>
              
              <h4 class="font-medium text-gray-900 mb-2">Accesibilidad</h4>
              <p class="text-gray-600 text-sm">{therapistProfile.location.accessibility}</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</div>

<style>
  .therapist-profile {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-green-600 text-white shadow-sm hover:bg-green-700 focus:ring-green-500;
  }
  
  .btn-secondary {
    @apply text-gray-700 bg-white border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-gray-500;
  }
</style>