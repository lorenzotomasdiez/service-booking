/**
 * Referral System Service for BarberPro
 * Provider-controlled rewards and referral tracking
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface ReferralReward {
  id: string;
  type: 'PERCENTAGE_DISCOUNT' | 'FIXED_AMOUNT' | 'FREE_SERVICE' | 'LOYALTY_POINTS';
  value: number;
  description: string;
  isActive: boolean;
  expiryDays?: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  currentUsage: number;
  createdAt: Date;
}

export interface ReferralProgram {
  id: string;
  providerId: string;
  name: string;
  description: string;
  isActive: boolean;
  referrerReward: ReferralReward;
  refereeReward: ReferralReward;
  settings: {
    requireCompletedBooking: boolean;
    minimumReferrals: number;
    trackingPeriodDays: number;
    allowSelfReferral: boolean;
    maxRewardsPerUser: number;
  };
  analytics: {
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsPaid: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralLink {
  id: string;
  providerId: string;
  referrerId: string;
  referralCode: string;
  shareUrl: string;
  clicks: number;
  conversions: number;
  totalReward: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReferralTracking {
  id: string;
  referralLinkId: string;
  referrerId: string;
  refereeId: string;
  providerId: string;
  bookingId?: string;
  status: 'PENDING' | 'COMPLETED' | 'REWARDED' | 'EXPIRED' | 'CANCELLED';
  referrerReward?: number;
  refereeReward?: number;
  completedAt?: Date;
  rewardedAt?: Date;
  createdAt: Date;
}

export class ReferralSystemService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Create a new referral program for a provider
   */
  async createReferralProgram(data: {
    providerId: string;
    name: string;
    description: string;
    referrerReward: Omit<ReferralReward, 'id' | 'currentUsage' | 'createdAt'>;
    refereeReward: Omit<ReferralReward, 'id' | 'currentUsage' | 'createdAt'>;
    settings?: Partial<ReferralProgram['settings']>;
  }): Promise<ReferralProgram> {
    const defaultSettings = {
      requireCompletedBooking: true,
      minimumReferrals: 1,
      trackingPeriodDays: 90,
      allowSelfReferral: false,
      maxRewardsPerUser: 10
    };

    const program: ReferralProgram = {
      id: uuidv4(),
      providerId: data.providerId,
      name: data.name,
      description: data.description,
      isActive: true,
      referrerReward: {
        ...data.referrerReward,
        id: uuidv4(),
        currentUsage: 0,
        createdAt: new Date()
      },
      refereeReward: {
        ...data.refereeReward,
        id: uuidv4(),
        currentUsage: 0,
        createdAt: new Date()
      },
      settings: { ...defaultSettings, ...data.settings },
      analytics: {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewardsPaid: 0,
        conversionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be stored in the database
    // For now, we'll return the created program
    console.log(`✅ Created referral program "${program.name}" for provider ${data.providerId}`);
    
    return program;
  }

  /**
   * Generate a referral link for a user
   */
  async generateReferralLink(data: {
    providerId: string;
    referrerId: string;
    customCode?: string;
    expiresInDays?: number;
  }): Promise<ReferralLink> {
    const referralCode = data.customCode || this.generateReferralCode(data.referrerId);
    const baseUrl = process.env.FRONTEND_URL || 'https://barberpro.com.ar';
    
    const referralLink: ReferralLink = {
      id: uuidv4(),
      providerId: data.providerId,
      referrerId: data.referrerId,
      referralCode,
      shareUrl: `${baseUrl}/ref/${referralCode}`,
      clicks: 0,
      conversions: 0,
      totalReward: 0,
      isActive: true,
      expiresAt: data.expiresInDays 
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date()
    };

    // Store referral link in database
    // await this.db.referralLink.create({ data: referralLink });

    console.log(`🔗 Generated referral link: ${referralLink.shareUrl}`);
    
    return referralLink;
  }

  /**
   * Track a referral when someone clicks a referral link
   */
  async trackReferralClick(referralCode: string, metadata?: any): Promise<{
    success: boolean;
    referralLink?: ReferralLink;
    redirectUrl: string;
  }> {
    try {
      // Find referral link by code
      const referralLink = await this.findReferralLinkByCode(referralCode);
      
      if (!referralLink) {
        return {
          success: false,
          redirectUrl: process.env.FRONTEND_URL || 'https://barberpro.com.ar'
        };
      }

      // Check if link is still active and not expired
      if (!referralLink.isActive || (referralLink.expiresAt && referralLink.expiresAt < new Date())) {
        return {
          success: false,
          redirectUrl: process.env.FRONTEND_URL || 'https://barberpro.com.ar'
        };
      }

      // Increment click count
      referralLink.clicks++;
      
      // Update in database
      // await this.db.referralLink.update({
      //   where: { id: referralLink.id },
      //   data: { clicks: referralLink.clicks }
      // });

      console.log(`👆 Referral click tracked: ${referralCode} (${referralLink.clicks} total clicks)`);

      return {
        success: true,
        referralLink,
        redirectUrl: `${process.env.FRONTEND_URL}/provider/${referralLink.providerId}?ref=${referralCode}`
      };
    } catch (error: any) {
      console.error('Error tracking referral click:', error.message);
      return {
        success: false,
        redirectUrl: process.env.FRONTEND_URL || 'https://barberpro.com.ar'
      };
    }
  }

  /**
   * Process a referral when someone books through a referral link
   */
  async processReferral(data: {
    referralCode: string;
    refereeId: string;
    bookingId: string;
  }): Promise<{
    success: boolean;
    tracking?: ReferralTracking;
    rewards?: {
      referrerReward: number;
      refereeReward: number;
    };
  }> {
    try {
      const referralLink = await this.findReferralLinkByCode(data.referralCode);
      
      if (!referralLink) {
        return { success: false };
      }

      // Check if self-referral is allowed
      const program = await this.getReferralProgram(referralLink.providerId);
      if (!program) {
        return { success: false };
      }

      if (!program.settings.allowSelfReferral && referralLink.referrerId === data.refereeId) {
        console.log('❌ Self-referral not allowed');
        return { success: false };
      }

      // Create referral tracking
      const tracking: ReferralTracking = {
        id: uuidv4(),
        referralLinkId: referralLink.id,
        referrerId: referralLink.referrerId,
        refereeId: data.refereeId,
        providerId: referralLink.providerId,
        bookingId: data.bookingId,
        status: program.settings.requireCompletedBooking ? 'PENDING' : 'COMPLETED',
        createdAt: new Date()
      };

      // Calculate rewards
      if (tracking.status === 'COMPLETED') {
        const rewards = await this.calculateRewards(program, data.bookingId);
        tracking.referrerReward = rewards.referrerReward;
        tracking.refereeReward = rewards.refereeReward;
      }

      // Update conversion count
      referralLink.conversions++;
      
      // Store tracking in database
      // await this.db.referralTracking.create({ data: tracking });
      // await this.db.referralLink.update({
      //   where: { id: referralLink.id },
      //   data: { conversions: referralLink.conversions }
      // });

      console.log(`🎯 Referral processed: ${data.referralCode} -> ${data.refereeId}`);

      return {
        success: true,
        tracking,
        rewards: tracking.referrerReward && tracking.refereeReward ? {
          referrerReward: tracking.referrerReward,
          refereeReward: tracking.refereeReward
        } : undefined
      };
    } catch (error: any) {
      console.error('Error processing referral:', error.message);
      return { success: false };
    }
  }

  /**
   * Complete a referral when the booking is finished
   */
  async completeReferral(bookingId: string): Promise<{
    success: boolean;
    rewardsIssued: Array<{
      userId: string;
      type: 'REFERRER' | 'REFEREE';
      reward: number;
      rewardType: ReferralReward['type'];
    }>;
  }> {
    try {
      // Find pending referral tracking for this booking
      const tracking = await this.findTrackingByBooking(bookingId);
      
      if (!tracking || tracking.status !== 'PENDING') {
        return { success: false, rewardsIssued: [] };
      }

      const program = await this.getReferralProgram(tracking.providerId);
      if (!program) {
        return { success: false, rewardsIssued: [] };
      }

      // Calculate and issue rewards
      const rewards = await this.calculateRewards(program, bookingId);
      
      tracking.status = 'COMPLETED';
      tracking.referrerReward = rewards.referrerReward;
      tracking.refereeReward = rewards.refereeReward;
      tracking.completedAt = new Date();

      // Issue rewards
      const rewardsIssued = await this.issueRewards({
        referrerId: tracking.referrerId,
        refereeId: tracking.refereeId,
        referrerReward: rewards.referrerReward,
        refereeReward: rewards.refereeReward,
        program
      });

      // Update tracking
      tracking.status = 'REWARDED';
      tracking.rewardedAt = new Date();

      // Update program analytics
      program.analytics.successfulReferrals++;
      program.analytics.totalRewardsPaid += rewards.referrerReward + rewards.refereeReward;
      program.analytics.conversionRate = program.analytics.totalReferrals > 0 
        ? (program.analytics.successfulReferrals / program.analytics.totalReferrals) * 100 
        : 0;

      console.log(`🎁 Referral rewards issued for booking ${bookingId}`);

      return { success: true, rewardsIssued };
    } catch (error: any) {
      console.error('Error completing referral:', error.message);
      return { success: false, rewardsIssued: [] };
    }
  }

  /**
   * Get referral analytics for a provider
   */
  async getReferralAnalytics(providerId: string, dateRange?: {
    from: Date;
    to: Date;
  }): Promise<{
    overview: ReferralProgram['analytics'];
    topReferrers: Array<{
      userId: string;
      name: string;
      referrals: number;
      conversions: number;
      totalRewards: number;
    }>;
    recentActivity: Array<ReferralTracking>;
    monthlyTrends: Array<{
      month: string;
      referrals: number;
      conversions: number;
      rewards: number;
    }>;
  }> {
    try {
      const program = await this.getReferralProgram(providerId);
      
      if (!program) {
        throw new Error('Referral program not found');
      }

      // Mock analytics data - in production, these would be database queries
      const topReferrers = [
        {
          userId: 'user1',
          name: 'María González',
          referrals: 15,
          conversions: 12,
          totalRewards: 2400
        },
        {
          userId: 'user2',
          name: 'Carlos López',
          referrals: 10,
          conversions: 8,
          totalRewards: 1600
        }
      ];

      const recentActivity: ReferralTracking[] = [];

      const monthlyTrends = [
        { month: '2025-08', referrals: 25, conversions: 20, rewards: 4000 },
        { month: '2025-09', referrals: 32, conversions: 26, rewards: 5200 }
      ];

      return {
        overview: program.analytics,
        topReferrers,
        recentActivity,
        monthlyTrends
      };
    } catch (error: any) {
      console.error('Error getting referral analytics:', error.message);
      throw error;
    }
  }

  /**
   * Update referral program settings
   */
  async updateReferralProgram(
    providerId: string,
    updates: Partial<Pick<ReferralProgram, 'name' | 'description' | 'isActive' | 'settings'>>
  ): Promise<ReferralProgram> {
    const program = await this.getReferralProgram(providerId);
    
    if (!program) {
      throw new Error('Referral program not found');
    }

    // Update program
    Object.assign(program, updates, { updatedAt: new Date() });

    console.log(`📝 Updated referral program for provider ${providerId}`);
    
    return program;
  }

  // Private helper methods

  private generateReferralCode(referrerId: string): string {
    const prefix = referrerId.slice(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  }

  private async findReferralLinkByCode(code: string): Promise<ReferralLink | null> {
    // Mock implementation - in production, this would query the database
    // return await this.db.referralLink.findFirst({
    //   where: { referralCode: code, isActive: true }
    // });
    
    return {
      id: 'mock-link-id',
      providerId: 'provider-1',
      referrerId: 'user-1',
      referralCode: code,
      shareUrl: `https://barberpro.com.ar/ref/${code}`,
      clicks: 5,
      conversions: 1,
      totalReward: 200,
      isActive: true,
      createdAt: new Date()
    };
  }

  private async getReferralProgram(providerId: string): Promise<ReferralProgram | null> {
    // Mock implementation - in production, this would query the database
    return {
      id: 'program-1',
      providerId,
      name: 'Programa de Referencias',
      description: 'Gana dinero refiriendo clientes',
      isActive: true,
      referrerReward: {
        id: 'reward-1',
        type: 'FIXED_AMOUNT',
        value: 200,
        description: '200 ARS por referencia exitosa',
        isActive: true,
        currentUsage: 0,
        createdAt: new Date()
      },
      refereeReward: {
        id: 'reward-2',
        type: 'PERCENTAGE_DISCOUNT',
        value: 15,
        description: '15% descuento en primer servicio',
        isActive: true,
        currentUsage: 0,
        createdAt: new Date()
      },
      settings: {
        requireCompletedBooking: true,
        minimumReferrals: 1,
        trackingPeriodDays: 90,
        allowSelfReferral: false,
        maxRewardsPerUser: 10
      },
      analytics: {
        totalReferrals: 57,
        successfulReferrals: 46,
        totalRewardsPaid: 9200,
        conversionRate: 80.7
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async findTrackingByBooking(bookingId: string): Promise<ReferralTracking | null> {
    // Mock implementation
    return {
      id: 'tracking-1',
      referralLinkId: 'link-1',
      referrerId: 'user-1',
      refereeId: 'user-2',
      providerId: 'provider-1',
      bookingId,
      status: 'PENDING',
      createdAt: new Date()
    };
  }

  private async calculateRewards(program: ReferralProgram, bookingId: string): Promise<{
    referrerReward: number;
    refereeReward: number;
  }> {
    // Get booking details for reward calculation
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return { referrerReward: 0, refereeReward: 0 };
    }

    const bookingAmount = Number(booking.totalAmount);
    
    // Calculate referrer reward
    let referrerReward = 0;
    if (program.referrerReward.type === 'FIXED_AMOUNT') {
      referrerReward = program.referrerReward.value;
    } else if (program.referrerReward.type === 'PERCENTAGE_DISCOUNT') {
      referrerReward = bookingAmount * (program.referrerReward.value / 100);
      if (program.referrerReward.maximumDiscount) {
        referrerReward = Math.min(referrerReward, program.referrerReward.maximumDiscount);
      }
    }

    // Calculate referee reward
    let refereeReward = 0;
    if (program.refereeReward.type === 'FIXED_AMOUNT') {
      refereeReward = program.refereeReward.value;
    } else if (program.refereeReward.type === 'PERCENTAGE_DISCOUNT') {
      refereeReward = bookingAmount * (program.refereeReward.value / 100);
      if (program.refereeReward.maximumDiscount) {
        refereeReward = Math.min(refereeReward, program.refereeReward.maximumDiscount);
      }
    }

    return { referrerReward, refereeReward };
  }

  private async issueRewards(data: {
    referrerId: string;
    refereeId: string;
    referrerReward: number;
    refereeReward: number;
    program: ReferralProgram;
  }) {
    const rewardsIssued = [];

    // Issue referrer reward
    if (data.referrerReward > 0) {
      // In production, this would add credits to user account, create discount codes, etc.
      rewardsIssued.push({
        userId: data.referrerId,
        type: 'REFERRER' as const,
        reward: data.referrerReward,
        rewardType: data.program.referrerReward.type
      });
    }

    // Issue referee reward
    if (data.refereeReward > 0) {
      rewardsIssued.push({
        userId: data.refereeId,
        type: 'REFEREE' as const,
        reward: data.refereeReward,
        rewardType: data.program.refereeReward.type
      });
    }

    return rewardsIssued;
  }
}

export const referralSystem = new ReferralSystemService();