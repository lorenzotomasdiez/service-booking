import { PrismaClient } from '@prisma/client';
import { 
  CreatePromotionRequest,
  PromotionResponse,
  ValidatePromotionRequest,
  PromotionValidationResponse,
  ApplyPromotionRequest,
  PromotionAnalytics,
  LoyaltyPointsResponse,
  UpdateLoyaltyPointsRequest
} from '../types/promotion';

export class PromotionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new promotion
   */
  async createPromotion(
    providerId: string,
    data: CreatePromotionRequest
  ): Promise<PromotionResponse> {
    // Check if code is unique (if provided)
    if (data.code) {
      const existing = await this.prisma.promotion.findUnique({
        where: { code: data.code }
      });
      if (existing) {
        throw new Error('Código promocional ya existe');
      }
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        providerId,
        name: data.name,
        description: data.description,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumAmount: data.minimumAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        maxUses: data.maxUses,
        maxUsesPerUser: data.maxUsesPerUser || 1,
        applicableToAllServices: data.applicableToAllServices ?? true,
        serviceIds: data.serviceIds || [],
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isNewClientOnly: data.isNewClientOnly || false,
        isBirthdayPromo: data.isBirthdayPromo || false,
        isGroupBooking: data.isGroupBooking || false,
        minGroupSize: data.minGroupSize
      },
      include: {
        provider: true,
        usages: true
      }
    });

    return await this.formatPromotionResponse(promotion);
  }

  /**
   * Get all promotions for a provider
   */
  async getProviderPromotions(providerId: string): Promise<PromotionResponse[]> {
    const promotions = await this.prisma.promotion.findMany({
      where: { providerId },
      include: {
        provider: true,
        usages: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(promotions.map(p => this.formatPromotionResponse(p)));
  }

  /**
   * Get active promotions for public access
   */
  async getActivePromotions(providerId?: string): Promise<PromotionResponse[]> {
    const now = new Date();
    
    const promotions = await this.prisma.promotion.findMany({
      where: {
        ...(providerId && { providerId }),
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { maxUses: null },
          { usedCount: { lt: this.prisma.promotion.fields.maxUses } }
        ]
      },
      include: {
        provider: true,
        usages: true
      },
      orderBy: { validUntil: 'asc' }
    });

    return Promise.all(promotions.map(p => this.formatPromotionResponse(p)));
  }

  /**
   * Validate a promotion for a specific booking
   */
  async validatePromotion(data: ValidatePromotionRequest): Promise<PromotionValidationResponse> {
    let promotion;

    if (data.code) {
      promotion = await this.prisma.promotion.findUnique({
        where: { code: data.code },
        include: { 
          provider: true,
          usages: { where: { userId: data.userId } }
        }
      });
    } else if (data.promotionId) {
      promotion = await this.prisma.promotion.findUnique({
        where: { id: data.promotionId },
        include: { 
          provider: true,
          usages: { where: { userId: data.userId } }
        }
      });
    }

    if (!promotion) {
      return {
        valid: false,
        message: 'Promoción no encontrada'
      };
    }

    // Check if promotion is active
    if (!promotion.isActive) {
      return {
        valid: false,
        message: 'Promoción no activa'
      };
    }

    // Check validity period
    const now = new Date();
    if (now < promotion.validFrom || now > promotion.validUntil) {
      return {
        valid: false,
        message: 'Promoción expirada o no válida aún'
      };
    }

    // Check usage limits
    if (promotion.maxUses && promotion.usedCount >= promotion.maxUses) {
      return {
        valid: false,
        message: 'Promoción alcanzó el límite de usos'
      };
    }

    // Check per-user usage limit
    if (promotion.usages.length >= promotion.maxUsesPerUser) {
      return {
        valid: false,
        message: 'Ya has usado esta promoción el máximo permitido'
      };
    }

    // Check minimum amount
    if (promotion.minimumAmount && data.totalAmount < Number(promotion.minimumAmount)) {
      return {
        valid: false,
        message: `Monto mínimo requerido: $${promotion.minimumAmount}`
      };
    }

    // Check if user is new client (if required)
    if (promotion.isNewClientOnly) {
      const existingBookings = await this.prisma.booking.count({
        where: {
          clientId: data.userId,
          providerId: promotion.providerId,
          status: { in: ['COMPLETED'] }
        }
      });

      if (existingBookings > 0) {
        return {
          valid: false,
          message: 'Esta promoción es solo para nuevos clientes'
        };
      }
    }

    // Check group booking requirements
    if (promotion.isGroupBooking) {
      if (!data.isGroupBooking) {
        return {
          valid: false,
          message: 'Esta promoción requiere una reserva grupal'
        };
      }

      if (promotion.minGroupSize && (!data.groupSize || data.groupSize < promotion.minGroupSize)) {
        return {
          valid: false,
          message: `Grupo mínimo requerido: ${promotion.minGroupSize} personas`
        };
      }
    }

    // Check applicable services
    if (!promotion.applicableToAllServices && promotion.serviceIds.length > 0) {
      const hasApplicableService = data.serviceIds.some(serviceId =>
        promotion.serviceIds.includes(serviceId)
      );

      if (!hasApplicableService) {
        return {
          valid: false,
          message: 'Esta promoción no aplica a los servicios seleccionados'
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    
    switch (promotion.discountType) {
      case 'FIXED_AMOUNT':
        discountAmount = Number(promotion.discountValue);
        break;
      case 'PERCENTAGE':
        discountAmount = data.totalAmount * (Number(promotion.discountValue) / 100);
        break;
      case 'BUY_ONE_GET_ONE':
        // For BOGO, we need specific service logic
        discountAmount = this.calculateBogoDiscount(data.serviceIds, data.totalAmount);
        break;
    }

    // Apply maximum discount limit
    if (promotion.maxDiscountAmount && discountAmount > Number(promotion.maxDiscountAmount)) {
      discountAmount = Number(promotion.maxDiscountAmount);
    }

    // Ensure discount doesn't exceed total amount
    if (discountAmount > data.totalAmount) {
      discountAmount = data.totalAmount;
    }

    const promotionResponse = await this.formatPromotionResponse(promotion);

    return {
      valid: true,
      promotion: promotionResponse,
      discountAmount,
      message: `Descuento aplicado: $${discountAmount}`
    };
  }

  /**
   * Apply a promotion to a booking
   */
  async applyPromotion(data: ApplyPromotionRequest): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Create promotion usage record
      await tx.promotionUsage.create({
        data: {
          promotionId: data.promotionId,
          userId: data.userId,
          bookingId: data.bookingId,
          discountAmount: data.discountAmount
        }
      });

      // Update promotion usage count
      await tx.promotion.update({
        where: { id: data.promotionId },
        data: { usedCount: { increment: 1 } }
      });
    });
  }

  /**
   * Get promotion analytics for a provider
   */
  async getPromotionAnalytics(providerId: string): Promise<PromotionAnalytics> {
    const promotions = await this.prisma.promotion.findMany({
      where: { providerId },
      include: {
        usages: {
          include: {
            booking: true
          }
        }
      }
    });

    const totalPromotions = promotions.length;
    const activePromotions = promotions.filter(p => p.isActive).length;
    const totalUsages = promotions.reduce((sum, p) => sum + p.usedCount, 0);
    const totalDiscountGiven = promotions
      .flatMap(p => p.usages)
      .reduce((sum, usage) => sum + Number(usage.discountAmount), 0);

    const averageDiscountPerBooking = totalUsages > 0 ? totalDiscountGiven / totalUsages : 0;

    // Top promotions by usage
    const topPromotions = promotions
      .map(p => ({
        id: p.id,
        name: p.name,
        usageCount: p.usedCount,
        totalDiscount: p.usages.reduce((sum, u) => sum + Number(u.discountAmount), 0),
        conversionRate: p.maxUses ? (p.usedCount / p.maxUses) * 100 : 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Monthly trends (last 12 months)
    const monthlyTrends = await this.calculateMonthlyTrends(providerId);

    return {
      totalPromotions,
      activePromotions,
      totalUsages,
      totalDiscountGiven,
      averageDiscountPerBooking,
      topPromotions,
      monthlyTrends
    };
  }

  /**
   * Loyalty Points Management
   */
  async getLoyaltyPoints(userId: string, providerId: string): Promise<LoyaltyPointsResponse | null> {
    const loyaltyPoints = await this.prisma.loyaltyPoints.findUnique({
      where: {
        userId_providerId: {
          userId,
          providerId
        }
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!loyaltyPoints) return null;

    return {
      id: loyaltyPoints.id,
      userId: loyaltyPoints.userId,
      providerId: loyaltyPoints.providerId,
      points: loyaltyPoints.points,
      totalEarned: loyaltyPoints.totalEarned,
      totalSpent: loyaltyPoints.totalSpent,
      createdAt: loyaltyPoints.createdAt.toISOString(),
      updatedAt: loyaltyPoints.updatedAt.toISOString(),
      transactions: loyaltyPoints.transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description || undefined,
        createdAt: t.createdAt.toISOString()
      }))
    };
  }

  /**
   * Update loyalty points
   */
  async updateLoyaltyPoints(
    userId: string,
    providerId: string,
    data: UpdateLoyaltyPointsRequest
  ): Promise<LoyaltyPointsResponse> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Get or create loyalty points record
      let loyaltyPoints = await tx.loyaltyPoints.findUnique({
        where: {
          userId_providerId: {
            userId,
            providerId
          }
        }
      });

      if (!loyaltyPoints) {
        loyaltyPoints = await tx.loyaltyPoints.create({
          data: {
            userId,
            providerId,
            points: 0,
            totalEarned: 0,
            totalSpent: 0
          }
        });
      }

      // Calculate new points
      let newPoints = loyaltyPoints.points;
      let newTotalEarned = loyaltyPoints.totalEarned;
      let newTotalSpent = loyaltyPoints.totalSpent;

      if (data.type === 'EARNED' || data.type === 'BONUS') {
        newPoints += data.points;
        newTotalEarned += data.points;
      } else if (data.type === 'SPENT') {
        newPoints = Math.max(0, newPoints - data.points);
        newTotalSpent += data.points;
      }

      // Update loyalty points
      const updatedLoyaltyPoints = await tx.loyaltyPoints.update({
        where: { id: loyaltyPoints.id },
        data: {
          points: newPoints,
          totalEarned: newTotalEarned,
          totalSpent: newTotalSpent
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      // Create transaction record
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyPointsId: loyaltyPoints.id,
          type: data.type,
          points: data.points,
          description: data.description,
          bookingId: data.bookingId
        }
      });

      return updatedLoyaltyPoints;
    });

    return {
      id: result.id,
      userId: result.userId,
      providerId: result.providerId,
      points: result.points,
      totalEarned: result.totalEarned,
      totalSpent: result.totalSpent,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      transactions: result.transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description || undefined,
        createdAt: t.createdAt.toISOString()
      }))
    };
  }

  /**
   * Auto-award birthday promotions
   */
  async checkBirthdayPromotions(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.birthDate) return;

    const today = new Date();
    const birthDate = new Date(user.birthDate);
    
    // Check if today is user's birthday
    if (today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate()) {
      const birthdayPromotions = await this.prisma.promotion.findMany({
        where: {
          isBirthdayPromo: true,
          isActive: true,
          validFrom: { lte: today },
          validUntil: { gte: today }
        }
      });

      // Create notifications or automatic promotions
      for (const promo of birthdayPromotions) {
        await this.prisma.notification.create({
          data: {
            userId,
            title: '¡Feliz Cumpleaños!',
            message: `Tienes una promoción especial de cumpleaños: ${promo.name}`,
            type: 'SYSTEM_ANNOUNCEMENT',
            data: {
              promotionId: promo.id,
              type: 'BIRTHDAY_PROMO'
            }
          }
        });
      }
    }
  }

  // Private helper methods

  private async formatPromotionResponse(promotion: any): Promise<PromotionResponse> {
    let services: Array<{ id: string; name: string; price: number }> = [];
    if (!promotion.applicableToAllServices && promotion.serviceIds.length > 0) {
      services = await this.prisma.service.findMany({
        where: { id: { in: promotion.serviceIds } },
        select: { id: true, name: true, price: true }
      });
    }

    return {
      id: promotion.id,
      providerId: promotion.providerId,
      name: promotion.name,
      description: promotion.description,
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: Number(promotion.discountValue),
      minimumAmount: promotion.minimumAmount ? Number(promotion.minimumAmount) : undefined,
      maxDiscountAmount: promotion.maxDiscountAmount ? Number(promotion.maxDiscountAmount) : undefined,
      isActive: promotion.isActive,
      maxUses: promotion.maxUses,
      usedCount: promotion.usedCount,
      maxUsesPerUser: promotion.maxUsesPerUser,
      applicableToAllServices: promotion.applicableToAllServices,
      serviceIds: promotion.serviceIds,
      validFrom: promotion.validFrom.toISOString(),
      validUntil: promotion.validUntil.toISOString(),
      isNewClientOnly: promotion.isNewClientOnly,
      isBirthdayPromo: promotion.isBirthdayPromo,
      isGroupBooking: promotion.isGroupBooking,
      minGroupSize: promotion.minGroupSize,
      createdAt: promotion.createdAt.toISOString(),
      updatedAt: promotion.updatedAt.toISOString(),
      provider: {
        businessName: promotion.provider.businessName
      },
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price)
      }))
    };
  }

  private calculateBogoDiscount(serviceIds: string[], totalAmount: number): number {
    // Simple BOGO implementation - 50% off total for multiple services
    return serviceIds.length >= 2 ? totalAmount * 0.5 : 0;
  }

  private async calculateMonthlyTrends(providerId: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await this.prisma.promotionUsage.groupBy({
      by: ['createdAt'],
      where: {
        promotion: { providerId },
        createdAt: { gte: twelveMonthsAgo }
      },
      _count: { id: true },
      _sum: { discountAmount: true }
    });

    // Group by month and format
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = monthlyData.filter(data => {
        const dataDate = new Date(data.createdAt);
        const dataMonthKey = `${dataDate.getFullYear()}-${String(dataDate.getMonth() + 1).padStart(2, '0')}`;
        return dataMonthKey === monthKey;
      });

      monthlyTrends.push({
        month: monthKey,
        usages: monthData.reduce((sum, data) => sum + data._count.id, 0),
        discountAmount: monthData.reduce((sum, data) => sum + Number(data._sum.discountAmount || 0), 0)
      });
    }

    return monthlyTrends;
  }
}