export interface ProviderAnalyticsResponse {
  providerId: string;
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    totalRevenue: number;
    netRevenue: number;
    platformFee: number;
    newClients: number;
    returningClients: number;
    averageRating: number;
    utilizationRate: number;
  };
  dailyMetrics: Array<{
    date: string;
    bookings: number;
    revenue: number;
    clients: number;
    utilizationRate: number;
  }>;
  servicePerformance: Array<{
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    averageRating: number;
    popularity: number; // percentage
  }>;
  clientInsights: {
    topClients: Array<{
      clientId: string;
      clientName: string;
      totalBookings: number;
      totalSpent: number;
      lastBooking: string;
    }>;
    clientRetentionRate: number;
    averageBookingsPerClient: number;
  };
  timeAnalysis: {
    busyHours: Array<{
      hour: number;
      bookingCount: number;
      revenuePercentage: number;
    }>;
    busyDays: Array<{
      dayOfWeek: string;
      bookingCount: number;
      averageRevenue: number;
    }>;
  };
  recommendations: Array<{
    type: 'SERVICE_OPTIMIZATION' | 'PRICING' | 'SCHEDULING' | 'MARKETING';
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    actionRequired: boolean;
  }>;
}

export interface EarningsReportResponse {
  providerId: string;
  period: {
    from: string;
    to: string;
  };
  totalEarnings: number;
  netEarnings: number;
  platformFee: number;
  platformFeePercentage: number;
  payoutStatus: {
    pending: number;
    paid: number;
    scheduled: number;
  };
  breakdown: {
    byService: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      bookings: number;
      averagePrice: number;
    }>;
    byPaymentMethod: Array<{
      method: string;
      amount: number;
      percentage: number;
    }>;
    byDate: Array<{
      date: string;
      gross: number;
      net: number;
      platformFee: number;
    }>;
  };
  trends: {
    revenueGrowth: number; // percentage
    bookingGrowth: number;
    averageBookingValue: number;
    previousPeriodComparison: {
      revenue: number;
      bookings: number;
      clients: number;
    };
  };
}

export interface ClientManagementResponse {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    totalBookings: number;
    totalSpent: number;
    lastBooking?: string;
    averageRating?: number;
    loyaltyPoints?: number;
    tags: string[];
    notes: Array<{
      id: string;
      content: string;
      createdAt: string;
      isPrivate: boolean;
      tags: string[];
    }>;
    bookingHistory: Array<{
      id: string;
      serviceName: string;
      date: string;
      status: string;
      amount: number;
      rating?: number;
    }>;
    preferences: {
      preferredServices: string[];
      preferredTimes: string[];
      communicationMethod: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PHONE';
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateClientNoteRequest {
  clientId: string;
  content: string;
  isPrivate?: boolean;
  tags?: string[];
}

export interface ClientNoteResponse {
  id: string;
  providerId: string;
  clientId: string;
  content: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    email: string;
  };
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    peakRequestsPerSecond: number;
  };
  errorRates: {
    overall: number;
    by4xx: number;
    by5xx: number;
  };
  databasePerformance: {
    averageQueryTime: number;
    slowQueries: Array<{
      query: string;
      averageTime: number;
      count: number;
    }>;
  };
  cacheHitRates: {
    redis: number;
    application: number;
  };
}

export interface BusinessInsights {
  marketTrends: {
    peakBookingTimes: Array<{
      timeSlot: string;
      demand: number;
      suggestedPricing: number;
    }>;
    seasonalPatterns: Array<{
      month: string;
      bookingVolume: number;
      averageRevenue: number;
    }>;
    competitiveAnalysis: {
      averageServicePrice: number;
      suggestedPriceRange: {
        min: number;
        max: number;
      };
    };
  };
  clientBehavior: {
    averageBookingWindow: number; // days in advance
    cancellationRate: number;
    rebookingRate: number;
    preferredBookingChannels: Array<{
      channel: string;
      percentage: number;
    }>;
  };
  revenueOptimization: {
    underutilizedTimeSlots: Array<{
      timeSlot: string;
      currentUtilization: number;
      potentialRevenue: number;
    }>;
    highValueServices: Array<{
      serviceId: string;
      serviceName: string;
      profitMargin: number;
      demandScore: number;
    }>;
  };
}