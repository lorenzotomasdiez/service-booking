<!--
  Argentine Peso Payment Display & Experience Optimizer
  Specialized for ARS currency, MercadoPago integration, and local preferences
  Based on Day 6 data: 92% MercadoPago usage, 100% payment success rate
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';
  
  export let amount: number;
  export let serviceType: string = 'servicio';
  export let enableInstallments: boolean = true;
  export let showTaxBreakdown: boolean = true;
  export let preferredMethod: 'mercadopago' | 'cash' | 'auto' = 'auto';
  
  const dispatch = createEventDispatcher<{
    paymentMethodSelected: { method: string; installments?: number };
    installmentChanged: { installments: number; monthlyAmount: number };
    taxInfoRequested: void;
  }>();
  
  interface PaymentOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    popularity: number;
    advantages: string[];
    processingTime: string;
    fees: number;
    installmentsAvailable: boolean;
    maxInstallments: number;
  }
  
  // Argentina payment landscape (based on Day 6 real data)
  let paymentOptions: PaymentOption[] = [
    {
      id: 'mercadopago',
      name: 'MercadoPago',
      description: 'Método preferido por 92% de usuarios argentinos',
      icon: '💳',
      popularity: 92,
      advantages: [
        'Pago instantáneo',
        'Protección al comprador',
        'Sin datos sensibles compartidos',
        'Disponible 24/7'
      ],
      processingTime: 'Inmediato',
      fees: 0,
      installmentsAvailable: true,
      maxInstallments: 12
    },
    {
      id: 'cash',
      name: 'Efectivo',
      description: 'Pago en el local al momento del servicio',
      icon: '💵',
      popularity: 8,
      advantages: [
        'Sin comisiones',
        'Privacidad total',
        'Aceptado universalmente',
        'Control directo'
      ],
      processingTime: 'Al momento del servicio',
      fees: 0,
      installmentsAvailable: false,
      maxInstallments: 0
    },
    {
      id: 'transfer',
      name: 'Transferencia Bancaria',
      description: 'CBU o Alias para transferencias directas',
      icon: '🏦',
      popularity: 5,
      advantages: [
        'Sin intermediarios',
        'Comisiones bancarias bajas',
        'Directo a la cuenta',
        'Comprobante inmediato'
      ],
      processingTime: '5-15 minutos',
      fees: 0,
      installmentsAvailable: false,
      maxInstallments: 0
    }
  ];
  
  // Argentine peso formatting and calculations
  let selectedPaymentMethod = preferredMethod === 'auto' ? 'mercadopago' : preferredMethod;
  let selectedInstallments = 1;
  let showInstallmentCalculator = false;
  let showTaxInfo = false;
  
  // Tax calculations (Argentina market)
  let taxBreakdown = {
    subtotal: amount,
    iva: Math.round(amount * 0.21), // 21% IVA
    serviceFee: Math.round(amount * 0.035), // 3.5% platform fee
    total: 0
  };
  
  // Installment calculator
  let installmentOptions = [1, 3, 6, 9, 12];
  let installmentData: Array<{
    months: number;
    monthlyAmount: number;
    totalAmount: number;
    interestRate: number;
  }> = [];
  
  onMount(() => {
    calculateTotals();
    generateInstallmentOptions();
    trackPaymentDisplayView();
  });
  
  function calculateTotals() {
    taxBreakdown.total = taxBreakdown.subtotal + taxBreakdown.iva;
  }
  
  function generateInstallmentOptions() {
    installmentData = installmentOptions.map(months => {
      let interestRate = 0;
      let totalAmount = amount;
      
      // Argentina installment interest rates (typical for MercadoPago)
      if (months > 1) {
        switch (months) {
          case 3: interestRate = 5.9; break;
          case 6: interestRate = 12.5; break;
          case 9: interestRate = 19.8; break;
          case 12: interestRate = 28.4; break;
          default: interestRate = months * 2.5; break;
        }
        totalAmount = amount * (1 + interestRate / 100);
      }
      
      return {
        months,
        monthlyAmount: Math.round(totalAmount / months),
        totalAmount: Math.round(totalAmount),
        interestRate
      };
    });
  }
  
  function trackPaymentDisplayView() {
    uxAnalytics.trackExternalEvent('payment_display_viewed', {
      amount,
      serviceType,
      preferredMethod,
      timestamp: Date.now()
    });
  }
  
  function selectPaymentMethod(methodId: string) {
    selectedPaymentMethod = methodId;
    const method = paymentOptions.find(p => p.id === methodId);
    
    if (method) {
      dispatch('paymentMethodSelected', { 
        method: methodId,
        installments: selectedInstallments 
      });
      
      // Track payment method selection
      uxAnalytics.trackPaymentMethodSelection(methodId as any);
      
      showInstallmentCalculator = method.installmentsAvailable && enableInstallments;
    }
  }
  
  function selectInstallments(months: number) {
    selectedInstallments = months;
    const installmentInfo = installmentData.find(i => i.months === months);
    
    if (installmentInfo) {
      dispatch('installmentChanged', {
        installments: months,
        monthlyAmount: installmentInfo.monthlyAmount
      });
      
      uxAnalytics.trackExternalEvent('installment_selected', {
        months,
        monthlyAmount: installmentInfo.monthlyAmount,
        interestRate: installmentInfo.interestRate,
        timestamp: Date.now()
      });
    }
  }
  
  function formatARS(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  function getPaymentMethodIcon(methodId: string): string {
    const method = paymentOptions.find(p => p.id === methodId);
    return method?.icon || '💳';
  }
  
  function toggleTaxInfo() {
    showTaxInfo = !showTaxInfo;
    if (showTaxInfo) {
      dispatch('taxInfoRequested');
    }
  }
</script>

<div class="peso-payment-optimizer bg-white rounded-xl shadow-lg border border-gray-200 p-6">
  <!-- Payment Amount Display -->
  <div class="text-center mb-6">
    <div class="text-3xl font-bold text-gray-900 mb-1">
      {formatARS(amount)}
    </div>
    <p class="text-gray-600">por {serviceType}</p>
    
    {#if showTaxBreakdown}
      <button
        type="button"
        on:click={toggleTaxInfo}
        class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showTaxInfo ? 'Ocultar' : 'Ver'} desglose de impuestos
      </button>
    {/if}
  </div>

  <!-- Tax Breakdown -->
  {#if showTaxInfo}
    <div class="bg-gray-50 rounded-lg p-4 mb-6" transition:slide={{ duration: 300 }}>
      <h4 class="text-sm font-medium text-gray-900 mb-3">Desglose de Impuestos</h4>
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Subtotal:</span>
          <span class="font-medium">{formatARS(taxBreakdown.subtotal)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">IVA (21%):</span>
          <span class="font-medium">{formatARS(taxBreakdown.iva)}</span>
        </div>
        <div class="border-t border-gray-200 pt-2">
          <div class="flex justify-between">
            <span class="font-medium text-gray-900">Total:</span>
            <span class="font-bold text-gray-900">{formatARS(taxBreakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Payment Method Selection -->
  <div class="mb-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h3>
    <div class="space-y-3">
      {#each paymentOptions as option}
        <label class="block">
          <input
            type="radio"
            value={option.id}
            bind:group={selectedPaymentMethod}
            on:change={() => selectPaymentMethod(option.id)}
            class="sr-only"
          >
          <div 
            class="border-2 rounded-xl p-4 cursor-pointer transition-all"
            class:border-blue-500={selectedPaymentMethod === option.id}
            class:bg-blue-50={selectedPaymentMethod === option.id}
            class:border-gray-200={selectedPaymentMethod !== option.id}
            class:hover:border-gray-300={selectedPaymentMethod !== option.id}
          >
            <div class="flex items-start space-x-4">
              <div class="text-2xl">{option.icon}</div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">{option.name}</h4>
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {option.popularity}% usa
                    </span>
                    {#if option.id === 'mercadopago'}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Recomendado
                      </span>
                    {/if}
                  </div>
                </div>
                <p class="text-sm text-gray-600 mb-3">{option.description}</p>
                
                <!-- Advantages -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  {#each option.advantages as advantage}
                    <div class="flex items-center space-x-1 text-xs text-gray-600">
                      <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>{advantage}</span>
                    </div>
                  {/each}
                </div>
                
                <!-- Processing info -->
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>Procesamiento: {option.processingTime}</span>
                  {#if option.fees > 0}
                    <span>Comisión: {option.fees}%</span>
                  {:else}
                    <span class="text-green-600 font-medium">Sin comisiones</span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </label>
      {/each}
    </div>
  </div>

  <!-- Installment Calculator (MercadoPago) -->
  {#if showInstallmentCalculator && selectedPaymentMethod === 'mercadopago'}
    <div class="mb-6" transition:slide={{ duration: 300 }}>
      <h4 class="text-base font-semibold text-gray-900 mb-4">Cuotas sin Interés</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each installmentData as installment}
          <label class="block">
            <input
              type="radio"
              value={installment.months}
              bind:group={selectedInstallments}
              on:change={() => selectInstallments(installment.months)}
              class="sr-only"
            >
            <div 
              class="border-2 rounded-lg p-3 cursor-pointer transition-all text-center"
              class:border-blue-500={selectedInstallments === installment.months}
              class:bg-blue-50={selectedInstallments === installment.months}
              class:border-gray-200={selectedInstallments !== installment.months}
              class:hover:border-gray-300={selectedInstallments !== installment.months}
            >
              <div class="font-bold text-gray-900 mb-1">
                {installment.months === 1 ? 'Contado' : `${installment.months} cuotas`}
              </div>
              <div class="text-lg font-semibold text-blue-600 mb-1">
                {formatARS(installment.monthlyAmount)}
              </div>
              {#if installment.months > 1}
                <div class="text-xs text-gray-500">
                  {#if installment.interestRate > 0}
                    Total: {formatARS(installment.totalAmount)}
                    <br>Interés: {installment.interestRate}%
                  {:else}
                    <span class="text-green-600 font-medium">Sin interés</span>
                  {/if}
                </div>
              {:else}
                <div class="text-xs text-green-600 font-medium">
                  Pago único
                </div>
              {/if}
            </div>
          </label>
        {/each}
      </div>
      
      <!-- Selected installment summary -->
      {#if selectedInstallments > 1}
        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-800">
              Pagarás {selectedInstallments} cuotas de {formatARS(installmentData.find(i => i.months === selectedInstallments)?.monthlyAmount || 0)}
            </span>
            <span class="text-xs text-blue-600">
              Total: {formatARS(installmentData.find(i => i.months === selectedInstallments)?.totalAmount || 0)}
            </span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Security & Trust Indicators -->
  <div class="bg-gray-50 rounded-lg p-4 mb-6">
    <h4 class="text-sm font-medium text-gray-900 mb-3">Seguridad y Confianza</h4>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 1L5 6v6l5 5 5-5V6l-5-5zM8.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm2.5 6a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
        <div>
          <div class="text-sm font-medium text-gray-900">Pago Seguro</div>
          <div class="text-xs text-gray-600">Encriptación 256-bit</div>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.282.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <div class="text-sm font-medium text-gray-900">Verificado</div>
          <div class="text-xs text-gray-600">100% éxito día 1</div>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="text-sm font-medium text-gray-900">Garantía</div>
          <div class="text-xs text-gray-600">Reembolso disponible</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Argentina Banking Tips -->
  <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
    <h4 class="text-sm font-medium text-gray-900 mb-2">💡 Tips para Pagos en Argentina</h4>
    <div class="text-sm text-gray-700 space-y-1">
      <p>• MercadoPago es el método más rápido y seguro</p>
      <p>• Las cuotas sin interés están sujetas a disponibilidad</p>
      <p>• El efectivo se paga directamente al profesional</p>
      <p>• Todos los pagos incluyen factura electrónica</p>
    </div>
  </div>

  <!-- Next Steps -->
  <div class="mt-6 flex justify-between items-center">
    <div class="text-sm text-gray-600">
      <span class="font-medium">Método seleccionado:</span>
      <span class="ml-1">{getPaymentMethodIcon(selectedPaymentMethod)} {paymentOptions.find(p => p.id === selectedPaymentMethod)?.name}</span>
      {#if selectedInstallments > 1}
        <span class="ml-2">({selectedInstallments} cuotas)</span>
      {/if}
    </div>
    
    <button class="btn btn-primary">
      Continuar con {paymentOptions.find(p => p.id === selectedPaymentMethod)?.name}
    </button>
  </div>
</div>