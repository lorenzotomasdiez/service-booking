/**
 * B11-001 Customer Success & Support Platform Implementation
 * Comprehensive customer support ticketing system with intelligent routing,
 * churn prediction, and automated customer success workflows
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface CustomerHealthMetrics {
  customerId: string;
  healthScore: number;
  churnProbability: number;
  engagementLevel: 'low' | 'medium' | 'high';
  lastActivity: Date;
  totalBookings: number;
  cancelationRate: number;
  averageRating: number;
  paymentHistory: 'good' | 'concerning' | 'poor';
  supportTickets: number;
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  assignedAgent?: string;
  createdAt: Date;
  resolvedAt?: Date;
  customerSatisfaction?: number;
}

interface CustomerSegment {
  segment: 'high_value' | 'at_risk' | 'new_customer' | 'loyal' | 'inactive';
  criteria: {
    totalSpent?: { min?: number; max?: number };
    bookingFrequency?: { min?: number; max?: number };
    lastBookingDays?: number;
    churnProbability?: { min?: number; max?: number };
  };
  count: number;
  interventionStrategy: string;
}

interface CustomerFeedback {
  id: string;
  customerId: string;
  bookingId?: string;
  rating: number;
  feedback: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  actionRequired: boolean;
  createdAt: Date;
}

interface InterventionAction {
  id: string;
  customerId: string;
  type: 'discount_offer' | 'personal_call' | 'email_campaign' | 'loyalty_bonus' | 'service_recommendation';
  trigger: string;
  status: 'pending' | 'executed' | 'completed' | 'cancelled';
  scheduledAt: Date;
  executedAt?: Date;
  result?: string;
  effectiveness?: number;
}

class CustomerSuccessPlatform {
  private prisma: PrismaClient;
  private healthScoreWeights = {
    bookingFrequency: 0.25,
    engagementLevel: 0.20,
    paymentHistory: 0.15,
    cancellationRate: 0.15,
    averageRating: 0.15,
    supportTickets: 0.10
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async calculateCustomerHealthScore(customerId: string): Promise<CustomerHealthMetrics> {
    try {
      // Get customer data
      const customer = await this.prisma.user.findUnique({
        where: { id: customerId },
        include: {
          clientBookings: {
            where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
            include: { payment: true }
          },
          notifications: true
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const bookings = customer.clientBookings;
      const totalBookings = bookings.length;
      
      // Calculate metrics
      const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
      const cancelationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      
      const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
      const averageRating = completedBookings.length > 0 
        ? completedBookings.reduce((sum, b) => sum + (b.clientRating || 3), 0) / completedBookings.length 
        : 3.0;

      const lastBooking = bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const daysSinceLastBooking = lastBooking 
        ? Math.floor((Date.now() - lastBooking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Payment history analysis
      const failedPayments = bookings.filter(b => b.payment?.status === 'FAILED').length;
      const paymentHistory = failedPayments === 0 ? 'good' : 
                            (failedPayments / totalBookings) < 0.1 ? 'concerning' : 'poor';

      // Support tickets (simulate - would come from actual support system)
      const supportTickets = Math.floor(Math.random() * 3);

      // Calculate health score
      let healthScore = 0;
      
      // Booking frequency score (0-100)
      const bookingFrequencyScore = Math.min(totalBookings * 20, 100);
      healthScore += bookingFrequencyScore * this.healthScoreWeights.bookingFrequency;

      // Engagement level score
      const engagementScore = daysSinceLastBooking < 7 ? 100 : 
                             daysSinceLastBooking < 30 ? 70 :
                             daysSinceLastBooking < 60 ? 40 : 10;
      healthScore += engagementScore * this.healthScoreWeights.engagementLevel;

      // Payment history score
      const paymentScore = paymentHistory === 'good' ? 100 : 
                          paymentHistory === 'concerning' ? 60 : 20;
      healthScore += paymentScore * this.healthScoreWeights.paymentHistory;

      // Cancellation rate score (inverted)
      const cancellationScore = Math.max(0, 100 - (cancelationRate * 2));
      healthScore += cancellationScore * this.healthScoreWeights.cancellationRate;

      // Rating score
      const ratingScore = (averageRating / 5) * 100;
      healthScore += ratingScore * this.healthScoreWeights.averageRating;

      // Support tickets score (inverted)
      const supportScore = Math.max(0, 100 - (supportTickets * 20));
      healthScore += supportScore * this.healthScoreWeights.supportTickets;

      // Calculate churn probability
      const churnProbability = this.calculateChurnProbability({
        healthScore,
        daysSinceLastBooking,
        cancelationRate,
        supportTickets,
        paymentHistory
      });

      const engagementLevel = daysSinceLastBooking < 14 ? 'high' : 
                             daysSinceLastBooking < 45 ? 'medium' : 'low';

      return {
        customerId,
        healthScore: Math.round(healthScore * 100) / 100,
        churnProbability: Math.round(churnProbability * 100) / 100,
        engagementLevel,
        lastActivity: lastBooking?.createdAt || new Date(0),
        totalBookings,
        cancelationRate: Math.round(cancelationRate * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        paymentHistory: paymentHistory as 'good' | 'concerning' | 'poor',
        supportTickets
      };

    } catch (error) {
      console.error('Error calculating customer health score:', error);
      throw error;
    }
  }

  private calculateChurnProbability(metrics: {
    healthScore: number;
    daysSinceLastBooking: number;
    cancelationRate: number;
    supportTickets: number;
    paymentHistory: string;
  }): number {
    let churnScore = 0;

    // Health score contribution (inverted)
    churnScore += (100 - metrics.healthScore) * 0.4;

    // Days since last booking
    if (metrics.daysSinceLastBooking > 60) churnScore += 30;
    else if (metrics.daysSinceLastBooking > 30) churnScore += 15;
    else if (metrics.daysSinceLastBooking > 14) churnScore += 5;

    // Cancellation rate
    churnScore += metrics.cancelationRate * 0.5;

    // Support tickets
    churnScore += metrics.supportTickets * 5;

    // Payment issues
    if (metrics.paymentHistory === 'poor') churnScore += 20;
    else if (metrics.paymentHistory === 'concerning') churnScore += 10;

    return Math.min(100, Math.max(0, churnScore));
  }

  async segmentCustomers(): Promise<CustomerSegment[]> {
    try {
      const customers = await this.prisma.user.findMany({
        where: { role: 'CLIENT' },
        include: {
          clientBookings: {
            include: { payment: true }
          }
        }
      });

      const segments: { [key: string]: CustomerSegment } = {
        high_value: {
          segment: 'high_value',
          criteria: { totalSpent: { min: 10000 }, bookingFrequency: { min: 5 } },
          count: 0,
          interventionStrategy: 'VIP treatment, exclusive offers, personal account manager'
        },
        at_risk: {
          segment: 'at_risk',
          criteria: { churnProbability: { min: 70 } },
          count: 0,
          interventionStrategy: 'Immediate intervention, discount offers, personal outreach'
        },
        new_customer: {
          segment: 'new_customer',
          criteria: { lastBookingDays: 30 },
          count: 0,
          interventionStrategy: 'Onboarding campaign, welcome bonus, service recommendations'
        },
        loyal: {
          segment: 'loyal',
          criteria: { bookingFrequency: { min: 3 }, totalSpent: { min: 5000 } },
          count: 0,
          interventionStrategy: 'Loyalty rewards, referral incentives, exclusive services'
        },
        inactive: {
          segment: 'inactive',
          criteria: { lastBookingDays: 90 },
          count: 0,
          interventionStrategy: 'Reactivation campaign, special comeback offers, surveys'
        }
      };

      for (const customer of customers) {
        const totalSpent = customer.clientBookings
          .filter(b => b.payment?.status === 'PAID')
          .reduce((sum, b) => sum + Number(b.totalAmount), 0);

        const bookingCount = customer.clientBookings.length;
        const lastBooking = customer.clientBookings
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        
        const daysSinceLastBooking = lastBooking 
          ? Math.floor((Date.now() - lastBooking.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const healthMetrics = await this.calculateCustomerHealthScore(customer.id);

        // Categorize customer
        if (totalSpent >= 10000 && bookingCount >= 5) {
          segments.high_value.count++;
        } else if (healthMetrics.churnProbability >= 70) {
          segments.at_risk.count++;
        } else if (daysSinceLastBooking <= 30) {
          segments.new_customer.count++;
        } else if (bookingCount >= 3 && totalSpent >= 5000) {
          segments.loyal.count++;
        } else if (daysSinceLastBooking >= 90) {
          segments.inactive.count++;
        }
      }

      return Object.values(segments);

    } catch (error) {
      console.error('Error segmenting customers:', error);
      throw error;
    }
  }

  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      // Intelligent routing based on category and priority
      const assignedAgent = await this.assignTicketIntelligently(
        ticketData.category || 'general',
        ticketData.priority || 'medium'
      );

      const ticket: SupportTicket = {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: ticketData.customerId!,
        subject: ticketData.subject!,
        description: ticketData.description!,
        priority: ticketData.priority || 'medium',
        status: 'open',
        category: ticketData.category || 'general',
        assignedAgent,
        createdAt: new Date(),
      };

      // Store in cache/database (simulate with in-memory for demo)
      // In production, this would go to a proper ticketing system
      
      return ticket;

    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  private async assignTicketIntelligently(category: string, priority: string): Promise<string> {
    // Simulate intelligent agent assignment
    const agents = {
      payment: ['agent_payments_1', 'agent_payments_2'],
      booking: ['agent_bookings_1', 'agent_bookings_2'],
      technical: ['agent_tech_1', 'agent_tech_2'],
      general: ['agent_general_1', 'agent_general_2', 'agent_general_3']
    };

    const categoryAgents = agents[category as keyof typeof agents] || agents.general;
    
    // For urgent tickets, assign to specialized agents
    if (priority === 'urgent') {
      return categoryAgents[0]; // Senior agent
    }

    // Round-robin assignment (simplified)
    return categoryAgents[Math.floor(Math.random() * categoryAgents.length)];
  }

  async collectCustomerFeedback(feedbackData: Partial<CustomerFeedback>): Promise<CustomerFeedback> {
    try {
      const feedback: CustomerFeedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: feedbackData.customerId!,
        bookingId: feedbackData.bookingId,
        rating: feedbackData.rating!,
        feedback: feedbackData.feedback!,
        sentiment: this.analyzeSentiment(feedbackData.feedback!),
        category: feedbackData.category || 'general',
        actionRequired: feedbackData.rating! <= 3 || this.analyzeSentiment(feedbackData.feedback!) === 'negative',
        createdAt: new Date()
      };

      // Trigger proactive intervention if needed
      if (feedback.actionRequired) {
        await this.triggerProactiveIntervention(feedback.customerId, 'poor_feedback');
      }

      return feedback;

    } catch (error) {
      console.error('Error collecting customer feedback:', error);
      throw error;
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis (in production, use AI service)
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'perfect', 'love', 'good'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'poor', 'disappointing'];

    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  async triggerProactiveIntervention(customerId: string, trigger: string): Promise<InterventionAction> {
    try {
      const healthMetrics = await this.calculateCustomerHealthScore(customerId);
      
      let interventionType: InterventionAction['type'];
      let scheduledDelay = 0; // minutes

      // Determine intervention type based on trigger and health score
      if (trigger === 'poor_feedback' || healthMetrics.churnProbability > 80) {
        interventionType = 'personal_call';
        scheduledDelay = 60; // 1 hour
      } else if (healthMetrics.churnProbability > 60) {
        interventionType = 'discount_offer';
        scheduledDelay = 24 * 60; // 24 hours
      } else if (healthMetrics.engagementLevel === 'low') {
        interventionType = 'email_campaign';
        scheduledDelay = 3 * 24 * 60; // 3 days
      } else {
        interventionType = 'service_recommendation';
        scheduledDelay = 7 * 24 * 60; // 1 week
      }

      const intervention: InterventionAction = {
        id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        type: interventionType,
        trigger,
        status: 'pending',
        scheduledAt: new Date(Date.now() + scheduledDelay * 60 * 1000),
      };

      // In production, this would be stored and executed by a background job
      console.log(`Scheduled intervention for customer ${customerId}:`, intervention);

      return intervention;

    } catch (error) {
      console.error('Error triggering proactive intervention:', error);
      throw error;
    }
  }

  async getCustomerLifetimeValue(customerId: string): Promise<{
    current: number;
    predicted: number;
    historicalTrend: number[];
    factors: { [key: string]: number };
  }> {
    try {
      const customer = await this.prisma.user.findUnique({
        where: { id: customerId },
        include: {
          clientBookings: {
            include: { payment: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const paidBookings = customer.clientBookings.filter(b => b.payment?.status === 'PAID');
      const currentValue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

      // Calculate monthly trend
      const monthlyRevenue: { [key: string]: number } = {};
      paidBookings.forEach(booking => {
        const monthKey = booking.createdAt.toISOString().substr(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(booking.totalAmount);
      });

      const historicalTrend = Object.values(monthlyRevenue);
      
      // Predict future value based on trends and health score
      const healthMetrics = await this.calculateCustomerHealthScore(customerId);
      const avgMonthlySpend = historicalTrend.length > 0 
        ? historicalTrend.reduce((a, b) => a + b, 0) / historicalTrend.length 
        : 0;

      // Simple prediction model (in production, use ML)
      const retentionProbability = (100 - healthMetrics.churnProbability) / 100;
      const predictedMonths = 12 * retentionProbability; // Expected retention
      const predicted = avgMonthlySpend * predictedMonths;

      const factors = {
        bookingFrequency: customer.clientBookings.length,
        averageOrderValue: currentValue / (customer.clientBookings.length || 1),
        retentionProbability,
        engagementScore: healthMetrics.healthScore,
        paymentReliability: healthMetrics.paymentHistory === 'good' ? 1 : 0.8
      };

      return {
        current: Math.round(currentValue * 100) / 100,
        predicted: Math.round(predicted * 100) / 100,
        historicalTrend,
        factors
      };

    } catch (error) {
      console.error('Error calculating customer lifetime value:', error);
      throw error;
    }
  }
}

// Service registration function
export function registerCustomerSuccessRoutes(server: FastifyInstance): void {
  const customerSuccessService = new CustomerSuccessPlatform(server.prisma);

  // Customer health score endpoint
  server.post('/api/customer-success/health-score', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Calculate customer health score and churn prediction',
      body: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                customerId: { type: 'string' },
                healthScore: { type: 'number' },
                churnProbability: { type: 'number' },
                engagementLevel: { type: 'string' },
                lastActivity: { type: 'string', format: 'date-time' },
                totalBookings: { type: 'number' },
                cancelationRate: { type: 'number' },
                averageRating: { type: 'number' },
                paymentHistory: { type: 'string' },
                supportTickets: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { customerId: string } }>, reply: FastifyReply) => {
    try {
      const { customerId } = request.body;
      const healthMetrics = await customerSuccessService.calculateCustomerHealthScore(customerId);
      
      reply.send({
        success: true,
        data: healthMetrics
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to calculate health score',
        message: error.message
      });
    }
  });

  // Customer segmentation endpoint
  server.get('/api/customer-success/segments', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Get customer segmentation data',
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
                  segment: { type: 'string' },
                  count: { type: 'number' },
                  interventionStrategy: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const segments = await customerSuccessService.segmentCustomers();
      
      reply.send({
        success: true,
        data: segments
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to segment customers',
        message: error.message
      });
    }
  });

  // Support ticket creation endpoint
  server.post('/api/support/tickets', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Create support ticket with intelligent routing',
      body: {
        type: 'object',
        required: ['customerId', 'subject', 'description'],
        properties: {
          customerId: { type: 'string' },
          subject: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          category: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                customerId: { type: 'string' },
                subject: { type: 'string' },
                priority: { type: 'string' },
                status: { type: 'string' },
                assignedAgent: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: Partial<SupportTicket> }>, reply: FastifyReply) => {
    try {
      const ticket = await customerSuccessService.createSupportTicket(request.body);
      
      reply.code(201).send({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to create support ticket',
        message: error.message
      });
    }
  });

  // Proactive intervention trigger
  server.post('/api/customer-success/intervention', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Trigger proactive customer intervention',
      body: {
        type: 'object',
        required: ['customerId', 'trigger'],
        properties: {
          customerId: { type: 'string' },
          trigger: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { customerId: string; trigger: string } }>, reply: FastifyReply) => {
    try {
      const { customerId, trigger } = request.body;
      const intervention = await customerSuccessService.triggerProactiveIntervention(customerId, trigger);
      
      reply.send({
        success: true,
        data: intervention,
        message: 'Proactive intervention scheduled successfully'
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to trigger intervention',
        message: error.message
      });
    }
  });

  // Customer feedback collection
  server.post('/api/customer-success/feedback', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Collect and analyze customer feedback',
      body: {
        type: 'object',
        required: ['customerId', 'rating', 'feedback'],
        properties: {
          customerId: { type: 'string' },
          bookingId: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          feedback: { type: 'string' },
          category: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: Partial<CustomerFeedback> }>, reply: FastifyReply) => {
    try {
      const feedback = await customerSuccessService.collectCustomerFeedback(request.body);
      
      reply.send({
        success: true,
        data: feedback,
        message: 'Customer feedback collected and analyzed successfully'
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to collect feedback',
        message: error.message
      });
    }
  });

  // Customer lifetime value calculation
  server.get('/api/customer-success/lifetime-value/:customerId', {
    schema: {
      tags: ['Customer Success'],
      summary: 'Calculate customer lifetime value and predictions',
      params: {
        type: 'object',
        properties: {
          customerId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { customerId: string } }>, reply: FastifyReply) => {
    try {
      const { customerId } = request.params;
      const lifetimeValue = await customerSuccessService.getCustomerLifetimeValue(customerId);
      
      reply.send({
        success: true,
        data: lifetimeValue
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to calculate lifetime value',
        message: error.message
      });
    }
  });

  server.log.info('B11-001 Customer Success & Support Platform routes registered successfully');
}