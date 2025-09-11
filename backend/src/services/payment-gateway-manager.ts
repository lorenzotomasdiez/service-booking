/**
 * Payment Gateway Manager for BarberPro Argentina
 * Multi-gateway support with load balancing and failover
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import MercadoPagoPaymentService from './payment';
import TodoPagoPaymentService from './gateways/todopago';
import DecidirPaymentService from './gateways/decidir';
import PayUPaymentService from './gateways/payu';
import paymentConfig from '../config/payment';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentGateway,
  PaymentProcessingResult,
  PaymentError,
  PaymentGatewayError,
  PaymentValidationError,
} from '../types/payment';

export type PaymentGatewayType = 'mercadopago' | 'todopago' | 'decidir' | 'payu';

export interface GatewayHealth {
  gateway: PaymentGatewayType;
  healthy: boolean;
  responseTime: number;
  successRate: number;
  lastChecked: Date;
  consecutiveFailures: number;
}

export interface GatewayMetrics {
  gateway: PaymentGatewayType;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date;
}

export class PaymentGatewayManager {
  private prisma: PrismaClient;
  private gateways: Map<PaymentGatewayType, PaymentGateway>;
  private gatewayHealth: Map<PaymentGatewayType, GatewayHealth>;
  private gatewayMetrics: Map<PaymentGatewayType, GatewayMetrics>;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.gateways = new Map();
    this.gatewayHealth = new Map();
    this.gatewayMetrics = new Map();
    
    this.initializeGateways();
    this.startHealthChecking();
  }

  /**
   * Initialize all configured payment gateways
   */
  private initializeGateways(): void {
    // Always initialize MercadoPago as primary
    this.gateways.set('mercadopago', new MercadoPagoPaymentService(this.prisma));
    this.initializeGatewayHealth('mercadopago');
    this.initializeGatewayMetrics('mercadopago');

    // Initialize secondary gateways if enabled
    if (paymentConfig.secondaryGateways.todopago.enabled) {
      this.gateways.set('todopago', new TodoPagoPaymentService(this.prisma));
      this.initializeGatewayHealth('todopago');
      this.initializeGatewayMetrics('todopago');
    }

    if (paymentConfig.secondaryGateways.decidir.enabled) {
      this.gateways.set('decidir', new DecidirPaymentService(this.prisma));
      this.initializeGatewayHealth('decidir');
      this.initializeGatewayMetrics('decidir');
    }

    if (paymentConfig.secondaryGateways.payu.enabled) {
      this.gateways.set('payu', new PayUPaymentService(this.prisma));
      this.initializeGatewayHealth('payu');
      this.initializeGatewayMetrics('payu');
    }

    console.log(`🎯 Initialized ${this.gateways.size} payment gateways:`, Array.from(this.gateways.keys()));
  }

  /**
   * Initialize health tracking for a gateway
   */
  private initializeGatewayHealth(gateway: PaymentGatewayType): void {
    this.gatewayHealth.set(gateway, {
      gateway,
      healthy: true,
      responseTime: 0,
      successRate: 100,
      lastChecked: new Date(),
      consecutiveFailures: 0,
    });
  }

  /**
   * Initialize metrics tracking for a gateway
   */
  private initializeGatewayMetrics(gateway: PaymentGatewayType): void {
    this.gatewayMetrics.set(gateway, {
      gateway,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(),
    });
  }

  /**
   * Create payment with automatic gateway selection and failover
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const gateways = this.selectOptimalGateways(request);
    let lastError: Error | null = null;

    for (const gatewayType of gateways) {
      try {
        const gateway = this.gateways.get(gatewayType);
        if (!gateway) continue;

        console.log(`💳 Attempting payment creation with ${gatewayType}`);
        const startTime = Date.now();
        
        const response = await gateway.createPayment({
          ...request,
          metadata: {
            ...request.metadata,
            selectedGateway: gatewayType,
            attemptedGateways: gateways,
          },
        });

        const duration = Date.now() - startTime;
        this.updateGatewayMetrics(gatewayType, true, duration);
        this.updateGatewayHealth(gatewayType, true, duration);

        console.log(`✅ Payment created successfully with ${gatewayType} (${duration}ms)`);
        return response;

      } catch (error: any) {
        lastError = error;
        const duration = Date.now() - Date.now();
        this.updateGatewayMetrics(gatewayType, false, duration);
        this.updateGatewayHealth(gatewayType, false, duration);

        console.warn(`❌ Payment creation failed with ${gatewayType}:`, error.message);

        // If this is a validation error, don't try other gateways
        if (error instanceof PaymentValidationError) {
          throw error;
        }

        // Continue to next gateway for gateway-specific errors
        continue;
      }
    }

    // All gateways failed
    throw new PaymentGatewayError(
      `Payment creation failed on all available gateways. Last error: ${lastError?.message}`,
      { attemptedGateways: gateways, lastError }
    );
  }

  /**
   * Get payment status from the original gateway
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    // Get payment record to determine which gateway was used
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new PaymentValidationError('Payment not found');
    }

    const gatewayType = this.determineGatewayFromPayment(payment);
    const gateway = this.gateways.get(gatewayType);

    if (!gateway) {
      throw new PaymentGatewayError(`Gateway ${gatewayType} not available`);
    }

    const startTime = Date.now();
    try {
      const response = await gateway.getPayment(paymentId);
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, true, duration);
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, false, duration);
      throw error;
    }
  }

  /**
   * Process refund using the original gateway
   */
  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new PaymentValidationError('Payment not found');
    }

    const gatewayType = this.determineGatewayFromPayment(payment);
    const gateway = this.gateways.get(gatewayType);

    if (!gateway) {
      throw new PaymentGatewayError(`Gateway ${gatewayType} not available for refund`);
    }

    const startTime = Date.now();
    try {
      const response = await gateway.processRefund(paymentId, amount, reason);
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, true, duration);
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, false, duration);
      throw error;
    }
  }

  /**
   * Process webhook from any gateway
   */
  async processWebhook(payload: any, gatewayType?: PaymentGatewayType): Promise<PaymentProcessingResult> {
    // If gateway type is not specified, try to determine from payload
    if (!gatewayType) {
      gatewayType = this.determineGatewayFromWebhook(payload);
    }

    const gateway = this.gateways.get(gatewayType);
    if (!gateway) {
      throw new PaymentGatewayError(`Gateway ${gatewayType} not available for webhook processing`);
    }

    const startTime = Date.now();
    try {
      const result = await gateway.processWebhook(payload);
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, result.success, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.updateGatewayMetrics(gatewayType, false, duration);
      throw error;
    }
  }

  /**
   * Select optimal gateways based on request and health status
   */
  private selectOptimalGateways(request: PaymentRequest): PaymentGatewayType[] {
    const availableGateways: PaymentGatewayType[] = [];

    // Check which gateways support the payment requirements
    for (const [gatewayType, gateway] of this.gateways) {
      const health = this.gatewayHealth.get(gatewayType);
      
      // Skip unhealthy gateways unless it's the only option
      if (health && !health.healthy && this.gateways.size > 1) {
        continue;
      }

      // Check if gateway supports the payment method/amount
      if (this.gatewaySupportsRequest(gatewayType, request)) {
        availableGateways.push(gatewayType);
      }
    }

    // Sort gateways by preference and performance
    return this.sortGatewaysByPreference(availableGateways);
  }

  /**
   * Check if gateway supports the payment request requirements
   */
  private gatewaySupportsRequest(gatewayType: PaymentGatewayType, request: PaymentRequest): boolean {
    // Basic amount validation
    if (request.amount < 100) return false; // Minimum amount for all gateways

    // Gateway-specific validations
    switch (gatewayType) {
      case 'mercadopago':
        return request.amount <= 999999.99; // MercadoPago max amount
      
      case 'todopago':
        return request.amount <= 500000 && !request.installments; // TodoPago limitations
      
      case 'decidir':
        return request.amount <= 999999.99;
      
      case 'payu':
        return request.amount <= 300000; // PayU has lower limits for Argentina
      
      default:
        return false;
    }
  }

  /**
   * Sort gateways by preference, health, and performance
   */
  private sortGatewaysByPreference(gateways: PaymentGatewayType[]): PaymentGatewayType[] {
    return gateways.sort((a, b) => {
      const healthA = this.gatewayHealth.get(a);
      const healthB = this.gatewayHealth.get(b);
      
      // Primary sort: health status
      if (healthA?.healthy !== healthB?.healthy) {
        return healthB?.healthy ? 1 : -1;
      }

      // Secondary sort: success rate
      const successRateA = healthA?.successRate || 0;
      const successRateB = healthB?.successRate || 0;
      if (successRateA !== successRateB) {
        return successRateB - successRateA;
      }

      // Tertiary sort: response time (lower is better)
      const responseTimeA = healthA?.responseTime || Infinity;
      const responseTimeB = healthB?.responseTime || Infinity;
      if (responseTimeA !== responseTimeB) {
        return responseTimeA - responseTimeB;
      }

      // Final sort: gateway preference (MercadoPago first)
      const preference = ['mercadopago', 'decidir', 'todopago', 'payu'];
      return preference.indexOf(a) - preference.indexOf(b);
    });
  }

  /**
   * Determine gateway type from payment record
   */
  private determineGatewayFromPayment(payment: any): PaymentGatewayType {
    // Check payment method or metadata
    if (payment.paymentMethod === 'mercadopago' || payment.metadata?.selectedGateway === 'mercadopago') {
      return 'mercadopago';
    }
    
    if (payment.paymentMethod === 'todopago' || payment.metadata?.selectedGateway === 'todopago') {
      return 'todopago';
    }
    
    if (payment.paymentMethod === 'decidir' || payment.metadata?.selectedGateway === 'decidir') {
      return 'decidir';
    }
    
    if (payment.paymentMethod === 'payu' || payment.metadata?.selectedGateway === 'payu') {
      return 'payu';
    }

    // Default to MercadoPago for backwards compatibility
    return 'mercadopago';
  }

  /**
   * Determine gateway type from webhook payload
   */
  private determineGatewayFromWebhook(payload: any): PaymentGatewayType {
    // MercadoPago webhooks have specific structure
    if (payload.type && payload.data && payload.application_id) {
      return 'mercadopago';
    }

    // TodoPago webhooks
    if (payload.merchant && payload.operation) {
      return 'todopago';
    }

    // Decidir webhooks
    if (payload.site_transaction_id && payload.payment_method_id) {
      return 'decidir';
    }

    // PayU webhooks
    if (payload.reference_sale && payload.state_pol) {
      return 'payu';
    }

    // Default fallback
    return 'mercadopago';
  }

  /**
   * Update gateway metrics
   */
  private updateGatewayMetrics(gateway: PaymentGatewayType, success: boolean, duration: number): void {
    const metrics = this.gatewayMetrics.get(gateway);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.lastRequestTime = new Date();

    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update average response time using exponential moving average
    const alpha = 0.2; // Smoothing factor
    metrics.averageResponseTime = metrics.averageResponseTime === 0 
      ? duration 
      : (alpha * duration) + ((1 - alpha) * metrics.averageResponseTime);
  }

  /**
   * Update gateway health status
   */
  private updateGatewayHealth(gateway: PaymentGatewayType, success: boolean, responseTime: number): void {
    const health = this.gatewayHealth.get(gateway);
    if (!health) return;

    health.lastChecked = new Date();
    health.responseTime = responseTime;

    if (success) {
      health.consecutiveFailures = 0;
      health.healthy = true;
    } else {
      health.consecutiveFailures++;
      
      // Mark as unhealthy if we exceed the threshold
      if (health.consecutiveFailures >= paymentConfig.loadBalancing.failoverThreshold) {
        health.healthy = false;
      }
    }

    // Update success rate (last 100 requests)
    const metrics = this.gatewayMetrics.get(gateway);
    if (metrics && metrics.totalRequests > 0) {
      health.successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    if (!paymentConfig.loadBalancing.enabled) return;

    const interval = paymentConfig.loadBalancing.healthCheckInterval;
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, interval);

    console.log(`🏥 Started payment gateway health checking (${interval}ms interval)`);
  }

  /**
   * Perform health checks on all gateways
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.gateways.keys()).map(async (gatewayType) => {
      try {
        const startTime = Date.now();
        await this.pingGateway(gatewayType);
        const duration = Date.now() - startTime;
        
        this.updateGatewayHealth(gatewayType, true, duration);
      } catch (error) {
        this.updateGatewayHealth(gatewayType, false, 0);
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Ping a gateway to check its health
   */
  private async pingGateway(gatewayType: PaymentGatewayType): Promise<void> {
    // For now, we'll simulate a health check
    // In a real implementation, this would make a lightweight API call to each gateway
    
    const health = this.gatewayHealth.get(gatewayType);
    if (!health) return;

    // Simulate random failures for testing
    if (paymentConfig.testing.simulationEnabled) {
      const randomFailure = Math.random() > paymentConfig.testing.successRate;
      if (randomFailure) {
        throw new Error(`Simulated health check failure for ${gatewayType}`);
      }
    }

    // Gateway is healthy
    return Promise.resolve();
  }

  /**
   * Get gateway health status
   */
  getGatewayHealth(): GatewayHealth[] {
    return Array.from(this.gatewayHealth.values());
  }

  /**
   * Get gateway metrics
   */
  getGatewayMetrics(): GatewayMetrics[] {
    return Array.from(this.gatewayMetrics.values());
  }

  /**
   * Get gateway status summary
   */
  getGatewayStatus(): {
    totalGateways: number;
    healthyGateways: number;
    unhealthyGateways: number;
    averageResponseTime: number;
    totalRequests: number;
    overallSuccessRate: number;
  } {
    const health = Array.from(this.gatewayHealth.values());
    const metrics = Array.from(this.gatewayMetrics.values());

    const healthyCount = health.filter(h => h.healthy).length;
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const successfulRequests = metrics.reduce((sum, m) => sum + m.successfulRequests, 0);
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;

    return {
      totalGateways: this.gateways.size,
      healthyGateways: healthyCount,
      unhealthyGateways: this.gateways.size - healthyCount,
      averageResponseTime: Math.round(avgResponseTime),
      totalRequests,
      overallSuccessRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('🛑 Payment gateway manager destroyed');
  }
}

export default PaymentGatewayManager;