/**
 * Test Data Fixtures for BarberPro
 * Argentina-specific test data for comprehensive testing scenarios
 */

export const argentinaTestData = {
  // Argentina User Personas
  users: {
    // Carlos - Barbería Owner (Small Business)
    carlos: {
      email: 'carlos.rodriguez@barberia.com.ar',
      password: 'CarlosBarber123!',
      name: 'Carlos Rodríguez',
      phone: '+5491123456789',
      role: 'PROVIDER' as const,
      dni: '20123456789',
      businessName: 'Barbería Don Carlos',
      address: 'Av. Corrientes 1234, CABA',
      businessType: 'BARBERSHOP',
      businessHours: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: { closed: true }
      }
    },

    // Martín - Independent Barber
    martin: {
      email: 'martin.independiente@gmail.com',
      password: 'MartinBarber456!',
      name: 'Martín García',
      phone: '+5491187654321',
      role: 'PROVIDER' as const,
      dni: '27987654321',
      businessName: 'Martín Barbero Profesional',
      address: 'San Telmo, CABA',
      businessType: 'INDEPENDENT',
      businessHours: {
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { closed: true },
        thursday: { start: '10:00', end: '18:00' },
        friday: { start: '10:00', end: '18:00' },
        saturday: { start: '09:00', end: '16:00' },
        sunday: { start: '10:00', end: '14:00' }
      }
    },

    // Alejandro - Chain Owner
    alejandro: {
      email: 'alejandro@cadenabarber.com.ar',
      password: 'CadenaBarber789!',
      name: 'Alejandro Mendoza',
      phone: '+5491145678901',
      role: 'PROVIDER' as const,
      dni: '23456789012',
      businessName: 'Cadena BarberStyle',
      address: 'Palermo, CABA',
      businessType: 'CHAIN',
      locations: [
        'Palermo Hollywood',
        'Villa Crespo',
        'Belgrano'
      ]
    },

    // Sofía - Professional Client
    sofia: {
      email: 'sofia.profesional@empresa.com.ar',
      password: 'SofiaProfesional123!',
      name: 'Sofía Fernández',
      phone: '+5491156789012',
      role: 'CLIENT' as const,
      preferences: {
        timeSlots: ['morning', 'lunch'],
        notifications: ['email', 'whatsapp'],
        paymentMethod: 'mercadopago'
      }
    },

    // Diego - Family Man
    diego: {
      email: 'diego.familia@hotmail.com',
      password: 'DiegoFamilia456!',
      name: 'Diego Fernández',
      phone: '+5491167890123',
      role: 'CLIENT' as const,
      preferences: {
        timeSlots: ['weekend', 'evening'],
        notifications: ['whatsapp', 'sms'],
        paymentMethod: 'cash'
      }
    },

    // Rodrigo - Premium Client
    rodrigo: {
      email: 'rodrigo.premium@outlook.com',
      password: 'RodrigoPremium789!',
      name: 'Rodrigo Vega',
      phone: '+5491178901234',
      role: 'CLIENT' as const,
      preferences: {
        timeSlots: ['any'],
        notifications: ['all'],
        paymentMethod: 'credit_card',
        premiumServices: true
      }
    }
  },

  // Argentina-specific Services
  services: {
    classic: {
      name: 'Corte Clásico',
      description: 'Corte de cabello tradicional masculino con máquina y tijera',
      duration: 30,
      price: 1200,
      category: 'HAIRCUT'
    },

    executiveHaircut: {
      name: 'Corte Ejecutivo',
      description: 'Corte profesional para ejecutivos, incluye lavado y peinado',
      duration: 45,
      price: 1800,
      category: 'HAIRCUT'
    },

    beardTrim: {
      name: 'Arreglo de Barba',
      description: 'Perfilado y arreglo de barba con productos premium',
      duration: 20,
      price: 800,
      category: 'BEARD'
    },

    completeBeard: {
      name: 'Barba Completa',
      description: 'Servicio completo de barba: corte, perfilado y aceites',
      duration: 40,
      price: 1500,
      category: 'BEARD'
    },

    premiumService: {
      name: 'Servicio Premium',
      description: 'Corte + barba + lavado + mascarilla facial + toalla caliente',
      duration: 90,
      price: 3500,
      category: 'PREMIUM'
    },

    childHaircut: {
      name: 'Corte Infantil',
      description: 'Corte especial para niños de 3 a 12 años',
      duration: 25,
      price: 1000,
      category: 'CHILD'
    },

    styling: {
      name: 'Peinado y Styling',
      description: 'Peinado profesional para eventos especiales',
      duration: 30,
      price: 1100,
      category: 'STYLING'
    },

    shave: {
      name: 'Afeitado Tradicional',
      description: 'Afeitado clásico con navaja y toalla caliente',
      duration: 35,
      price: 1400,
      category: 'SHAVE'
    }
  },

  // Argentina Holidays 2024
  holidays: [
    { date: '2024-01-01', name: 'Año Nuevo' },
    { date: '2024-02-12', name: 'Carnaval' },
    { date: '2024-02-13', name: 'Carnaval' },
    { date: '2024-03-24', name: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
    { date: '2024-03-29', name: 'Viernes Santo' },
    { date: '2024-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
    { date: '2024-05-01', name: 'Día del Trabajador' },
    { date: '2024-05-25', name: 'Día de la Revolución de Mayo' },
    { date: '2024-06-17', name: 'Paso a la Inmortalidad del General Martín Miguel de Güemes' },
    { date: '2024-06-20', name: 'Paso a la Inmortalidad del General Manuel Belgrano' },
    { date: '2024-07-09', name: 'Día de la Independencia' },
    { date: '2024-08-17', name: 'Paso a la Inmortalidad del General José de San Martín' },
    { date: '2024-10-12', name: 'Día del Respeto a la Diversidad Cultural' },
    { date: '2024-11-20', name: 'Día de la Soberanía Nacional' },
    { date: '2024-12-08', name: 'Inmaculada Concepción de María' },
    { date: '2024-12-25', name: 'Navidad' }
  ],

  // Argentina Provinces and Cities
  locations: {
    caba: {
      province: 'Ciudad Autónoma de Buenos Aires',
      neighborhoods: [
        'Palermo', 'Villa Crespo', 'San Telmo', 'Puerto Madero',
        'Belgrano', 'Recoleta', 'Barracas', 'La Boca',
        'Flores', 'Caballito', 'Núñez', 'Colegiales'
      ]
    },
    buenosAires: {
      province: 'Buenos Aires',
      cities: [
        'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil',
        'Quilmes', 'Avellaneda', 'Lanús', 'San Isidro'
      ]
    },
    cordoba: {
      province: 'Córdoba',
      cities: ['Córdoba Capital', 'Río Cuarto', 'Villa María', 'San Francisco']
    },
    santaFe: {
      province: 'Santa Fe',
      cities: ['Santa Fe Capital', 'Rosario', 'Rafaela', 'Venado Tuerto']
    }
  },

  // Argentina Phone Number Patterns
  phoneNumbers: {
    buenosAires: {
      mobile: ['+5491123456789', '+5491187654321', '+5491145678901'],
      landline: ['+542114567890', '+542112345678', '+542118765432']
    },
    cordoba: {
      mobile: ['+5493516789012', '+5493517890123', '+5493518901234'],
      landline: ['+543514567890', '+543512345678', '+543518765432']
    },
    rosario: {
      mobile: ['+5493416789012', '+5493417890123', '+5493418901234'],
      landline: ['+543414567890', '+543412345678', '+543418765432']
    }
  },

  // DNI Number Patterns (Argentina)
  dniNumbers: [
    '12345678901', // Valid 11-digit DNI
    '20123456789', // Valid CUIT format
    '27987654321', // Valid CUIT format
    '23456789012', // Valid CUIT format
    '30123456789', // Valid CUIT format for businesses
    '33987654321'  // Valid CUIT format for businesses
  ],

  // Payment Methods for Argentina
  paymentMethods: {
    mercadopago: {
      name: 'MercadoPago',
      type: 'digital_wallet',
      currencies: ['ARS'],
      fees: 0.035 // 3.5%
    },
    transferenciaBancaria: {
      name: 'Transferencia Bancaria',
      type: 'bank_transfer',
      currencies: ['ARS'],
      fees: 0.01 // 1%
    },
    tarjetaCredito: {
      name: 'Tarjeta de Crédito',
      type: 'credit_card',
      currencies: ['ARS'],
      fees: 0.045 // 4.5%
    },
    tarjetaDebito: {
      name: 'Tarjeta de Débito',
      type: 'debit_card',
      currencies: ['ARS'],
      fees: 0.025 // 2.5%
    },
    efectivo: {
      name: 'Efectivo',
      type: 'cash',
      currencies: ['ARS'],
      fees: 0 // No fees
    }
  },

  // Common Argentina Pricing Tiers (in ARS)
  pricingTiers: {
    budget: { min: 500, max: 1000 },
    standard: { min: 1000, max: 2000 },
    premium: { min: 2000, max: 4000 },
    luxury: { min: 4000, max: 8000 }
  },

  // Business Hours Patterns
  businessHoursPatterns: {
    traditional: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' },
      sunday: { closed: true }
    },
    modern: {
      monday: { start: '10:00', end: '20:00' },
      tuesday: { start: '10:00', end: '20:00' },
      wednesday: { start: '10:00', end: '20:00' },
      thursday: { start: '10:00', end: '20:00' },
      friday: { start: '10:00', end: '20:00' },
      saturday: { start: '09:00', end: '19:00' },
      sunday: { start: '10:00', end: '16:00' }
    },
    flexible: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '10:00', end: '19:00' },
      wednesday: { closed: true },
      thursday: { start: '10:00', end: '19:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '08:00', end: '16:00' },
      sunday: { start: '10:00', end: '14:00' }
    }
  },

  // Common Spanish Phrases for Testing
  spanishPhrases: {
    greetings: [
      '¡Hola! ¿Cómo estás?',
      'Buenos días',
      'Buenas tardes',
      '¿Qué tal?'
    ],
    serviceDescriptions: [
      'Especialistas en cortes masculinos',
      'Atención personalizada y productos de primera calidad',
      'Más de 10 años de experiencia',
      'Ubicados en el corazón de Palermo'
    ],
    customerNotes: [
      'Prefiero corte con máquina número 3',
      'Por favor no muy corto arriba',
      'Me gusta el degradé',
      'Tengo reunión importante mañana'
    ]
  }
};

/**
 * Test Fixture Generator Functions
 */

export const testFixtures = {
  /**
   * Generate a random Argentina phone number
   */
  generateArgentinaPhone(): string {
    const areaCodes = ['11', '351', '341', '223', '221']; // Buenos Aires, Córdoba, Rosario, Mar del Plata, La Plata
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const number = Math.floor(Math.random() * 90000000) + 10000000; // 8-digit number
    return `+549${areaCode}${number}`;
  },

  /**
   * Generate a random valid Argentina DNI/CUIT
   */
  generateArgentinaDNI(): string {
    const prefixes = ['20', '23', '24', '27']; // Valid CUIT prefixes
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 900000000) + 100000000; // 9-digit number
    return `${prefix}${number}`;
  },

  /**
   * Generate a booking date within business hours
   */
  generateBusinessHourDate(daysFromNow: number = 1): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    
    // Set to a random business hour (9 AM to 6 PM)
    const hour = Math.floor(Math.random() * 9) + 9; // 9-17
    const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    
    date.setHours(hour, minute, 0, 0);
    return date;
  },

  /**
   * Generate a random service price in Argentina pesos
   */
  generateServicePrice(tier: 'budget' | 'standard' | 'premium' | 'luxury' = 'standard'): number {
    const { min, max } = argentinaTestData.pricingTiers[tier];
    return Math.floor(Math.random() * (max - min) + min);
  },

  /**
   * Generate realistic Argentina address
   */
  generateArgentinaAddress(): string {
    const streets = [
      'Av. Corrientes', 'Av. Santa Fe', 'Av. Cabildo', 'Av. Rivadavia',
      'Gurruchaga', 'Thames', 'Honduras', 'Córdoba',
      'Scalabrini Ortiz', 'Juan B. Justo', 'Callao', 'Pueyrredón'
    ];
    
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    const neighborhoods = argentinaTestData.locations.caba.neighborhoods;
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    
    return `${street} ${number}, ${neighborhood}, CABA`;
  },

  /**
   * Get a random Spanish service description
   */
  getRandomServiceDescription(): string {
    const descriptions = argentinaTestData.spanishPhrases.serviceDescriptions;
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  },

  /**
   * Create a complete test user with Argentina-specific data
   */
  createArgentinaUser(role: 'CLIENT' | 'PROVIDER' = 'CLIENT', overrides: any = {}) {
    const baseUser = {
      email: `test${Date.now()}@example.com.ar`,
      password: 'TestPass123!',
      name: role === 'CLIENT' ? 'Juan Pérez' : 'María González',
      phone: this.generateArgentinaPhone(),
      role
    };

    if (role === 'PROVIDER') {
      return {
        ...baseUser,
        dni: this.generateArgentinaDNI(),
        businessName: 'Barbería Test',
        address: this.generateArgentinaAddress(),
        ...overrides
      };
    }

    return { ...baseUser, ...overrides };
  },

  /**
   * Create a test service with Argentina-specific data
   */
  createArgentinaService(tier: 'budget' | 'standard' | 'premium' | 'luxury' = 'standard', overrides: any = {}) {
    const services = Object.values(argentinaTestData.services);
    const baseService = services[Math.floor(Math.random() * services.length)];
    
    return {
      ...baseService,
      price: this.generateServicePrice(tier),
      description: this.getRandomServiceDescription(),
      ...overrides
    };
  },

  /**
   * Create a test booking with realistic Argentina timing
   */
  createArgentinaBooking(daysFromNow: number = 1, overrides: any = {}) {
    return {
      scheduledAt: this.generateBusinessHourDate(daysFromNow),
      notes: 'Booking de prueba para testing',
      notificationPreferences: {
        whatsapp: true,
        email: true,
        sms: false
      },
      ...overrides
    };
  }
};

/**
 * Database Seeding Functions
 */

export const seedData = {
  /**
   * Seed the database with all Argentina test personas
   */
  async seedArgentinaPersonas(prisma: any) {
    const users = [];
    
    for (const [key, userData] of Object.entries(argentinaTestData.users)) {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: '$2b$10$hashedpassword' // Pre-hashed for testing
        }
      });
      users.push({ key, user });
    }
    
    return users;
  },

  /**
   * Seed services for each provider
   */
  async seedArgentinaServices(prisma: any, providers: any[]) {
    const services = [];
    
    for (const provider of providers) {
      for (const [key, serviceData] of Object.entries(argentinaTestData.services)) {
        const service = await prisma.service.create({
          data: {
            ...serviceData,
            providerId: provider.id
          }
        });
        services.push({ key, service, providerId: provider.id });
      }
    }
    
    return services;
  },

  /**
   * Create realistic booking history
   */
  async seedBookingHistory(prisma: any, clients: any[], providers: any[], services: any[]) {
    const bookings = [];
    const statuses = ['COMPLETED', 'CONFIRMED', 'CANCELLED', 'PENDING'];
    
    // Create 50 historical bookings
    for (let i = 0; i < 50; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const service = services.find(s => s.providerId === provider.id);
      
      if (service) {
        const booking = await prisma.booking.create({
          data: {
            clientId: client.id,
            providerId: provider.id,
            serviceId: service.id,
            scheduledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
            status: statuses[Math.floor(Math.random() * statuses.length)] as any,
            totalPrice: service.price,
            notes: 'Booking histórico para testing'
          }
        });
        bookings.push(booking);
      }
    }
    
    return bookings;
  }
};