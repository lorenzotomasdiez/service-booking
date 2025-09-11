export interface CreatePromotionRequest {
  name: string;
  description?: string;
  code?: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'BUY_ONE_GET_ONE';
  discountValue: number;
  minimumAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  applicableToAllServices?: boolean;
  serviceIds?: string[];
  validFrom: string;
  validUntil: string;
  isNewClientOnly?: boolean;
  isBirthdayPromo?: boolean;
  isGroupBooking?: boolean;
  minGroupSize?: number;
}

export interface PromotionResponse {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  code?: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'BUY_ONE_GET_ONE';
  discountValue: number;
  minimumAmount?: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  applicableToAllServices: boolean;
  serviceIds: string[];
  validFrom: string;
  validUntil: string;
  isNewClientOnly: boolean;
  isBirthdayPromo: boolean;
  isGroupBooking: boolean;
  minGroupSize?: number;
  createdAt: string;
  updatedAt: string;
  provider: {
    businessName: string;
  };
  services?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface ValidatePromotionRequest {
  code?: string;
  promotionId?: string;
  userId: string;
  serviceIds: string[];
  totalAmount: number;
  isGroupBooking?: boolean;
  groupSize?: number;
}

export interface PromotionValidationResponse {
  valid: boolean;
  promotion?: PromotionResponse;
  discountAmount?: number;
  message?: string;
  errors?: string[];
}

export interface ApplyPromotionRequest {
  promotionId: string;
  userId: string;
  bookingId?: string;
  discountAmount: number;
}

export interface PromotionAnalytics {
  totalPromotions: number;
  activePromotions: number;
  totalUsages: number;
  totalDiscountGiven: number;
  averageDiscountPerBooking: number;
  topPromotions: Array<{
    id: string;
    name: string;
    usageCount: number;
    totalDiscount: number;
    conversionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    usages: number;
    discountAmount: number;
  }>;
}

export interface LoyaltyPointsResponse {
  id: string;
  userId: string;
  providerId: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  transactions: Array<{
    id: string;
    type: 'EARNED' | 'SPENT' | 'EXPIRED' | 'BONUS';
    points: number;
    description?: string;
    createdAt: string;
  }>;
}

export interface UpdateLoyaltyPointsRequest {
  type: 'EARNED' | 'SPENT' | 'BONUS';
  points: number;
  description?: string;
  bookingId?: string;
}