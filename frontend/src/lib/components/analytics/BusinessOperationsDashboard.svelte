<script lang="ts">
  // Business Operations Dashboard Component
  // F11-001: Customer Experience Platform - Business Operations Dashboard & Analytics
  
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import Chart from 'chart.js/auto';
  import businessIntelligenceService from '../../services/business-intelligence';
  import type {
    FinancialReportData,
    OperationalEfficiencyMetrics,
    MarketPerformanceData,
    ProviderPerformanceMetrics,
    ExecutiveDashboardMetrics,
    BusinessPerformanceApiResponse
  } from '../../types/customer-experience';
  
  const dispatch = createEventDispatcher();
  
  export let userRole: 'admin' | 'manager' | 'executive' = 'manager';
  export let refreshInterval: number = 30000; // 30 seconds
  
  let activeView: 'overview' | 'financial' | 'operational' | 'market' | 'providers' | 'executive' = 'overview';
  let financialData: FinancialReportData | null = null;
  let operationalData: OperationalEfficiencyMetrics | null = null;
  let marketData: MarketPerformanceData | null = null;
  let providerData: ProviderPerformanceMetrics[] = [];
  let executiveData: ExecutiveDashboardMetrics | null = null;
  let isLoading = false;
  let error: string | null = null;
  let lastUpdated: Date | null = null;
  
  // Chart instances
  let revenueChart: Chart | null = null;
  let operationalChart: Chart | null = null;
  let marketChart: Chart | null = null;
  let kpiChart: Chart | null = null;
  
  // Chart canvas references
  let revenueCanvas: HTMLCanvasElement;
  let operationalCanvas: HTMLCanvasElement;
  let marketCanvas: HTMLCanvasElement;
  let kpiCanvas: HTMLCanvasElement;
  
  // Real-time updates
  let unsubscribeRealtimeUpdates: (() => void) | null = null;
  let autoRefreshInterval: NodeJS.Timeout | null = null;
  
  // Filters and settings
  let timeRange = 'monthly';
  let selectedPeriod = 'last_30_days';
  let showAdvancedMetrics = userRole === 'executive';
  
  const timeRangeOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];
  
  const periodOptions = [
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'current_month', label: 'Mes actual' },
    { value: 'last_month', label: 'Mes anterior' },
    { value: 'current_year', label: 'Año actual' }
  ];
  
  onMount(async () => {
    await loadDashboardData();
    setupAutoRefresh();
    setupRealtimeUpdates();
  });
  
  onDestroy(() => {
    cleanupCharts();
    if (unsubscribeRealtimeUpdates) {
      unsubscribeRealtimeUpdates();
    }
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });
  
  async function loadDashboardData() {
    isLoading = true;
    error = null;
    
    try {
      const [businessPerformance, executive] = await Promise.all([
        businessIntelligenceService.getBusinessPerformance(),
        userRole === 'executive' ? businessIntelligenceService.getExecutiveDashboard() : null
      ]);
      
      financialData = businessPerformance.financial;
      operationalData = businessPerformance.operational;
      marketData = businessPerformance.market;
      providerData = businessPerformance.providers;
      
      if (executive) {
        executiveData = executive;
      }
      
      lastUpdated = new Date();
      
      // Update charts after data is loaded
      setTimeout(() => {
        updateCharts();
      }, 100);
      
    } catch (err) {
      error = 'Error al cargar los datos del dashboard';
      console.error('Dashboard data loading error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  function setupAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);
  }
  
  function setupRealtimeUpdates() {
    unsubscribeRealtimeUpdates = businessIntelligenceService.subscribeToRealTimeUpdates(
      'main-dashboard',
      (data) => {
        // Handle real-time updates
        if (data.type === 'financial_update' && financialData) {
          financialData = { ...financialData, ...data.data };
        }
        if (data.type === 'operational_update' && operationalData) {
          operationalData = { ...operationalData, ...data.data };
        }
        
        lastUpdated = new Date();
        updateCharts();
      }
    );
  }
  
  function updateCharts() {
    updateRevenueChart();
    updateOperationalChart();
    updateMarketChart();
    updateKPIChart();
  }
  
  function updateRevenueChart() {
    if (!revenueCanvas || !financialData) return;
    
    const ctx = revenueCanvas.getContext('2d');
    if (!ctx) return;
    
    if (revenueChart) {
      revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
          {
            label: 'Ingresos Totales',
            data: [45000, 52000, 48000, 61000, 58000, 67000, 71000, 69000, 78000, 82000, 89000, 95000],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Comisiones',
            data: [8100, 9360, 8640, 10980, 10440, 12060, 12780, 12420, 14040, 14760, 16020, 17100],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.parsed.y.toLocaleString('es-AR');
              }
            }
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + Number(value).toLocaleString('es-AR');
              }
            }
          }
        }
      }
    });
  }
  
  function updateOperationalChart() {
    if (!operationalCanvas || !operationalData) return;
    
    const ctx = operationalCanvas.getContext('2d');
    if (!ctx) return;
    
    if (operationalChart) {
      operationalChart.destroy();
    }
    
    operationalChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['CPU', 'Memoria', 'Base de Datos', 'Ancho de Banda'],
        datasets: [{
          data: [
            operationalData.resourceUtilization.serverCpu,
            operationalData.resourceUtilization.serverMemory,
            operationalData.resourceUtilization.database,
            operationalData.resourceUtilization.bandwidth
          ],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        }
      }
    });
  }
  
  function updateMarketChart() {
    if (!marketCanvas || !marketData) return;
    
    const ctx = marketCanvas.getContext('2d');
    if (!ctx) return;
    
    if (marketChart) {
      marketChart.destroy();
    }
    
    marketChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: marketData.competitorAnalysis.map(c => c.competitor),
        datasets: [
          {
            label: 'Participación de Mercado (%)',
            data: marketData.competitorAnalysis.map(c => c.marketShare),
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y + '% del mercado';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
  
  function updateKPIChart() {
    if (!kpiCanvas || !executiveData) return;
    
    const ctx = kpiCanvas.getContext('2d');
    if (!ctx) return;
    
    if (kpiChart) {
      kpiChart.destroy();
    }
    
    kpiChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Usuarios Totales',
            data: executiveData.growthMetrics.userAcquisition,
            borderColor: 'rgb(59, 130, 246)',
            yAxisID: 'y'
          },
          {
            label: 'Tasa de Churn (%)',
            data: executiveData.growthMetrics.churnRate,
            borderColor: 'rgb(239, 68, 68)',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Mes'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Usuarios'
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Churn (%)'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        }
      }
    });
  }
  
  function cleanupCharts() {
    [revenueChart, operationalChart, marketChart, kpiChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }
  
  async function exportData(type: 'financial' | 'operational' | 'provider' | 'market') {
    try {
      const blob = await businessIntelligenceService.exportData(type, 'excel');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }
  
  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }
  
  function getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }
  
  function getGrowthIcon(growth: number): string {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  }
</script>

<div class="p-6 bg-gray-50 min-h-screen">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard de Operaciones</h1>
        <p class="text-gray-600 mt-1">Monitoreo en tiempo real y análisis de rendimiento del negocio</p>
      </div>
      
      <div class="flex items-center space-x-3">
        {#if lastUpdated}
          <span class="text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString('es-AR')}
          </span>
        {/if}
        
        <button
          on:click={loadDashboardData}
          disabled={isLoading}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {#if isLoading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          Actualizar
        </button>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="flex items-center space-x-4">
      <select
        bind:value={timeRange}
        on:change={loadDashboardData}
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each timeRangeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      
      <select
        bind:value={selectedPeriod}
        on:change={loadDashboardData}
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each periodOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      
      {#if userRole === 'executive'}
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={showAdvancedMetrics}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">Métricas avanzadas</span>
        </label>
      {/if}
    </div>
  </div>
  
  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" transition:slide>
      <div class="flex items-center">
        <div class="text-red-600 mr-3">⚠️</div>
        <div class="text-red-700">{error}</div>
        <button 
          on:click={() => error = null}
          class="ml-auto text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Cargando datos...</span>
    </div>
  {:else if financialData && operationalData}
    <!-- Navigation Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex space-x-8">
        {#each [
          { key: 'overview', label: 'Resumen General', icon: '📊' },
          { key: 'financial', label: 'Finanzas', icon: '💰' },
          { key: 'operational', label: 'Operaciones', icon: '⚙️' },
          { key: 'market', label: 'Mercado', icon: '🌍' },
          { key: 'providers', label: 'Proveedores', icon: '👥' },
          ...(userRole === 'executive' ? [{ key: 'executive', label: 'Ejecutivo', icon: '📈' }] : [])
        ] as tab}
          <button
            on:click={() => activeView = tab.key}
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
              {activeView === tab.key 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        {/each}
      </nav>
    </div>
    
    <!-- Overview Tab -->
    {#if activeView === 'overview'}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" transition:fade>
        <!-- Key Metrics Cards -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p class="text-2xl font-bold text-gray-900">{formatCurrency(financialData.revenue.total)}</p>
              <p class="text-sm {getGrowthColor(financialData.revenue.growth.percentage)} flex items-center mt-1">
                <span class="mr-1">{getGrowthIcon(financialData.revenue.growth.percentage)}</span>
                {formatPercentage(financialData.revenue.growth.percentage)}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <div class="text-2xl">💰</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Margen Neto</p>
              <p class="text-2xl font-bold text-gray-900">{formatPercentage(financialData.profitability.margin)}</p>
              <p class="text-sm text-gray-500 mt-1">{formatCurrency(financialData.profitability.net)}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <div class="text-2xl">📈</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Tiempo de Respuesta</p>
              <p class="text-2xl font-bold text-gray-900">{operationalData.processingTimes.supportResponse}min</p>
              <p class="text-sm text-green-600 flex items-center mt-1">
                <span class="mr-1">↗️</span>
                Mejorando
              </p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <div class="text-2xl">⏱️</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Proveedores Activos</p>
              <p class="text-2xl font-bold text-gray-900">{providerData.length}</p>
              <p class="text-sm text-blue-600 mt-1">+12 este mes</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <div class="text-2xl">👥</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Tendencia de Ingresos</h3>
            <button
              on:click={() => exportData('financial')}
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              📄 Exportar
            </button>
          </div>
          <div class="h-64">
            <canvas bind:this={revenueCanvas}></canvas>
          </div>
        </div>
        
        <!-- Operational Efficiency -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Utilización de Recursos</h3>
            <button
              on:click={() => exportData('operational')}
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              📄 Exportar
            </button>
          </div>
          <div class="h-64">
            <canvas bind:this={operationalCanvas}></canvas>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Financial Tab -->
    {#if activeView === 'financial'}
      <div transition:fade>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Análisis Financiero Detallado</h3>
              <div class="h-80">
                <canvas bind:this={revenueCanvas}></canvas>
              </div>
            </div>
          </div>
          
          <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 class="font-semibold text-gray-900 mb-4">Desglose de Ingresos</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Reservas</span>
                  <span class="font-medium">{formatCurrency(financialData.revenue.breakdown.bookings)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Suscripciones</span>
                  <span class="font-medium">{formatCurrency(financialData.revenue.breakdown.subscriptions)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Comisiones</span>
                  <span class="font-medium">{formatCurrency(financialData.revenue.breakdown.commissions)}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 class="font-semibold text-gray-900 mb-4">Métricas Clave</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">ARPU</span>
                  <span class="font-medium">{formatCurrency(financialData.arpu)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">LTV</span>
                  <span class="font-medium">{formatCurrency(financialData.ltv)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">CAC</span>
                  <span class="font-medium">{formatCurrency(financialData.cac)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">LTV/CAC</span>
                  <span class="font-medium text-green-600">{(financialData.ltv / financialData.cac).toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Operational Tab -->
    {#if activeView === 'operational'}
      <div transition:fade>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Eficiencia Operacional</h3>
            <div class="h-64">
              <canvas bind:this={operationalCanvas}></canvas>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Tiempos de Procesamiento</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Confirmación de Reserva</span>
                <span class="font-medium">{operationalData.processingTimes.bookingConfirmation}s</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Procesamiento de Pago</span>
                <span class="font-medium">{operationalData.processingTimes.paymentProcessing}s</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Respuesta de Soporte</span>
                <span class="font-medium">{operationalData.processingTimes.supportResponse}min</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Verificación de Proveedor</span>
                <span class="font-medium">{operationalData.processingTimes.providerVerification}h</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        {#if operationalData.recommendations.length > 0}
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recomendaciones de Optimización</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each operationalData.recommendations as rec}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-medium text-gray-900">{rec.title}</h4>
                    <span class="px-2 py-1 text-xs font-medium rounded-full
                      {rec.priority === 'critical' ? 'text-red-600 bg-red-100' :
                        rec.priority === 'high' ? 'text-orange-600 bg-orange-100' :
                        rec.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-green-600 bg-green-100'}">
                      {rec.priority === 'critical' ? 'Crítico' :
                       rec.priority === 'high' ? 'Alto' :
                       rec.priority === 'medium' ? 'Medio' : 'Bajo'}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{rec.description}</p>
                  <div class="text-xs text-gray-500">
                    <div>Impacto: {rec.estimatedImpact.performance}% rendimiento</div>
                    <div>Esfuerzo: {rec.implementationEffort}</div>
                    <div>Timeline: {rec.timeline}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Market Tab -->
    {#if activeView === 'market'}
      <div transition:fade>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Análisis Competitivo</h3>
            <div class="h-64">
              <canvas bind:this={marketCanvas}></canvas>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Tendencias del Mercado</h3>
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Demanda Actual</h4>
                <div class="text-2xl font-bold text-blue-600">{marketData.marketTrends.demand.current.toLocaleString()}</div>
                <div class="text-sm text-gray-600">reservas mensuales</div>
              </div>
              
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Demanda Proyectada</h4>
                <div class="text-2xl font-bold text-green-600">{marketData.marketTrends.demand.projected.toLocaleString()}</div>
                <div class="text-sm text-gray-600">próximo mes</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Market Opportunities -->
        {#if marketData.opportunities.length > 0}
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Oportunidades de Mercado</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each marketData.opportunities as opp}
                <div class="border border-gray-200 rounded-lg p-4">
                  <h4 class="font-medium text-gray-900 mb-2">{opp.title}</h4>
                  <p class="text-sm text-gray-600 mb-3">{opp.description}</p>
                  <div class="space-y-1 text-xs text-gray-500">
                    <div>Ingresos potenciales: {formatCurrency(opp.potentialRevenue)}</div>
                    <div>Inversión requerida: {formatCurrency(opp.investmentRequired)}</div>
                    <div class="flex items-center">
                      <span>Riesgo:</span>
                      <span class="ml-1 px-2 py-1 rounded-full text-xs
                        {opp.riskLevel === 'low' ? 'text-green-600 bg-green-100' :
                          opp.riskLevel === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                          'text-red-600 bg-red-100'}">
                        {opp.riskLevel === 'low' ? 'Bajo' :
                         opp.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                      </span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Providers Tab -->
    {#if activeView === 'providers'}
      <div transition:fade>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Rendimiento de Proveedores</h3>
              <button
                on:click={() => exportData('provider')}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                📄 Exportar Reporte
              </button>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reservas
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa Completada
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crecimiento
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each providerData.slice(0, 10) as provider}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-gray-900">{provider.businessName}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.metrics.totalBookings}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-green-600">
                        {formatPercentage(provider.metrics.completionRate)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">{provider.metrics.averageRating}</span>
                        <span class="text-yellow-400 ml-1">★</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(provider.metrics.revenue)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm {getGrowthColor(provider.metrics.growth.revenue)} flex items-center">
                        <span class="mr-1">{getGrowthIcon(provider.metrics.growth.revenue)}</span>
                        {formatPercentage(provider.metrics.growth.revenue)}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Executive Tab -->
    {#if activeView === 'executive' && executiveData && userRole === 'executive'}
      <div transition:fade>
        <!-- KPI Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Usuarios Totales</p>
                <p class="text-2xl font-bold text-gray-900">{executiveData.kpis.totalUsers.value.toLocaleString()}</p>
                <div class="flex items-center mt-1">
                  <span class="text-sm {getGrowthColor(executiveData.kpis.totalUsers.growth)}">
                    {getGrowthIcon(executiveData.kpis.totalUsers.growth)} {formatPercentage(executiveData.kpis.totalUsers.growth)}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    Meta: {executiveData.kpis.totalUsers.target.toLocaleString()}
                  </span>
                </div>
              </div>
              <div class="text-3xl">👥</div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">MRR</p>
                <p class="text-2xl font-bold text-gray-900">{formatCurrency(executiveData.kpis.monthlyRecurringRevenue.value)}</p>
                <div class="flex items-center mt-1">
                  <span class="text-sm {getGrowthColor(executiveData.kpis.monthlyRecurringRevenue.growth)}">
                    {getGrowthIcon(executiveData.kpis.monthlyRecurringRevenue.growth)} {formatPercentage(executiveData.kpis.monthlyRecurringRevenue.growth)}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    Meta: {formatCurrency(executiveData.kpis.monthlyRecurringRevenue.target)}
                  </span>
                </div>
              </div>
              <div class="text-3xl">💵</div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Satisfacción del Cliente</p>
                <p class="text-2xl font-bold text-gray-900">{executiveData.kpis.customerSatisfaction.value}/5</p>
                <div class="flex items-center mt-1">
                  <span class="text-sm {getGrowthColor(executiveData.kpis.customerSatisfaction.growth)}">
                    {getGrowthIcon(executiveData.kpis.customerSatisfaction.growth)} {formatPercentage(executiveData.kpis.customerSatisfaction.growth)}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    Meta: {executiveData.kpis.customerSatisfaction.target}/5
                  </span>
                </div>
              </div>
              <div class="text-3xl">🌟</div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Penetración de Mercado</p>
                <p class="text-2xl font-bold text-gray-900">{formatPercentage(executiveData.kpis.marketPenetration.value)}</p>
                <div class="flex items-center mt-1">
                  <span class="text-sm {getGrowthColor(executiveData.kpis.marketPenetration.growth)}">
                    {getGrowthIcon(executiveData.kpis.marketPenetration.growth)} {formatPercentage(executiveData.kpis.marketPenetration.growth)}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    Meta: {formatPercentage(executiveData.kpis.marketPenetration.target)}
                  </span>
                </div>
              </div>
              <div class="text-3xl">🎯</div>
            </div>
          </div>
        </div>
        
        <!-- Growth Metrics Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Métricas de Crecimiento</h3>
          <div class="h-80">
            <canvas bind:this={kpiCanvas}></canvas>
          </div>
        </div>
        
        <!-- Strategic Initiatives -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Iniciativas Estratégicas</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each executiveData.strategicInitiatives as initiative}
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-medium text-gray-900">{initiative.name}</h4>
                  <span class="px-2 py-1 text-xs font-medium rounded-full
                    {initiative.status === 'completed' ? 'text-green-600 bg-green-100' :
                      initiative.status === 'in_progress' ? 'text-blue-600 bg-blue-100' :
                      initiative.status === 'on_hold' ? 'text-yellow-600 bg-yellow-100' :
                      'text-gray-600 bg-gray-100'}">
                    {initiative.status === 'completed' ? 'Completado' :
                     initiative.status === 'in_progress' ? 'En Progreso' :
                     initiative.status === 'on_hold' ? 'En Pausa' : 'Planeando'}
                  </span>
                </div>
                
                <p class="text-sm text-gray-600 mb-3">{initiative.description}</p>
                
                <div class="mb-3">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span>{initiative.progress}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style="width: {initiative.progress}%"
                    ></div>
                  </div>
                </div>
                
                <div class="text-xs text-gray-500 space-y-1">
                  <div>Presupuesto: {formatCurrency(initiative.budget.spent)} / {formatCurrency(initiative.budget.allocated)}</div>
                  <div>Owner: {initiative.owner}</div>
                  <div>Fin: {new Date(initiative.timeline.endDate).toLocaleDateString('es-AR')}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
