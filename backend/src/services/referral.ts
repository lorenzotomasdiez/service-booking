import { PrismaClient } from '@prisma/client';
import { 
  CreateReferralCodeRequest, 
  ReferralCodeResponse, 
  ProcessReferralRequest,
  ReferralResponse,
  ReferralAnalytics,
  ShareReferralRequest
} from '../types/referral';

export class ReferralService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a unique referral code
   */
  private async generateUniqueCode(baseCode?: string): Promise<string> {
    if (baseCode) {
      const existing = await this.prisma.referralCode.findUnique({
        where: { code: baseCode }
      });
      if (!existing) return baseCode;
    }

    // Generate random code with Argentina context
    let attempts = 0;
    while (attempts < 10) {
      const code = `BARBER${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const existing = await this.prisma.referralCode.findUnique({
        where: { code }
      });
      if (!existing) return code;
      attempts++;
    }

    throw new Error('No se pudo generar un código único');
  }

  /**
   * Create a new referral code for a provider
   */
  async createReferralCode(
    providerId: string,
    data: CreateReferralCodeRequest
  ): Promise<ReferralCodeResponse> {
    const code = await this.generateUniqueCode(data.code);

    const referralCode = await this.prisma.referralCode.create({
      data: {
        code,
        providerId,
        referrerReward: data.referrerReward,
        refereeDiscount: data.refereeDiscount,
        rewardType: data.rewardType,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      },
      include: {
        provider: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    return {
      id: referralCode.id,
      code: referralCode.code,
      providerId: referralCode.providerId,
      isActive: referralCode.isActive,
      maxUses: referralCode.maxUses || undefined,
      usedCount: referralCode.usedCount,
      referrerReward: Number(referralCode.referrerReward),
      refereeDiscount: Number(referralCode.refereeDiscount),
      rewardType: referralCode.rewardType,
      expiresAt: referralCode.expiresAt?.toISOString(),
      createdAt: referralCode.createdAt.toISOString(),
      updatedAt: referralCode.updatedAt.toISOString(),
      provider: {
        businessName: referralCode.provider.businessName,
        user: {
          name: referralCode.provider.user.name
        }
      }
    };
  }

  /**
   * Get all referral codes for a provider
   */
  async getProviderReferralCodes(providerId: string): Promise<ReferralCodeResponse[]> {
    const referralCodes = await this.prisma.referralCode.findMany({
      where: { providerId },
      include: {
        provider: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return referralCodes.map(code => ({
      id: code.id,
      code: code.code,
      providerId: code.providerId,
      isActive: code.isActive,
      maxUses: code.maxUses || undefined,
      usedCount: code.usedCount,
      referrerReward: Number(code.referrerReward),
      refereeDiscount: Number(code.refereeDiscount),
      rewardType: code.rewardType,
      expiresAt: code.expiresAt?.toISOString(),
      createdAt: code.createdAt.toISOString(),
      updatedAt: code.updatedAt.toISOString(),
      provider: {
        businessName: code.provider.businessName,
        user: {
          name: code.provider.user.name
        }
      }
    }));
  }

  /**
   * Validate and process a referral
   */
  async processReferral(data: ProcessReferralRequest): Promise<ReferralResponse> {
    // Find referral code
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code: data.referralCode },
      include: {
        provider: { include: { user: true } },
        referrals: true
      }
    });

    if (!referralCode || !referralCode.isActive) {
      throw new Error('Código de referido inválido o inactivo');
    }

    // Check expiration
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new Error('Código de referido expirado');
    }

    // Check usage limits
    if (referralCode.maxUses && referralCode.usedCount >= referralCode.maxUses) {
      throw new Error('Código de referido ya alcanzó el límite de usos');
    }

    // Check if user already used this code
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        codeId: referralCode.id,
        refereeId: data.refereeId
      }
    });

    if (existingReferral) {
      throw new Error('Ya has usado este código de referido');
    }

    // Get referrer from provider
    const referrerId = referralCode.provider.userId;

    // Create referral record
    const referral = await this.prisma.$transaction(async (tx) => {
      // Create referral
      const newReferral = await tx.referral.create({
        data: {
          codeId: referralCode.id,
          referrerId,
          refereeId: data.refereeId,
          bookingId: data.bookingId,
          status: 'PENDING',
          discountAmount: referralCode.refereeDiscount
        },
        include: {
          code: {
            include: {
              provider: true
            }
          },
          referrer: {
            select: { name: true, email: true }
          },
          referee: {
            select: { name: true, email: true }
          }
        }
      });

      // Update code usage count
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: { usedCount: { increment: 1 } }
      });

      return newReferral;
    });

    return {
      id: referral.id,
      codeId: referral.codeId,
      referrerId: referral.referrerId,
      refereeId: referral.refereeId,
      bookingId: referral.bookingId || undefined,
      status: referral.status,
      rewardAmount: referral.rewardAmount ? Number(referral.rewardAmount) : undefined,
      discountAmount: referral.discountAmount ? Number(referral.discountAmount) : undefined,
      rewardPaidAt: referral.rewardPaidAt?.toISOString(),
      createdAt: referral.createdAt.toISOString(),
      code: {
        code: referral.code.code,
        provider: {
          businessName: referral.code.provider.businessName
        }
      },
      referrer: {
        name: referral.referrer.name,
        email: referral.referrer.email
      },
      referee: {
        name: referral.referee.name,
        email: referral.referee.email
      }
    };
  }

  /**
   * Complete a referral when booking is completed
   */
  async completeReferral(referralId: string, bookingId: string): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        code: true,
        booking: true
      }
    });

    if (!referral) {
      throw new Error('Referido no encontrado');
    }

    // Calculate reward based on booking amount
    let rewardAmount = Number(referral.code.referrerReward);
    if (referral.code.rewardType === 'PERCENTAGE' && referral.booking) {
      rewardAmount = Number(referral.booking.totalAmount) * (Number(referral.code.referrerReward) / 100);
    }

    await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'COMPLETED',
        bookingId,
        rewardAmount
      }
    });
  }

  /**
   * Get referral analytics for a provider
   */
  async getReferralAnalytics(providerId: string): Promise<ReferralAnalytics> {
    const referralCodes = await this.prisma.referralCode.findMany({
      where: { providerId },
      include: {
        referrals: {
          include: {
            referrer: true,
            referee: true
          }
        }
      }
    });

    const allReferrals = referralCodes.flatMap(code => code.referrals);

    const totalReferrals = allReferrals.length;
    const pendingReferrals = allReferrals.filter(r => r.status === 'PENDING').length;
    const completedReferrals = allReferrals.filter(r => r.status === 'COMPLETED' || r.status === 'PAID').length;
    const totalRewards = allReferrals
      .filter(r => r.rewardAmount)
      .reduce((sum, r) => sum + Number(r.rewardAmount!), 0);
    const totalDiscounts = allReferrals
      .filter(r => r.discountAmount)
      .reduce((sum, r) => sum + Number(r.discountAmount!), 0);

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    // Top referrers
    const referrerMap = new Map<string, {
      userId: string;
      userName: string;
      referralCount: number;
      totalRewards: number;
    }>();

    allReferrals.forEach(referral => {
      const key = referral.referrerId;
      const existing = referrerMap.get(key) || {
        userId: referral.referrerId,
        userName: referral.referrer.name,
        referralCount: 0,
        totalRewards: 0
      };

      existing.referralCount += 1;
      existing.totalRewards += Number(referral.rewardAmount || 0);
      referrerMap.set(key, existing);
    });

    const topReferrers = Array.from(referrerMap.values())
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 10);

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewards,
      totalDiscounts,
      conversionRate,
      topReferrers
    };
  }

  /**
   * Generate social sharing links
   */
  async generateShareLink(
    referralCode: string,
    shareData: ShareReferralRequest
  ): Promise<{ shareUrl: string; message: string }> {
    const code = await this.prisma.referralCode.findUnique({
      where: { code: referralCode },
      include: {
        provider: {
          include: { user: true }
        }
      }
    });

    if (!code) {
      throw new Error('Código de referido no encontrado');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://barberpro.com.ar';
    const shareUrl = `${baseUrl}/referral/${referralCode}`;

    const defaultMessage = `¡Hola! Te invito a conocer ${code.provider.businessName}. ` +
      `Usa mi código ${referralCode} y obtén un descuento de $${code.refereeDiscount}. ` +
      `¡Reserva aquí: ${shareUrl}`;

    const message = shareData.customMessage || defaultMessage;

    return { shareUrl, message };
  }

  /**
   * Toggle referral code status
   */
  async toggleReferralCodeStatus(codeId: string, providerId: string): Promise<void> {
    const code = await this.prisma.referralCode.findFirst({
      where: { 
        id: codeId,
        providerId 
      }
    });

    if (!code) {
      throw new Error('Código de referido no encontrado');
    }

    await this.prisma.referralCode.update({
      where: { id: codeId },
      data: { isActive: !code.isActive }
    });
  }

  /**
   * Get user referrals (as referrer)
   */
  async getUserReferrals(userId: string): Promise<ReferralResponse[]> {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        code: {
          include: {
            provider: true
          }
        },
        referrer: {
          select: { name: true, email: true }
        },
        referee: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return referrals.map(referral => ({
      id: referral.id,
      codeId: referral.codeId,
      referrerId: referral.referrerId,
      refereeId: referral.refereeId,
      bookingId: referral.bookingId || undefined,
      status: referral.status,
      rewardAmount: referral.rewardAmount ? Number(referral.rewardAmount) : undefined,
      discountAmount: referral.discountAmount ? Number(referral.discountAmount) : undefined,
      rewardPaidAt: referral.rewardPaidAt?.toISOString(),
      createdAt: referral.createdAt.toISOString(),
      code: {
        code: referral.code.code,
        provider: {
          businessName: referral.code.provider.businessName
        }
      },
      referrer: {
        name: referral.referrer.name,
        email: referral.referrer.email
      },
      referee: {
        name: referral.referee.name,
        email: referral.referee.email
      }
    }));
  }
}