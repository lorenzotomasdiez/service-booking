import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ReferralService } from '../services/referral';
import { CreateReferralCodeRequest, ProcessReferralRequest, ShareReferralRequest } from '../types/referral';

export default async function referralRoutes(server: FastifyInstance) {
  const referralService = new ReferralService(server.prisma);

  // Authentication hook for all routes
  server.addHook('preHandler', server.authenticate);

  /**
   * Create referral code
   * POST /api/referrals/create
   */
  server.post<{ 
    Body: CreateReferralCodeRequest 
  }>('/create', {
    schema: {
      tags: ['Referrals'],
      description: 'Create a new referral code for a provider',
      body: {
        type: 'object',
        required: ['referrerReward', 'refereeDiscount', 'rewardType'],
        properties: {
          code: { type: 'string', description: 'Optional custom code' },
          referrerReward: { type: 'number', minimum: 0, description: 'Reward amount for referrer' },
          refereeDiscount: { type: 'number', minimum: 0, description: 'Discount for new client' },
          rewardType: { type: 'string', enum: ['FIXED_AMOUNT', 'PERCENTAGE'] },
          maxUses: { type: 'number', minimum: 1, description: 'Maximum number of uses' },
          expiresAt: { type: 'string', format: 'date-time', description: 'Expiration date' }
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
                id: { type: 'string' },
                code: { type: 'string' },
                providerId: { type: 'string' },
                referrerReward: { type: 'number' },
                refereeDiscount: { type: 'number' },
                rewardType: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateReferralCodeRequest }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      
      // Verify user is a provider
      const provider = await server.prisma.provider.findUnique({
        where: { userId: user.id }
      });

      if (!provider) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los proveedores pueden crear códigos de referido'
        });
      }

      const referralCode = await referralService.createReferralCode(provider.id, request.body);

      return reply.send({
        success: true,
        data: referralCode
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al crear código de referido'
      });
    }
  });

  /**
   * Get provider referral codes
   * GET /api/referrals
   */
  server.get('/codes', {
    schema: {
      tags: ['Referrals'],
      description: 'Get all referral codes for the authenticated provider',
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
                  code: { type: 'string' },
                  isActive: { type: 'boolean' },
                  usedCount: { type: 'number' },
                  referrerReward: { type: 'number' },
                  refereeDiscount: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      
      const provider = await server.prisma.provider.findUnique({
        where: { userId: user.id }
      });

      if (!provider) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los proveedores pueden ver códigos de referido'
        });
      }

      const referralCodes = await referralService.getProviderReferralCodes(provider.id);

      return reply.send({
        success: true,
        data: referralCodes
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener códigos de referido'
      });
    }
  });

  /**
   * Process referral
   * POST /api/referrals/process
   */
  server.post<{ 
    Body: ProcessReferralRequest 
  }>('/process', {
    schema: {
      tags: ['Referrals'],
      description: 'Process a referral code for a new client',
      body: {
        type: 'object',
        required: ['referralCode', 'refereeId'],
        properties: {
          referralCode: { type: 'string', description: 'Referral code to process' },
          refereeId: { type: 'string', description: 'ID of the new client being referred' },
          bookingId: { type: 'string', description: 'Associated booking ID' }
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
                id: { type: 'string' },
                status: { type: 'string' },
                discountAmount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: ProcessReferralRequest }>, reply: FastifyReply) => {
    try {
      const referral = await referralService.processReferral(request.body);

      return reply.send({
        success: true,
        data: referral,
        message: `Referido procesado exitosamente. Descuento: $${referral.discountAmount}`
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al procesar referido'
      });
    }
  });

  /**
   * Get referral analytics
   * GET /api/referrals/analytics
   */
  server.get('/analytics', {
    schema: {
      tags: ['Referrals'],
      description: 'Get referral analytics for the authenticated provider',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalReferrals: { type: 'number' },
                completedReferrals: { type: 'number' },
                totalRewards: { type: 'number' },
                conversionRate: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      
      const provider = await server.prisma.provider.findUnique({
        where: { userId: user.id }
      });

      if (!provider) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los proveedores pueden ver analíticas de referidos'
        });
      }

      const analytics = await referralService.getReferralAnalytics(provider.id);

      return reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener analíticas de referidos'
      });
    }
  });

  /**
   * Generate share link
   * POST /api/referrals/:code/share
   */
  server.post<{ 
    Params: { code: string };
    Body: ShareReferralRequest 
  }>('/:code/share', {
    schema: {
      tags: ['Referrals'],
      description: 'Generate social sharing link for referral code',
      params: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      },
      body: {
        type: 'object',
        required: ['platform'],
        properties: {
          platform: { 
            type: 'string', 
            enum: ['whatsapp', 'instagram', 'facebook', 'sms', 'email'],
            description: 'Social platform for sharing' 
          },
          customMessage: { type: 'string', description: 'Custom message to include' }
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
                shareUrl: { type: 'string' },
                message: { type: 'string' },
                platform: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { code: string }; Body: ShareReferralRequest }>, reply: FastifyReply) => {
    try {
      const { code } = request.params;
      const shareData = request.body;

      const { shareUrl, message } = await referralService.generateShareLink(code, shareData);

      // Generate platform-specific URLs
      let platformUrl = shareUrl;
      const encodedMessage = encodeURIComponent(message);

      switch (shareData.platform) {
        case 'whatsapp':
          platformUrl = `https://wa.me/?text=${encodedMessage}`;
          break;
        case 'facebook':
          platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodedMessage}`;
          break;
        case 'instagram':
          // Instagram doesn't support direct sharing via URL, return base URL
          break;
        case 'sms':
          platformUrl = `sms:?body=${encodedMessage}`;
          break;
        case 'email':
          platformUrl = `mailto:?subject=${encodeURIComponent('Te invito a un descuento especial')}&body=${encodedMessage}`;
          break;
      }

      return reply.send({
        success: true,
        data: {
          shareUrl: platformUrl,
          message,
          platform: shareData.platform
        }
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al generar enlace de compartir'
      });
    }
  });

  /**
   * Toggle referral code status
   * PATCH /api/referrals/:id/toggle
   */
  server.patch<{ 
    Params: { id: string } 
  }>('/:id/toggle', {
    schema: {
      tags: ['Referrals'],
      description: 'Toggle referral code active status',
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
      const user = request.user as any;
      const { id } = request.params;

      const provider = await server.prisma.provider.findUnique({
        where: { userId: user.id }
      });

      if (!provider) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los proveedores pueden modificar códigos de referido'
        });
      }

      await referralService.toggleReferralCodeStatus(id, provider.id);

      return reply.send({
        success: true,
        message: 'Estado del código de referido actualizado'
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message || 'Error al actualizar código de referido'
      });
    }
  });

  /**
   * Get user referrals (as referrer)
   * GET /api/referrals/my-referrals
   */
  server.get('/my-referrals', {
    schema: {
      tags: ['Referrals'],
      description: 'Get referrals made by the authenticated user',
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
                  status: { type: 'string' },
                  rewardAmount: { type: 'number' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const referrals = await referralService.getUserReferrals(user.id);

      return reply.send({
        success: true,
        data: referrals
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener referidos'
      });
    }
  });

  /**
   * Validate referral code (public endpoint)
   * GET /api/referrals/validate/:code
   */
  server.get<{ 
    Params: { code: string } 
  }>('/validate/:code', {
    preHandler: [], // Remove authentication for public validation
    schema: {
      tags: ['Referrals'],
      description: 'Validate a referral code (public endpoint)',
      params: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                refereeDiscount: { type: 'number' },
                provider: {
                  type: 'object',
                  properties: {
                    businessName: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
    try {
      const { code } = request.params;

      const referralCode = await server.prisma.referralCode.findUnique({
        where: { code },
        include: {
          provider: true
        }
      });

      if (!referralCode || !referralCode.isActive) {
        return reply.send({
          success: true,
          valid: false,
          message: 'Código de referido inválido o inactivo'
        });
      }

      // Check expiration
      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        return reply.send({
          success: true,
          valid: false,
          message: 'Código de referido expirado'
        });
      }

      // Check usage limits
      if (referralCode.maxUses && referralCode.usedCount >= referralCode.maxUses) {
        return reply.send({
          success: true,
          valid: false,
          message: 'Código de referido alcanzó el límite de usos'
        });
      }

      return reply.send({
        success: true,
        valid: true,
        data: {
          code: referralCode.code,
          refereeDiscount: Number(referralCode.refereeDiscount),
          provider: {
            businessName: referralCode.provider.businessName
          }
        }
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al validar código de referido'
      });
    }
  });
}