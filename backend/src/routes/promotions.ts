import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PromotionService } from '../services/promotion';
import { 
  CreatePromotionRequest, 
  ValidatePromotionRequest, 
  ApplyPromotionRequest,
  UpdateLoyaltyPointsRequest
} from '../types/promotion';

export default async function promotionRoutes(server: FastifyInstance) {
  const promotionService = new PromotionService(server.prisma);

  // Authentication hook for protected routes
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
   * Create promotion
   * POST /api/promotions
   */
  server.post<{ 
    Body: CreatePromotionRequest 
  }>('/', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Promotions'],
      description: 'Create a new promotion',
      body: {
        type: 'object',
        required: ['name', 'discountType', 'discountValue', 'validFrom', 'validUntil'],
        properties: {
          name: { type: 'string', description: 'Promotion name' },
          description: { type: 'string', description: 'Promotion description' },
          code: { type: 'string', description: 'Optional promo code' },
          discountType: { 
            type: 'string', 
            enum: ['FIXED_AMOUNT', 'PERCENTAGE', 'BUY_ONE_GET_ONE'],
            description: 'Type of discount' 
          },
          discountValue: { type: 'number', minimum: 0, description: 'Discount value' },
          minimumAmount: { type: 'number', minimum: 0, description: 'Minimum order amount' },
          maxDiscountAmount: { type: 'number', minimum: 0, description: 'Maximum discount amount' },
          maxUses: { type: 'number', minimum: 1, description: 'Maximum total uses' },
          maxUsesPerUser: { type: 'number', minimum: 1, description: 'Maximum uses per user' },
          applicableToAllServices: { type: 'boolean', description: 'Apply to all services' },
          serviceIds: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Specific service IDs if not all services' 
          },
          validFrom: { type: 'string', format: 'date-time', description: 'Valid from date' },
          validUntil: { type: 'string', format: 'date-time', description: 'Valid until date' },
          isNewClientOnly: { type: 'boolean', description: 'Only for new clients' },
          isBirthdayPromo: { type: 'boolean', description: 'Birthday promotion' },
          isGroupBooking: { type: 'boolean', description: 'Group booking promotion' },
          minGroupSize: { type: 'number', minimum: 2, description: 'Minimum group size' }
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
                name: { type: 'string' },
                code: { type: 'string' },
                discountType: { type: 'string' },
                discountValue: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreatePromotionRequest }>, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const promotion = await promotionService.createPromotion(provider.id, request.body);

      return reply.code(201).send({
        success: true,
        data: promotion,
        message: 'Promoción creada exitosamente'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al crear promoción'
      });
    }
  });

  /**
   * Get provider promotions
   * GET /api/promotions
   */
  server.get('/', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Promotions'],
      description: 'Get all promotions for the authenticated provider',
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
                  name: { type: 'string' },
                  code: { type: 'string' },
                  discountType: { type: 'string' },
                  isActive: { type: 'boolean' },
                  usedCount: { type: 'number' }
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
      const promotions = await promotionService.getProviderPromotions(provider.id);

      return reply.send({
        success: true,
        data: promotions
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener promociones'
      });
    }
  });

  /**
   * Get active promotions (public endpoint)
   * GET /api/promotions/active
   */
  server.get<{
    Querystring: { providerId?: string }
  }>('/active', {
    schema: {
      tags: ['Promotions'],
      description: 'Get active promotions (public endpoint)',
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string', description: 'Filter by provider ID' }
        }
      },
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
                  name: { type: 'string' },
                  description: { type: 'string' },
                  discountType: { type: 'string' },
                  discountValue: { type: 'number' },
                  validUntil: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { providerId?: string } }>, reply: FastifyReply) => {
    try {
      const { providerId } = request.query;
      const promotions = await promotionService.getActivePromotions(providerId);

      return reply.send({
        success: true,
        data: promotions
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener promociones activas'
      });
    }
  });

  /**
   * Validate promotion
   * POST /api/promotions/validate
   */
  server.post<{ 
    Body: ValidatePromotionRequest 
  }>('/validate', {
    preHandler: [server.authenticate],
    schema: {
      tags: ['Promotions'],
      description: 'Validate a promotion for a specific booking',
      body: {
        type: 'object',
        required: ['userId', 'serviceIds', 'totalAmount'],
        properties: {
          code: { type: 'string', description: 'Promotion code' },
          promotionId: { type: 'string', description: 'Promotion ID' },
          userId: { type: 'string', description: 'User ID' },
          serviceIds: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Service IDs for booking' 
          },
          totalAmount: { type: 'number', minimum: 0, description: 'Total booking amount' },
          isGroupBooking: { type: 'boolean', description: 'Is group booking' },
          groupSize: { type: 'number', minimum: 1, description: 'Group size' }
        }
      },
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean' },
            discountAmount: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: ValidatePromotionRequest }>, reply: FastifyReply) => {
    try {
      const validation = await promotionService.validatePromotion(request.body);

      return reply.send({
        success: true,
        ...validation
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al validar promoción'
      });
    }
  });

  /**
   * Apply promotion
   * POST /api/promotions/apply
   */
  server.post<{ 
    Body: ApplyPromotionRequest 
  }>('/apply', {
    preHandler: [server.authenticate],
    schema: {
      tags: ['Promotions'],
      description: 'Apply a promotion to a booking',
      body: {
        type: 'object',
        required: ['promotionId', 'userId', 'discountAmount'],
        properties: {
          promotionId: { type: 'string', description: 'Promotion ID' },
          userId: { type: 'string', description: 'User ID' },
          bookingId: { type: 'string', description: 'Booking ID' },
          discountAmount: { type: 'number', minimum: 0, description: 'Discount amount' }
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
  }, async (request: FastifyRequest<{ Body: ApplyPromotionRequest }>, reply: FastifyReply) => {
    try {
      await promotionService.applyPromotion(request.body);

      return reply.send({
        success: true,
        message: 'Promoción aplicada exitosamente'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al aplicar promoción'
      });
    }
  });

  /**
   * Get promotion analytics
   * GET /api/promotions/analytics
   */
  server.get('/analytics', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Promotions'],
      description: 'Get promotion analytics for the authenticated provider',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalPromotions: { type: 'number' },
                activePromotions: { type: 'number' },
                totalUsages: { type: 'number' },
                totalDiscountGiven: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = (request as any).provider;
      const analytics = await promotionService.getPromotionAnalytics(provider.id);

      return reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener analíticas de promociones'
      });
    }
  });

  /**
   * Get loyalty points
   * GET /api/promotions/loyalty/:userId
   */
  server.get<{
    Params: { userId: string };
    Querystring: { providerId?: string }
  }>('/loyalty/:userId', {
    preHandler: [server.authenticate],
    schema: {
      tags: ['Promotions'],
      description: 'Get loyalty points for a user',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
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
                points: { type: 'number' },
                totalEarned: { type: 'number' },
                totalSpent: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Querystring: { providerId?: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const { providerId } = request.query;
      
      // If no providerId provided, get it from authenticated provider
      let targetProviderId = providerId;
      if (!targetProviderId) {
        const user = request.user as any;
        const provider = await server.prisma.provider.findUnique({
          where: { userId: user.id }
        });
        if (provider) {
          targetProviderId = provider.id;
        }
      }

      if (!targetProviderId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Provider ID requerido'
        });
      }

      const loyaltyPoints = await promotionService.getLoyaltyPoints(userId, targetProviderId);

      return reply.send({
        success: true,
        data: loyaltyPoints
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener puntos de lealtad'
      });
    }
  });

  /**
   * Update loyalty points
   * POST /api/promotions/loyalty/:userId
   */
  server.post<{
    Params: { userId: string };
    Body: UpdateLoyaltyPointsRequest & { providerId?: string }
  }>('/loyalty/:userId', {
    preHandler: [server.authenticate],
    schema: {
      tags: ['Promotions'],
      description: 'Update loyalty points for a user',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        required: ['type', 'points'],
        properties: {
          type: { 
            type: 'string', 
            enum: ['EARNED', 'SPENT', 'BONUS'],
            description: 'Transaction type' 
          },
          points: { type: 'number', minimum: 1, description: 'Points amount' },
          description: { type: 'string', description: 'Transaction description' },
          bookingId: { type: 'string', description: 'Associated booking ID' },
          providerId: { type: 'string', description: 'Provider ID (optional)' }
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
                points: { type: 'number' },
                totalEarned: { type: 'number' },
                totalSpent: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Body: UpdateLoyaltyPointsRequest & { providerId?: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const { providerId, ...loyaltyData } = request.body;

      // If no providerId provided, get it from authenticated provider
      let targetProviderId = providerId;
      if (!targetProviderId) {
        const user = request.user as any;
        const provider = await server.prisma.provider.findUnique({
          where: { userId: user.id }
        });
        if (provider) {
          targetProviderId = provider.id;
        }
      }

      if (!targetProviderId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Provider ID requerido'
        });
      }

      const updatedPoints = await promotionService.updateLoyaltyPoints(userId, targetProviderId, loyaltyData);

      return reply.send({
        success: true,
        data: updatedPoints,
        message: `Puntos ${loyaltyData.type.toLowerCase()} exitosamente`
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al actualizar puntos de lealtad'
      });
    }
  });

  /**
   * Toggle promotion status
   * PATCH /api/promotions/:id/toggle
   */
  server.patch<{
    Params: { id: string }
  }>('/:id/toggle', {
    preHandler: [authenticateProvider],
    schema: {
      tags: ['Promotions'],
      description: 'Toggle promotion active status',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
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
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const provider = (request as any).provider;

      const promotion = await server.prisma.promotion.findFirst({
        where: {
          id,
          providerId: provider.id
        }
      });

      if (!promotion) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Promoción no encontrada'
        });
      }

      await server.prisma.promotion.update({
        where: { id },
        data: { isActive: !promotion.isActive }
      });

      return reply.send({
        success: true,
        message: `Promoción ${promotion.isActive ? 'desactivada' : 'activada'} exitosamente`
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al actualizar promoción'
      });
    }
  });

  /**
   * Check birthday promotions for user
   * POST /api/promotions/birthday-check
   */
  server.post<{
    Body: { userId: string }
  }>('/birthday-check', {
    preHandler: [server.authenticate],
    schema: {
      tags: ['Promotions'],
      description: 'Check and trigger birthday promotions for a user',
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID to check birthday promotions for' }
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
  }, async (request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.body;
      await promotionService.checkBirthdayPromotions(userId);

      return reply.send({
        success: true,
        message: 'Promociones de cumpleaños verificadas'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al verificar promociones de cumpleaños'
      });
    }
  });
}