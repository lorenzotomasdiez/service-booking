/**
 * B14-001: API Documentation & Integration Platform
 *
 * Comprehensive API documentation with:
 * - Interactive API documentation
 * - Integration guidelines
 * - Code examples for multiple languages
 * - Testing sandbox
 * - Performance guidelines
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Record<string, any>;
  requestBody?: Record<string, any>;
  responses: Record<string, any>;
  examples: {
    request?: any;
    response?: any;
    curl?: string;
    javascript?: string;
    python?: string;
  };
  authentication: boolean;
  rateLimit?: string;
  argentineSpecific?: boolean;
}

interface IntegrationGuide {
  title: string;
  description: string;
  steps: string[];
  codeExamples: Record<string, string>;
  bestPractices: string[];
  argentineTips: string[];
}

class APIDocumentationPlatform {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private integrationGuides: Map<string, IntegrationGuide> = new Map();

  constructor() {
    this.initializeEndpoints();
    this.initializeIntegrationGuides();
  }

  private initializeEndpoints(): void {
    // Authentication endpoints
    this.endpoints.set('POST /api/auth/login', {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Authenticate user with email and password',
      requestBody: {
        email: 'string (required) - User email address',
        password: 'string (required) - User password',
        remember: 'boolean (optional) - Remember login session'
      },
      responses: {
        200: 'Login successful with JWT token',
        401: 'Invalid credentials',
        429: 'Rate limit exceeded'
      },
      examples: {
        request: {
          email: 'juan@example.com.ar',
          password: 'SecurePassword123!',
          remember: true
        },
        response: {
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'user_123',
            email: 'juan@example.com.ar',
            name: 'Juan Carlos',
            role: 'CLIENT'
          },
          expiresIn: '24h'
        },
        curl: `curl -X POST https://api.barberpro.com.ar/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"juan@example.com.ar","password":"SecurePassword123!"}'`,
        javascript: `const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@example.com.ar',
    password: 'SecurePassword123!'
  })
});
const data = await response.json();`,
        python: `import requests

response = requests.post('https://api.barberpro.com.ar/api/auth/login',
  json={
    'email': 'juan@example.com.ar',
    'password': 'SecurePassword123!'
  }
)
data = response.json()`
      },
      authentication: false,
      rateLimit: '5 requests per minute',
      argentineSpecific: true
    });

    // Booking endpoints
    this.endpoints.set('POST /api/v1/bookings', {
      method: 'POST',
      path: '/api/v1/bookings',
      description: 'Create a new service booking',
      parameters: {
        Authorization: 'Bearer token (required)'
      },
      requestBody: {
        providerId: 'string (required) - Service provider ID',
        serviceId: 'string (required) - Service ID',
        date: 'string (required) - Booking date in ISO format',
        time: 'string (required) - Booking time in HH:MM format',
        notes: 'string (optional) - Additional notes'
      },
      responses: {
        201: 'Booking created successfully',
        400: 'Invalid booking data',
        401: 'Authentication required',
        409: 'Time slot not available'
      },
      examples: {
        request: {
          providerId: 'prov_abc123',
          serviceId: 'serv_haircut_001',
          date: '2024-03-15',
          time: '14:30',
          notes: 'Corte clásico, por favor'
        },
        response: {
          success: true,
          booking: {
            id: 'book_xyz789',
            providerId: 'prov_abc123',
            serviceId: 'serv_haircut_001',
            date: '2024-03-15',
            time: '14:30',
            status: 'CONFIRMED',
            totalAmount: 2500,
            currency: 'ARS',
            timezone: 'America/Argentina/Buenos_Aires'
          }
        },
        curl: `curl -X POST https://api.barberpro.com.ar/api/v1/bookings \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"providerId":"prov_abc123","serviceId":"serv_haircut_001","date":"2024-03-15","time":"14:30"}'`,
        javascript: `const response = await fetch('/api/v1/bookings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    providerId: 'prov_abc123',
    serviceId: 'serv_haircut_001',
    date: '2024-03-15',
    time: '14:30'
  })
});`,
        python: `headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
data = {
    'providerId': 'prov_abc123',
    'serviceId': 'serv_haircut_001',
    'date': '2024-03-15',
    'time': '14:30'
}
response = requests.post(
    'https://api.barberpro.com.ar/api/v1/bookings',
    headers=headers,
    json=data
)`
      },
      authentication: true,
      rateLimit: '10 requests per minute',
      argentineSpecific: true
    });

    // Payment endpoints
    this.endpoints.set('POST /api/payments/process', {
      method: 'POST',
      path: '/api/payments/process',
      description: 'Process payment for booking (Argentina-optimized)',
      parameters: {
        Authorization: 'Bearer token (required)'
      },
      requestBody: {
        bookingId: 'string (required) - Booking ID to pay for',
        paymentMethod: 'string (required) - Payment method (mercadopago, transfer)',
        installments: 'number (optional) - Number of installments (cuotas)',
        dni: 'string (required) - DNI for Argentina tax requirements'
      },
      responses: {
        200: 'Payment processed successfully',
        400: 'Invalid payment data',
        402: 'Payment failed',
        404: 'Booking not found'
      },
      examples: {
        request: {
          bookingId: 'book_xyz789',
          paymentMethod: 'mercadopago',
          installments: 3,
          dni: '12345678'
        },
        response: {
          success: true,
          payment: {
            id: 'pay_mp_123456',
            bookingId: 'book_xyz789',
            amount: 2500,
            currency: 'ARS',
            status: 'approved',
            installments: 3,
            installmentAmount: 833.33,
            gateway: 'mercadopago',
            transactionId: 'mp_transaction_789'
          },
          receipt: {
            url: 'https://api.barberpro.com.ar/receipts/pay_mp_123456.pdf',
            afipData: {
              cae: '68123456789012',
              vencimiento: '2024-03-25'
            }
          }
        },
        curl: `curl -X POST https://api.barberpro.com.ar/api/payments/process \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"bookingId":"book_xyz789","paymentMethod":"mercadopago","installments":3,"dni":"12345678"}'`,
        javascript: `const response = await fetch('/api/payments/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bookingId: 'book_xyz789',
    paymentMethod: 'mercadopago',
    installments: 3,
    dni: '12345678'
  })
});`,
        python: `payment_data = {
    'bookingId': 'book_xyz789',
    'paymentMethod': 'mercadopago',
    'installments': 3,
    'dni': '12345678'
}
response = requests.post(
    'https://api.barberpro.com.ar/api/payments/process',
    headers={'Authorization': f'Bearer {token}'},
    json=payment_data
)`
      },
      authentication: true,
      rateLimit: '5 requests per minute',
      argentineSpecific: true
    });

    // Provider search endpoints
    this.endpoints.set('GET /api/search/providers', {
      method: 'GET',
      path: '/api/search/providers',
      description: 'Search for service providers by location and services',
      parameters: {
        lat: 'number (optional) - Latitude for location search',
        lng: 'number (optional) - Longitude for location search',
        city: 'string (optional) - City name (Buenos Aires, Córdoba, etc.)',
        service: 'string (optional) - Service type to filter',
        radius: 'number (optional) - Search radius in kilometers',
        available: 'string (optional) - Date for availability check (YYYY-MM-DD)'
      },
      responses: {
        200: 'Providers found successfully',
        400: 'Invalid search parameters'
      },
      examples: {
        request: null,
        response: {
          success: true,
          providers: [
            {
              id: 'prov_abc123',
              name: 'Barbería El Clásico',
              address: 'Av. Corrientes 1234, CABA',
              distance: 0.8,
              rating: 4.8,
              services: ['haircut', 'beard', 'shampoo'],
              nextAvailable: '2024-03-15T10:00:00-03:00',
              priceRange: '1500-3500 ARS'
            }
          ],
          total: 15,
          page: 1,
          limit: 10
        },
        curl: `curl "https://api.barberpro.com.ar/api/search/providers?city=Buenos%20Aires&service=haircut&available=2024-03-15"`,
        javascript: `const params = new URLSearchParams({
  city: 'Buenos Aires',
  service: 'haircut',
  available: '2024-03-15'
});
const response = await fetch('/api/search/providers?' + params);`,
        python: `params = {
    'city': 'Buenos Aires',
    'service': 'haircut',
    'available': '2024-03-15'
}
response = requests.get(
    'https://api.barberpro.com.ar/api/search/providers',
    params=params
)`
      },
      authentication: false,
      rateLimit: '20 requests per minute',
      argentineSpecific: true
    });
  }

  private initializeIntegrationGuides(): void {
    // Mobile app integration
    this.integrationGuides.set('mobile-app', {
      title: 'Mobile App Integration',
      description: 'Complete guide for integrating BarberPro API into mobile applications',
      steps: [
        'Set up authentication with JWT tokens',
        'Implement location-based provider search',
        'Build booking flow with real-time availability',
        'Integrate Argentina payment methods',
        'Handle offline scenarios and sync',
        'Implement push notifications for booking updates'
      ],
      codeExamples: {
        'React Native Authentication': `import AsyncStorage from '@react-native-async-storage/async-storage';

const login = async (email, password) => {
  try {
    const response = await fetch('https://api.barberpro.com.ar/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
      await AsyncStorage.setItem('authToken', data.token);
      return data.user;
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};`,
        'Location-based Search': `import Geolocation from '@react-native-geolocation-service';

const searchNearbyProviders = async () => {
  const position = await new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    });
  });

  const { latitude, longitude } = position.coords;
  const response = await fetch(
    \`https://api.barberpro.com.ar/api/search/providers?lat=\${latitude}&lng=\${longitude}&radius=5\`
  );

  return response.json();
};`
      },
      bestPractices: [
        'Always handle network errors gracefully',
        'Implement proper token refresh logic',
        'Cache provider data for offline usage',
        'Use Argentina timezone for all date operations',
        'Optimize for slower mobile connections'
      ],
      argentineTips: [
        'Display prices in Argentine Pesos (ARS)',
        'Support MercadoPago as primary payment method',
        'Handle DNI validation for payment processing',
        'Consider data usage optimization for prepaid plans',
        'Implement localization for Spanish (Argentina)'
      ]
    });

    // Web application integration
    this.integrationGuides.set('web-app', {
      title: 'Web Application Integration',
      description: 'Guide for integrating BarberPro API into web applications',
      steps: [
        'Set up CORS for your domain',
        'Implement authentication flow',
        'Build responsive booking interface',
        'Integrate payment processing',
        'Add real-time notifications',
        'Implement SEO optimization for Argentina market'
      ],
      codeExamples: {
        'Vue.js Integration': `// store/auth.js
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken'))
  const user = ref(null)

  const login = async (credentials) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })

    if (response.success) {
      token.value = response.token
      user.value = response.user
      localStorage.setItem('authToken', response.token)
    }

    return response
  }

  return { token, user, login }
})`,
        'Booking Component': `<template>
  <div class="booking-form">
    <h2>Reservar Turno</h2>
    <form @submit.prevent="submitBooking">
      <select v-model="selectedProvider" required>
        <option value="">Seleccionar barbería</option>
        <option v-for="provider in providers" :key="provider.id" :value="provider.id">
          {{ provider.name }} - {{ provider.address }}
        </option>
      </select>

      <input
        type="date"
        v-model="selectedDate"
        :min="today"
        required
      />

      <select v-model="selectedTime" required>
        <option value="">Seleccionar horario</option>
        <option v-for="time in availableTimes" :key="time" :value="time">
          {{ time }}
        </option>
      </select>

      <button type="submit" :disabled="!canSubmit">
        Confirmar Reserva
      </button>
    </form>
  </div>
</template>`
      },
      bestPractices: [
        'Use progressive web app features',
        'Implement proper error boundaries',
        'Add loading states for all API calls',
        'Use semantic HTML for accessibility',
        'Implement proper SEO meta tags'
      ],
      argentineTips: [
        'Use Argentina date format (DD/MM/YYYY)',
        'Display business hours in Argentina timezone',
        'Include province selection for delivery',
        'Support keyboard navigation for accessibility',
        'Add WhatsApp integration for customer support'
      ]
    });

    // Payment integration guide
    this.integrationGuides.set('payments', {
      title: 'Payment Integration Guide',
      description: 'Complete guide for integrating Argentina payment methods',
      steps: [
        'Set up MercadoPago credentials',
        'Implement payment form with validation',
        'Handle payment webhooks',
        'Generate AFIP-compliant receipts',
        'Implement refund processing',
        'Add payment analytics'
      ],
      codeExamples: {
        'MercadoPago Integration': `import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const payment = new Payment(client);

const processPayment = async (bookingData) => {
  const body = {
    transaction_amount: bookingData.amount,
    description: \`Reserva en \${bookingData.providerName}\`,
    payment_method_id: 'visa',
    payer: {
      email: bookingData.userEmail,
      identification: {
        type: 'DNI',
        number: bookingData.dni
      }
    },
    notification_url: 'https://api.barberpro.com.ar/webhooks/mercadopago'
  };

  return await payment.create({ body });
};`,
        'Webhook Handler': `app.post('/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      const payment = await getPaymentDetails(paymentId);

      if (payment.status === 'approved') {
        await confirmBooking(payment.external_reference);
        await sendConfirmationEmail(payment.payer.email);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});`
      },
      bestPractices: [
        'Always validate webhook signatures',
        'Implement idempotency for payment processing',
        'Store detailed payment logs',
        'Handle payment failures gracefully',
        'Implement proper error handling'
      ],
      argentineTips: [
        'Support installments (cuotas) for higher amounts',
        'Integrate with Argentina bank transfer methods',
        'Generate receipts with AFIP requirements',
        'Handle DNI validation properly',
        'Consider regional payment preferences'
      ]
    });
  }

  // Get all API endpoints
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  // Get specific endpoint documentation
  getEndpoint(method: string, path: string): APIEndpoint | null {
    return this.endpoints.get(`${method} ${path}`) || null;
  }

  // Get all integration guides
  getIntegrationGuides(): IntegrationGuide[] {
    return Array.from(this.integrationGuides.values());
  }

  // Get specific integration guide
  getIntegrationGuide(key: string): IntegrationGuide | null {
    return this.integrationGuides.get(key) || null;
  }

  // Generate OpenAPI specification
  generateOpenAPISpec(): Record<string, any> {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'BarberPro API',
        version: '1.0.0',
        description: 'API para plataforma de reservas de barbería en Argentina',
        contact: {
          name: 'BarberPro Support',
          email: 'soporte@barberpro.com.ar',
          url: 'https://barberpro.com.ar/support'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://api.barberpro.com.ar',
          description: 'Production server (Argentina)'
        },
        {
          url: 'https://staging-api.barberpro.com.ar',
          description: 'Staging server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      paths: {}
    };

    // Add endpoints to OpenAPI spec
    for (const endpoint of this.endpoints.values()) {
      const pathKey = endpoint.path;
      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }

      spec.paths[pathKey][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        description: endpoint.description,
        security: endpoint.authentication ? [{ bearerAuth: [] }] : [],
        parameters: endpoint.parameters ? Object.entries(endpoint.parameters).map(([name, desc]) => ({
          name,
          in: name === 'Authorization' ? 'header' : 'query',
          required: desc.includes('required'),
          description: desc,
          schema: { type: 'string' }
        })) : [],
        requestBody: endpoint.requestBody ? {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: Object.entries(endpoint.requestBody).reduce((acc, [key, desc]) => {
                  acc[key] = {
                    type: desc.includes('number') ? 'number' : 'string',
                    description: desc
                  };
                  return acc;
                }, {} as Record<string, any>)
              }
            }
          }
        } : undefined,
        responses: Object.entries(endpoint.responses).reduce((acc, [code, desc]) => {
          acc[code] = {
            description: desc,
            content: {
              'application/json': {
                example: endpoint.examples.response
              }
            }
          };
          return acc;
        }, {} as Record<string, any>)
      };
    }

    return spec;
  }

  // Generate Postman collection
  generatePostmanCollection(): Record<string, any> {
    const collection = {
      info: {
        name: 'BarberPro API',
        description: 'API para plataforma de reservas de barbería en Argentina',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.barberpro.com.ar',
          type: 'string'
        },
        {
          key: 'authToken',
          value: '',
          type: 'string'
        }
      ],
      item: []
    };

    // Add endpoints to Postman collection
    for (const endpoint of this.endpoints.values()) {
      const item: any = {
        name: `${endpoint.method} ${endpoint.path}`,
        request: {
          method: endpoint.method,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          url: {
            raw: `{{baseUrl}}${endpoint.path}`,
            host: ['{{baseUrl}}'],
            path: endpoint.path.split('/').filter(p => p)
          },
          description: endpoint.description
        }
      };

      if (endpoint.authentication) {
        item.request.auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{authToken}}',
              type: 'string'
            }
          ]
        };
      }

      if (endpoint.examples.request) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify(endpoint.examples.request, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      }

      collection.item.push(item);
    }

    return collection;
  }
}

// Export singleton instance
export const apiDocumentationPlatform = new APIDocumentationPlatform();

// Register routes for API documentation
export function registerAPIDocumentationRoutes(server: FastifyInstance): void {
  // Get all endpoints
  server.get('/api/v1/docs/endpoints', {
    schema: {
      tags: ['API Documentation'],
      summary: 'Get all API endpoints',
      description: 'Retrieves comprehensive documentation for all API endpoints',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          endpoints: Type.Array(Type.Any()),
          totalEndpoints: Type.Number(),
          timestamp: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const endpoints = apiDocumentationPlatform.getEndpoints();

      reply.send({
        success: true,
        endpoints,
        totalEndpoints: endpoints.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Documentation retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get integration guides
  server.get('/api/v1/docs/integration', {
    schema: {
      tags: ['API Documentation'],
      summary: 'Get integration guides',
      description: 'Retrieves comprehensive integration guides for different platforms',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          guides: Type.Array(Type.Any()),
          timestamp: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const guides = apiDocumentationPlatform.getIntegrationGuides();

      reply.send({
        success: true,
        guides,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Integration guides retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get OpenAPI specification
  server.get('/api/v1/docs/openapi', {
    schema: {
      tags: ['API Documentation'],
      summary: 'Get OpenAPI specification',
      description: 'Generates OpenAPI 3.0 specification for the API',
      response: {
        200: Type.Any()
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const spec = apiDocumentationPlatform.generateOpenAPISpec();
      reply.send(spec);
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'OpenAPI generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Postman collection
  server.get('/api/v1/docs/postman', {
    schema: {
      tags: ['API Documentation'],
      summary: 'Get Postman collection',
      description: 'Generates Postman collection for API testing',
      response: {
        200: Type.Any()
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const collection = apiDocumentationPlatform.generatePostmanCollection();
      reply.send(collection);
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Postman collection generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ API Documentation Platform routes registered');
}