<!--
  Advanced Analytics Dashboard for Providers
  Data-driven insights for Argentina market success
  Based on Day 6 performance: 35 providers, ARS 28,500 revenue
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';
  
  export let providerId: string;
  export let timeRange: '24h' | '7d' | '30d' | '90d' = '7d';
  
  // Sample data based on Day 6 real performance
  let analyticsData = {
    revenue: {
      current: 1350, // ARS per day for top performer
      previous: 1200,
      trend: 12.5,
      currency: 'ARS'
    },
    bookings: {
      current: 28,
      previous: 25,
      trend: 12.0,
      completionRate: 96
    },
    clients: {
      new: 18,
      returning: 10,
      retentionRate: 67,
      averageRating: 4.8
    },
    performance: {
      responseTime: '8 minutos',
      availabilityScore: 94,
      professionalismScore: 96,
      marketPosition: 'Top 15%'
    }
  };
  
  // Argentina market insights
  let marketInsights = {
    peakHours: [
      { hour: '10:00-12:00', bookings: 35, revenue: 4725 },
      { hour: '17:00-19:00', bookings: 28, revenue: 3780 },
      { hour: '14:00-16:00', bookings: 12, revenue: 1620 }, // Post-siesta
      { hour: '19:00-21:00', bookings: 22, revenue: 2970 }
    ],
    topServices: [
      { name: 'Corte clásico', bookings: 45, revenue: 6750, margin: 95 },
      { name: 'Barba styling', bookings: 30, revenue: 6300, margin: 92 },
      { name: 'Combo completo', bookings: 25, revenue: 8750, margin: 88 }
    ],
    clientDemographics: {
      ages: [
        { range: '25-35', percentage: 45, revenue: 12150 },
        { range: '36-45', percentage: 30, revenue: 9450 },
        { range: '18-25', percentage: 15, revenue: 3375 },
        { range: '46+', percentage: 10, revenue: 3525 }
      ],
      neighborhoods: [
        { name: 'Palermo', percentage: 35, avgSpend: 4500 },
        { name: 'Recoleta', percentage: 25, avgSpend: 5200 },
        { name: 'Belgrano', percentage: 20, avgSpend: 4100 },
        { name: 'Otros', percentage: 20, avgSpend: 3800 }
      ]
    },
    paymentMethods: [
      { method: 'MercadoPago', percentage: 92, trend: '+5%' },
      { method: 'Efectivo', percentage: 8, trend: '-3%' }
    ]
  };
  
  // Growth recommendations based on data
  let growthRecommendations = [
    {
      category: 'Horarios',
      recommendation: 'Ampliar disponibilidad 19:00-21:00',
      impact: '+15% ingresos estimados',
      priority: 'alta',
      explanation: 'Alto demand en horario post-trabajo'
    },
    {
      category: 'Servicios',
      recommendation: 'Promocionar combos completos',
      impact: '+22% valor promedio',
      priority: 'alta',
      explanation: 'Mayor margen y satisfacción client'
    },
    {
      category: 'Marketing',
      recommendation: 'Enfocar en Recoleta/Palermo',
      impact: '+18% clientela premium',
      priority: 'media',
      explanation: 'Barrios con mayor gasto promedio'
    },
    {
      category: 'Retención',
      recommendation: 'Programa de fidelidad WhatsApp',
      impact: '+25% clientes recurrentes',
      priority: 'media',
      explanation: '67% prefiere comunicación WhatsApp'
    }
  ];
  
  let selectedMetric = 'revenue';
  let chartData: any[] = [];
  
  onMount(() => {
    generateChartData();
    trackDashboardUsage();
  });
  
  function generateChartData() {
    // Generate sample time series data
    const days = 7;
    chartData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      return {
        date: date.toLocaleDateString('es-AR'),
        revenue: Math.round(1000 + Math.random() * 600 + i * 50),
        bookings: Math.round(15 + Math.random() * 15 + i * 2),
        clients: Math.round(10 + Math.random() * 10 + i * 1.5)
      };
    });
  }
  
  function trackDashboardUsage() {
    uxAnalytics.trackExternalEvent('provider_analytics_view', {
      providerId,
      timeRange,
      timestamp: Date.now()
    });
  }
  
  function switchMetric(metric: string) {
    selectedMetric = metric;
    uxAnalytics.trackExternalEvent('analytics_metric_switch', {
      metric,
      providerId,
      timestamp: Date.now()
    });
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  function getTrendColor(trend: number): string {
    return trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  }
  
  function getTrendIcon(trend: number): string {
    return trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️';
  }
</script>

<div class="advanced-analytics-dashboard space-y-6">
  <!-- Header with Time Range Selector -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Panel de Analytics Avanzado</h2>
      <p class="text-gray-600">Insights de tu negocio en el mercado argentino</p>
    </div>
    
    <div class="flex space-x-2">
      {#each ['24h', '7d', '30d', '90d'] as range}
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          class:bg-blue-600={timeRange === range}
          class:text-white={timeRange === range}
          class:bg-gray-100={timeRange !== range}
          class:text-gray-700={timeRange !== range}
          on:click={() => timeRange = range}
        >
          {range}
        </button>
      {/each}
    </div>
  </div>

  <!-- Key Performance Indicators -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Revenue KPI -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-500">Ingresos</h3>
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          💰
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.current)}</div>
        <div class="flex items-center space-x-1">
          <span class="{getTrendColor(analyticsData.revenue.trend)} text-sm font-medium">
            {getTrendIcon(analyticsData.revenue.trend)} {analyticsData.revenue.trend > 0 ? '+' : ''}{analyticsData.revenue.trend}%
          </span>
          <span class="text-gray-500 text-xs">vs período anterior</span>
        </div>
      </div>
    </div>

    <!-- Bookings KPI -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-500">Reservas</h3>
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          📅
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-gray-900">{analyticsData.bookings.current}</div>
        <div class="flex items-center space-x-1">
          <span class="{getTrendColor(analyticsData.bookings.trend)} text-sm font-medium">
            {getTrendIcon(analyticsData.bookings.trend)} {analyticsData.bookings.trend > 0 ? '+' : ''}{analyticsData.bookings.trend}%
          </span>
          <span class="text-gray-500 text-xs">{analyticsData.bookings.completionRate}% completadas</span>
        </div>
      </div>
    </div>

    <!-- Clients KPI -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-500">Clientes</h3>
        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          👥
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-gray-900">{analyticsData.clients.new + analyticsData.clients.returning}</div>
        <div class="flex items-center space-x-1">
          <span class="text-green-600 text-sm font-medium">{analyticsData.clients.retentionRate}% retención</span>
          <span class="text-gray-500 text-xs">★ {analyticsData.clients.averageRating}</span>
        </div>
      </div>
    </div>

    <!-- Performance KPI -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-500">Rendimiento</h3>
        <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          🚀
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-gray-900">{analyticsData.performance.availabilityScore}%</div>
        <div class="flex items-center space-x-1">
          <span class="text-blue-600 text-sm font-medium">{analyticsData.performance.marketPosition}</span>
          <span class="text-gray-500 text-xs">mercado</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Chart -->
    <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Tendencias</h3>
        <div class="flex space-x-2">
          {#each ['revenue', 'bookings', 'clients'] as metric}
            <button
              class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              class:bg-blue-600={selectedMetric === metric}
              class:text-white={selectedMetric === metric}
              class:bg-gray-100={selectedMetric !== metric}
              class:text-gray-700={selectedMetric !== metric}
              on:click={() => switchMetric(metric)}
            >
              {metric === 'revenue' ? 'Ingresos' : metric === 'bookings' ? 'Reservas' : 'Clientes'}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Simple Chart Visualization -->
      <div class="space-y-4">
        {#each chartData as dataPoint, index}
          <div class="flex items-center space-x-4">
            <div class="w-16 text-sm text-gray-600">{dataPoint.date}</div>
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <div class="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    class="bg-blue-600 h-3 rounded-full transition-all duration-1000" 
                    style="width: {(dataPoint[selectedMetric] / Math.max(...chartData.map(d => d[selectedMetric]))) * 100}%"
                  ></div>
                </div>
                <div class="text-sm font-medium text-gray-700 w-20 text-right">
                  {selectedMetric === 'revenue' ? formatCurrency(dataPoint[selectedMetric]) : dataPoint[selectedMetric]}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Peak Hours -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Horarios Pico</h3>
      <div class="space-y-4">
        {#each marketInsights.peakHours as hour}
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">{hour.hour}</div>
              <div class="text-xs text-gray-500">{hour.bookings} reservas</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-gray-900">{formatCurrency(hour.revenue)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Services Performance -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">Rendimiento por Servicio</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each marketInsights.topServices as service}
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <h4 class="font-medium text-gray-900 mb-2">{service.name}</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Reservas:</span>
              <span class="font-medium">{service.bookings}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Ingresos:</span>
              <span class="font-medium">{formatCurrency(service.revenue)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Margen:</span>
              <span class="font-medium text-green-600">{service.margin}%</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Client Demographics -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Age Distribution -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Distribución por Edad</h3>
      <div class="space-y-3">
        {#each marketInsights.clientDemographics.ages as age}
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="text-sm font-medium text-gray-900">{age.range} años</div>
              <div class="flex-1 bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-blue-600 h-2 rounded-full" style="width: {age.percentage}%"></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{age.percentage}%</div>
              <div class="text-xs text-gray-500">{formatCurrency(age.revenue)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Neighborhood Distribution -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Clientes por Barrio</h3>
      <div class="space-y-3">
        {#each marketInsights.clientDemographics.neighborhoods as neighborhood}
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="text-sm font-medium text-gray-900">{neighborhood.name}</div>
              <div class="flex-1 bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-purple-600 h-2 rounded-full" style="width: {neighborhood.percentage}%"></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{neighborhood.percentage}%</div>
              <div class="text-xs text-gray-500">Prom: {formatCurrency(neighborhood.avgSpend)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Growth Recommendations -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">Recomendaciones de Crecimiento</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each growthRecommendations as rec}
        <div 
          class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
          in:fly={{ y: 20, duration: 300, delay: growthRecommendations.indexOf(rec) * 100 }}
        >
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-medium text-gray-900">{rec.category}</h4>
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              class:bg-red-100={rec.priority === 'alta'}
              class:text-red-800={rec.priority === 'alta'}
              class:bg-yellow-100={rec.priority === 'media'}
              class:text-yellow-800={rec.priority === 'media'}
            >
              {rec.priority.toUpperCase()}
            </span>
          </div>
          <p class="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-green-600">{rec.impact}</span>
            <button class="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Más info
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">{rec.explanation}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Payment Methods Breakdown -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
    <div class="space-y-4">
      {#each marketInsights.paymentMethods as payment}
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {payment.method === 'MercadoPago' ? '💳' : '💵'}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{payment.method}</div>
              <div class="text-xs text-gray-500">Trending {payment.trend}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-gray-900">{payment.percentage}%</div>
            <div class="w-20 bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: {payment.percentage}%"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>