// Customer Experience Platform Types
// F11-001: Customer Experience Platform & Business Operations Interface

export interface CustomerOnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isRequired: boolean;
  order: number;
  estimatedMinutes: number;
  dependsOn?: string[];
}

export interface CustomerOnboardingProgress {
  userId: string;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  completionPercentage: number;
  startedAt: Date;
  lastActiveAt: Date;
  estimatedCompletionTime: number;
  personalizedRecommendations: string[];
}

export interface ProviderOnboardingData {
  businessInfo: {
    businessName: string;
    businessType: 'individual' | 'business';
    cuit?: string;
    address: string;
    phone: string;
    email: string;
    description: string;
  };
  verification: {
    identityDocument: File | null;
    businessLicense?: File | null;
    taxCertificate?: File | null;
    insuranceCertificate?: File | null;
    bankAccount: {
      cbu: string;
      alias: string;
      bankName: string;
    };
  };
  services: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
    workingHours: {
      [key: string]: {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
      };
    };
  };
  profile: {
    profileImage?: File | null;
    coverImage?: File | null;
    portfolio: File[];
    socialProof: {
      instagramUrl?: string;
      facebookUrl?: string;
      websiteUrl?: string;
      testimonials: string[];
    };
  };
}

export interface ClientAcquisitionMetrics {
  source: 'organic' | 'referral' | 'social' | 'advertising' | 'direct';
  conversionRate: number;
  acquisitionCost: number;
  lifetimeValue: number;
  firstBookingTime: number; // hours from signup
  socialProofViews: number;
  testimonialEngagement: number;
}

export interface CustomerSupportTicket {
  id: string;
  userId: string;
  type: 'technical' | 'billing' | 'booking' | 'general' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  tags: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionTime?: number; // minutes
  satisfactionScore?: number; // 1-5
  messages: CustomerSupportMessage[];
}

export interface CustomerSupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'support' | 'system';
  message: string;
  attachments: string[];
  isInternal: boolean;
  timestamp: Date;
}

export interface CustomerHealthScore {
  userId: string;
  score: number; // 0-100
  factors: {
    bookingFrequency: number;
    paymentHistory: number;
    supportInteractions: number;
    appUsage: number;
    socialEngagement: number;
  };
  risk: 'low' | 'medium' | 'high';
  recommendations: CustomerSuccessRecommendation[];
  lastCalculated: Date;
}

export interface CustomerSuccessRecommendation {
  id: string;
  type: 'retention' | 'upsell' | 'engagement' | 'support';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number; // 0-100
  automationType?: 'email' | 'push' | 'in_app' | 'sms';
  triggerConditions: Record<string, any>;
  expiresAt?: Date;
}

export interface CustomerFeedback {
  id: string;
  userId: string;
  type: 'nps' | 'csat' | 'review' | 'suggestion';
  score?: number;
  comment: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  actionTaken?: string;
  createdAt: Date;
  tags: string[];
}

export interface CustomerSegmentation {
  segmentId: string;
  name: string;
  description: string;
  criteria: {
    demographics?: Record<string, any>;
    behavior?: Record<string, any>;
    preferences?: Record<string, any>;
  };
  customerCount: number;
  averageLifetimeValue: number;
  churnRate: number;
  engagement: {
    bookingFrequency: number;
    appUsage: number;
    responseRate: number;
  };
}

export interface BusinessIntelligenceDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  lastUpdated: Date;
  permissions: {
    viewRoles: string[];
    editRoles: string[];
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'funnel';
  title: string;
  description: string;
  dataSource: string;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    timeRange: string;
    groupBy?: string;
    filters: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval: number;
}

export interface FinancialReportData {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  revenue: {
    total: number;
    breakdown: {
      bookings: number;
      subscriptions: number;
      commissions: number;
    };
    growth: {
      amount: number;
      percentage: number;
    };
  };
  costs: {
    operational: number;
    marketing: number;
    support: number;
    technology: number;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
  };
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value
  cac: number; // Customer Acquisition Cost
}

export interface OperationalEfficiencyMetrics {
  processingTimes: {
    bookingConfirmation: number;
    paymentProcessing: number;
    supportResponse: number;
    providerVerification: number;
  };
  errorRates: {
    bookingFailures: number;
    paymentFailures: number;
    systemErrors: number;
  };
  resourceUtilization: {
    serverCpu: number;
    serverMemory: number;
    database: number;
    bandwidth: number;
  };
  recommendations: OperationalRecommendation[];
}

export interface OperationalRecommendation {
  id: string;
  category: 'performance' | 'cost' | 'reliability' | 'scalability';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: {
    cost: number;
    performance: number;
    reliability: number;
  };
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface MarketPerformanceData {
  competitorAnalysis: {
    competitor: string;
    marketShare: number;
    pricing: {
      average: number;
      range: [number, number];
    };
    features: string[];
    strengths: string[];
    weaknesses: string[];
  }[];
  marketTrends: {
    demand: {
      current: number;
      projected: number;
      seasonality: Record<string, number>;
    };
    demographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      preferences: Record<string, number>;
    };
  };
  opportunities: MarketOpportunity[];
}

export interface MarketOpportunity {
  id: string;
  category: 'geographic' | 'demographic' | 'service' | 'pricing';
  title: string;
  description: string;
  potentialRevenue: number;
  investmentRequired: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeline: string;
  prerequisites: string[];
}

export interface ProviderPerformanceMetrics {
  providerId: string;
  businessName: string;
  metrics: {
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
    averageRating: number;
    responseTime: number; // minutes
    revenue: number;
    growth: {
      bookings: number;
      revenue: number;
    };
  };
  rankings: {
    category: string;
    rank: number;
    totalProviders: number;
    percentile: number;
  }[];
  recommendations: ProviderRecommendation[];
}

export interface ProviderRecommendation {
  id: string;
  type: 'optimization' | 'marketing' | 'service' | 'pricing';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface ExecutiveDashboardMetrics {
  kpis: {
    totalUsers: {
      value: number;
      growth: number;
      target: number;
    };
    monthlyRecurringRevenue: {
      value: number;
      growth: number;
      target: number;
    };
    customerSatisfaction: {
      value: number;
      growth: number;
      target: number;
    };
    marketPenetration: {
      value: number;
      growth: number;
      target: number;
    };
  };
  growthMetrics: {
    userAcquisition: number[];
    revenueGrowth: number[];
    marketExpansion: number[];
    churnRate: number[];
  };
  strategicInitiatives: StrategicInitiative[];
}

export interface StrategicInitiative {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress: number; // 0-100
  budget: {
    allocated: number;
    spent: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: {
      name: string;
      date: Date;
      completed: boolean;
    }[];
  };
  kpiImpact: {
    metric: string;
    expectedImpact: number;
    actualImpact?: number;
  }[];
  owner: string;
  stakeholders: string[];
}

// API Integration Types
export interface CustomerSuccessApiResponse {
  healthScore: CustomerHealthScore;
  recommendations: CustomerSuccessRecommendation[];
  interventions: CustomerSuccessIntervention[];
}

export interface CustomerSuccessIntervention {
  id: string;
  userId: string;
  type: 'automated' | 'manual';
  trigger: string;
  action: string;
  status: 'pending' | 'executed' | 'completed' | 'failed';
  results?: {
    engagement: boolean;
    conversion: boolean;
    satisfaction?: number;
  };
  executedAt?: Date;
  completedAt?: Date;
}

export interface BusinessPerformanceApiResponse {
  financial: FinancialReportData;
  operational: OperationalEfficiencyMetrics;
  market: MarketPerformanceData;
  providers: ProviderPerformanceMetrics[];
}

// Real-time Event Types
export interface CustomerExperienceSocketEvents {
  'support:ticket_created': {
    ticket: CustomerSupportTicket;
    priority: string;
  };
  
  'support:ticket_updated': {
    ticketId: string;
    status: string;
    assignedTo?: string;
  };
  
  'customer:health_score_changed': {
    userId: string;
    previousScore: number;
    newScore: number;
    risk: string;
  };
  
  'onboarding:step_completed': {
    userId: string;
    step: string;
    progress: number;
  };
  
  'analytics:real_time_update': {
    dashboard: string;
    widget: string;
    data: any;
  };
}

// Form Types
export interface OnboardingFormData {
  step: string;
  data: Record<string, any>;
  validation: {
    isValid: boolean;
    errors: Record<string, string[]>;
  };
}

export interface SupportTicketFormData {
  type: string;
  priority: string;
  title: string;
  description: string;
  attachments: File[];
}

export interface FeedbackFormData {
  type: 'nps' | 'csat' | 'review' | 'suggestion';
  score?: number;
  comment: string;
  category: string;
  allowContact: boolean;
}

// Argentina-specific types
export interface ArgentinaBusinessRegistration {
  cuit: string;
  businessType: 'monotributista' | 'responsable_inscripto' | 'exento';
  afipCategory: string;
  taxAddress: string;
  bankingInfo: {
    cbu: string;
    alias: string;
    bankCode: string;
    accountType: 'savings' | 'checking';
  };
}

export interface ArgentinaTaxCompliance {
  cuitStatus: 'active' | 'inactive' | 'suspended';
  monotributoCategory?: string;
  ivaCondition: string;
  lastDeclaration?: Date;
  taxObligations: {
    monotributo: boolean;
    iva: boolean;
    ganancias: boolean;
  };
}
