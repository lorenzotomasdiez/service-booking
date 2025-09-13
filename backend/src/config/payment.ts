/**
 * Payment Configuration for BarberPro Argentina
 * MercadoPago Integration with Argentina-specific settings
 */

export const paymentConfig = {
  // MercadoPago Configuration
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_ACCESS_TOKEN_TEST 
      : process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_PUBLIC_KEY_TEST 
      : process.env.MERCADOPAGO_PUBLIC_KEY,
    environment: process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox',
    timeout: parseInt(process.env.MERCADOPAGO_TIMEOUT || '15000'),
    integrationId: process.env.MERCADOPAGO_INTEGRATION_ID || 'barberpro-v1',
    baseUrl: process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com',
    webhookSecret: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST 
      : process.env.MERCADOPAGO_WEBHOOK_SECRET,
  },

  // Argentina Business Configuration
  business: {
    commissionStandard: parseFloat(process.env.PLATFORM_COMMISSION_STANDARD || '0.035'),
    commissionHighVolume: parseFloat(process.env.PLATFORM_COMMISSION_HIGH_VOLUME || '0.028'),
    commissionPremium: parseFloat(process.env.PLATFORM_COMMISSION_PREMIUM || '0.025'),
    payoutHoldDays: parseInt(process.env.PAYOUT_HOLD_DAYS || '10'),
    minimumPayoutAmount: parseInt(process.env.MINIMUM_PAYOUT_AMOUNT || '1000'),
  },

  // Payment Method Configuration
  paymentMethods: {
    installmentsMax: parseInt(process.env.PAYMENT_INSTALLMENTS_MAX || '12'),
    ticketExpiryDays: parseInt(process.env.PAYMENT_TICKET_EXPIRY_DAYS || '3'),
    retryAttempts: parseInt(process.env.PAYMENT_RETRY_ATTEMPTS || '3'),
    retryDelayMs: parseInt(process.env.PAYMENT_RETRY_DELAY_MS || '5000'),
  },

  // Argentina Tax Configuration
  tax: {
    ivaRate: parseFloat(process.env.TAX_IVA_RATE || '0.21'),
    withholdingEnabled: process.env.TAX_WITHHOLDING_ENABLED === 'true',
    afipIntegrationEnabled: process.env.AFIP_INTEGRATION_ENABLED === 'true',
    electronicInvoicePointOfSale: parseInt(process.env.ELECTRONIC_INVOICE_POINT_OF_SALE || '1'),
  },

  // Webhook Configuration
  webhooks: {
    signatureValidation: process.env.WEBHOOK_SIGNATURE_VALIDATION !== 'false',
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '5'),
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000'),
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.PAYMENT_DATA_ENCRYPTION_KEY,
    pciComplianceMode: process.env.PCI_COMPLIANCE_MODE === 'true',
    auditLogging: process.env.PAYMENT_AUDIT_LOGGING !== 'false',
  },

  // Argentina Secondary Payment Gateways
  secondaryGateways: {
    todopago: {
      enabled: process.env.TODOPAGO_ENABLED === 'true',
      merchantId: process.env.TODOPAGO_MERCHANT_ID,
      apiKey: process.env.TODOPAGO_API_KEY,
      environment: process.env.TODOPAGO_ENVIRONMENT || 'sandbox',
      timeout: parseInt(process.env.TODOPAGO_TIMEOUT || '10000'),
    },
    decidir: {
      enabled: process.env.DECIDIR_ENABLED === 'true',
      publicApiKey: process.env.DECIDIR_PUBLIC_API_KEY,
      privateApiKey: process.env.DECIDIR_PRIVATE_API_KEY,
      environment: process.env.DECIDIR_ENVIRONMENT || 'sandbox',
      timeout: parseInt(process.env.DECIDIR_TIMEOUT || '10000'),
    },
    payu: {
      enabled: process.env.PAYU_ENABLED === 'true',
      apiLogin: process.env.PAYU_API_LOGIN,
      apiKey: process.env.PAYU_API_KEY,
      merchantId: process.env.PAYU_MERCHANT_ID,
      accountId: process.env.PAYU_ACCOUNT_ID,
      environment: process.env.PAYU_ENVIRONMENT || 'sandbox',
      timeout: parseInt(process.env.PAYU_TIMEOUT || '10000'),
    },
  },

  // Argentina Specific Payment Methods
  argentinaPaymentMethods: {
    rapipago: {
      enabled: true,
      maxAmount: 50000,
      minAmount: 100,
      expiryHours: 72,
      networkFee: 0.015,
      supportedProvinces: ['BA', 'CABA', 'CF', 'CH', 'CT', 'ER', 'FM', 'JY', 'LP', 'LR', 'MZ', 'NQ', 'RN', 'SA', 'SE', 'SF', 'SJ', 'SL', 'SC', 'TF', 'TM', 'TU'],
    },
    pagofacil: {
      enabled: true,
      maxAmount: 50000,
      minAmount: 100,
      expiryHours: 72,
      networkFee: 0.015,
      supportedProvinces: ['BA', 'CABA', 'CF', 'CH', 'CT', 'ER', 'FM', 'JY', 'LP', 'LR', 'MZ', 'NQ', 'RN', 'SA', 'SE', 'SF', 'SJ', 'SL', 'SC', 'TF', 'TM', 'TU'],
    },
    cbuTransfer: {
      enabled: true,
      requiresCBUValidation: true,
      processingTimeHours: 24,
      maxAmount: 1000000,
      minAmount: 500,
      dailyLimit: 500000,
    },
    debin: {
      enabled: process.env.DEBIN_ENABLED === 'true',
      maxAmount: 999999.99,
      minAmount: 100,
      processingTimeMinutes: 5,
      requiresAlias: true,
    },
  },

  // Performance Optimization
  performance: {
    connectionPooling: {
      enabled: true,
      maxConnections: parseInt(process.env.PAYMENT_MAX_CONNECTIONS || '10'),
      timeout: parseInt(process.env.PAYMENT_CONNECTION_TIMEOUT || '5000'),
    },
    caching: {
      enabled: process.env.PAYMENT_CACHING_ENABLED !== 'false',
      ttl: parseInt(process.env.PAYMENT_CACHE_TTL || '300'),
      maxSize: parseInt(process.env.PAYMENT_CACHE_MAX_SIZE || '1000'),
    },
    retryPolicy: {
      maxRetries: parseInt(process.env.PAYMENT_RETRY_ATTEMPTS || '3'),
      backoffMultiplier: parseFloat(process.env.PAYMENT_BACKOFF_MULTIPLIER || '2'),
      maxBackoffMs: parseInt(process.env.PAYMENT_MAX_BACKOFF_MS || '30000'),
    },
  },

  // Load Balancing for High Volume
  loadBalancing: {
    enabled: process.env.PAYMENT_LOAD_BALANCING_ENABLED === 'true',
    strategy: process.env.PAYMENT_LB_STRATEGY || 'round_robin', // round_robin, least_connections, weighted
    healthCheckInterval: parseInt(process.env.PAYMENT_HEALTH_CHECK_INTERVAL || '60000'),
    failoverThreshold: parseInt(process.env.PAYMENT_FAILOVER_THRESHOLD || '3'),
  },

  // Development and Testing
  testing: {
    simulationEnabled: process.env.ENABLE_PAYMENT_SIMULATION === 'true',
    successRate: parseFloat(process.env.TEST_PAYMENT_SUCCESS_RATE || '0.95'),
    debugLogging: process.env.PAYMENT_DEBUG_LOGGING === 'true',
    mockGatewayEnabled: process.env.MOCK_PAYMENT_GATEWAY_ENABLED === 'true',
    testCardNumbers: {
      visa: '4507990000004905',
      mastercard: '5031755734530604',
      amex: '373141108955219',
    },
  },

  // Advanced Monitoring
  monitoring: {
    successRateThreshold: parseFloat(process.env.PAYMENT_SUCCESS_RATE_THRESHOLD || '0.95'),
    responseTimeThreshold: parseInt(process.env.PAYMENT_RESPONSE_TIME_THRESHOLD || '5000'),
    metricsEnabled: process.env.ENABLE_PAYMENT_METRICS !== 'false',
    alertEmail: process.env.PAYMENT_ALERT_EMAIL || 'admin@barberpro.com.ar',
    realTimeMonitoring: {
      enabled: process.env.PAYMENT_REALTIME_MONITORING_ENABLED === 'true',
      dashboardUrl: process.env.PAYMENT_DASHBOARD_URL,
      webhookUrl: process.env.PAYMENT_MONITORING_WEBHOOK_URL,
    },
    analytics: {
      enabled: process.env.PAYMENT_ANALYTICS_ENABLED !== 'false',
      retentionDays: parseInt(process.env.PAYMENT_ANALYTICS_RETENTION_DAYS || '365'),
      aggregationInterval: process.env.PAYMENT_ANALYTICS_INTERVAL || '1h',
    },
  },

  // PAY8-001: Day 8 Advanced Payment Features
  advancedFeatures: {
    // Advanced Subscription Billing
    subscriptionBilling: {
      enabled: process.env.ADVANCED_SUBSCRIPTION_BILLING_ENABLED === 'true',
      dynamicCommissionEnabled: process.env.DYNAMIC_COMMISSION_ENABLED !== 'false',
      loyaltyPointsEnabled: process.env.LOYALTY_POINTS_ENABLED !== 'false',
      prorationEnabled: process.env.SUBSCRIPTION_PRORATION_ENABLED !== 'false',
    },
    
    // Installment Optimization
    installmentOptimization: {
      enabled: process.env.INSTALLMENT_OPTIMIZATION_ENABLED !== 'false',
      argentinacultural: process.env.ARGENTINA_CULTURAL_INSTALLMENTS_ENABLED !== 'false',
      smartRecommendations: process.env.SMART_INSTALLMENT_RECOMMENDATIONS_ENABLED !== 'false',
      seasonalPromotions: process.env.SEASONAL_INSTALLMENT_PROMOTIONS_ENABLED !== 'false',
    },
    
    // Advanced Refund & Dispute Management
    refundDisputeSystem: {
      enabled: process.env.ADVANCED_REFUND_SYSTEM_ENABLED !== 'false',
      automaticEligibility: process.env.AUTOMATIC_REFUND_ELIGIBILITY_ENABLED !== 'false',
      disputeResolution: process.env.DISPUTE_RESOLUTION_ENABLED !== 'false',
      argentinaConsumerLaw: process.env.ARGENTINA_CONSUMER_LAW_COMPLIANCE_ENABLED !== 'false',
    },
    
    // Payment Intelligence & ML
    paymentIntelligence: {
      enabled: process.env.PAYMENT_INTELLIGENCE_ENABLED !== 'false',
      fraudDetectionML: process.env.ML_FRAUD_DETECTION_ENABLED !== 'false',
      behaviorAnalysis: process.env.PAYMENT_BEHAVIOR_ANALYSIS_ENABLED !== 'false',
      predictiveAnalytics: process.env.PREDICTIVE_PAYMENT_ANALYTICS_ENABLED !== 'false',
    },
    
    // Loyalty Points System
    loyaltyPoints: {
      earningRate: parseFloat(process.env.LOYALTY_POINTS_EARNING_RATE || '0.1'), // 10 points per ARS 100
      redemptionRate: parseFloat(process.env.LOYALTY_POINTS_REDEMPTION_RATE || '0.01'), // 1 point = ARS 0.01
      minimumRedemption: parseInt(process.env.LOYALTY_POINTS_MINIMUM_REDEMPTION || '1000'),
      maximumDiscount: parseFloat(process.env.LOYALTY_POINTS_MAXIMUM_DISCOUNT || '0.30'), // 30% max
      expiryDays: parseInt(process.env.LOYALTY_POINTS_EXPIRY_DAYS || '365'),
    },
  },

  // Argentina Market Optimizations
  argentinaOptimizations: {
    // Cultural Adaptations
    cultural: {
      enabled: process.env.ARGENTINA_CULTURAL_OPTIMIZATIONS_ENABLED !== 'false',
      spanishLocalization: process.env.SPANISH_LOCALIZATION_ENABLED !== 'false',
      familyOriented: process.env.FAMILY_ORIENTED_FEATURES_ENABLED !== 'false',
      seasonalAdjustments: process.env.SEASONAL_ADJUSTMENTS_ENABLED !== 'false',
    },
    
    // Economic Adaptations
    economic: {
      pesoStabilityProtection: process.env.PESO_STABILITY_PROTECTION_ENABLED !== 'false',
      inflationAdjustments: process.env.INFLATION_ADJUSTMENTS_ENABLED !== 'false',
      smartRounding: process.env.SMART_PESO_ROUNDING_ENABLED !== 'false',
      exchangeRateHedging: process.env.EXCHANGE_RATE_HEDGING_ENABLED !== 'false',
    },
    
    // Regional Preferences
    regional: {
      provincialAdaptations: process.env.PROVINCIAL_ADAPTATIONS_ENABLED !== 'false',
      bankNetworkOptimization: process.env.BANK_NETWORK_OPTIMIZATION_ENABLED !== 'false',
      cashPaymentNetworks: process.env.CASH_PAYMENT_NETWORKS_ENABLED !== 'false',
    },
  },

  // Psychology Vertical Payment Features
  psychologyVertical: {
    enabled: process.env.PSYCHOLOGY_PAYMENTS_ENABLED === 'true',
    
    // Obras Sociales Integration
    obrasSociales: {
      enabled: process.env.OBRAS_SOCIALES_INTEGRATION_ENABLED === 'true',
      apiTimeout: parseInt(process.env.OBRAS_SOCIALES_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.OBRAS_SOCIALES_RETRY_ATTEMPTS || '3'),
      cacheValidityMinutes: parseInt(process.env.OBRAS_SOCIALES_CACHE_VALIDITY || '60'),
    },
    
    // Confidential Billing
    confidentialBilling: {
      enabled: process.env.CONFIDENTIAL_BILLING_ENABLED === 'true',
      encryptionLevel: process.env.CONFIDENTIAL_BILLING_ENCRYPTION_LEVEL || 'AES-256',
      anonymousBillingCodes: process.env.ANONYMOUS_BILLING_CODES_ENABLED === 'true',
      discreteDescriptions: process.env.DISCRETE_BILLING_DESCRIPTIONS_ENABLED === 'true',
    },
    
    // Therapy Payment Plans
    therapyPaymentPlans: {
      enabled: process.env.THERAPY_PAYMENT_PLANS_ENABLED === 'true',
      weeklyPayments: process.env.WEEKLY_THERAPY_PAYMENTS_ENABLED === 'true',
      monthlyPackages: process.env.MONTHLY_THERAPY_PACKAGES_ENABLED === 'true',
      prepaidSessions: process.env.PREPAID_THERAPY_SESSIONS_ENABLED === 'true',
      slidingScale: process.env.SLIDING_SCALE_THERAPY_PRICING_ENABLED === 'true',
    },
  },

  // Fraud Prevention
  fraudPrevention: {
    enabled: process.env.FRAUD_PREVENTION_ENABLED === 'true',
    riskScoring: {
      enabled: true,
      thresholds: {
        low: 30,
        medium: 70,
        high: 90,
      },
    },
    velocityChecks: {
      enabled: true,
      maxTransactionsPerMinute: parseInt(process.env.MAX_TRANSACTIONS_PER_MINUTE || '10'),
      maxAmountPerHour: parseInt(process.env.MAX_AMOUNT_PER_HOUR || '50000'),
    },
    geoBlocking: {
      enabled: process.env.GEO_BLOCKING_ENABLED === 'true',
      allowedCountries: ['AR'],
      blockedCountries: process.env.BLOCKED_COUNTRIES?.split(',') || [],
    },
  },
};

// Validation
export function validatePaymentConfig(): void {
  const errors: string[] = [];

  if (!paymentConfig.mercadopago.accessToken) {
    errors.push('MERCADOPAGO_ACCESS_TOKEN is required');
  }

  if (!paymentConfig.mercadopago.publicKey) {
    errors.push('MERCADOPAGO_PUBLIC_KEY is required');
  }

  if (!paymentConfig.mercadopago.webhookSecret) {
    errors.push('MERCADOPAGO_WEBHOOK_SECRET is required');
  }

  if (!paymentConfig.security.encryptionKey) {
    errors.push('PAYMENT_DATA_ENCRYPTION_KEY is required');
  }

  if (paymentConfig.security.encryptionKey && paymentConfig.security.encryptionKey.length < 32) {
    errors.push('PAYMENT_DATA_ENCRYPTION_KEY must be at least 32 characters');
  }

  // Validate secondary gateways if enabled
  if (paymentConfig.secondaryGateways.todopago.enabled) {
    if (!paymentConfig.secondaryGateways.todopago.merchantId) {
      errors.push('TODOPAGO_MERCHANT_ID is required when TodoPago is enabled');
    }
    if (!paymentConfig.secondaryGateways.todopago.apiKey) {
      errors.push('TODOPAGO_API_KEY is required when TodoPago is enabled');
    }
  }

  if (paymentConfig.secondaryGateways.decidir.enabled) {
    if (!paymentConfig.secondaryGateways.decidir.publicApiKey) {
      errors.push('DECIDIR_PUBLIC_API_KEY is required when Decidir is enabled');
    }
    if (!paymentConfig.secondaryGateways.decidir.privateApiKey) {
      errors.push('DECIDIR_PRIVATE_API_KEY is required when Decidir is enabled');
    }
  }

  if (paymentConfig.secondaryGateways.payu.enabled) {
    if (!paymentConfig.secondaryGateways.payu.apiLogin) {
      errors.push('PAYU_API_LOGIN is required when PayU is enabled');
    }
    if (!paymentConfig.secondaryGateways.payu.apiKey) {
      errors.push('PAYU_API_KEY is required when PayU is enabled');
    }
    if (!paymentConfig.secondaryGateways.payu.merchantId) {
      errors.push('PAYU_MERCHANT_ID is required when PayU is enabled');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Payment configuration errors: ${errors.join(', ')}`);
  }
}

export default paymentConfig;