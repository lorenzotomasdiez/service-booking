# 📊 Provider Dashboard Enhancement Components - Professional Business Management

## ProviderDashboard.svelte - Advanced Analytics & Management Hub

### Component Architecture
```typescript
// ProviderDashboard.svelte - Complete business management interface
interface ProviderDashboardProps {
  provider: Provider;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: DateRange) => void;
  realTimeUpdates: boolean;
}

interface DashboardMetrics {
  todaysRevenue: number;
  monthlyRevenue: number;
  bookingCount: number;
  completionRate: number;
  averageRating: number;
  clientRetention: number;
}
```

### Visual Design Specifications

#### Dashboard Header & Quick Stats
```html
<div class="provider-dashboard-header">
  <!-- Welcome Section -->
  <div class="dashboard-welcome bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="provider-avatar">
          <img src={provider.avatar} alt={provider.name} class="w-16 h-16 rounded-full border-4 border-white/20">
          <div class="online-status"></div>
        </div>
        <div>
          <h1 class="text-2xl font-bold">¡Hola, {provider.name}!</h1>
          <p class="text-blue-100">Miércoles, 15 de Septiembre</p>
          <div class="flex items-center mt-2 space-x-4">
            <span class="flex items-center text-blue-100 text-sm">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {provider.rating} ({provider.totalReviews} reseñas)
            </span>
            {#if provider.isVerified}
              <span class="flex items-center bg-green-500/20 text-green-100 text-xs px-2 py-1 rounded-full">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Verificado
              </span>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="flex space-x-3">
        <button class="quick-action-btn">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Nueva cita
        </button>
        <button class="quick-action-btn">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          Mensajes
        </button>
      </div>
    </div>
  </div>
  
  <!-- Key Performance Metrics -->
  <div class="dashboard-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Today's Revenue -->
    <div class="metric-card featured">
      <div class="metric-icon bg-green-100 text-green-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-label">Ingresos de hoy</div>
        <div class="metric-value">$12.500</div>
        <div class="metric-change positive">+15% vs ayer</div>
      </div>
    </div>
    
    <!-- Monthly Progress -->
    <div class="metric-card">
      <div class="metric-icon bg-blue-100 text-blue-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-label">Progreso mensual</div>
        <div class="metric-value">$87.340</div>
        <div class="metric-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 73%"></div>
          </div>
          <div class="progress-text">73% de la meta</div>
        </div>
      </div>
    </div>
    
    <!-- Booking Completion Rate -->
    <div class="metric-card">
      <div class="metric-icon bg-purple-100 text-purple-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-label">Tasa de completación</div>
        <div class="metric-value">94%</div>
        <div class="metric-change positive">+2% vs mes anterior</div>
      </div>
    </div>
    
    <!-- Client Retention -->
    <div class="metric-card">
      <div class="metric-icon bg-orange-100 text-orange-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-label">Retención de clientes</div>
        <div class="metric-value">87%</div>
        <div class="metric-change positive">+5% vs mes anterior</div>
      </div>
    </div>
  </div>
</div>

<style>
.dashboard-welcome {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
}

.provider-avatar {
  position: relative;
  
  .online-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    background: #10b981;
    border: 3px solid white;
    border-radius: 50%;
  }
}

.quick-action-btn {
  @apply bg-white/20 hover:bg-white/30 text-white;
  @apply px-4 py-2 rounded-lg font-medium text-sm;
  @apply flex items-center transition-colors duration-200;
  @apply backdrop-blur-sm;
}

.metric-card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  @apply hover:shadow-md transition-shadow duration-200;
  
  &.featured {
    @apply ring-2 ring-green-500 ring-opacity-20;
    @apply bg-gradient-to-br from-green-50 to-white;
  }
  
  .metric-icon {
    @apply w-12 h-12 rounded-xl flex items-center justify-center mb-4;
  }
  
  .metric-label {
    @apply text-sm text-gray-600 mb-1;
  }
  
  .metric-value {
    @apply text-2xl font-bold text-gray-900 mb-2;
  }
  
  .metric-change {
    @apply text-sm font-medium;
    
    &.positive {
      @apply text-green-600;
    }
    
    &.negative {
      @apply text-red-600;
    }
  }
  
  .metric-progress {
    .progress-bar {
      @apply w-full bg-gray-200 rounded-full h-2 mb-2;
      
      .progress-fill {
        @apply bg-blue-600 h-2 rounded-full transition-all duration-500;
      }
    }
    
    .progress-text {
      @apply text-xs text-gray-500;
    }
  }
}
</style>
```

#### Advanced Calendar Management
```html
<div class="provider-calendar-management">
  <!-- Calendar Header -->
  <div class="calendar-header bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Gestión de Agenda</h2>
        <p class="text-gray-600">Administra tu disponibilidad y citas</p>
      </div>
      
      <!-- Calendar Views Toggle -->
      <div class="view-toggle">
        <div class="toggle-group">
          <button class="toggle-btn active" data-view="day">Día</button>
          <button class="toggle-btn" data-view="week">Semana</button>
          <button class="toggle-btn" data-view="month">Mes</button>
        </div>
      </div>
    </div>
    
    <!-- Date Navigation -->
    <div class="date-navigation flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button class="nav-btn" onclick="previousPeriod()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <h3 class="current-period text-lg font-semibold text-gray-900">
          Miércoles, 15 de Septiembre 2025
        </h3>
        
        <button class="nav-btn" onclick="nextPeriod()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      
      <!-- Quick Actions -->
      <div class="calendar-actions flex items-center space-x-3">
        <button class="action-btn secondary" onclick="goToToday()">
          Hoy
        </button>
        <button class="action-btn primary" onclick="openAvailabilitySettings()">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
          </svg>
          Configurar horarios
        </button>
      </div>
    </div>
  </div>
  
  <!-- Day View Calendar -->
  <div class="day-view-calendar bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Time Slots Grid -->
    <div class="time-slots-grid">
      <!-- Time Labels -->
      <div class="time-labels">
        {#each Array.from({length: 13}, (_, i) => i + 8) as hour}
          <div class="time-label">
            {hour.toString().padStart(2, '0')}:00
          </div>
        {/each}
      </div>
      
      <!-- Appointment Slots -->
      <div class="appointment-slots">
        <!-- Available Slot -->
        <div class="time-slot available" data-time="09:00" onclick="createBooking('09:00')">
          <div class="slot-content">
            <div class="slot-time">09:00 - 09:45</div>
            <div class="slot-status">Disponible</div>
            <div class="slot-action">+ Agregar cita</div>
          </div>
        </div>
        
        <!-- Booked Appointment -->
        <div class="time-slot booked" data-time="10:00" onclick="editBooking('booking-123')">
          <div class="appointment-card">
            <div class="appointment-header">
              <div class="client-info">
                <div class="client-avatar">
                  <img src="/api/placeholder/32/32" alt="Juan" class="w-8 h-8 rounded-full">
                </div>
                <div class="client-details">
                  <div class="client-name">Juan Pérez</div>
                  <div class="client-phone">+54 11 1234-5678</div>
                </div>
              </div>
              <div class="appointment-status confirmed">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            
            <div class="appointment-details">
              <div class="service-info">
                <span class="service-name">Corte + Barba</span>
                <span class="service-duration">45 min</span>
              </div>
              <div class="appointment-time">10:00 - 10:45</div>
              <div class="appointment-price">$2.500</div>
            </div>
            
            <div class="appointment-notes">
              Quiere que le dejes la barba más corta
            </div>
          </div>
        </div>
        
        <!-- Break Time -->
        <div class="time-slot break" data-time="13:00">
          <div class="slot-content">
            <div class="break-icon">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="break-text">
              <div class="break-title">Almuerzo</div>
              <div class="break-time">13:00 - 14:00</div>
            </div>
          </div>
        </div>
        
        <!-- Pending Confirmation -->
        <div class="time-slot pending" data-time="15:00" onclick="handlePendingBooking('booking-456')">
          <div class="appointment-card pending">
            <div class="appointment-header">
              <div class="client-info">
                <div class="client-avatar">
                  <div class="avatar-placeholder">M</div>
                </div>
                <div class="client-details">
                  <div class="client-name">María González</div>
                  <div class="client-phone">+54 11 9876-5432</div>
                </div>
              </div>
              <div class="appointment-status pending">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            
            <div class="appointment-details">
              <div class="service-info">
                <span class="service-name">Tratamiento Capilar</span>
                <span class="service-duration">90 min</span>
              </div>
              <div class="appointment-time">15:00 - 16:30</div>
              <div class="appointment-price">$3.500</div>
            </div>
            
            <div class="pending-actions">
              <button class="confirm-btn" onclick="confirmBooking('booking-456')">
                Confirmar
              </button>
              <button class="reject-btn" onclick="rejectBooking('booking-456')">
                Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.view-toggle {
  .toggle-group {
    @apply flex bg-gray-100 rounded-lg p-1;
  }
  
  .toggle-btn {
    @apply px-4 py-2 rounded-md text-sm font-medium transition-colors;
    @apply text-gray-600 hover:text-gray-900;
    
    &.active {
      @apply bg-white text-blue-600 shadow-sm;
    }
  }
}

.nav-btn {
  @apply p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900;
  @apply transition-colors duration-200;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium text-sm;
  @apply flex items-center transition-colors duration-200;
  
  &.primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  
  &.secondary {
    @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  }
}

.time-slots-grid {
  @apply flex min-h-96;
  
  .time-labels {
    @apply w-20 bg-gray-50 border-r border-gray-200;
    
    .time-label {
      @apply h-16 flex items-center justify-center text-sm text-gray-600;
      @apply border-b border-gray-100;
    }
  }
  
  .appointment-slots {
    @apply flex-1 relative;
  }
}

.time-slot {
  @apply absolute left-0 right-0 border-b border-gray-100;
  @apply cursor-pointer transition-all duration-200;
  height: 64px; // 1 hour = 64px
  
  &.available {
    @apply hover:bg-blue-50;
    
    .slot-content {
      @apply p-4 h-full flex flex-col justify-center items-center;
      @apply border-2 border-dashed border-gray-200 rounded-lg mx-2;
      @apply hover:border-blue-300 transition-colors;
      
      .slot-time {
        @apply text-sm font-medium text-gray-600;
      }
      
      .slot-status {
        @apply text-xs text-gray-500;
      }
      
      .slot-action {
        @apply text-xs text-blue-600 mt-1;
        @apply opacity-0 group-hover:opacity-100 transition-opacity;
      }
    }
  }
  
  &.booked {
    .appointment-card {
      @apply bg-white border border-gray-200 rounded-lg shadow-sm m-2 p-3;
      @apply hover:shadow-md transition-shadow;
    }
  }
  
  &.break {
    @apply bg-orange-50;
    
    .slot-content {
      @apply flex items-center justify-center p-4 h-full;
      
      .break-icon {
        @apply mr-3;
      }
      
      .break-title {
        @apply font-medium text-orange-900;
      }
      
      .break-time {
        @apply text-xs text-orange-700;
      }
    }
  }
  
  &.pending {
    .appointment-card {
      @apply bg-yellow-50 border border-yellow-200 rounded-lg m-2 p-3;
    }
  }
}

.appointment-header {
  @apply flex items-center justify-between mb-2;
  
  .client-info {
    @apply flex items-center space-x-2;
    
    .client-name {
      @apply font-semibold text-gray-900 text-sm;
    }
    
    .client-phone {
      @apply text-xs text-gray-500;
    }
  }
  
  .appointment-status {
    @apply w-6 h-6 rounded-full flex items-center justify-center;
    
    &.confirmed {
      @apply bg-green-100 text-green-600;
    }
    
    &.pending {
      @apply bg-yellow-100 text-yellow-600;
    }
  }
}

.appointment-details {
  @apply flex items-center justify-between mb-2 text-xs;
  
  .service-info {
    @apply flex items-center space-x-2;
    
    .service-name {
      @apply font-medium text-gray-900;
    }
    
    .service-duration {
      @apply text-gray-500;
    }
  }
  
  .appointment-time {
    @apply text-gray-600;
  }
  
  .appointment-price {
    @apply font-semibold text-green-600;
  }
}

.appointment-notes {
  @apply text-xs text-gray-600 italic bg-gray-50 p-2 rounded;
}

.pending-actions {
  @apply flex space-x-2 mt-2;
  
  .confirm-btn, .reject-btn {
    @apply px-3 py-1 rounded text-xs font-medium;
  }
  
  .confirm-btn {
    @apply bg-green-600 text-white hover:bg-green-700;
  }
  
  .reject-btn {
    @apply bg-red-600 text-white hover:bg-red-700;
  }
}

.avatar-placeholder {
  @apply w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center;
  @apply text-white font-semibold text-sm;
}
</style>
```

#### Revenue Analytics Dashboard
```html
<div class="revenue-analytics-dashboard">
  <!-- Analytics Header -->
  <div class="analytics-header bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Análisis de Ingresos</h2>
        <p class="text-gray-600">Seguimiento detallado de tu rendimiento financiero</p>
      </div>
      
      <!-- Date Range Selector -->
      <div class="date-range-selector">
        <div class="flex items-center space-x-2">
          <button class="range-btn active" data-range="7d">7 días</button>
          <button class="range-btn" data-range="30d">30 días</button>
          <button class="range-btn" data-range="90d">90 días</button>
          <button class="range-btn" data-range="custom">Personalizado</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Revenue Chart -->
  <div class="revenue-chart-container bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <div class="chart-header flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Ingresos por día</h3>
        <p class="text-sm text-gray-600">Últimos 30 días</p>
      </div>
      
      <div class="chart-legend flex items-center space-x-4">
        <div class="legend-item">
          <div class="legend-color bg-blue-500"></div>
          <span class="legend-label">Ingresos</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-green-500"></div>
          <span class="legend-label">Meta</span>
        </div>
      </div>
    </div>
    
    <!-- Chart Container -->
    <div class="chart-area">
      <canvas id="revenueChart" class="w-full h-64"></canvas>
    </div>
    
    <!-- Chart Summary -->
    <div class="chart-summary grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
      <div class="summary-item">
        <div class="summary-label">Total del período</div>
        <div class="summary-value">$87.340</div>
        <div class="summary-change positive">+12% vs anterior</div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">Promedio diario</div>
        <div class="summary-value">$2.911</div>
        <div class="summary-change positive">+8% vs anterior</div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">Día más exitoso</div>
        <div class="summary-value">$4.750</div>
        <div class="summary-date">15 Sept</div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">Meta mensual</div>
        <div class="summary-value">$120.000</div>
        <div class="summary-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 73%"></div>
          </div>
          <div class="progress-text">73% completado</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Service Performance -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Top Services -->
    <div class="top-services bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-6">Servicios más populares</h3>
      
      <div class="service-list space-y-4">
        <div class="service-item">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="service-icon bg-blue-100 text-blue-600">
                <span class="text-lg">✂️</span>
              </div>
              <div>
                <div class="service-name">Corte Clásico</div>
                <div class="service-stats">45 servicios este mes</div>
              </div>
            </div>
            
            <div class="text-right">
              <div class="service-revenue">$67.500</div>
              <div class="service-percentage">43% del total</div>
            </div>
          </div>
          
          <div class="service-progress mt-3">
            <div class="progress-bar">
              <div class="progress-fill bg-blue-500" style="width: 43%"></div>
            </div>
          </div>
        </div>
        
        <div class="service-item">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="service-icon bg-green-100 text-green-600">
                <span class="text-lg">🧔</span>
              </div>
              <div>
                <div class="service-name">Barba Completa</div>
                <div class="service-stats">32 servicios este mes</div>
              </div>
            </div>
            
            <div class="text-right">
              <div class="service-revenue">$24.000</div>
              <div class="service-percentage">15% del total</div>
            </div>
          </div>
          
          <div class="service-progress mt-3">
            <div class="progress-bar">
              <div class="progress-fill bg-green-500" style="width: 15%"></div>
            </div>
          </div>
        </div>
        
        <div class="service-item">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="service-icon bg-purple-100 text-purple-600">
                <span class="text-lg">💆</span>
              </div>
              <div>
                <div class="service-name">Tratamiento Capilar</div>
                <div class="service-stats">18 servicios este mes</div>
              </div>
            </div>
            
            <div class="text-right">
              <div class="service-revenue">$63.000</div>
              <div class="service-percentage">40% del total</div>
            </div>
          </div>
          
          <div class="service-progress mt-3">
            <div class="progress-bar">
              <div class="progress-fill bg-purple-500" style="width: 40%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <button class="view-all-btn mt-4 w-full">
        Ver análisis completo de servicios
      </button>
    </div>
    
    <!-- Peak Hours Analysis -->
    <div class="peak-hours bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-6">Horarios de mayor demanda</h3>
      
      <div class="hours-heatmap">
        <div class="heatmap-grid">
          <!-- Days of week labels -->
          <div class="day-labels">
            <div class="day-label">L</div>
            <div class="day-label">M</div>
            <div class="day-label">M</div>
            <div class="day-label">J</div>
            <div class="day-label">V</div>
            <div class="day-label">S</div>
          </div>
          
          <!-- Hour labels -->
          <div class="hour-labels">
            {#each Array.from({length: 12}, (_, i) => i + 9) as hour}
              <div class="hour-label">{hour}</div>
            {/each}
          </div>
          
          <!-- Heatmap cells -->
          <div class="heatmap-cells">
            {#each Array(72) as _, index}
              <div class="heatmap-cell intensity-{Math.floor(Math.random() * 5)}"></div>
            {/each}
          </div>
        </div>
        
        <!-- Heatmap Legend -->
        <div class="heatmap-legend flex items-center justify-center mt-4 space-x-2">
          <span class="text-xs text-gray-600">Menos</span>
          {#each Array(5) as _, intensity}
            <div class="legend-cell intensity-{intensity}"></div>
          {/each}
          <span class="text-xs text-gray-600">Más</span>
        </div>
      </div>
      
      <!-- Peak Hours Summary -->
      <div class="peak-summary mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-900 mb-2">Horarios pico</h4>
        <div class="peak-times space-y-2">
          <div class="peak-time">
            <span class="time-range">10:00 - 12:00</span>
            <span class="peak-label">Mañana ocupada</span>
            <span class="booking-rate">85% ocupación</span>
          </div>
          <div class="peak-time">
            <span class="time-range">15:00 - 17:00</span>
            <span class="peak-label">Tarde exitosa</span>
            <span class="booking-rate">78% ocupación</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.range-btn {
  @apply px-3 py-1.5 rounded-lg text-sm font-medium;
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100;
  @apply transition-colors duration-200;
  
  &.active {
    @apply bg-blue-600 text-white;
  }
}

.chart-legend {
  .legend-item {
    @apply flex items-center space-x-2;
    
    .legend-color {
      @apply w-3 h-3 rounded-sm;
    }
    
    .legend-label {
      @apply text-sm text-gray-600;
    }
  }
}

.summary-item {
  .summary-label {
    @apply text-sm text-gray-600 mb-1;
  }
  
  .summary-value {
    @apply text-xl font-bold text-gray-900 mb-1;
  }
  
  .summary-change {
    @apply text-sm font-medium;
    
    &.positive {
      @apply text-green-600;
    }
    
    &.negative {
      @apply text-red-600;
    }
  }
  
  .summary-date {
    @apply text-sm text-gray-500;
  }
}

.service-item {
  @apply p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow;
  
  .service-icon {
    @apply w-10 h-10 rounded-lg flex items-center justify-center;
  }
  
  .service-name {
    @apply font-semibold text-gray-900;
  }
  
  .service-stats {
    @apply text-sm text-gray-600;
  }
  
  .service-revenue {
    @apply font-bold text-gray-900;
  }
  
  .service-percentage {
    @apply text-sm text-gray-500;
  }
  
  .service-progress {
    .progress-bar {
      @apply w-full bg-gray-200 rounded-full h-1.5;
      
      .progress-fill {
        @apply h-1.5 rounded-full;
      }
    }
  }
}

.heatmap-grid {
  @apply relative;
  
  .day-labels {
    @apply flex justify-center space-x-2 mb-2;
    
    .day-label {
      @apply w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600;
    }
  }
  
  .hour-labels {
    @apply absolute left-0 top-8 space-y-2;
    
    .hour-label {
      @apply w-6 h-6 flex items-center justify-center text-xs text-gray-500;
    }
  }
  
  .heatmap-cells {
    @apply grid grid-cols-6 gap-1 ml-8 mt-8;
    
    .heatmap-cell {
      @apply w-6 h-6 rounded-sm;
      
      &.intensity-0 { @apply bg-gray-100; }
      &.intensity-1 { @apply bg-blue-200; }
      &.intensity-2 { @apply bg-blue-400; }
      &.intensity-3 { @apply bg-blue-600; }
      &.intensity-4 { @apply bg-blue-800; }
    }
  }
}

.legend-cell {
  @apply w-3 h-3 rounded-sm;
  
  &.intensity-0 { @apply bg-gray-100; }
  &.intensity-1 { @apply bg-blue-200; }
  &.intensity-2 { @apply bg-blue-400; }
  &.intensity-3 { @apply bg-blue-600; }
  &.intensity-4 { @apply bg-blue-800; }
}

.peak-time {
  @apply flex items-center justify-between text-sm;
  
  .time-range {
    @apply font-semibold text-blue-900;
  }
  
  .peak-label {
    @apply text-blue-700;
  }
  
  .booking-rate {
    @apply text-blue-600 font-medium;
  }
}

.view-all-btn {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg;
  @apply hover:bg-gray-200 transition-colors duration-200;
  @apply text-sm font-medium;
}
</style>
```

#### Client Communication Hub
```html
<div class="client-communication-hub">
  <!-- Communication Header -->
  <div class="communication-header bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Centro de Comunicación</h2>
        <p class="text-gray-600">Gestiona mensajes y notificaciones con tus clientes</p>
      </div>
      
      <!-- Quick Stats -->
      <div class="communication-stats flex space-x-6">
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">Sin leer</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">12</div>
          <div class="stat-label">Hoy</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">89%</div>
          <div class="stat-label">Respuesta</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Message Center -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Message List -->
    <div class="message-list bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="list-header bg-gray-50 p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Mensajes</h3>
          <button class="compose-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </button>
        </div>
        
        <!-- Search Bar -->
        <div class="mt-4 relative">
          <input 
            type="text" 
            placeholder="Buscar conversaciones..."
            class="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>
      
      <div class="message-items">
        <!-- Unread Message -->
        <div class="message-item unread active">
          <div class="client-avatar">
            <img src="/api/placeholder/40/40" alt="Ana" class="w-10 h-10 rounded-full">
            <div class="online-indicator"></div>
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <div class="client-name">Ana Rodríguez</div>
              <div class="message-time">10:45</div>
            </div>
            
            <div class="message-preview">
              ¿Puedo cambiar mi cita de mañana para el viernes?
            </div>
            
            <div class="message-indicators">
              <span class="unread-badge">2</span>
              <span class="message-type">WhatsApp</span>
            </div>
          </div>
        </div>
        
        <!-- Regular Message -->
        <div class="message-item">
          <div class="client-avatar">
            <img src="/api/placeholder/40/40" alt="Carlos" class="w-10 h-10 rounded-full">
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <div class="client-name">Carlos López</div>
              <div class="message-time">Ayer</div>
            </div>
            
            <div class="message-preview">
              Perfecto, gracias! Nos vemos el jueves 👍
            </div>
            
            <div class="message-indicators">
              <span class="message-type">SMS</span>
              <svg class="read-indicator w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- System Message -->
        <div class="message-item system">
          <div class="system-avatar">
            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <div class="client-name">Sistema</div>
              <div class="message-time">2h</div>
            </div>
            
            <div class="message-preview">
              Recordatorio enviado a María González para cita de mañana
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chat Interface -->
    <div class="chat-interface lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <!-- Chat Header -->
      <div class="chat-header bg-gray-50 p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img src="/api/placeholder/40/40" alt="Ana" class="w-10 h-10 rounded-full">
            <div>
              <div class="client-name font-semibold text-gray-900">Ana Rodríguez</div>
              <div class="client-status text-sm text-green-600 flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                En línea
              </div>
            </div>
          </div>
          
          <div class="chat-actions flex items-center space-x-2">
            <button class="action-btn" onclick="callClient()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </button>
            
            <button class="action-btn" onclick="openWhatsApp()">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </button>
            
            <button class="action-btn" onclick="viewClientProfile()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Messages Area -->
      <div class="messages-area flex-1 p-4 space-y-4 overflow-y-auto max-h-96">
        <!-- Client Message -->
        <div class="message client">
          <div class="message-bubble">
            Hola! ¿Puedo cambiar mi cita de mañana a las 2 PM para el viernes a la misma hora?
          </div>
          <div class="message-meta">
            <span class="message-time">10:45</span>
          </div>
        </div>
        
        <!-- Provider Message -->
        <div class="message provider">
          <div class="message-bubble">
            ¡Hola Ana! Por supuesto, déjame revisar mi agenda del viernes...
          </div>
          <div class="message-meta">
            <span class="message-time">10:46</span>
            <svg class="read-status w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
        
        <!-- Provider Message -->
        <div class="message provider">
          <div class="message-bubble">
            Perfecto, tengo disponible el viernes a las 2 PM. ¿Te parece bien? Te actualizo la reserva 👍
          </div>
          <div class="message-meta">
            <span class="message-time">10:48</span>
            <svg class="read-status w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
        
        <!-- Client Typing Indicator -->
        <div class="typing-indicator">
          <div class="typing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <span class="typing-text">Ana está escribiendo...</span>
        </div>
      </div>
      
      <!-- Message Input -->
      <div class="message-input bg-gray-50 p-4 border-t border-gray-200">
        <div class="input-container flex items-end space-x-3">
          <!-- Quick Actions -->
          <button class="quick-action-btn" onclick="openTemplates()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </button>
          
          <!-- Text Input -->
          <div class="input-wrapper flex-1">
            <textarea 
              placeholder="Escribir mensaje..."
              class="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="1"
              onInput="autoResize(this)"
            ></textarea>
          </div>
          
          <!-- Send Button -->
          <button class="send-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        
        <!-- Quick Templates -->
        <div class="quick-templates mt-3 flex flex-wrap gap-2">
          <button class="template-btn">Confirmación de cita</button>
          <button class="template-btn">Recordatorio 24h</button>
          <button class="template-btn">Cambio de horario</button>
          <button class="template-btn">Agradecimiento</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.communication-stats {
  .stat-item {
    @apply text-center;
    
    .stat-value {
      @apply text-2xl font-bold text-gray-900;
    }
    
    .stat-label {
      @apply text-sm text-gray-600;
    }
  }
}

.message-item {
  @apply flex items-start space-x-3 p-4 border-b border-gray-100;
  @apply hover:bg-gray-50 cursor-pointer transition-colors;
  
  &.unread {
    @apply bg-blue-50 border-l-4 border-l-blue-500;
  }
  
  &.active {
    @apply bg-blue-100;
  }
  
  &.system {
    .system-avatar {
      @apply w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center;
    }
  }
  
  .message-content {
    @apply flex-1 min-w-0;
    
    .message-header {
      @apply flex items-center justify-between mb-1;
      
      .client-name {
        @apply font-semibold text-gray-900 text-sm;
      }
      
      .message-time {
        @apply text-xs text-gray-500;
      }
    }
    
    .message-preview {
      @apply text-sm text-gray-600 line-clamp-2 mb-2;
    }
    
    .message-indicators {
      @apply flex items-center space-x-2;
      
      .unread-badge {
        @apply bg-blue-600 text-white text-xs px-2 py-1 rounded-full;
      }
      
      .message-type {
        @apply bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full;
      }
    }
  }
}

.action-btn {
  @apply p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900;
  @apply transition-colors duration-200;
}

.message {
  @apply flex flex-col max-w-xs;
  
  &.client {
    @apply items-start;
    
    .message-bubble {
      @apply bg-gray-100 text-gray-900 rounded-lg p-3;
    }
  }
  
  &.provider {
    @apply items-end self-end;
    
    .message-bubble {
      @apply bg-blue-600 text-white rounded-lg p-3;
    }
  }
  
  .message-meta {
    @apply flex items-center space-x-2 mt-1;
    
    .message-time {
      @apply text-xs text-gray-500;
    }
  }
}

.typing-indicator {
  @apply flex items-center space-x-2 text-gray-500 text-sm;
  
  .typing-dots {
    @apply flex space-x-1;
    
    .dot {
      @apply w-2 h-2 bg-gray-400 rounded-full animate-pulse;
      animation-delay: calc(var(--i) * 0.3s);
    }
  }
}

.quick-action-btn {
  @apply p-2 rounded-lg text-gray-600 hover:bg-gray-200;
  @apply transition-colors duration-200;
}

.send-btn {
  @apply p-3 bg-blue-600 text-white rounded-lg;
  @apply hover:bg-blue-700 transition-colors duration-200;
}

.template-btn {
  @apply px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg;
  @apply hover:bg-gray-200 transition-colors duration-200;
}
</style>
```

This provider dashboard enhancement provides comprehensive business management tools with advanced calendar management, revenue analytics, and client communication features specifically designed for Argentina's service booking market.