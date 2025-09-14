// Customer Success Service
// F11-001: Customer Experience Platform - Customer Success & Support Interface

import type {
  CustomerHealthScore,
  CustomerSuccessRecommendation,
  CustomerSuccessIntervention,
  CustomerSupportTicket,
  CustomerSupportMessage,
  CustomerSegmentation,
  CustomerFeedback,
  SupportTicketFormData,
  FeedbackFormData
} from '../types/customer-experience';

const API_BASE = '/api/customer-success';

class CustomerSuccessService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Customer Health Score Management
  async getCustomerHealthScore(userId: string): Promise<CustomerHealthScore> {
    const cacheKey = `health-score-${userId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/health-score/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer health score');
      }

      const healthScore = await response.json();
      this.setCached(cacheKey, healthScore);
      return healthScore;
    } catch (error) {
      console.error('Error fetching customer health score:', error);
      throw error;
    }
  }

  async updateCustomerHealthScore(userId: string): Promise<CustomerHealthScore> {
    try {
      const response = await fetch(`${API_BASE}/health-score/${userId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update customer health score');
      }

      const healthScore = await response.json();
      this.setCached(`health-score-${userId}`, healthScore);
      return healthScore;
    } catch (error) {
      console.error('Error updating customer health score:', error);
      throw error;
    }
  }

  async getCustomerRecommendations(userId: string): Promise<CustomerSuccessRecommendation[]> {
    const cacheKey = `recommendations-${userId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/recommendations/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer recommendations');
      }

      const recommendations = await response.json();
      this.setCached(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error fetching customer recommendations:', error);
      throw error;
    }
  }

  async executeIntervention(userId: string, interventionId: string): Promise<CustomerSuccessIntervention> {
    try {
      const response = await fetch(`${API_BASE}/intervention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId,
          interventionId,
          executedBy: 'system'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute customer intervention');
      }

      const intervention = await response.json();
      
      // Invalidate related cache
      this.invalidateCache(`health-score-${userId}`);
      this.invalidateCache(`recommendations-${userId}`);
      
      return intervention;
    } catch (error) {
      console.error('Error executing customer intervention:', error);
      throw error;
    }
  }

  // Support Ticket Management
  async createSupportTicket(ticketData: SupportTicketFormData): Promise<CustomerSupportTicket> {
    try {
      const formData = new FormData();
      formData.append('type', ticketData.type);
      formData.append('priority', ticketData.priority);
      formData.append('title', ticketData.title);
      formData.append('description', ticketData.description);
      
      ticketData.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      const ticket = await response.json();
      
      // Invalidate tickets cache
      this.invalidateCache('support-tickets');
      
      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async getSupportTickets(userId?: string): Promise<CustomerSupportTicket[]> {
    const cacheKey = `support-tickets${userId ? `-${userId}` : ''}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = userId 
        ? `/api/support/tickets?userId=${userId}`
        : '/api/support/tickets';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      const tickets = await response.json();
      this.setCached(cacheKey, tickets);
      return tickets;
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw error;
    }
  }

  async updateSupportTicket(ticketId: string, updates: Partial<CustomerSupportTicket>): Promise<CustomerSupportTicket> {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update support ticket');
      }

      const ticket = await response.json();
      
      // Invalidate tickets cache
      this.invalidateCache('support-tickets');
      
      return ticket;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  async addTicketMessage(ticketId: string, message: string, attachments: File[] = []): Promise<CustomerSupportMessage> {
    try {
      const formData = new FormData();
      formData.append('message', message);
      
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to add ticket message');
      }

      const ticketMessage = await response.json();
      
      // Invalidate tickets cache
      this.invalidateCache('support-tickets');
      
      return ticketMessage;
    } catch (error) {
      console.error('Error adding ticket message:', error);
      throw error;
    }
  }

  // Customer Feedback Management
  async submitFeedback(feedbackData: FeedbackFormData): Promise<CustomerFeedback> {
    try {
      const response = await fetch('/api/customer-success/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const feedback = await response.json();
      
      // Invalidate feedback cache
      this.invalidateCache('customer-feedback');
      
      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getCustomerFeedback(userId?: string): Promise<CustomerFeedback[]> {
    const cacheKey = `customer-feedback${userId ? `-${userId}` : ''}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = userId 
        ? `/api/customer-success/feedback?userId=${userId}`
        : '/api/customer-success/feedback';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer feedback');
      }

      const feedback = await response.json();
      this.setCached(cacheKey, feedback);
      return feedback;
    } catch (error) {
      console.error('Error fetching customer feedback:', error);
      throw error;
    }
  }

  // Customer Segmentation
  async getCustomerSegments(): Promise<CustomerSegmentation[]> {
    const cacheKey = 'customer-segments';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/segments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer segments');
      }

      const segments = await response.json();
      this.setCached(cacheKey, segments);
      return segments;
    } catch (error) {
      console.error('Error fetching customer segments:', error);
      throw error;
    }
  }

  async getSegmentCustomers(segmentId: string): Promise<any[]> {
    const cacheKey = `segment-customers-${segmentId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/segments/${segmentId}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch segment customers');
      }

      const customers = await response.json();
      this.setCached(cacheKey, customers);
      return customers;
    } catch (error) {
      console.error('Error fetching segment customers:', error);
      throw error;
    }
  }

  // Real-time Updates
  subscribeToCustomerUpdates(userId: string, callback: (event: any) => void): () => void {
    // Implementation will depend on WebSocket or SSE setup
    const eventSource = new EventSource(`/api/customer-success/stream/${userId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
        
        // Invalidate relevant cache based on event type
        if (data.type === 'health_score_changed') {
          this.invalidateCache(`health-score-${userId}`);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }

  // Analytics and Insights
  async getCustomerInsights(userId: string): Promise<any> {
    const cacheKey = `customer-insights-${userId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/insights/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer insights');
      }

      const insights = await response.json();
      this.setCached(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      throw error;
    }
  }

  // Utility Methods
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  private getAuthToken(): string {
    // Implementation depends on auth system
    return localStorage.getItem('auth_token') || '';
  }

  // Cleanup method for when service is destroyed
  destroy(): void {
    this.cache.clear();
  }
}

export const customerSuccessService = new CustomerSuccessService();
export default customerSuccessService;
