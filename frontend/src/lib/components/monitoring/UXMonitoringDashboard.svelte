<script lang="ts">
  // UX Monitoring Dashboard - Real-time Launch Day Analytics
  // Critical metrics for Argentina market user behavior analysis
  
  import { onMount, onDestroy } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { uxAnalytics, type UserSession } from '$lib/services/ux-analytics';
  import type { DeviceInfo, ArgentinaLocationData } from '$lib/services/ux-analytics';

  // Real-time metrics state
  let isConnected = false;
  let currentMetrics: RealtimeMetrics = {
    activeUsers: 0,
    bookingFlowStarted: 0,
    bookingFlowCompleted: 0,
    bookingFlowAbandoned: 0,
    mobileUsers: 0,
    desktopUsers: 0,
    averageSessionDuration: 0,
    conversionRate: 0,
    topErrorSources: [],
    argentinaMarketInsights: {
      pesoTransactions: 0,
      mercadopagoUsage: 0,
      mobileBookingRate: 0,
      averageResponseTime: 0,
      popularTimeSlots: []
    }
  };

  let connectionQualityData: ConnectionQualityMetric[] = [];
  let userFlowAnalytics: BookingFlowAnalytic[] = [];
  let errorReports: UXError[] = [];
  let performanceMetrics: PerformanceSnapshot[] = [];

  interface RealtimeMetrics {
    activeUsers: number;
    bookingFlowStarted: number;
    bookingFlowCompleted: number;
    bookingFlowAbandoned: number;
    mobileUsers: number;
    desktopUsers: number;
    averageSessionDuration: number;
    conversionRate: number;
    topErrorSources: ErrorSource[];
    argentinaMarketInsights: ArgentinaInsights;
  }

  interface ArgentinaInsights {
    pesoTransactions: number;
    mercadopagoUsage: number;
    mobileBookingRate: number;
    averageResponseTime: number;
    popularTimeSlots: string[];
  }

  interface ConnectionQualityMetric {
    timestamp: number;
    connectionType: string;
    userCount: number;
    averageLoadTime: number;
    errorRate: number;
  }

  interface BookingFlowAnalytic {
    step: string;
    startedCount: number;
    completedCount: number;
    averageTime: number;
    dropOffRate: number;
    commonErrors: string[];
  }

  interface UXError {
    timestamp: number;
    errorType: string;
    message: string;
    userAgent: string;
    route: string;
    frequency: number;
    resolved?: boolean;
  }

  interface PerformanceSnapshot {
    timestamp: number;
    pageLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    route: string;
    deviceType: string;
  }

  interface ErrorSource {
    source: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }

  // WebSocket connection for real-time updates
  let ws: WebSocket | null = null;
  let reconnectInterval: NodeJS.Timeout | null = null;
  let metricsUpdateInterval: NodeJS.Timeout | null = null;

  onMount(() => {
    initializeRealtimeConnection();
    startMetricsCollection();
  });

  onDestroy(() => {
    cleanup();
  });

  function initializeRealtimeConnection(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/ux-monitoring`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected = true;
        console.log('UX Monitoring connected');
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        isConnected = false;
        console.log('UX Monitoring disconnected');
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnected = false;
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      scheduleReconnect();
    }
  }

  function scheduleReconnect(): void {
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        if (!isConnected) {
          initializeRealtimeConnection();
        }
      }, 5000);
    }
  }

  function handleRealtimeUpdate(data: any): void {
    switch (data.type) {
      case 'metrics_update':
        currentMetrics = { ...currentMetrics, ...data.metrics };
        break;
      case 'error_report':
        errorReports = [...errorReports.slice(-49), data.error];
        break;
      case 'performance_update':
        performanceMetrics = [...performanceMetrics.slice(-99), data.performance];
        break;
      case 'connection_quality':
        connectionQualityData = [...connectionQualityData.slice(-23), data.quality];
        break;
      case 'booking_flow_update':
        userFlowAnalytics = data.flows;
        break;
    }
  }

  function startMetricsCollection(): void {
    // Collect local metrics every 10 seconds
    metricsUpdateInterval = setInterval(() => {
      const sessionAnalytics = uxAnalytics.getCurrentSessionAnalytics();
      const argentinaInsights = uxAnalytics.getArgentinaMarketInsights();
      
      // Send current session data to monitoring system
      if (ws && isConnected) {
        ws.send(JSON.stringify({
          type: 'session_update',
          session: sessionAnalytics,
          insights: argentinaInsights
        }));
      }
    }, 10000);
  }

  function cleanup(): void {
    if (ws) {
      ws.close();
    }
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
    }
    if (metricsUpdateInterval) {
      clearInterval(metricsUpdateInterval);
    }
  }

  // Utility functions
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  function getConnectionQualityColor(type: string): string {
    switch (type) {
      case '4g': return 'text-green-600';
      case '3g': return 'text-yellow-600';
      case '2g': return 'text-red-600';
      case 'wifi': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  function getErrorSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  // Export function for external monitoring tools
  export function getRealtimeMetrics(): RealtimeMetrics {
    return currentMetrics;
  }

  export function exportAnalyticsData(): any {
    return {
      metrics: currentMetrics,
      connectionQuality: connectionQualityData,
      userFlows: userFlowAnalytics,
      errors: errorReports,
      performance: performanceMetrics,
      exportTime: new Date().toISOString()
    };
  }
</script>

<!-- UX Monitoring Dashboard -->
<div class="ux-monitoring-dashboard bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">UX Monitoring - Argentina Launch</h2>
        <p class="text-blue-100">Real-time user experience analytics</p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- Connection status -->
        <div class="flex items-center space-x-2">
          <div class={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span class="text-white text-sm">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <!-- Last update timestamp -->
        <span class="text-blue-100 text-sm">
          Actualizado: {new Date().toLocaleTimeString('es-AR')}
        </span>
      </div>
    </div>
  </div>

  <!-- Key Metrics Grid -->
  <div class="p-6">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      <!-- Active Users -->
      <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div class="text-2xl font-bold text-green-700">{currentMetrics.activeUsers}</div>
        <div class="text-sm text-green-600">Usuarios Activos</div>
      </div>

      <!-- Booking Flow Started -->
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <div class="text-2xl font-bold text-blue-700">{currentMetrics.bookingFlowStarted}</div>
        <div class="text-sm text-blue-600">Reservas Iniciadas</div>
      </div>

      <!-- Booking Flow Completed -->
      <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
        <div class="text-2xl font-bold text-purple-700">{currentMetrics.bookingFlowCompleted}</div>
        <div class="text-sm text-purple-600">Reservas Completadas</div>
      </div>

      <!-- Conversion Rate -->
      <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
        <div class="text-2xl font-bold text-indigo-700">
          {formatPercentage(currentMetrics.conversionRate)}
        </div>
        <div class="text-sm text-indigo-600">Tasa Conversión</div>
      </div>

      <!-- Mobile Users -->
      <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
        <div class="text-2xl font-bold text-orange-700">{currentMetrics.mobileUsers}</div>
        <div class="text-sm text-orange-600">Móviles</div>
      </div>

      <!-- Desktop Users -->
      <div class="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
        <div class="text-2xl font-bold text-teal-700">{currentMetrics.desktopUsers}</div>
        <div class="text-sm text-teal-600">Escritorio</div>
      </div>
    </div>

    <!-- Argentina Market Insights -->
    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200 mb-8">
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        <h3 class="text-lg font-bold text-yellow-800">Insights Mercado Argentino</h3>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-700">
            {currentMetrics.argentinaMarketInsights.pesoTransactions}
          </div>
          <div class="text-sm text-yellow-600">Transacciones ARS</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-700">
            {formatPercentage(currentMetrics.argentinaMarketInsights.mercadopagoUsage / 100)}
          </div>
          <div class="text-sm text-yellow-600">Uso MercadoPago</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-700">
            {formatPercentage(currentMetrics.argentinaMarketInsights.mobileBookingRate / 100)}
          </div>
          <div class="text-sm text-yellow-600">Reservas Móviles</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-700">
            {currentMetrics.argentinaMarketInsights.averageResponseTime}ms
          </div>
          <div class="text-sm text-yellow-600">Tiempo Respuesta</div>
        </div>
      </div>
    </div>

    <!-- Booking Flow Analytics -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- Connection Quality -->
      <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Calidad Conexión (Argentina)</h3>
        <div class="space-y-3">
          {#each connectionQualityData.slice(-5) as quality}
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div class="flex items-center space-x-3">
                <div class={`w-3 h-3 rounded-full ${getConnectionQualityColor(quality.connectionType)}`}></div>
                <span class="font-medium text-gray-700">
                  {quality.connectionType.toUpperCase()}
                </span>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-gray-800">
                  {quality.userCount} usuarios
                </div>
                <div class="text-xs text-gray-500">
                  {quality.averageLoadTime}ms carga
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Booking Flow Steps -->
      <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Flujo de Reservas</h3>
        <div class="space-y-3">
          {#each userFlowAnalytics as flow}
            <div class="p-3 bg-white rounded-lg border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-700">{flow.step}</span>
                <span class="text-sm font-semibold text-gray-800">
                  {formatPercentage(flow.dropOffRate / 100)} abandono
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style="width: {100 - flow.dropOffRate}%"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{flow.completedCount}/{flow.startedCount}</span>
                <span>{formatDuration(flow.averageTime)}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Error Monitoring -->
    {#if errorReports.length > 0}
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8" in:slide>
        <h3 class="text-lg font-semibold text-red-800 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Errores Recientes
        </h3>
        <div class="space-y-2">
          {#each errorReports.slice(-5) as error}
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
              <div class="flex-1">
                <div class="font-medium text-red-800">{error.errorType}</div>
                <div class="text-sm text-red-600">{error.message.slice(0, 80)}...</div>
                <div class="text-xs text-red-500">{error.route}</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-red-700">×{error.frequency}</div>
                <div class="text-xs text-red-500">
                  {new Date(error.timestamp).toLocaleTimeString('es-AR')}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Performance Metrics -->
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Rendimiento (Promedio 5min)</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each performanceMetrics.slice(-20) as perf}
          <div class="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div class="text-lg font-bold text-gray-700">{perf.pageLoadTime}ms</div>
            <div class="text-xs text-gray-500">Carga {perf.route}</div>
            <div class="text-xs text-gray-400">{perf.deviceType}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Export Button -->
    <div class="flex justify-end mt-6">
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        on:click={() => {
          const data = exportAnalyticsData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ux-analytics-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Exportar Datos</span>
      </button>
    </div>
  </div>
</div>

<style>
  .ux-monitoring-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  
  /* Responsive adjustments for Argentina mobile market */
  @media (max-width: 768px) {
    .ux-monitoring-dashboard {
      margin: 1rem;
      border-radius: 1rem;
    }
    
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    
    .p-6 {
      padding: 1rem;
    }
  }
  
  /* Animation for real-time updates */
  .grid > div {
    transition: all 0.3s ease-in-out;
  }
  
  .grid > div:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
</style>