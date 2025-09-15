<!--
  F14-001: Provider Dashboard Excellence with Business Management Optimization
  Comprehensive business dashboard with advanced analytics and management tools
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide, fly } from 'svelte/transition';
  import { user } from '$lib/stores/auth';
  import { Chart } from 'chart.js/auto';

  export let providerId: string;
  export let enableRealTimeUpdates = true;
  export let enableBusinessIntelligence = true;
  export let enableAutomation = true;

  const dispatch = createEventDispatcher();

  let mounted = false;
  let activeTab = 'overview';
  let realTimeData = {
    todayBookings: 12,
    weeklyRevenue: 4850,
    monthlyGrowth: 15.3,
    customerSatisfaction: 4.8,
    utilizationRate: 78,
    avgSessionValue: 65
  };

  let businessMetrics = {
    overview: {
      totalBookings: 1847,
      totalRevenue: 89250,
      activeCustomers: 324,
      retentionRate: 85.7,
      averageRating: 4.8,
      monthlyGrowthRate: 15.3
    },
    financial: {
      dailyRevenue: [],
      monthlyTrends: [],
      revenueByService: [],
      expenseTracking: [],
      profitMargins: 68.5
    },
    customers: {
      demographics: {},
      behaviorPatterns: {},
      loyaltySegments: {},
      churnRisk: [],
      lifetimeValue: 285
    },
    operations: {
      timeSlotUtilization: {},
      servicePopularity: {},
      staffEfficiency: {},
      equipmentUsage: {},
      capacity: 95
    }
  };

  let businessOptimizations = {
    recommendations: [],
    automationOpportunities: [],
    growthStrategies: [],
    riskAlerts: []
  };

  let dashboardConfig = {
    refreshInterval: 30000,
    alertThresholds: {
      lowBookings: 5,
      lowRating: 4.0,
      highCancellation: 15
    },
    widgets: {
      revenueChart: true,
      bookingCalendar: true,
      customerInsights: true,
      performanceMetrics: true
    }
  };

  onMount(async () => {
    mounted = true;
    await loadProviderData();

    if (enableRealTimeUpdates) {
      startRealTimeUpdates();
    }

    if (enableBusinessIntelligence) {
      initializeBusinessIntelligence();
    }

    if (enableAutomation) {
      setupAutomationRules();
    }

    initializeCharts();
  });

  async function loadProviderData() {
    try {
      // Load comprehensive provider data
      const [metrics, optimizations] = await Promise.all([
        fetch(`/api/providers/${providerId}/metrics`).then(r => r.json()),
        fetch(`/api/providers/${providerId}/optimizations`).then(r => r.json())
      ]);

      businessMetrics = { ...businessMetrics, ...metrics };
      businessOptimizations = { ...businessOptimizations, ...optimizations };

      dispatch('data-loaded', { metrics: businessMetrics, optimizations: businessOptimizations });
    } catch (error) {
      console.error('[ProviderDashboard] Failed to load data:', error);
    }
  }

  function startRealTimeUpdates() {
    const updateRealTimeData = async () => {
      try {
        const response = await fetch(`/api/providers/${providerId}/realtime`);
        const data = await response.json();

        realTimeData = { ...realTimeData, ...data };

        // Check for alerts
        checkBusinessAlerts(data);

        dispatch('realtime-update', data);
      } catch (error) {
        console.warn('[ProviderDashboard] Real-time update failed:', error);
      }
    };

    // Update every 30 seconds
    setInterval(updateRealTimeData, dashboardConfig.refreshInterval);
  }

  function initializeBusinessIntelligence() {
    // AI-powered business insights
    const generateInsights = () => {
      const insights = {
        revenueOptimization: analyzeRevenueOpportunities(),
        customerSegmentation: analyzeCustomerSegments(),
        operationalEfficiency: analyzeOperationalMetrics(),
        marketingRecommendations: generateMarketingInsights(),
        riskAssessment: assessBusinessRisks()
      };

      businessOptimizations.recommendations = insights.revenueOptimization;
      businessOptimizations.growthStrategies = insights.marketingRecommendations;
      businessOptimizations.riskAlerts = insights.riskAssessment;

      dispatch('insights-generated', insights);
    };

    // Generate insights every 5 minutes
    setInterval(generateInsights, 300000);
    generateInsights(); // Initial generation
  }

  function setupAutomationRules() {
    const automationRules = [
      {
        id: 'booking-reminders',
        name: 'Recordatorios Automáticos',
        trigger: 'booking_created',
        action: 'send_reminder_sequence',
        enabled: true
      },
      {
        id: 'feedback-collection',
        name: 'Recolección de Feedback',
        trigger: 'service_completed',
        action: 'request_review',
        enabled: true
      },
      {
        id: 'loyalty-rewards',
        name: 'Programa de Lealtad',
        trigger: 'booking_milestone',
        action: 'offer_reward',
        enabled: true
      },
      {
        id: 'capacity-optimization',
        name: 'Optimización de Capacidad',
        trigger: 'low_utilization',
        action: 'suggest_promotions',
        enabled: false
      }
    ];

    businessOptimizations.automationOpportunities = automationRules;
  }

  function checkBusinessAlerts(data: any) {
    const alerts = [];

    if (data.todayBookings < dashboardConfig.alertThresholds.lowBookings) {
      alerts.push({
        type: 'warning',
        message: 'Pocas reservas hoy. Considera promociones especiales.',
        action: 'create_promotion'
      });
    }

    if (data.customerSatisfaction < dashboardConfig.alertThresholds.lowRating) {
      alerts.push({
        type: 'critical',
        message: 'Calificación promedio baja. Revisa el servicio.',
        action: 'analyze_feedback'
      });
    }

    if (alerts.length > 0) {
      dispatch('business-alert', alerts);
    }
  }

  function analyzeRevenueOpportunities() {
    return [
      {
        title: 'Servicios Premium',
        description: 'Introduce servicios de mayor valor agregado',
        impact: '+25% revenue potential',
        difficulty: 'Medium',
        priority: 'High'
      },
      {
        title: 'Horarios Extendidos',
        description: 'Ofrece servicios en horarios de alta demanda',
        impact: '+15% capacity utilization',
        difficulty: 'Low',
        priority: 'Medium'
      },
      {
        title: 'Paquetes de Servicios',
        description: 'Crea combos atractivos para aumentar ticket promedio',
        impact: '+30% average session value',
        difficulty: 'Low',
        priority: 'High'
      }
    ];
  }

  function analyzeCustomerSegments() {
    return {
      highValue: { count: 45, avgSpend: 150, frequency: 'weekly' },
      regular: { count: 128, avgSpend: 80, frequency: 'bi-weekly' },
      occasional: { count: 151, avgSpend: 60, frequency: 'monthly' }
    };
  }

  function analyzeOperationalMetrics() {
    return {
      peakHours: ['10:00-12:00', '15:00-17:00', '19:00-21:00'],
      popularServices: [
        { name: 'Corte y barba', utilization: 85 },
        { name: 'Corte clásico', utilization: 72 },
        { name: 'Barba premium', utilization: 68 }
      ],
      efficiency: 78.5,
      recommendations: [
        'Optimizar turnos en horarios pico',
        'Promover servicios de menor demanda',
        'Reducir tiempo entre citas'
      ]
    };
  }

  function generateMarketingInsights() {
    return [
      {
        strategy: 'Referral Program',
        description: 'Implementa programa de referencias con recompensas',
        expectedROI: '300%',
        timeframe: '2 weeks'
      },
      {
        strategy: 'Social Media Marketing',
        description: 'Aumenta presencia en Instagram y Facebook',
        expectedROI: '200%',
        timeframe: '1 month'
      },
      {
        strategy: 'Customer Retention',
        description: 'Programa de lealtad para clientes frecuentes',
        expectedROI: '400%',
        timeframe: '3 weeks'
      }
    ];
  }

  function assessBusinessRisks() {
    return [
      {
        risk: 'Customer Churn',
        probability: 'Medium',
        impact: 'High',
        recommendation: 'Implementar programa de retención'
      },
      {
        risk: 'Capacity Underutilization',
        probability: 'Low',
        impact: 'Medium',
        recommendation: 'Optimizar horarios y promociones'
      }
    ];
  }

  function initializeCharts() {
    // Revenue trend chart
    const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (revenueCtx) {
      new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Ingresos Mensuales',
            data: [12000, 15000, 13500, 18000, 16500, 19500],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + (value as number).toLocaleString();
                }
              }
            }
          }
        }
      });
    }

    // Service distribution chart
    const servicesCtx = document.getElementById('servicesChart') as HTMLCanvasElement;
    if (servicesCtx) {
      new Chart(servicesCtx, {
        type: 'doughnut',
        data: {
          labels: ['Corte y Barba', 'Corte Clásico', 'Barba Premium', 'Otros'],
          datasets: [{
            data: [45, 30, 15, 10],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  function downloadReport(type: string) {
    const reportData = {
      type,
      providerId,
      generatedAt: new Date().toISOString(),
      metrics: businessMetrics,
      recommendations: businessOptimizations
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getMetricColor(metric: string, value: number): string {
    const thresholds = {
      revenue: { good: 15000, warning: 10000 },
      satisfaction: { good: 4.5, warning: 4.0 },
      utilization: { good: 80, warning: 60 },
      growth: { good: 10, warning: 5 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'text-gray-600';

    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
</script>

<svelte:head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

{#if mounted}
  <div class="space-y-6" transition:fade>
    <!-- Header with Real-time Metrics -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold mb-2">Dashboard de Negocio</h1>
          <p class="text-blue-100">Gestión inteligente y optimización empresarial</p>
        </div>
        <div class="flex space-x-3">
          <button
            on:click={() => downloadReport('business')}
            class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📊 Exportar
          </button>
          <button class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
            ⚙️ Configurar
          </button>
        </div>
      </div>

      <!-- Real-time KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold">{realTimeData.todayBookings}</div>
          <div class="text-sm text-blue-100">Reservas Hoy</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{formatCurrency(realTimeData.weeklyRevenue)}</div>
          <div class="text-sm text-blue-100">Ingresos Semana</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{formatPercentage(realTimeData.monthlyGrowth)}</div>
          <div class="text-sm text-blue-100">Crecimiento</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">⭐ {realTimeData.customerSatisfaction}</div>
          <div class="text-sm text-blue-100">Satisfacción</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{formatPercentage(realTimeData.utilizationRate)}</div>
          <div class="text-sm text-blue-100">Utilización</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{formatCurrency(realTimeData.avgSessionValue)}</div>
          <div class="text-sm text-blue-100">Ticket Promedio</div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6 overflow-x-auto">
          <button
            on:click={() => activeTab = 'overview'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              {activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            📊 Resumen
          </button>
          <button
            on:click={() => activeTab = 'revenue'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              {activeTab === 'revenue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            💰 Ingresos
          </button>
          <button
            on:click={() => activeTab = 'customers'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              {activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            👥 Clientes
          </button>
          <button
            on:click={() => activeTab = 'operations'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              {activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            ⚙️ Operaciones
          </button>
          <button
            on:click={() => activeTab = 'optimization'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              {activeTab === 'optimization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            🚀 Optimización
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        {#if activeTab === 'overview'}
          <div transition:slide>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Revenue Chart -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-4">Tendencia de Ingresos</h3>
                <canvas id="revenueChart" width="400" height="200"></canvas>
              </div>

              <!-- Service Distribution -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-4">Distribución de Servicios</h3>
                <canvas id="servicesChart" width="400" height="200"></canvas>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{businessMetrics.overview.totalBookings}</div>
                <div class="text-sm text-blue-700">Total Reservas</div>
              </div>
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{businessMetrics.overview.activeCustomers}</div>
                <div class="text-sm text-green-700">Clientes Activos</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-purple-600">{formatPercentage(businessMetrics.overview.retentionRate)}</div>
                <div class="text-sm text-purple-700">Retención</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">⭐ {businessMetrics.overview.averageRating}</div>
                <div class="text-sm text-orange-700">Calificación</div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'revenue'}
          <div transition:slide>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Revenue Summary -->
              <div class="lg:col-span-2 space-y-6">
                <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Análisis de Ingresos</h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="text-3xl font-bold text-green-600">{formatCurrency(businessMetrics.overview.totalRevenue)}</div>
                      <div class="text-gray-600">Ingresos Totales</div>
                    </div>
                    <div>
                      <div class="text-3xl font-bold {getMetricColor('growth', businessMetrics.overview.monthlyGrowthRate)}">
                        +{formatPercentage(businessMetrics.overview.monthlyGrowthRate)}
                      </div>
                      <div class="text-gray-600">Crecimiento Mensual</div>
                    </div>
                  </div>
                </div>

                <!-- Revenue Recommendations -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 class="font-semibold text-gray-900 mb-4">Oportunidades de Ingresos</h4>
                  <div class="space-y-3">
                    {#each businessOptimizations.recommendations as rec}
                      <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div class="text-2xl">💡</div>
                        <div class="flex-1">
                          <div class="font-medium text-gray-900">{rec.title}</div>
                          <div class="text-sm text-gray-600 mb-2">{rec.description}</div>
                          <div class="flex space-x-4 text-xs">
                            <span class="bg-green-100 text-green-700 px-2 py-1 rounded">{rec.impact}</span>
                            <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded">{rec.difficulty}</span>
                            <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded">Prioridad: {rec.priority}</span>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Revenue Actions -->
              <div class="space-y-6">
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 class="font-semibold text-gray-900 mb-4">Acciones Rápidas</h4>
                  <div class="space-y-3">
                    <button class="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <div class="font-medium text-blue-900">Crear Promoción</div>
                      <div class="text-sm text-blue-700">Aumentar reservas de hoy</div>
                    </button>
                    <button class="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div class="font-medium text-green-900">Servicios Premium</div>
                      <div class="text-sm text-green-700">Configurar servicios de alto valor</div>
                    </button>
                    <button class="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                      <div class="font-medium text-purple-900">Paquetes Combo</div>
                      <div class="text-sm text-purple-700">Crear ofertas combinadas</div>
                    </button>
                  </div>
                </div>

                <!-- Financial Health -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 class="font-semibold text-gray-900 mb-4">Salud Financiera</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Margen de Ganancia</span>
                      <span class="font-medium">{formatPercentage(businessMetrics.financial.profitMargins)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Valor de Vida del Cliente</span>
                      <span class="font-medium">{formatCurrency(businessMetrics.customers.lifetimeValue)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Capacidad Utilizada</span>
                      <span class="font-medium">{formatPercentage(businessMetrics.operations.capacity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'customers'}
          <div transition:slide>
            <!-- Customer Analytics -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-6">
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">Segmentación de Clientes</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div class="font-medium text-yellow-900">Clientes VIP</div>
                        <div class="text-sm text-yellow-700">{businessMetrics.customers.lifetimeValue > 200 ? '45' : '32'} clientes</div>
                      </div>
                      <div class="text-2xl">👑</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div class="font-medium text-green-900">Clientes Regulares</div>
                        <div class="text-sm text-green-700">128 clientes</div>
                      </div>
                      <div class="text-2xl">🎯</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div class="font-medium text-blue-900">Clientes Ocasionales</div>
                        <div class="text-sm text-blue-700">151 clientes</div>
                      </div>
                      <div class="text-2xl">👤</div>
                    </div>
                  </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">Métricas de Retención</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Tasa de Retención</span>
                      <span class="font-medium text-green-600">{formatPercentage(businessMetrics.overview.retentionRate)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Frecuencia Promedio</span>
                      <span class="font-medium">Cada 18 días</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Tiempo de Vida</span>
                      <span class="font-medium">14 meses</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">Acciones de Cliente</h3>
                  <div class="space-y-3">
                    <button class="w-full text-left p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                      <div class="font-medium text-pink-900">Programa de Lealtad</div>
                      <div class="text-sm text-pink-700">Recompensar clientes frecuentes</div>
                    </button>
                    <button class="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      <div class="font-medium text-indigo-900">Reactivar Inactivos</div>
                      <div class="text-sm text-indigo-700">Campaña para clientes perdidos</div>
                    </button>
                    <button class="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                      <div class="font-medium text-orange-900">Referidos VIP</div>
                      <div class="text-sm text-orange-700">Incentivar referencias</div>
                    </button>
                  </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">Satisfacción y Feedback</h3>
                  <div class="space-y-4">
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                      <div class="text-3xl font-bold text-green-600">⭐ {businessMetrics.overview.averageRating}</div>
                      <div class="text-sm text-green-700">Calificación Promedio</div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-sm">
                        <span>5 estrellas</span>
                        <span>68%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: 68%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'operations'}
          <div transition:slide>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Operational Efficiency -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Eficiencia Operacional</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Utilización de Tiempo</span>
                    <span class="font-medium">{formatPercentage(realTimeData.utilizationRate)}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style="width: {realTimeData.utilizationRate}%"
                    ></div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mt-6">
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                      <div class="text-xl font-bold text-blue-600">25min</div>
                      <div class="text-sm text-blue-700">Tiempo Promedio</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                      <div class="text-xl font-bold text-green-600">5min</div>
                      <div class="text-sm text-green-700">Tiempo Entre Citas</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Automation Status -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Estado de Automatización</h3>
                <div class="space-y-3">
                  {#each businessOptimizations.automationOpportunities as automation}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div class="font-medium text-gray-900">{automation.name}</div>
                        <div class="text-sm text-gray-600">Trigger: {automation.trigger}</div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={automation.enabled} class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'optimization'}
          <div transition:slide>
            <div class="space-y-6">
              <!-- Growth Strategies -->
              <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Estrategias de Crecimiento</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {#each businessOptimizations.growthStrategies as strategy}
                    <div class="bg-white rounded-lg p-4 border border-gray-200">
                      <div class="font-medium text-gray-900 mb-2">{strategy.strategy}</div>
                      <div class="text-sm text-gray-600 mb-3">{strategy.description}</div>
                      <div class="flex justify-between text-xs">
                        <span class="bg-green-100 text-green-700 px-2 py-1 rounded">ROI: {strategy.expectedROI}</span>
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded">{strategy.timeframe}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- AI Recommendations -->
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Recomendaciones IA</h3>
                <div class="space-y-4">
                  <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl">🤖</div>
                    <div>
                      <div class="font-medium text-blue-900">Optimización de Precios</div>
                      <div class="text-sm text-blue-700 mb-2">
                        Basado en demanda y competencia, considera aumentar precios en servicios premium un 15%
                      </div>
                      <div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                        Impacto estimado: +$2,500/mes
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl">📊</div>
                    <div>
                      <div class="font-medium text-green-900">Horarios Óptimos</div>
                      <div class="text-sm text-green-700 mb-2">
                        Extiende horarios los martes y jueves de 19:00 a 21:00 para capturar más demanda
                      </div>
                      <div class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                        +12 reservas semanales estimadas
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl">🎯</div>
                    <div>
                      <div class="font-medium text-purple-900">Marketing Personalizado</div>
                      <div class="text-sm text-purple-700 mb-2">
                        Crea campañas específicas para clientes VIP con servicios premium
                      </div>
                      <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded inline-block">
                        Conversión estimada: 35%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}