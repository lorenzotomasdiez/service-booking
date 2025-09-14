// Business Intelligence Service
// F11-001: Customer Experience Platform - Business Operations Dashboard & Analytics

import type {
  BusinessIntelligenceDashboard,
  DashboardWidget,
  FinancialReportData,
  OperationalEfficiencyMetrics,
  MarketPerformanceData,
  ProviderPerformanceMetrics,
  ExecutiveDashboardMetrics,
  BusinessPerformanceApiResponse
} from '../types/customer-experience';

const API_BASE = '/api/analytics';

class BusinessIntelligenceService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real-time BI data
  private refreshIntervals = new Map<string, NodeJS.Timeout>();

  // Dashboard Management
  async getDashboards(): Promise<BusinessIntelligenceDashboard[]> {
    const cacheKey = 'bi-dashboards';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/dashboards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch BI dashboards');
      }

      const dashboards = await response.json();
      this.setCached(cacheKey, dashboards);
      return dashboards;
    } catch (error) {
      console.error('Error fetching BI dashboards:', error);
      throw error;
    }
  }

  async getDashboard(dashboardId: string): Promise<BusinessIntelligenceDashboard> {
    const cacheKey = `bi-dashboard-${dashboardId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/dashboards/${dashboardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch BI dashboard');
      }

      const dashboard = await response.json();
      this.setCached(cacheKey, dashboard);
      return dashboard;
    } catch (error) {
      console.error('Error fetching BI dashboard:', error);
      throw error;
    }
  }

  async getWidgetData(widgetId: string, timeRange?: string): Promise<any> {
    const cacheKey = `widget-data-${widgetId}${timeRange ? `-${timeRange}` : ''}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = new URL(`${API_BASE}/widgets/${widgetId}/data`, window.location.origin);
      if (timeRange) {
        url.searchParams.append('timeRange', timeRange);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch widget data');
      }

      const data = await response.json();
      this.setCached(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching widget data:', error);
      throw error;
    }
  }

  // Financial Reporting
  async getFinancialReport(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<FinancialReportData> {
    const cacheKey = `financial-report-${period}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/financial-reporting?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch financial report');
      }

      const report = await response.json();
      this.setCached(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Error fetching financial report:', error);
      throw error;
    }
  }

  async getFinancialTrends(startDate: string, endDate: string): Promise<any[]> {
    const cacheKey = `financial-trends-${startDate}-${endDate}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${API_BASE}/financial-reporting/trends?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch financial trends');
      }

      const trends = await response.json();
      this.setCached(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Error fetching financial trends:', error);
      throw error;
    }
  }

  // Business Performance Analytics
  async getBusinessPerformance(): Promise<BusinessPerformanceApiResponse> {
    const cacheKey = 'business-performance';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/business-performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business performance data');
      }

      const performance = await response.json();
      this.setCached(cacheKey, performance);
      return performance;
    } catch (error) {
      console.error('Error fetching business performance:', error);
      throw error;
    }
  }

  async getOperationalEfficiency(): Promise<OperationalEfficiencyMetrics> {
    const cacheKey = 'operational-efficiency';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/operational-efficiency`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operational efficiency data');
      }

      const efficiency = await response.json();
      this.setCached(cacheKey, efficiency);
      return efficiency;
    } catch (error) {
      console.error('Error fetching operational efficiency:', error);
      throw error;
    }
  }

  // Market Performance Analysis
  async getMarketPerformance(): Promise<MarketPerformanceData> {
    const cacheKey = 'market-performance';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/market-performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch market performance data');
      }

      const market = await response.json();
      this.setCached(cacheKey, market);
      return market;
    } catch (error) {
      console.error('Error fetching market performance:', error);
      throw error;
    }
  }

  async getCompetitorAnalysis(): Promise<any[]> {
    const cacheKey = 'competitor-analysis';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/competitor-analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch competitor analysis');
      }

      const analysis = await response.json();
      this.setCached(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error fetching competitor analysis:', error);
      throw error;
    }
  }

  // Provider Performance Analytics
  async getProviderPerformance(providerId?: string): Promise<ProviderPerformanceMetrics[]> {
    const cacheKey = `provider-performance${providerId ? `-${providerId}` : ''}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = providerId 
        ? `${API_BASE}/provider-performance/${providerId}`
        : `${API_BASE}/provider-performance`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provider performance data');
      }

      const performance = await response.json();
      const result = providerId ? [performance] : performance;
      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching provider performance:', error);
      throw error;
    }
  }

  async getProviderRankings(category?: string): Promise<any[]> {
    const cacheKey = `provider-rankings${category ? `-${category}` : ''}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = category 
        ? `${API_BASE}/provider-rankings?category=${category}`
        : `${API_BASE}/provider-rankings`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provider rankings');
      }

      const rankings = await response.json();
      this.setCached(cacheKey, rankings);
      return rankings;
    } catch (error) {
      console.error('Error fetching provider rankings:', error);
      throw error;
    }
  }

  // Executive Dashboard
  async getExecutiveDashboard(): Promise<ExecutiveDashboardMetrics> {
    const cacheKey = 'executive-dashboard';
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/executive-dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch executive dashboard data');
      }

      const dashboard = await response.json();
      this.setCached(cacheKey, dashboard);
      return dashboard;
    } catch (error) {
      console.error('Error fetching executive dashboard:', error);
      throw error;
    }
  }

  async getKPITrends(kpi: string, period: string): Promise<any[]> {
    const cacheKey = `kpi-trends-${kpi}-${period}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_BASE}/kpi-trends?kpi=${kpi}&period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch KPI trends');
      }

      const trends = await response.json();
      this.setCached(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Error fetching KPI trends:', error);
      throw error;
    }
  }

  // Real-time Data Streaming
  subscribeToRealTimeUpdates(dashboardId: string, callback: (data: any) => void): () => void {
    const eventSource = new EventSource(`${API_BASE}/stream/${dashboardId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
        
        // Update cache with new data
        if (data.widgetId) {
          this.setCached(`widget-data-${data.widgetId}`, data.data);
        }
      } catch (error) {
        console.error('Error parsing real-time data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time data stream error:', error);
    };

    return () => {
      eventSource.close();
    };
  }

  // Auto-refresh Management
  startAutoRefresh(key: string, refreshFunction: () => Promise<any>, interval: number): void {
    this.stopAutoRefresh(key);
    
    const intervalId = setInterval(async () => {
      try {
        await refreshFunction();
      } catch (error) {
        console.error(`Auto-refresh error for ${key}:`, error);
      }
    }, interval);
    
    this.refreshIntervals.set(key, intervalId);
  }

  stopAutoRefresh(key: string): void {
    const intervalId = this.refreshIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(key);
    }
  }

  stopAllAutoRefresh(): void {
    this.refreshIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.refreshIntervals.clear();
  }

  // Data Export
  async exportData(type: 'financial' | 'operational' | 'provider' | 'market', format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE}/export/${type}?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting data:', error);
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

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  // Cleanup
  destroy(): void {
    this.stopAllAutoRefresh();
    this.cache.clear();
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();
export default businessIntelligenceService;
