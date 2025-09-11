export interface CreateReferralCodeRequest {
  code?: string; // Optional - will generate if not provided
  referrerReward: number;
  refereeDiscount: number;
  rewardType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  maxUses?: number;
  expiresAt?: string;
}

export interface ReferralCodeResponse {
  id: string;
  code: string;
  providerId: string;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  referrerReward: number;
  refereeDiscount: number;
  rewardType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  provider: {
    businessName: string;
    user: {
      name: string;
    };
  };
}

export interface ProcessReferralRequest {
  referralCode: string;
  refereeId: string;
  bookingId?: string;
}

export interface ReferralResponse {
  id: string;
  codeId: string;
  referrerId: string;
  refereeId: string;
  bookingId?: string;
  status: 'PENDING' | 'COMPLETED' | 'PAID' | 'EXPIRED';
  rewardAmount?: number;
  discountAmount?: number;
  rewardPaidAt?: string;
  createdAt: string;
  code: {
    code: string;
    provider: {
      businessName: string;
    };
  };
  referrer: {
    name: string;
    email: string;
  };
  referee: {
    name: string;
    email: string;
  };
}

export interface ReferralAnalytics {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  totalDiscounts: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    userName: string;
    referralCount: number;
    totalRewards: number;
  }>;
}

export interface ShareReferralRequest {
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'sms' | 'email';
  customMessage?: string;
}