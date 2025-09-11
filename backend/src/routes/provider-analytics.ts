import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/analytics';
import { CreateClientNoteRequest } from '../types/analytics';

export default async function providerAnalyticsRoutes(server: FastifyInstance) {
  const analyticsService = new AnalyticsService(server.prisma);

  // Authentication hook for provider routes
  const authenticateProvider = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      
      const provider = await server.prisma.provider.findUnique({
        where: { userId: user.id }
      });

      if (!provider) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los proveedores pueden acceder a este recurso'
        });
      }

      (request as any).provider = provider;
    } catch (error) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token de acceso requerido'
      });
    }
  };

  /**
   * Get provider analytics
   * GET /api/provider/analytics
   */
  server.get<{
    Querystring: { 
      from?: string; 
      to?: string; 
      period?: 'day' | 'week' | 'month' | 'year' 
    }
  }>('/analytics', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get comprehensive analytics for the authenticated provider',
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' },
          period: { 
            type: 'string', 
            enum: ['day', 'week', 'month', 'year'],
            description: 'Predefined period' 
          }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                providerId: { type: 'string' },
                period: {
                  type: 'object',
                  properties: {
                    from: { type: 'string' },
                    to: { type: 'string' }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalBookings: { type: 'number' },
                    totalRevenue: { type: 'number' },
                    netRevenue: { type: 'number' },
                    newClients: { type: 'number' },
                    utilizationRate: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { from?: string; to?: string; period?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { from, to, period } = request.query;

      // Calculate date range
      let fromDate: Date, toDate: Date;

      if (from && to) {
        fromDate = new Date(from);
        toDate = new Date(to);
      } else {
        // Use period or default to last 30 days
        toDate = new Date();
        fromDate = new Date();

        switch (period) {
          case 'day':
            fromDate.setDate(toDate.getDate() - 1);
            break;
          case 'week':
            fromDate.setDate(toDate.getDate() - 7);
            break;
          case 'month':
            fromDate.setMonth(toDate.getMonth() - 1);
            break;
          case 'year':
            fromDate.setFullYear(toDate.getFullYear() - 1);
            break;
          default:
            fromDate.setDate(toDate.getDate() - 30);
        }
      }

      const analytics = await analyticsService.getProviderAnalytics(provider.id, fromDate, toDate);

      return reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener analíticas del proveedor'
      });
    }
  });

  /**
   * Get earnings report
   * GET /api/provider/earnings
   */
  server.get<{
    Querystring: { 
      from?: string; 
      to?: string; 
      period?: 'day' | 'week' | 'month' | 'year' 
    }
  }>('/earnings', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get detailed earnings report for the authenticated provider',
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' },
          period: { 
            type: 'string', 
            enum: ['day', 'week', 'month', 'year'],
            description: 'Predefined period' 
          }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalEarnings: { type: 'number' },
                netEarnings: { type: 'number' },
                platformFee: { type: 'number' },
                breakdown: {
                  type: 'object',
                  properties: {
                    byService: { type: 'array' },
                    byPaymentMethod: { type: 'array' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { from?: string; to?: string; period?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { from, to, period } = request.query;

      // Calculate date range (same logic as analytics)
      let fromDate: Date, toDate: Date;

      if (from && to) {
        fromDate = new Date(from);
        toDate = new Date(to);
      } else {
        toDate = new Date();
        fromDate = new Date();

        switch (period) {
          case 'day':
            fromDate.setDate(toDate.getDate() - 1);
            break;
          case 'week':
            fromDate.setDate(toDate.getDate() - 7);
            break;
          case 'month':
            fromDate.setMonth(toDate.getMonth() - 1);
            break;
          case 'year':
            fromDate.setFullYear(toDate.getFullYear() - 1);
            break;
          default:
            fromDate.setDate(toDate.getDate() - 30);
        }
      }

      const earnings = await analyticsService.getEarningsReport(provider.id, fromDate, toDate);

      return reply.send({
        success: true,
        data: earnings
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener reporte de ingresos'
      });
    }
  });

  /**
   * Get client management data
   * GET /api/provider/clients
   */
  server.get<{
    Querystring: { 
      page?: number; 
      limit?: number; 
      search?: string 
    }
  }>('/clients', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get client management data for the authenticated provider',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, description: 'Page number (default: 1)' },
          limit: { type: 'number', minimum: 1, maximum: 100, description: 'Items per page (default: 20)' },
          search: { type: 'string', description: 'Search by name, email, or phone' }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clients: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      totalBookings: { type: 'number' },
                      totalSpent: { type: 'number' },
                      lastBooking: { type: 'string' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    totalPages: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { page?: number; limit?: number; search?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { page = 1, limit = 20, search } = request.query;

      const clientData = await analyticsService.getClientManagement(provider.id, page, limit, search);

      return reply.send({
        success: true,
        data: clientData
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener datos de clientes'
      });
    }
  });

  /**
   * Create client note
   * POST /api/provider/clients/notes
   */
  server.post<{
    Body: CreateClientNoteRequest
  }>('/clients/notes', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Create a note for a client',
      body: {
        type: 'object',
        required: ['clientId', 'content'],
        properties: {
          clientId: { type: 'string', description: 'Client ID' },
          content: { type: 'string', description: 'Note content' },
          isPrivate: { type: 'boolean', description: 'Is note private (default: true)' },
          tags: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Tags for the note' 
          }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                isPrivate: { type: 'boolean' },
                tags: { type: 'array' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateClientNoteRequest }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const note = await analyticsService.createClientNote(provider.id, request.body);

      return reply.code(201).send({
        success: true,
        data: note,
        message: 'Nota creada exitosamente'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al crear nota'
      });
    }
  });

  /**
   * Get client notes
   * GET /api/provider/clients/:clientId/notes
   */
  server.get<{
    Params: { clientId: string }
  }>('/clients/:clientId/notes', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get all notes for a specific client',
      params: {
        type: 'object',
        properties: {
          clientId: { type: 'string' }
        },
        required: ['clientId']
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  isPrivate: { type: 'boolean' },
                  tags: { type: 'array' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { clientId } = request.params;

      const notes = await server.prisma.clientNote.findMany({
        where: {
          providerId: provider.id,
          clientId
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: notes.map(note => ({
          id: note.id,
          content: note.content,
          isPrivate: note.isPrivate,
          tags: note.tags,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString()
        }))
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener notas del cliente'
      });
    }
  });

  /**
   * Update daily analytics (internal endpoint)
   * POST /api/provider/analytics/update-daily
   */
  server.post<{
    Body: { date?: string }
  }>('/analytics/update-daily', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Update daily analytics for the authenticated provider',
      body: {
        type: 'object',
        properties: {
          date: { 
            type: 'string', 
            format: 'date',
            description: 'Date to update analytics for (default: today)' 
          }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { date?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { date } = request.body;

      const targetDate = date ? new Date(date) : new Date();
      await analyticsService.updateDailyAnalytics(provider.id, targetDate);

      return reply.send({
        success: true,
        message: 'Analíticas diarias actualizadas exitosamente'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al actualizar analíticas diarias'
      });
    }
  });

  /**
   * Get performance recommendations
   * GET /api/provider/recommendations
   */
  server.get('/recommendations', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get performance optimization recommendations',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  impact: { type: 'string' },
                  actionRequired: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;

      // Get recent analytics to generate recommendations
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 30);

      const analytics = await analyticsService.getProviderAnalytics(provider.id, fromDate, toDate);

      return reply.send({
        success: true,
        data: analytics.recommendations
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener recomendaciones'
      });
    }
  });

  /**
   * Get service performance metrics
   * GET /api/provider/services/performance
   */
  server.get<{
    Querystring: { 
      from?: string; 
      to?: string; 
      serviceId?: string 
    }
  }>('/services/performance', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Get service performance metrics',
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' },
          serviceId: { type: 'string', description: 'Filter by specific service' }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  serviceId: { type: 'string' },
                  serviceName: { type: 'string' },
                  bookings: { type: 'number' },
                  revenue: { type: 'number' },
                  averageRating: { type: 'number' },
                  popularity: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { from?: string; to?: string; serviceId?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { from, to, serviceId } = request.query;

      // Calculate date range
      let fromDate: Date, toDate: Date;
      if (from && to) {
        fromDate = new Date(from);
        toDate = new Date(to);
      } else {
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 30);
      }

      const analytics = await analyticsService.getProviderAnalytics(provider.id, fromDate, toDate);
      let servicePerformance = analytics.servicePerformance;

      // Filter by serviceId if provided
      if (serviceId) {
        servicePerformance = servicePerformance.filter(sp => sp.serviceId === serviceId);
      }

      return reply.send({
        success: true,
        data: servicePerformance
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener métricas de servicios'
      });
    }
  });

  /**
   * Export analytics data
   * GET /api/provider/analytics/export
   */
  server.get<{
    Querystring: { 
      from: string; 
      to: string; 
      format?: 'csv' | 'json' 
    }
  }>('/analytics/export', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Provider Analytics'],
      description: 'Export analytics data in CSV or JSON format',
      querystring: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' },
          format: { 
            type: 'string', 
            enum: ['csv', 'json'],
            description: 'Export format (default: json)' 
          }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            downloadUrl: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { from: string; to: string; format?: string } }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const { from, to, format = 'json' } = request.query;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      const analytics = await analyticsService.getProviderAnalytics(provider.id, fromDate, toDate);
      const earnings = await analyticsService.getEarningsReport(provider.id, fromDate, toDate);

      const exportData = {
        provider: {
          id: provider.id,
          businessName: provider.businessName
        },
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        },
        analytics,
        earnings,
        exportedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        // For CSV, we'd need to implement CSV conversion
        // For now, return JSON with a note
        return reply.send({
          success: true,
          data: exportData,
          message: 'Exportación en formato CSV no implementada aún. Datos devueltos en JSON.'
        });
      }

      return reply.send({
        success: true,
        data: exportData,
        message: 'Datos exportados exitosamente'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al exportar datos analíticos'
      });
    }
  });
}