<!--
  PAY8-001: Advanced Payment Features Component - Day 8
  Comprehensive payment features showcase for Argentina market
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  // Stores
  const paymentFeatures = writable({
    subscriptionBilling: null,
    installmentOptimization: null,
    loyaltyPoints: null,
    psychologyFeatures: null,
    fraudDetection: null,
    performanceAnalytics: null,
  });

  const isLoading = writable(true);
  const error = writable(null);

  // Component state
  let activeTab = 'subscription';
  let selectedProvider = '';
  let paymentAmount = 15000;
  let selectedInstallments = 3;

  // Sample data
  const sampleProviders = [
    { id: 'prov_001', name: 'Maria Rodriguez - Hair Stylist', tier: 'premium' },
    { id: 'prov_002', name: 'Carlos Mendez - Barber', tier: 'high_volume' },
    { id: 'prov_003', name: 'Ana Garcia - Psychology', tier: 'standard' },
  ];

  const tabs = [
    { id: 'subscription', label: 'Suscripciones Avanzadas', icon: '💳' },
    { id: 'installments', label: 'Cuotas Inteligentes', icon: '📊' },
    { id: 'loyalty', label: 'Puntos y Recompensas', icon: '🎁' },
    { id: 'psychology', label: 'Psicología y Obras Sociales', icon: '🧠' },
    { id: 'fraud', label: 'Detección de Fraude', icon: '🛡️' },
    { id: 'analytics', label: 'Analytics de Pagos', icon: '📈' },
  ];

  onMount(async () => {
    try {
      // Load advanced payment features
      await Promise.all([
        loadSubscriptionBilling(),
        loadInstallmentOptimization(),
        loadLoyaltyPoints(),
        loadPsychologyFeatures(),
        loadFraudDetection(),
        loadPerformanceAnalytics(),
      ]);
    } catch (err) {
      error.set(err.message);
    } finally {
      isLoading.set(false);
    }
  });

  async function loadSubscriptionBilling() {
    const response = await fetch('/api/v1/payments/advanced/subscription-billing', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        subscriptionBilling: data.data,
      }));
    }
  }

  async function loadInstallmentOptimization() {
    const response = await fetch('/api/v1/payments/advanced/installment-optimization', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        installmentOptimization: data.data,
      }));
    }
  }

  async function loadLoyaltyPoints() {
    const response = await fetch('/api/v1/payments/advanced/loyalty-points', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        loyaltyPoints: data.data,
      }));
    }
  }

  async function loadPsychologyFeatures() {
    const response = await fetch('/api/v1/payments/psychology/features', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        psychologyFeatures: data.data,
      }));
    }
  }

  async function loadFraudDetection() {
    const response = await fetch('/api/v1/payments/intelligence/fraud-detection', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        fraudDetection: data.data,
      }));
    }
  }

  async function loadPerformanceAnalytics() {
    const response = await fetch('/api/v1/payments/intelligence/performance-analytics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    const data = await response.json();
    if (data.success) {
      paymentFeatures.update(features => ({
        ...features,
        performanceAnalytics: data.data,
      }));
    }
  }

  async function calculateDynamicCommission() {
    if (!selectedProvider) return;
    
    try {
      const response = await fetch('/api/v1/payments/advanced/dynamic-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          providerId: selectedProvider,
          amount: paymentAmount,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (err) {
      console.error('Error calculating dynamic commission:', err);
    }
  }

  async function getPaymentRecommendations() {
    try {
      const response = await fetch('/api/v1/payments/advanced/method-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          serviceType: 'beauty',
          userProfile: {
            preferredMethods: ['mercadopago_wallet', 'credit_card'],
            installmentHistory: [3, 6, 3],
            locationProvince: 'CABA',
          },
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (err) {
      console.error('Error getting payment recommendations:', err);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  }

  function formatPercentage(value) {
    return `${(value * 100).toFixed(2)}%`;
  }
</script>

<div class="advanced-payment-features">
  <div class="header">
    <h1>🚀 PAY8-001: Funciones Avanzadas de Pago</h1>
    <p class="subtitle">
      Sistema de pagos de próxima generación optimizado para Argentina
    </p>
  </div>

  {#if $isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando funciones avanzadas de pago...</p>
    </div>
  {:else if $error}
    <div class="error">
      <h3>Error al cargar las funciones</h3>
      <p>{$error}</p>
    </div>
  {:else}
    <div class="tabs">
      {#each tabs as tab}
        <button
          class="tab {activeTab === tab.id ? 'active' : ''}"
          on:click={() => activeTab = tab.id}
        >
          <span class="icon">{tab.icon}</span>
          <span class="label">{tab.label}</span>
        </button>
      {/each}
    </div>

    <div class="tab-content">
      {#if activeTab === 'subscription'}
        <div class="subscription-billing">
          <h2>💳 Facturación de Suscripciones Avanzada</h2>
          
          {#if $paymentFeatures.subscriptionBilling}
            <div class="plans-grid">
              <div class="provider-plans">
                <h3>Planes para Proveedores</h3>
                {#each $paymentFeatures.subscriptionBilling.flexiblePlans.providerPlans as plan}
                  <div class="plan-card {plan.id}">
                    <h4>{plan.name}</h4>
                    <div class="price">{formatCurrency(plan.price)}</div>
                    <div class="commission">
                      Comisión: {formatPercentage(plan.commissionRate)}
                    </div>
                    <ul class="features">
                      {#each plan.features as feature}
                        <li>✅ {feature}</li>
                      {/each}
                    </ul>
                    {#if plan.trialDays > 0}
                      <div class="trial">🎁 {plan.trialDays} días gratis</div>
                    {/if}
                  </div>
                {/each}
              </div>

              <div class="client-plans">
                <h3>Planes para Clientes</h3>
                {#each $paymentFeatures.subscriptionBilling.flexiblePlans.clientPlans as plan}
                  <div class="plan-card {plan.id}">
                    <h4>{plan.name}</h4>
                    <div class="price">{formatCurrency(plan.price)}</div>
                    {#if plan.discountPercentage > 0}
                      <div class="discount">
                        {plan.discountPercentage}% descuento
                      </div>
                    {/if}
                    <ul class="benefits">
                      {#each plan.benefits as benefit}
                        <li>🌟 {benefit}</li>
                      {/each}
                    </ul>
                    {#if plan.familyAccounts}
                      <div class="family">👨‍👩‍👧‍👦 Cuentas familiares</div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <div class="dynamic-commission">
              <h3>🎯 Comisión Dinámica</h3>
              <div class="commission-calculator">
                <label>
                  Proveedor:
                  <select bind:value={selectedProvider}>
                    <option value="">Seleccionar proveedor</option>
                    {#each sampleProviders as provider}
                      <option value={provider.id}>
                        {provider.name} ({provider.tier})
                      </option>
                    {/each}
                  </select>
                </label>
                
                <label>
                  Monto:
                  <input 
                    type="number" 
                    bind:value={paymentAmount} 
                    min="100" 
                    step="100"
                  >
                </label>
                
                {#if selectedProvider}
                  <button on:click={calculateDynamicCommission}>
                    Calcular Comisión
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'installments'}
        <div class="installment-optimization">
          <h2>📊 Optimización de Cuotas para Argentina</h2>
          
          {#if $paymentFeatures.installmentOptimization}
            <div class="argentina-preferences">
              <h3>🇦🇷 Adaptaciones Culturales</h3>
              <div class="cultural-grid">
                {#each Object.entries($paymentFeatures.installmentOptimization.argentinaPreferences.culturalAdaptation) as [key, value]}
                  <div class="cultural-item">
                    <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>
                    <span>{value}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="smart-recommendations">
              <h3>🎯 Recomendaciones Inteligentes</h3>
              <div class="amount-calculator">
                <label>
                  Monto del servicio:
                  <input 
                    type="number" 
                    bind:value={paymentAmount} 
                    min="1000" 
                    step="500"
                  >
                </label>
                
                {#each Object.entries($paymentFeatures.installmentOptimization.intelligentRecommendations.amountBasedSuggestions) as [range, installments]}
                  <div class="range-suggestion">
                    <span class="range">{range}:</span>
                    <div class="installments">
                      {#each installments as installment}
                        <button 
                          class="installment-option {selectedInstallments === installment ? 'selected' : ''}"
                          on:click={() => selectedInstallments = installment}
                        >
                          {installment} cuota{installment > 1 ? 's' : ''}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="seasonal-promotions">
              <h3>🎄 Promociones Estacionales</h3>
              {#each Object.entries($paymentFeatures.installmentOptimization.argentinaPreferences.seasonalAdjustments) as [season, details]}
                <div class="season-card">
                  <h4>{season.replace('_', ' ').toUpperCase()}</h4>
                  <p><strong>Meses:</strong> {details.months.join(', ')}</p>
                  <p><strong>Máximo cuotas:</strong> {details.max_installments}</p>
                  <p><strong>Sin interés:</strong> {details.interest_free_options.join(', ')} cuotas</p>
                  <p><strong>Promoción:</strong> {details.promotion}</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      {:else if activeTab === 'loyalty'}
        <div class="loyalty-points">
          <h2>🎁 Sistema de Puntos y Recompensas</h2>
          
          {#if $paymentFeatures.loyaltyPoints}
            <div class="points-structure">
              <h3>⭐ Estructura de Puntos</h3>
              <div class="earning-rates">
                {#each Object.entries($paymentFeatures.loyaltyPoints.pointsStructure.earningRates) as [activity, points]}
                  <div class="earning-item">
                    <span class="activity">{activity.replace(/_/g, ' ')}</span>
                    <span class="points">{points} puntos</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="redemption-options">
              <h3>🎯 Opciones de Canje</h3>
              <div class="rewards-grid">
                {#each $paymentFeatures.loyaltyPoints.redemptionOptions as reward}
                  <div class="reward-card">
                    <h4>{reward.name}</h4>
                    <p>{reward.description}</p>
                    <div class="points-required">
                      {reward.pointsRequired} puntos
                    </div>
                    <div class="discount-value">
                      {formatCurrency(reward.discount)}
                    </div>
                    <p class="restrictions">{reward.restrictions}</p>
                  </div>
                {/each}
              </div>
            </div>

            <div class="tier-benefits">
              <h3>🏆 Niveles de Lealtad</h3>
              <div class="tiers-grid">
                {#each Object.entries($paymentFeatures.loyaltyPoints.tierBenefits) as [tier, details]}
                  <div class="tier-card {tier}">
                    <h4>{tier.toUpperCase()}</h4>
                    <div class="threshold">
                      Umbral: {details.threshold} puntos
                    </div>
                    <div class="multiplier">
                      Multiplicador: {details.multiplier}x
                    </div>
                    <ul class="benefits">
                      {#each details.benefits as benefit}
                        <li>{benefit}</li>
                      {/each}
                    </ul>
                  </div>
                {/each}
              </div>
            </div>

            <div class="argentina-integration">
              <h3>🇦🇷 Integración Argentina</h3>
              <div class="integration-features">
                <div class="mercadopago-points">
                  <h4>💰 MercadoPago Points</h4>
                  <p>{$paymentFeatures.loyaltyPoints.argentinaIntegration.mercadopagoPoints.integration}</p>
                  <p>Tasa de cambio: {$paymentFeatures.loyaltyPoints.argentinaIntegration.mercadopagoPoints.exchange_rate}</p>
                </div>
                
                <div class="local-partners">
                  <h4>🤝 Socios Locales</h4>
                  {#each Object.entries($paymentFeatures.loyaltyPoints.argentinaIntegration.localPartners) as [category, description]}
                    <div class="partner-category">
                      <strong>{category.replace(/_/g, ' ')}:</strong> {description}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'psychology'}
        <div class="psychology-features">
          <h2>🧠 Funciones de Pago para Psicología</h2>
          
          {#if $paymentFeatures.psychologyFeatures}
            <div class="obras-sociales">
              <h3>🏥 Obras Sociales Soportadas</h3>
              <div class="os-grid">
                {#each $paymentFeatures.psychologyFeatures.obras_sociales.supported_providers as provider}
                  <div class="os-card">
                    <h4>{provider.name}</h4>
                    <div class="coverage">
                      Cobertura: {provider.coverage_percentage}%
                    </div>
                    <div class="copay">
                      Copago: {formatCurrency(provider.copay_amount)}
                    </div>
                    <div class="authorization">
                      {provider.authorization_required ? '📋 Requiere autorización' : '✅ Sin autorización previa'}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="confidential-billing">
              <h3>🔒 Facturación Confidencial</h3>
              <div class="privacy-features">
                {#each Object.entries($paymentFeatures.psychologyFeatures.confidential_billing.privacy_enhancements) as [feature, enabled]}
                  <div class="privacy-item {enabled ? 'enabled' : 'disabled'}">
                    <span class="status">{enabled ? '✅' : '❌'}</span>
                    <span class="feature">{feature.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                {/each}
              </div>
              
              <div class="compliance-badges">
                <h4>Cumplimiento Normativo</h4>
                {#each Object.entries($paymentFeatures.psychologyFeatures.confidential_billing.compliance) as [standard, compliant]}
                  <div class="compliance-badge {compliant ? 'compliant' : 'non-compliant'}">
                    {standard.replace(/_/g, ' ').toUpperCase()}
                    {compliant ? '✅' : '❌'}
                  </div>
                {/each}
              </div>
            </div>

            <div class="therapy-payment-plans">
              <h3>💳 Planes de Pago para Terapia</h3>
              <div class="payment-options">
                {#each Object.entries($paymentFeatures.psychologyFeatures.therapy_payment_plans.flexible_scheduling) as [option, available]}
                  <div class="payment-option {available ? 'available' : 'unavailable'}">
                    <span class="status">{available ? '✅' : '❌'}</span>
                    <span class="option">{option.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'fraud'}
        <div class="fraud-detection">
          <h2>🛡️ Detección Inteligente de Fraude</h2>
          
          {#if $paymentFeatures.fraudDetection}
            <div class="ml-models">
              <h3>🤖 Modelos de Machine Learning</h3>
              <div class="models-grid">
                {#each Object.entries($paymentFeatures.fraudDetection.fraudDetection.ml_models) as [modelType, details]}
                  <div class="model-card">
                    <h4>{modelType.replace(/_/g, ' ').toUpperCase()}</h4>
                    <div class="model-details">
                      <p><strong>Tipo:</strong> {details.model_type}</p>
                      {#if details.accuracy}
                        <div class="accuracy">Precisión: {details.accuracy}</div>
                      {/if}
                      {#if details.features}
                        <div class="features">
                          <strong>Características:</strong>
                          <ul>
                            {#each details.features as feature}
                              <li>{feature.replace(/_/g, ' ')}</li>
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="real-time-monitoring">
              <h3>⚡ Monitoreo en Tiempo Real</h3>
              <div class="monitoring-metrics">
                {#each Object.entries($paymentFeatures.fraudDetection.fraudDetection.real_time_monitoring.velocity_checks) as [check, limit]}
                  <div class="velocity-check">
                    <span class="check-name">{check.replace(/_/g, ' ').toUpperCase()}:</span>
                    <span class="limit">{limit}</span>
                  </div>
                {/each}
              </div>
              
              <div class="risk-thresholds">
                <h4>Umbrales de Riesgo</h4>
                {#each Object.entries($paymentFeatures.fraudDetection.fraudDetection.real_time_monitoring.risk_thresholds) as [level, threshold]}
                  <div class="risk-level {level}">
                    <span class="level">{level.replace('_', ' ').toUpperCase()}:</span>
                    <span class="threshold">{threshold}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'analytics'}
        <div class="performance-analytics">
          <h2>📈 Analytics de Rendimiento</h2>
          
          {#if $paymentFeatures.performanceAnalytics}
            <div class="kpi-dashboard">
              <h3>📊 Dashboard de KPIs</h3>
              <div class="kpis-grid">
                {#each Object.entries($paymentFeatures.performanceAnalytics.kpiDashboard.revenue_metrics) as [metric, value]}
                  <div class="kpi-card revenue">
                    <div class="metric-name">{metric.replace(/_/g, ' ').toUpperCase()}</div>
                    <div class="metric-value">{value}</div>
                  </div>
                {/each}
                
                {#each Object.entries($paymentFeatures.performanceAnalytics.kpiDashboard.payment_performance) as [metric, value]}
                  <div class="kpi-card performance">
                    <div class="metric-name">{metric.replace(/_/g, ' ').toUpperCase()}</div>
                    <div class="metric-value">{value}</div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="actionable-recommendations">
              <h3>🎯 Recomendaciones Accionables</h3>
              <div class="recommendations-list">
                {#each $paymentFeatures.performanceAnalytics.actionableRecommendations as recommendation}
                  <div class="recommendation-card {recommendation.priority.toLowerCase()}">
                    <div class="priority-badge">{recommendation.priority}</div>
                    <div class="category">{recommendation.category}</div>
                    <div class="recommendation">{recommendation.recommendation}</div>
                    <div class="impact">Impacto: {recommendation.expected_impact}</div>
                    <div class="timeline">Tiempo: {recommendation.timeline}</div>
                    <div class="effort">Esfuerzo: {recommendation.implementation_effort}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .advanced-payment-features {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Inter', sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #1a365d;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #4a5568;
    margin: 0;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #3182ce;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    background: #fed7d7;
    border: 1px solid #e53e3e;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
    color: #c53030;
  }

  .tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: fit-content;
  }

  .tab:hover {
    border-color: #3182ce;
    transform: translateY(-2px);
  }

  .tab.active {
    border-color: #3182ce;
    background: #ebf8ff;
    color: #2b6cb0;
  }

  .tab .icon {
    font-size: 1.2rem;
  }

  .tab .label {
    font-weight: 500;
  }

  .tab-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .plans-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .plan-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    background: #f7fafc;
  }

  .plan-card.basic_free {
    border-color: #68d391;
  }

  .plan-card.pro_plan {
    border-color: #4299e1;
  }

  .plan-card.premium_plan {
    border-color: #ed8936;
  }

  .plan-card h4 {
    margin: 0 0 1rem 0;
    color: #1a365d;
  }

  .price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2b6cb0;
    margin-bottom: 0.5rem;
  }

  .commission {
    background: #bee3f8;
    color: #2c5282;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    display: inline-block;
  }

  .features, .benefits {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }

  .features li, .benefits li {
    padding: 0.25rem 0;
    font-size: 0.9rem;
  }

  .trial, .family {
    background: #c6f6d5;
    color: #22543d;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    margin-top: 1rem;
    display: inline-block;
  }

  .commission-calculator {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  .commission-calculator label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .commission-calculator select,
  .commission-calculator input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }

  .commission-calculator button {
    background: #3182ce;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .commission-calculator button:hover {
    background: #2c5282;
  }

  .cultural-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .cultural-item {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
    border-radius: 8px;
    padding: 1rem;
  }

  .cultural-item strong {
    display: block;
    color: #22543d;
    margin-bottom: 0.5rem;
  }

  .amount-calculator {
    margin-bottom: 2rem;
  }

  .amount-calculator label {
    display: block;
    margin-bottom: 1rem;
  }

  .amount-calculator input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    width: 200px;
    margin-left: 0.5rem;
  }

  .range-suggestion {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 8px;
  }

  .range {
    font-weight: 500;
    min-width: 200px;
  }

  .installments {
    display: flex;
    gap: 0.5rem;
  }

  .installment-option {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .installment-option:hover {
    border-color: #3182ce;
  }

  .installment-option.selected {
    background: #3182ce;
    color: white;
    border-color: #3182ce;
  }

  .season-card {
    background: #fffbeb;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .season-card h4 {
    color: #92400e;
    margin: 0 0 0.5rem 0;
  }

  .season-card p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .earning-rates {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .earning-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 1rem;
  }

  .activity {
    font-weight: 500;
    text-transform: capitalize;
  }

  .points {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .rewards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .reward-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    background: white;
    transition: transform 0.2s ease;
  }

  .reward-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .reward-card h4 {
    margin: 0 0 0.5rem 0;
    color: #1a365d;
  }

  .points-required {
    background: #fed7e2;
    color: #97266d;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: bold;
    display: inline-block;
    margin: 0.5rem 0;
  }

  .discount-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #2b6cb0;
    margin: 0.5rem 0;
  }

  .restrictions {
    font-size: 0.8rem;
    color: #718096;
    margin: 0.5rem 0 0 0;
  }

  .tiers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .tier-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
  }

  .tier-card.bronze {
    border-color: #cd7c32;
    background: linear-gradient(135deg, #fdf2e9 0%, #f6e05e 100%);
  }

  .tier-card.silver {
    border-color: #c0c0c0;
    background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
  }

  .tier-card.gold {
    border-color: #ffd700;
    background: linear-gradient(135deg, #fffbeb 0%, #f59e0b 100%);
  }

  .tier-card.platinum {
    border-color: #e5e7eb;
    background: linear-gradient(135deg, #f3f4f6 0%, #6b7280 100%);
    color: white;
  }

  .tier-card h4 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .threshold, .multiplier {
    margin: 0.5rem 0;
    font-weight: 500;
  }

  .tier-card .benefits {
    text-align: left;
    margin-top: 1rem;
  }

  .tier-card .benefits li {
    padding: 0.25rem 0;
    font-size: 0.9rem;
  }

  .integration-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .mercadopago-points, .local-partners {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .mercadopago-points h4, .local-partners h4 {
    margin: 0 0 1rem 0;
    color: #1a365d;
  }

  .partner-category {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: white;
    border-radius: 6px;
  }

  .os-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .os-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    background: #f0fff4;
  }

  .os-card h4 {
    margin: 0 0 1rem 0;
    color: #22543d;
  }

  .coverage {
    background: #c6f6d5;
    color: #22543d;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    margin: 0.5rem 0;
    display: inline-block;
  }

  .copay {
    font-weight: 500;
    margin: 0.5rem 0;
  }

  .authorization {
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }

  .privacy-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .privacy-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
  }

  .privacy-item.enabled {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
  }

  .privacy-item.disabled {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .compliance-badges {
    margin-top: 2rem;
  }

  .compliance-badges h4 {
    margin-bottom: 1rem;
  }

  .compliance-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border-radius: 8px;
    font-weight: 500;
  }

  .compliance-badge.compliant {
    background: #c6f6d5;
    color: #22543d;
  }

  .compliance-badge.non-compliant {
    background: #fed7d7;
    color: #c53030;
  }

  .payment-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .payment-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 8px;
  }

  .payment-option.available {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
  }

  .payment-option.unavailable {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .model-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    background: #f8fafc;
  }

  .model-card h4 {
    margin: 0 0 1rem 0;
    color: #1a365d;
  }

  .accuracy {
    background: #c6f6d5;
    color: #22543d;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    margin: 0.5rem 0;
    display: inline-block;
    font-weight: bold;
  }

  .features ul {
    margin: 0.5rem 0;
    padding-left: 1rem;
  }

  .features li {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .monitoring-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .velocity-check {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 8px;
    padding: 1rem;
  }

  .check-name {
    font-weight: 500;
  }

  .limit {
    background: #fed7e2;
    color: #97266d;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .risk-thresholds {
    margin-top: 2rem;
  }

  .risk-level {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border-radius: 8px;
  }

  .risk-level.low_risk {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
  }

  .risk-level.medium_risk {
    background: #fffbeb;
    border: 1px solid #fbbf24;
  }

  .risk-level.high_risk {
    background: #fef2f2;
    border: 1px solid #f87171;
  }

  .risk-level.critical_risk {
    background: #fef2f2;
    border: 1px solid #dc2626;
  }

  .kpis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .kpi-card {
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  }

  .kpi-card.revenue {
    background: linear-gradient(135deg, #ebf8ff 0%, #3182ce 100%);
    color: white;
  }

  .kpi-card.performance {
    background: linear-gradient(135deg, #f0fff4 0%, #38a169 100%);
    color: white;
  }

  .metric-name {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .recommendation-card {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    background: white;
  }

  .recommendation-card.high {
    border-color: #f56565;
    background: #fed7d7;
  }

  .recommendation-card.medium {
    border-color: #ed8936;
    background: #feebc8;
  }

  .recommendation-card.low {
    border-color: #48bb78;
    background: #c6f6d5;
  }

  .priority-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .recommendation-card.high .priority-badge {
    background: #c53030;
    color: white;
  }

  .recommendation-card.medium .priority-badge {
    background: #d69e2e;
    color: white;
  }

  .recommendation-card.low .priority-badge {
    background: #38a169;
    color: white;
  }

  .category {
    font-weight: 500;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .recommendation {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .impact, .timeline, .effort {
    font-size: 0.9rem;
    margin: 0.25rem 0;
    color: #718096;
  }

  @media (max-width: 768px) {
    .advanced-payment-features {
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .tabs {
      flex-wrap: wrap;
    }

    .tab-content {
      padding: 1rem;
    }

    .plans-grid {
      grid-template-columns: 1fr;
    }

    .integration-features {
      grid-template-columns: 1fr;
    }

    .models-grid {
      grid-template-columns: 1fr;
    }

    .kpis-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
  }
</style>