/**
 * Test User Data for BarberPro Argentina Market Testing
 * Realistic personas and scenarios for comprehensive testing
 */

export interface TestUser {
  email: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'PROVIDER';
  location?: {
    city: string;
    province: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  preferences?: {
    language: string;
    currency: string;
    timezone: string;
  };
  metadata?: Record<string, any>;
}

export interface TestProvider extends TestUser {
  role: 'PROVIDER';
  business: {
    name: string;
    type: 'SHOP' | 'MOBILE' | 'HOME';
    description: string;
    specialties: string[];
    priceRange: {
      min: number;
      max: number;
    };
    workingHours: {
      [key: string]: {
        open: string;
        close: string;
        breaks?: Array<{ start: string; end: string }>;
      };
    };
  };
  services: Array<{
    name: string;
    description: string;
    duration: number; // minutes
    price: number; // ARS
    category: string;
  }>;
}

export interface TestClient extends TestUser {
  role: 'CLIENT';
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    preferredTimes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
  };
  bookingHistory?: Array<{
    serviceType: string;
    frequency: 'weekly' | 'monthly' | 'occasional';
    preferredProviders?: string[];
  }>;
}

// =================
// PROVIDER TEST DATA
// =================

export const testProviders: TestProvider[] = [
  {
    // Carlos - Traditional Barber Shop Owner (Buenos Aires)
    email: 'carlos.barberia@test.com',
    name: 'Carlos Rodríguez',
    phone: '+5491123456789',
    role: 'PROVIDER',
    location: {
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      address: 'Av. Corrientes 1234, Palermo, CABA',
      coordinates: { lat: -34.5891, lng: -58.3969 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires'
    },
    business: {
      name: 'Barbería El Corte Perfecto',
      type: 'SHOP',
      description: 'Barbería tradicional con más de 20 años de experiencia en Palermo',
      specialties: ['Cortes clásicos', 'Barba tradicional', 'Afeitado con navaja'],
      priceRange: { min: 500, max: 2000 },
      workingHours: {
        monday: { open: '09:00', close: '19:00', breaks: [{ start: '13:00', end: '15:00' }] },
        tuesday: { open: '09:00', close: '19:00', breaks: [{ start: '13:00', end: '15:00' }] },
        wednesday: { open: '09:00', close: '19:00', breaks: [{ start: '13:00', end: '15:00' }] },
        thursday: { open: '09:00', close: '19:00', breaks: [{ start: '13:00', end: '15:00' }] },
        friday: { open: '09:00', close: '19:00', breaks: [{ start: '13:00', end: '15:00' }] },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: '10:00', close: '14:00' }
      }
    },
    services: [
      {
        name: 'Corte Clásico',
        description: 'Corte de cabello tradicional con tijera y máquina',
        duration: 30,
        price: 800,
        category: 'Corte'
      },
      {
        name: 'Barba Completa',
        description: 'Arreglo de barba con máquina y tijera',
        duration: 20,
        price: 500,
        category: 'Barba'
      },
      {
        name: 'Combo Corte + Barba',
        description: 'Servicio completo de corte y barba',
        duration: 45,
        price: 1200,
        category: 'Combo'
      },
      {
        name: 'Afeitado Tradicional',
        description: 'Afeitado con navaja y toallas calientes',
        duration: 30,
        price: 700,
        category: 'Afeitado'
      }
    ],
    metadata: {
      staffCount: 3,
      hasWaitingArea: true,
      acceptsWalkIns: true,
      popularTimes: ['18:00-20:00', 'Saturday morning']
    }
  },

  {
    // Martín - Mobile Modern Barber (Córdoba)
    email: 'martin.mobile@test.com',
    name: 'Martín Fernández',
    phone: '+5493514567890',
    role: 'PROVIDER',
    location: {
      city: 'Córdoba',
      province: 'Córdoba',
      address: 'Servicio a domicilio - Zona Centro y alrededores',
      coordinates: { lat: -31.4201, lng: -64.1888 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires'
    },
    business: {
      name: 'Martín Mobile Barber',
      type: 'MOBILE',
      description: 'Barbero moderno a domicilio. Llevo mi estilo a tu casa u oficina',
      specialties: ['Cortes modernos', 'Fade cuts', 'Beard styling', 'Domicilio'],
      priceRange: { min: 800, max: 2500 },
      workingHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '21:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: { open: '10:00', close: '16:00' }
      }
    },
    services: [
      {
        name: 'Corte Moderno',
        description: 'Cortes actuales: fade, undercut, texturizado',
        duration: 40,
        price: 1000,
        category: 'Corte'
      },
      {
        name: 'Barba Styling',
        description: 'Diseño y perfilado de barba moderna',
        duration: 25,
        price: 600,
        category: 'Barba'
      },
      {
        name: 'Premium Complete',
        description: 'Corte + barba + lavado + styling a domicilio',
        duration: 60,
        price: 1800,
        category: 'Premium'
      },
      {
        name: 'Express Cut',
        description: 'Corte rápido para oficina (solo corte)',
        duration: 20,
        price: 800,
        category: 'Express'
      }
    ],
    metadata: {
      mobileRadius: 15, // km
      hasOwnTransport: true,
      equipment: 'portable',
      serviceLocations: ['home', 'office', 'events']
    }
  },

  {
    // Ana - Women's Hair Specialist (Mendoza)
    email: 'ana.estilo@test.com',
    name: 'Ana García',
    phone: '+5492614567890',
    role: 'PROVIDER',
    location: {
      city: 'Mendoza',
      province: 'Mendoza',
      address: 'San Martín 567, Ciudad de Mendoza',
      coordinates: { lat: -32.8908, lng: -68.8272 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires'
    },
    business: {
      name: 'Estudio Ana - Hair & Beauty',
      type: 'SHOP',
      description: 'Especialista en cortes femeninos, coloración y tratamientos',
      specialties: ['Cortes femeninos', 'Coloración', 'Tratamientos', 'Peinados'],
      priceRange: { min: 1200, max: 5000 },
      workingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '08:00', close: '16:00' },
        sunday: { open: '00:00', close: '00:00' } // Closed
      }
    },
    services: [
      {
        name: 'Corte Femenino',
        description: 'Corte personalizado según tipo de rostro y cabello',
        duration: 45,
        price: 1500,
        category: 'Corte'
      },
      {
        name: 'Coloración Completa',
        description: 'Color permanente con productos profesionales',
        duration: 120,
        price: 3500,
        category: 'Color'
      },
      {
        name: 'Mechas/Luces',
        description: 'Mechas con técnica de papel o gorro',
        duration: 150,
        price: 4000,
        category: 'Color'
      },
      {
        name: 'Peinado Social',
        description: 'Peinado para eventos especiales',
        duration: 60,
        price: 2000,
        category: 'Peinado'
      }
    ],
    metadata: {
      specializes: 'women',
      hasColorBar: true,
      bookingAdvance: '48h', // requires 48h advance booking
      cancelationPolicy: '24h'
    }
  }
];

// =================
// CLIENT TEST DATA
// =================

export const testClients: TestClient[] = [
  {
    // Sofía - Busy Professional (Buenos Aires)
    email: 'sofia.martinez@test.com',
    name: 'Sofía Martínez',
    phone: '+5491198765432',
    role: 'CLIENT',
    location: {
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      address: 'Microcentro, CABA',
      coordinates: { lat: -34.6037, lng: -58.3816 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      preferredTimes: ['18:00-20:00', 'Saturday morning'],
      budgetRange: { min: 800, max: 2000 }
    },
    bookingHistory: [
      {
        serviceType: 'Corte femenino',
        frequency: 'monthly',
        preferredProviders: ['ana.estilo@test.com']
      }
    ],
    metadata: {
      profession: 'Marketing Manager',
      workSchedule: '09:00-18:00',
      hasChildren: true,
      prefersMobileService: false,
      loyaltyTier: 'regular'
    }
  },

  {
    // Diego - Young Professional (Córdoba)
    email: 'diego.tech@test.com',
    name: 'Diego López',
    phone: '+5493517654321',
    role: 'CLIENT',
    location: {
      city: 'Córdoba',
      province: 'Córdoba',
      address: 'Nueva Córdoba',
      coordinates: { lat: -31.4201, lng: -64.1888 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      preferredTimes: ['19:00-21:00', 'Weekend'],
      budgetRange: { min: 600, max: 1500 }
    },
    bookingHistory: [
      {
        serviceType: 'Corte moderno',
        frequency: 'monthly',
        preferredProviders: ['martin.mobile@test.com']
      }
    ],
    metadata: {
      profession: 'Software Developer',
      workSchedule: 'flexible',
      hasChildren: false,
      prefersMobileService: true,
      loyaltyTier: 'new'
    }
  },

  {
    // Roberto - Traditional Client (Buenos Aires)
    email: 'roberto.clasico@test.com',
    name: 'Roberto Pérez',
    phone: '+5491187654321',
    role: 'CLIENT',
    location: {
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      address: 'Palermo, CABA',
      coordinates: { lat: -34.5891, lng: -58.3969 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      preferredTimes: ['10:00-12:00', 'Saturday afternoon'],
      budgetRange: { min: 500, max: 1200 }
    },
    bookingHistory: [
      {
        serviceType: 'Corte clásico',
        frequency: 'weekly',
        preferredProviders: ['carlos.barberia@test.com']
      }
    ],
    metadata: {
      profession: 'Retired',
      workSchedule: 'flexible',
      hasChildren: false,
      prefersMobileService: false,
      loyaltyTier: 'vip',
      regularAppointment: 'Saturday 11:00'
    }
  },

  {
    // Lucía - Student (Mendoza)
    email: 'lucia.estudiante@test.com',
    name: 'Lucía Fernández',
    phone: '+5492615678901',
    role: 'CLIENT',
    location: {
      city: 'Mendoza',
      province: 'Mendoza',
      address: 'Ciudad Universitaria, Mendoza',
      coordinates: { lat: -32.8908, lng: -68.8272 }
    },
    preferences: {
      language: 'es-AR',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      preferredTimes: ['15:00-17:00', 'Weekend'],
      budgetRange: { min: 400, max: 1000 }
    },
    bookingHistory: [
      {
        serviceType: 'Corte femenino',
        frequency: 'occasional',
        preferredProviders: []
      }
    ],
    metadata: {
      profession: 'University Student',
      workSchedule: 'morning classes',
      hasChildren: false,
      prefersMobileService: false,
      loyaltyTier: 'student',
      priceCareful: true
    }
  }
];

// =================
// EDGE CASE SCENARIOS
// =================

export const edgeCaseUsers = {
  // User with special characters in name
  specialCharacterUser: {
    email: 'maría.josé+test@test.com',
    name: 'María José Ñoñez-D\'Angelo',
    phone: '+5491199887766',
    role: 'CLIENT' as const,
    location: {
      city: 'Río Gallegos',
      province: 'Santa Cruz',
      address: 'Av. Libertador 123, Río Gallegos'
    }
  },

  // User with very long business name
  longBusinessNameProvider: {
    email: 'super.long.name@test.com',
    name: 'Establecimiento de Servicios Estéticos y Capilares Premium Plus',
    phone: '+5491177665544',
    role: 'PROVIDER' as const,
    business: {
      name: 'Centro de Estética Capilar Avanzado y Servicios de Belleza Integral Para Toda la Familia y Empresas'
    }
  },

  // User with minimum/maximum prices
  extremePriceProvider: {
    email: 'extreme.prices@test.com',
    name: 'Extreme Pricing Test',
    phone: '+5491166554433',
    role: 'PROVIDER' as const,
    services: [
      { name: 'Cheap Cut', price: 100 }, // Very low price
      { name: 'Luxury Treatment', price: 25000 } // Very high price
    ]
  },

  // User in remote Argentina location
  remoteLocationUser: {
    email: 'remote.user@test.com',
    name: 'Usuario Remoto',
    phone: '+5492944123456',
    role: 'CLIENT' as const,
    location: {
      city: 'Ushuaia',
      province: 'Tierra del Fuego',
      address: 'Fin del Mundo 999, Ushuaia'
    }
  }
};

// =================
// PAYMENT TEST SCENARIOS
// =================

export const paymentTestScenarios = {
  successfulPayment: {
    cardNumber: '4507990000004905', // MercadoPago test card
    expiryDate: '11/25',
    cvv: '123',
    holderName: 'APRO',
    installments: 1
  },

  failedPayment: {
    cardNumber: '4074090000000004', // MercadoPago rejected card
    expiryDate: '11/25',
    cvv: '123',
    holderName: 'OTHE',
    installments: 1
  },

  pendingPayment: {
    cardNumber: '4507990000004897', // MercadoPago pending card
    expiryDate: '11/25',
    cvv: '123',
    holderName: 'PEND',
    installments: 1
  }
};

// =================
// TEST DATA HELPERS
// =================

export const testDataHelpers = {
  /**
   * Get a random provider from test data
   */
  getRandomProvider(): TestProvider {
    return testProviders[Math.floor(Math.random() * testProviders.length)];
  },

  /**
   * Get a random client from test data
   */
  getRandomClient(): TestClient {
    return testClients[Math.floor(Math.random() * testClients.length)];
  },

  /**
   * Get providers by city
   */
  getProvidersByCity(city: string): TestProvider[] {
    return testProviders.filter(provider => 
      provider.location?.city.toLowerCase() === city.toLowerCase()
    );
  },

  /**
   * Get providers by service type
   */
  getProvidersByService(serviceCategory: string): TestProvider[] {
    return testProviders.filter(provider =>
      provider.services.some(service => 
        service.category.toLowerCase() === serviceCategory.toLowerCase()
      )
    );
  },

  /**
   * Get providers in price range
   */
  getProvidersByPriceRange(minPrice: number, maxPrice: number): TestProvider[] {
    return testProviders.filter(provider =>
      provider.business.priceRange.min >= minPrice &&
      provider.business.priceRange.max <= maxPrice
    );
  },

  /**
   * Generate Argentina phone number
   */
  generateArgentinaPhone(): string {
    const areaCodes = ['11', '351', '261', '381', '223', '341']; // Major Argentina area codes
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const number = Math.floor(10000000 + Math.random() * 90000000);
    return `+549${areaCode}${number}`;
  },

  /**
   * Generate test booking for a specific date/time
   */
  generateTestBooking(providerId: string, clientId: string, appointmentTime: Date) {
    return {
      providerId,
      clientId,
      serviceId: 'test-service-id',
      startTime: appointmentTime,
      endTime: new Date(appointmentTime.getTime() + 30 * 60000), // 30 minutes later
      status: 'CONFIRMED',
      totalPrice: 1000,
      paymentMethod: 'MERCADOPAGO',
      notes: 'Test booking for automated testing'
    };
  }
};