import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';

// Argentina-specific validation patterns
export const argentinaValidation = {
  // DNI: 8 digits with optional dots and dashes
  dni: z.string().regex(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}$/, 'DNI debe tener formato válido (ej: 12.345.678)'),
  
  // CUIT/CUIL: 11 digits with dashes
  cuit: z.string().regex(/^[0-9]{2}-[0-9]{8}-[0-9]{1}$/, 'CUIT/CUIL debe tener formato válido (ej: 20-12345678-9)'),
  
  // Argentina phone: +54 9 followed by area code and number (with spaces)
  phone: z.string().regex(/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/, 'Teléfono debe tener formato válido (+54 9 11 1234-5678)'),
  
  // Argentine postal codes
  postalCode: z.string().regex(/^[A-Z]?[0-9]{4}[A-Z]{0,3}$/, 'Código postal argentino inválido'),
  
  // Common Argentina provinces
  province: z.enum([
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán'
  ], 'Provincia argentina inválida'),
  
  // Argentina timezone
  timezone: z.literal('America/Argentina/Buenos_Aires'),
  
  // Argentina locale
  locale: z.literal('es-AR'),
  
  // Price in ARS (Argentine Pesos)
  price: z.number().positive('El precio debe ser positivo').max(999999.99, 'Precio demasiado alto'),
  
  // Working hours format
  workingHours: z.object({
    monday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    tuesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    wednesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    thursday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    friday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    saturday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    }),
    sunday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      isOpen: z.boolean()
    })
  })
};

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1, 'Página debe ser mayor a 0').default(1),
    limit: z.coerce.number().int().min(1, 'Límite debe ser mayor a 0').max(100, 'Límite no puede exceder 100').default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Search query
  search: z.object({
    q: z.string().min(1, 'Query de búsqueda requerido').max(100, 'Query demasiado largo'),
    category: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    city: z.string().optional(),
    province: argentinaValidation.province.optional()
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.string().datetime('Fecha de inicio inválida').optional(),
    endDate: z.string().datetime('Fecha de fin inválida').optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Fecha de inicio debe ser anterior a fecha de fin'),
  
  // ID parameter
  id: z.object({
    id: z.string().cuid('ID inválido')
  })
};

// Validation middleware factory
export function validateSchema<T = any>(schema: ZodSchema<T>, target: 'body' | 'query' | 'params' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let dataToValidate;
      
      switch (target) {
        case 'body':
          dataToValidate = request.body;
          break;
        case 'query':
          dataToValidate = request.query;
          break;
        case 'params':
          dataToValidate = request.params;
          break;
        default:
          dataToValidate = request.body;
      }

      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      switch (target) {
        case 'body':
          request.body = validatedData;
          break;
        case 'query':
          request.query = validatedData;
          break;
        case 'params':
          request.params = validatedData;
          break;
      }
      
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        // Send validation error response and terminate request processing
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Los datos enviados no son válidos',
          statusCode: 400,
          validation: errors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Re-throw non-validation errors
      throw error;
    }
  };
}

// Request logging middleware
export function requestLoggingMiddleware(server: FastifyInstance): void {
  server.addHook('onRequest', async (request, reply) => {
    const startTime = Date.now();
    request.startTime = startTime;
    
    server.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      contentType: request.headers['content-type'],
      timestamp: new Date().toISOString()
    }, 'Incoming request');
  });

  server.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - (request.startTime || Date.now());
    
    server.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, 'Request completed');
  });
}

// Response format middleware
export function responseFormatMiddleware(server: FastifyInstance): void {
  server.addHook('onSend', async (request, reply, payload) => {
    // Add standard headers for Argentina
    reply.header('X-Response-Time', Date.now() - (request.startTime || Date.now()));
    reply.header('X-API-Version', '1.0.0');
    reply.header('X-Country', 'AR');

    // Don't modify error responses or non-JSON responses
    const contentType = reply.getHeader('content-type');
    if (reply.statusCode >= 400 || !(typeof contentType === 'string' && contentType.includes('application/json'))) {
      return payload;
    }

    // Exclude Swagger/OpenAPI schema endpoints from wrapping
    if (request.url.includes('/docs/json') || request.url.includes('/swagger') || request.url.includes('openapi')) {
      return payload;
    }

    // Wrap successful responses in a standard format
    if (typeof payload === 'string') {
      try {
        const data = JSON.parse(payload);

        // If it's already in our format, don't wrap again
        if (data.success !== undefined || data.error !== undefined) {
          return payload;
        }

        const wrappedResponse = {
          success: true,
          data: data,
          timestamp: new Date().toISOString(),
          statusCode: reply.statusCode
        };

        return JSON.stringify(wrappedResponse);
      } catch (e) {
        // If it's not JSON, return as-is
        return payload;
      }
    }
    
    return payload;
  });
}

// Error normalization middleware
export function errorNormalizationMiddleware(server: FastifyInstance): void {
  server.setErrorHandler(async (error, request, reply) => {
    const { log } = request;
    
    // Check if response was already sent to prevent duplicate responses
    if (reply.sent) {
      log.warn('Attempted to send error response after reply was already sent');
      return;
    }
    
    // Log the error with context
    log.error({
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      ip: request.ip,
      timestamp: new Date().toISOString()
    }, 'Request error');

    // Handle Prisma errors
    if (error.code && error.code.startsWith('P')) {
      switch (error.code) {
        case 'P2002':
          return reply.code(409).send({
            error: 'Conflict',
            message: 'El recurso ya existe. Verifique los datos únicos.',
            statusCode: 409,
            timestamp: new Date().toISOString()
          });
        case 'P2025':
          return reply.code(404).send({
            error: 'Not Found',
            message: 'El recurso solicitado no fue encontrado.',
            statusCode: 404,
            timestamp: new Date().toISOString()
          });
        case 'P2003':
          return reply.code(400).send({
            error: 'Foreign Key Constraint',
            message: 'Error de relación entre datos. Verifique las referencias.',
            statusCode: 400,
            timestamp: new Date().toISOString()
          });
      }
    }

    // Handle JWT errors
    if (error.message.includes('jwt') || error.message.includes('token')) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token de acceso inválido o expirado.',
        statusCode: 401,
        timestamp: new Date().toISOString()
      });
    }

    // Handle validation errors (already handled in preHandler, but just in case)
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Los datos enviados no son válidos.',
        validation: error.validation,
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
        statusCode: 429,
        timestamp: new Date().toISOString()
      });
    }

    // Generic server error
    const statusCode = error.statusCode || 500;
    return reply.code(statusCode).send({
      error: statusCode >= 400 && statusCode < 500 ? 'Client Error' : 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor. Contacte soporte si el problema persiste.' 
        : error.message,
      statusCode: statusCode,
      timestamp: new Date().toISOString()
    });
  });
}

// Setup all validation middleware
export function setupValidationMiddleware(server: FastifyInstance): void {
  requestLoggingMiddleware(server);
  responseFormatMiddleware(server);
  errorNormalizationMiddleware(server);
}

// Note: This file exports validation middleware and schemas for use in routes