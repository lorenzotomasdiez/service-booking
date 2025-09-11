/**
 * Artillery Load Test Helper Functions for BarberPro
 * Argentina-specific test data generation and utilities
 */

// Test data generators for Argentina market
const argentinaTestData = {
  firstNames: [
    'Carlos', 'María', 'Diego', 'Sofía', 'Martín', 'Ana', 'Alejandro', 'Laura',
    'Pablo', 'Carmen', 'José', 'Elena', 'Fernando', 'Patricia', 'Ricardo'
  ],
  
  lastNames: [
    'Rodríguez', 'González', 'Fernández', 'López', 'García', 'Martínez', 'Pérez',
    'Sánchez', 'Romero', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales'
  ],
  
  businessTypes: [
    'Barbería', 'Peluquería', 'Salon', 'Estudio', 'Centro de Belleza'
  ],
  
  businessNames: [
    'El Clásico', 'Don Carlos', 'La Esquina', 'Profesional', 'Premium',
    'Moderno', 'Tradicional', 'Elegante', 'Express', 'VIP'
  ],
  
  serviceNames: [
    'Corte Clásico', 'Corte Ejecutivo', 'Corte Moderno', 'Arreglo de Barba',
    'Barba Completa', 'Afeitado Tradicional', 'Servicio Premium', 'Corte Infantil',
    'Peinado y Styling', 'Lavado Premium', 'Corte y Barba', 'Servicio Express'
  ],
  
  serviceDescriptions: [
    'Corte de cabello tradicional masculino con máquina y tijera',
    'Servicio profesional para ejecutivos, incluye lavado y peinado',
    'Arreglo y perfilado de barba con productos premium',
    'Corte completo con barba, lavado y styling profesional',
    'Servicio premium con productos importados y toalla caliente',
    'Corte especial para niños de 3 a 12 años con paciencia',
    'Peinado profesional para eventos especiales',
    'Afeitado clásico con navaja y cuidados tradicionales'
  ],
  
  argentinaCityCodes: [
    '11',   // Buenos Aires
    '351',  // Córdoba
    '341',  // Rosario
    '223',  // Mar del Plata
    '221',  // La Plata
    '261',  // Mendoza
    '381',  // Tucumán
    '299'   // Neuquén
  ],
  
  dniPrefixes: ['20', '23', '24', '27', '30', '33'],
  
  domains: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar', 'gmail.com.ar']
};

// Global counters for unique data generation
let emailCounter = 0;
let phoneCounter = 0;
let dniCounter = 0;

/**
 * Generate unique email address
 */
function generateEmail(userContext, events, done) {
  const firstName = getRandomItem(argentinaTestData.firstNames).toLowerCase();
  const lastName = getRandomItem(argentinaTestData.lastNames).toLowerCase();
  const domain = getRandomItem(argentinaTestData.domains);
  const timestamp = Date.now();
  
  userContext.vars.generatedEmail = `${firstName}.${lastName}.${timestamp}@${domain}`;
  return done();
}

/**
 * Generate provider email address
 */
function generateProviderEmail(userContext, events, done) {
  const businessType = getRandomItem(argentinaTestData.businessTypes).toLowerCase();
  const businessName = getRandomItem(argentinaTestData.businessNames).toLowerCase();
  const domain = getRandomItem(argentinaTestData.domains);
  const timestamp = Date.now();
  
  userContext.vars.generatedProviderEmail = `${businessType}.${businessName}.${timestamp}@${domain}`;
  return done();
}

/**
 * Generate secure password
 */
function generatePassword(userContext, events, done) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each required type
  password += getRandomItem('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); // Uppercase
  password += getRandomItem('abcdefghijklmnopqrstuvwxyz'); // Lowercase  
  password += getRandomItem('0123456789'); // Number
  password += getRandomItem('!@#$%^&*'); // Special char
  
  // Fill rest randomly
  for (let i = 4; i < 12; i++) {
    password += getRandomItem(chars);
  }
  
  // Shuffle the password
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  userContext.vars.generatedPassword = password;
  return done();
}

/**
 * Generate Argentina phone number
 */
function generateArgentinaPhone(userContext, events, done) {
  const cityCode = getRandomItem(argentinaTestData.argentinaCityCodes);
  const number = Math.floor(Math.random() * 90000000) + 10000000; // 8 digit number
  
  userContext.vars.generatedPhone = `+549${cityCode}${number}`;
  return done();
}

/**
 * Generate Argentina DNI/CUIT
 */
function generateArgentinaDNI(userContext, events, done) {
  const prefix = getRandomItem(argentinaTestData.dniPrefixes);
  const number = Math.floor(Math.random() * 900000000) + 100000000; // 9 digit number
  
  userContext.vars.generatedDNI = `${prefix}${number}`;
  return done();
}

/**
 * Generate business name
 */
function generateBusinessName(userContext, events, done) {
  const businessType = getRandomItem(argentinaTestData.businessTypes);
  const businessName = getRandomItem(argentinaTestData.businessNames);
  
  userContext.vars.generatedBusinessName = `${businessType} ${businessName}`;
  return done();
}

/**
 * Generate service name
 */
function generateServiceName(userContext, events, done) {
  const serviceName = getRandomItem(argentinaTestData.serviceNames);
  userContext.vars.generatedServiceName = serviceName;
  return done();
}

/**
 * Generate service description
 */
function generateServiceDescription(userContext, events, done) {
  const description = getRandomItem(argentinaTestData.serviceDescriptions);
  userContext.vars.generatedServiceDescription = description;
  return done();
}

/**
 * Generate service duration (15-120 minutes in 15-minute increments)
 */
function generateDuration(userContext, events, done) {
  const durations = [15, 30, 45, 60, 75, 90, 105, 120];
  userContext.vars.generatedDuration = getRandomItem(durations);
  return done();
}

/**
 * Generate Argentina peso price
 */
function generateArgentinaPrice(userContext, events, done) {
  const priceRanges = [
    { min: 500, max: 1000 },   // Budget
    { min: 1000, max: 2000 },  // Standard  
    { min: 2000, max: 4000 },  // Premium
    { min: 4000, max: 8000 }   // Luxury
  ];
  
  const range = getRandomItem(priceRanges);
  const price = Math.floor(Math.random() * (range.max - range.min) + range.min);
  
  userContext.vars.generatedPrice = price;
  return done();
}

/**
 * Authenticate as a test client
 */
function authenticateAsClient(userContext, events, done) {
  // Use predefined test client or create one
  userContext.vars.clientToken = 'test-client-token-' + Math.random();
  userContext.vars.clientId = 'test-client-id-' + Math.random();
  return done();
}

/**
 * Authenticate as a test provider
 */
function authenticateAsProvider(userContext, events, done) {
  // Use predefined test provider or create one
  userContext.vars.providerToken = 'test-provider-token-' + Math.random();
  userContext.vars.providerId = 'test-provider-id-' + Math.random();
  return done();
}

/**
 * Find available service for booking
 */
function findAvailableService(userContext, events, done) {
  // Simulate finding an available service
  userContext.vars.availableServiceId = 'service-' + Math.random();
  userContext.vars.serviceProviderId = 'provider-' + Math.random();
  return done();
}

/**
 * Find pending booking for status management
 */
function findPendingBooking(userContext, events, done) {
  userContext.vars.bookingId = 'booking-' + Math.random();
  return done();
}

/**
 * Get random client token (for concurrent testing)
 */
function getRandomClientToken(userContext, events, done) {
  const tokens = [
    'client-token-1', 'client-token-2', 'client-token-3',
    'client-token-4', 'client-token-5'
  ];
  userContext.vars.randomClientToken = getRandomItem(tokens);
  return done();
}

/**
 * Get popular service ID (for stress testing)
 */
function getPopularServiceId(userContext, events, done) {
  const popularServices = [
    'corte-clasico-popular',
    'corte-ejecutivo-popular', 
    'servicio-premium-popular'
  ];
  userContext.vars.popularServiceId = getRandomItem(popularServices);
  return done();
}

/**
 * Get random provider ID
 */
function getRandomProviderId(userContext, events, done) {
  const providers = [
    'provider-carlos', 'provider-martin', 'provider-alejandro',
    'provider-sofia', 'provider-maria'
  ];
  userContext.vars.randomProviderId = getRandomItem(providers);
  return done();
}

/**
 * Utility function to get random item from array
 */
function getRandomItem(arr) {
  if (typeof arr === 'string') {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate booking time within business hours
 */
function generateBookingTime(userContext, events, done) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
  
  // Business hours: 9 AM to 6 PM
  const hours = [9, 10, 11, 12, 14, 15, 16, 17]; // Skip 13 (lunch/siesta)
  const minutes = [0, 15, 30, 45];
  
  futureDate.setHours(getRandomItem(hours));
  futureDate.setMinutes(getRandomItem(minutes));
  futureDate.setSeconds(0);
  futureDate.setMilliseconds(0);
  
  // Convert to Argentina timezone
  const argentinaTime = new Date(futureDate.getTime() - (3 * 60 * 60 * 1000));
  userContext.vars.generatedBookingTime = argentinaTime.toISOString();
  return done();
}

/**
 * Simulate Argentina network conditions
 */
function simulateArgentinaNetwork(userContext, events, done) {
  // Add random delay to simulate Argentina internet latency
  const delays = [50, 100, 150, 200, 250]; // milliseconds
  const delay = getRandomItem(delays);
  
  setTimeout(() => {
    return done();
  }, delay);
}

/**
 * Performance monitoring helper
 */
function trackPerformance(userContext, events, done) {
  const startTime = Date.now();
  userContext.vars.performanceStart = startTime;
  
  // Track common performance metrics
  userContext.vars.metrics = {
    requestStart: startTime,
    argentineUserAgent: 'LoadTest-Argentina/1.0',
    connectionType: getRandomItem(['wifi', '4g', '3g']),
    region: 'AR-B' // Buenos Aires
  };
  
  return done();
}

/**
 * Custom error handling for Argentina-specific scenarios
 */
function handleArgentinaErrors(userContext, events, done) {
  // Custom error handling for common Argentina API issues
  userContext.vars.errorHandling = {
    timeoutThreshold: 5000, // 5 seconds
    retryCount: 3,
    fallbackLanguage: 'es-AR'
  };
  
  return done();
}

// Export all functions for Artillery
module.exports = {
  generateEmail,
  generateProviderEmail,
  generatePassword,
  generateArgentinaPhone,
  generateArgentinaDNI,
  generateBusinessName,
  generateServiceName,
  generateServiceDescription,
  generateDuration,
  generateArgentinaPrice,
  authenticateAsClient,
  authenticateAsProvider,
  findAvailableService,
  findPendingBooking,
  getRandomClientToken,
  getPopularServiceId,
  getRandomProviderId,
  generateBookingTime,
  simulateArgentinaNetwork,
  trackPerformance,
  handleArgentinaErrors
};