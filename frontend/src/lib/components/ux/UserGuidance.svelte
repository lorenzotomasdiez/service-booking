<!-- Enhanced User Guidance System for Argentina Mobile Users -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { uxOptimizationService, isMobile, connectionSpeed } from '$lib/services/ux-optimization';

  export let contextualHelp: boolean = true;
  export let adaptToUser: boolean = true;
  export let showProgress: boolean = true;

  interface GuidanceStep {
    id: string;
    title: string;
    description: string;
    target?: string; // CSS selector
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void;
    skipable: boolean;
    mobileOptimized: boolean;
    argentineContext: boolean;
  }

  interface GuidanceState {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    userProgress: Record<string, boolean>; // page -> completed
    userPreferences: {
      showTooltips: boolean;
      reducedGuidance: boolean;
      language: 'es-AR';
    };
    contextualTips: GuidanceStep[];
  }

  // Store for guidance state
  const guidanceStore = writable<GuidanceState>({
    isActive: false,
    currentStep: 0,
    totalSteps: 0,
    userProgress: {},
    userPreferences: {
      showTooltips: true,
      reducedGuidance: false,
      language: 'es-AR'
    },
    contextualTips: []
  });

  // Argentina-specific guidance content
  const guidanceContent = {
    onboarding: {
      client: [
        {
          id: 'welcome-argentina',
          title: '¡Bienvenido a BarberPro!',
          description: 'La app de reservas de servicios #1 en Argentina. Te guiaremos paso a paso.',
          position: 'center' as const,
          skipable: false,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'profile-importance',
          title: 'Tu perfil es importante',
          description: 'Completar tu perfil ayuda a encontrar los mejores profesionales cerca tuyo.',
          target: '[data-onboarding="profile"]',
          position: 'bottom' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'location-benefits',
          title: 'Ubicación para mejores resultados',
          description: 'Con tu ubicación, encontramos servicios en tu barrio o zona preferida.',
          target: '[data-onboarding="location"]',
          position: 'top' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'mobile-app-features',
          title: 'Optimizado para móvil',
          description: 'BarberPro funciona perfecto en tu celular. Agregalo a tu pantalla de inicio.',
          position: 'center' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        }
      ],
      provider: [
        {
          id: 'provider-welcome',
          title: '¡Bienvenido, Profesional!',
          description: 'Configuremos tu perfil para empezar a recibir clientes en Argentina.',
          position: 'center' as const,
          skipable: false,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'professional-profile',
          title: 'Perfil profesional completo',
          description: 'Un perfil completo aumenta tus reservas hasta un 300%. ¡Vale la pena!',
          target: '[data-onboarding="professional-profile"]',
          position: 'bottom' as const,
          skipable: false,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'pricing-strategy',
          title: 'Precios competitivos',
          description: 'Revisa precios de la zona para mantenerte competitivo en tu área.',
          target: '[data-onboarding="pricing"]',
          position: 'top' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'portfolio-impact',
          title: 'Fotos que venden',
          description: 'Clientes argentinos prefieren ver trabajos antes de reservar. ¡Súbí tus mejores fotos!',
          target: '[data-onboarding="portfolio"]',
          position: 'bottom' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        }
      ]
    },
    
    contextual: {
      booking: [
        {
          id: 'booking-search-tip',
          title: 'Búsqueda inteligente',
          description: 'Usá filtros como "cerca de casa" o "disponible hoy" para encontrar más rápido.',
          target: '[data-guide="search-filters"]',
          position: 'bottom' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'booking-timing',
          title: 'Mejores horarios',
          description: 'Reservá antes de las 10am o después de las 6pm para mejores precios.',
          target: '[data-guide="time-selector"]',
          position: 'top' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        }
      ],
      
      payment: [
        {
          id: 'mercadopago-secure',
          title: 'Pago 100% seguro',
          description: 'Procesamos con MercadoPago. Tu información está protegida.',
          target: '[data-guide="payment-form"]',
          position: 'top' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        },
        {
          id: 'payment-methods',
          title: 'Múltiples opciones',
          description: 'Pagá con tarjeta, transferencia, o efectivo en el local.',
          target: '[data-guide="payment-methods"]',
          position: 'bottom' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: true
        }
      ],
      
      dashboard: [
        {
          id: 'mobile-navigation',
          title: 'Navegación táctil',
          description: 'Deslizá hacia los costados para ver más opciones.',
          position: 'center' as const,
          skipable: true,
          mobileOptimized: true,
          argentineContext: false
        }
      ]
    }
  };

  let currentGuidanceSteps: GuidanceStep[] = [];
  let tooltipElement: HTMLElement | null = null;
  let tooltipVisible = false;
  let guidanceOverlay: HTMLElement | null = null;

  onMount(() => {
    if (browser) {
      initializeGuidance();
      setupContextualHelp();
    }
  });

  onDestroy(() => {
    cleanupGuidance();
  });

  function initializeGuidance() {
    // Load user preferences
    const savedPrefs = localStorage.getItem('user_guidance_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        guidanceStore.update(state => ({
          ...state,
          userPreferences: { ...state.userPreferences, ...prefs }
        }));
      } catch (error) {
        console.warn('Failed to load guidance preferences:', error);
      }
    }

    // Detect if user needs guidance based on previous visits
    const hasVisited = localStorage.getItem('barberpro_visited');
    const needsGuidance = !hasVisited || localStorage.getItem('show_guidance') === 'true';

    if (needsGuidance && contextualHelp) {
      setTimeout(() => showContextualGuidance(), 1000);
    }

    // Mark as visited
    localStorage.setItem('barberpro_visited', 'true');
  }

  function setupContextualHelp() {
    if (!browser) return;

    // Monitor page changes for contextual tips
    page.subscribe((pageData) => {
      const pathname = pageData.url.pathname;
      setTimeout(() => showContextualTipsForPage(pathname), 500);
    });

    // Monitor form interactions
    document.addEventListener('focusin', handleFormFocus);
    document.addEventListener('click', handleElementClick);
  }

  function cleanupGuidance() {
    if (browser) {
      document.removeEventListener('focusin', handleFormFocus);
      document.removeEventListener('click', handleElementClick);
    }
    hideTooltip();
  }

  function showContextualGuidance() {
    const currentPath = $page.url.pathname;
    
    // Determine guidance type based on current page
    if (currentPath.includes('/dashboard/client')) {
      startGuidanceFlow(guidanceContent.onboarding.client);
    } else if (currentPath.includes('/dashboard/provider')) {
      startGuidanceFlow(guidanceContent.onboarding.provider);
    } else if (currentPath.includes('/booking')) {
      showContextualTips(guidanceContent.contextual.booking);
    } else if (currentPath.includes('/payment')) {
      showContextualTips(guidanceContent.contextual.payment);
    }
  }

  function showContextualTipsForPage(pathname: string) {
    // Show relevant tips based on page
    if (pathname.includes('/booking') && !hasSeenTips('booking')) {
      showContextualTips(guidanceContent.contextual.booking);
    } else if (pathname.includes('/dashboard') && !hasSeenTips('dashboard')) {
      showContextualTips(guidanceContent.contextual.dashboard);
    }
  }

  function hasSeenTips(page: string): boolean {
    const seenTips = localStorage.getItem('seen_tips');
    if (!seenTips) return false;
    
    try {
      const seen = JSON.parse(seenTips);
      return seen.includes(page);
    } catch {
      return false;
    }
  }

  function markTipsAsSeen(page: string) {
    const seenTips = localStorage.getItem('seen_tips');
    let seen: string[] = [];
    
    if (seenTips) {
      try {
        seen = JSON.parse(seenTips);
      } catch {
        seen = [];
      }
    }
    
    if (!seen.includes(page)) {
      seen.push(page);
      localStorage.setItem('seen_tips', JSON.stringify(seen));
    }
  }

  function startGuidanceFlow(steps: GuidanceStep[]) {
    // Filter steps based on device and preferences
    const filteredSteps = steps.filter(step => {
      if ($isMobile && !step.mobileOptimized) return false;
      if ($guidanceStore.userPreferences.reducedGuidance && step.skipable) return false;
      return true;
    });

    currentGuidanceSteps = filteredSteps;
    
    guidanceStore.update(state => ({
      ...state,
      isActive: true,
      currentStep: 0,
      totalSteps: filteredSteps.length
    }));

    if (filteredSteps.length > 0) {
      showStep(0);
    }
  }

  function showStep(stepIndex: number) {
    const step = currentGuidanceSteps[stepIndex];
    if (!step) return;

    guidanceStore.update(state => ({
      ...state,
      currentStep: stepIndex
    }));

    // Show tooltip or modal based on step
    if (step.target) {
      showTooltipForTarget(step);
    } else {
      showModalStep(step);
    }

    // Update progress
    if (showProgress) {
      updateProgressIndicator(stepIndex, currentGuidanceSteps.length);
    }
  }

  function showTooltipForTarget(step: GuidanceStep) {
    const targetElement = document.querySelector(step.target!);
    if (!targetElement) {
      console.warn(`Guidance target not found: ${step.target}`);
      nextStep();
      return;
    }

    createTooltip(step, targetElement as HTMLElement);
    highlightElement(targetElement as HTMLElement);
  }

  function createTooltip(step: GuidanceStep, targetElement: HTMLElement) {
    // Remove existing tooltip
    hideTooltip();

    tooltipElement = document.createElement('div');
    tooltipElement.className = 'guidance-tooltip argentina-style';
    tooltipElement.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-header">
          <h4 class="tooltip-title">${step.title}</h4>
          <button class="tooltip-close" onclick="this.closest('.guidance-tooltip').remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="tooltip-description">${step.description}</p>
        <div class="tooltip-actions">
          ${step.skipable ? '<button class="btn-skip">Saltar</button>' : ''}
          <button class="btn-next">Entendido</button>
        </div>
        ${showProgress ? `<div class="tooltip-progress">${$guidanceStore.currentStep + 1} de ${$guidanceStore.totalSteps}</div>` : ''}
      </div>
      <div class="tooltip-arrow"></div>
    `;

    // Position tooltip
    positionTooltip(tooltipElement, targetElement, step.position || 'top');

    // Add event listeners
    const nextBtn = tooltipElement.querySelector('.btn-next');
    const skipBtn = tooltipElement.querySelector('.btn-skip');
    const closeBtn = tooltipElement.querySelector('.tooltip-close');

    nextBtn?.addEventListener('click', () => nextStep());
    skipBtn?.addEventListener('click', () => skipCurrentStep());
    closeBtn?.addEventListener('click', () => endGuidance());

    document.body.appendChild(tooltipElement);
    tooltipVisible = true;

    // Animate in
    requestAnimationFrame(() => {
      tooltipElement?.classList.add('tooltip-visible');
    });
  }

  function positionTooltip(tooltip: HTMLElement, target: HTMLElement, position: string) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    let top: number, left: number;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 10;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 10;
        break;
      default:
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    }

    // Adjust for viewport bounds (mobile optimization)
    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewport.width - 10) {
      left = viewport.width - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > viewport.height - 10) {
      top = viewport.height - tooltipRect.height - 10;
    }

    tooltip.style.position = 'fixed';
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.zIndex = '10000';
  }

  function highlightElement(element: HTMLElement) {
    element.classList.add('guidance-highlighted');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function removeHighlight() {
    const highlighted = document.querySelectorAll('.guidance-highlighted');
    highlighted.forEach(el => el.classList.remove('guidance-highlighted'));
  }

  function showModalStep(step: GuidanceStep) {
    // Create overlay modal for center-positioned steps
    const modal = document.createElement('div');
    modal.className = 'guidance-modal argentina-mobile';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${step.title}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-description">${step.description}</p>
        </div>
        <div class="modal-actions">
          ${step.skipable ? '<button class="btn btn-ghost btn-skip">Saltar</button>' : ''}
          <button class="btn btn-primary btn-next">Continuar</button>
        </div>
        ${showProgress ? `
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(($guidanceStore.currentStep + 1) / $guidanceStore.totalSteps) * 100}%"></div>
            </div>
            <span class="progress-text">${$guidanceStore.currentStep + 1} de ${$guidanceStore.totalSteps}</span>
          </div>
        ` : ''}
      </div>
    `;

    // Add event listeners
    const nextBtn = modal.querySelector('.btn-next');
    const skipBtn = modal.querySelector('.btn-skip');
    const overlay = modal.querySelector('.modal-overlay');

    nextBtn?.addEventListener('click', () => {
      modal.remove();
      nextStep();
    });
    
    skipBtn?.addEventListener('click', () => {
      modal.remove();
      skipCurrentStep();
    });
    
    overlay?.addEventListener('click', () => {
      modal.remove();
      endGuidance();
    });

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('modal-visible');
    });
  }

  function showContextualTips(tips: GuidanceStep[]) {
    // Show non-intrusive contextual tips
    tips.forEach((tip, index) => {
      setTimeout(() => {
        if (tip.target) {
          const target = document.querySelector(tip.target);
          if (target) {
            showQuickTip(tip, target as HTMLElement);
          }
        }
      }, index * 2000); // Stagger tips
    });

    // Mark as seen
    markTipsAsSeen($page.url.pathname.split('/')[1] || 'home');
  }

  function showQuickTip(tip: GuidanceStep, target: HTMLElement) {
    // Create a small, unobtrusive tip
    const tipElement = document.createElement('div');
    tipElement.className = 'quick-tip argentina-style';
    tipElement.innerHTML = `
      <div class="tip-content">
        <p class="tip-text">${tip.description}</p>
        <button class="tip-close">×</button>
      </div>
    `;

    // Position near target
    const targetRect = target.getBoundingClientRect();
    tipElement.style.position = 'fixed';
    tipElement.style.top = `${targetRect.bottom + 5}px`;
    tipElement.style.left = `${targetRect.left}px`;
    tipElement.style.zIndex = '9999';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      tipElement.remove();
    }, 5000);

    // Manual close
    const closeBtn = tipElement.querySelector('.tip-close');
    closeBtn?.addEventListener('click', () => tipElement.remove());

    document.body.appendChild(tipElement);
    
    // Animate in
    requestAnimationFrame(() => {
      tipElement.classList.add('tip-visible');
    });
  }

  function nextStep() {
    hideTooltip();
    removeHighlight();

    const nextIndex = $guidanceStore.currentStep + 1;
    if (nextIndex < currentGuidanceSteps.length) {
      showStep(nextIndex);
    } else {
      endGuidance();
    }
  }

  function skipCurrentStep() {
    nextStep();
  }

  function endGuidance() {
    hideTooltip();
    removeHighlight();
    
    guidanceStore.update(state => ({
      ...state,
      isActive: false,
      currentStep: 0
    }));

    // Save completion
    localStorage.setItem('guidance_completed', 'true');
    
    // Show completion message for Argentina users
    if ($isMobile) {
      uxOptimizationService.showUserGuidance(
        '¡Perfecto! Ya conocés lo básico. ¡A disfrutar BarberPro!',
        'info'
      );
    }
  }

  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
      tooltipVisible = false;
    }

    // Remove any modals (browser check for SSR)
    if (typeof document !== 'undefined') {
      const modals = document.querySelectorAll('.guidance-modal');
      modals.forEach(modal => modal.remove());
    }
  }

  function updateProgressIndicator(current: number, total: number) {
    // This would integrate with a global progress indicator
    const progress = ((current + 1) / total) * 100;
    document.documentElement.style.setProperty('--guidance-progress', `${progress}%`);
  }

  function handleFormFocus(event: Event) {
    if (!contextualHelp) return;
    
    const target = event.target as HTMLElement;
    
    // Show contextual help for specific form fields
    if (target.matches('[data-help]')) {
      const helpText = target.getAttribute('data-help');
      if (helpText) {
        showQuickTip({
          id: 'form-help',
          title: '',
          description: helpText,
          skipable: true,
          mobileOptimized: true,
          argentineContext: false
        }, target);
      }
    }
  }

  function handleElementClick(event: Event) {
    // Hide quick tips when user interacts elsewhere
    const quickTips = document.querySelectorAll('.quick-tip');
    const target = event.target as HTMLElement;
    
    if (!target.closest('.quick-tip')) {
      quickTips.forEach(tip => tip.remove());
    }
  }

  // Public API for components
  export function showGuidanceForElement(element: HTMLElement, content: Omit<GuidanceStep, 'id'>) {
    const step: GuidanceStep = {
      id: `manual-${Date.now()}`,
      ...content
    };
    
    createTooltip(step, element);
    highlightElement(element);
  }

  export function triggerGuidance(type: 'onboarding' | 'contextual', subtype?: string) {
    if (type === 'onboarding') {
      showContextualGuidance();
    } else if (type === 'contextual' && subtype) {
      const tips = guidanceContent.contextual[subtype];
      if (tips) {
        showContextualTips(tips);
      }
    }
  }
</script>

<!-- Global Guidance Styles -->
<style>
  :global(.guidance-tooltip) {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    max-width: 320px;
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.2s ease-out;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  
  :global(.guidance-tooltip.tooltip-visible) {
    opacity: 1;
    transform: scale(1);
  }
  
  :global(.guidance-tooltip.argentina-style) {
    border-color: #3b82f6;
  }
  
  :global(.tooltip-content) {
    padding: 16px;
  }
  
  :global(.tooltip-header) {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  
  :global(.tooltip-title) {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.4;
  }
  
  :global(.tooltip-close) {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  :global(.tooltip-close:hover) {
    background-color: #f3f4f6;
  }
  
  :global(.tooltip-description) {
    color: #4b5563;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px 0;
  }
  
  :global(.tooltip-actions) {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  :global(.tooltip-actions button) {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  :global(.btn-skip) {
    background: #f9fafb;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }
  
  :global(.btn-skip:hover) {
    background: #f3f4f6;
  }
  
  :global(.btn-next) {
    background: #3b82f6;
    color: white;
  }
  
  :global(.btn-next:hover) {
    background: #2563eb;
  }
  
  :global(.tooltip-progress) {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
    text-align: center;
  }
  
  /* Modal styles */
  :global(.guidance-modal) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  :global(.guidance-modal.modal-visible) {
    opacity: 1;
  }
  
  :global(.modal-overlay) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }
  
  :global(.modal-content) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  :global(.guidance-modal.argentina-mobile .modal-content) {
    max-width: 350px;
    padding: 20px;
  }
  
  :global(.modal-title) {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 16px 0;
    text-align: center;
  }
  
  :global(.modal-description) {
    color: #4b5563;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 24px 0;
    text-align: center;
  }
  
  :global(.modal-actions) {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  :global(.modal-actions .btn) {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    min-width: 100px;
  }
  
  :global(.btn-ghost) {
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }
  
  :global(.btn-ghost:hover) {
    background: #f3f4f6;
  }
  
  :global(.btn-primary) {
    background: #3b82f6;
    color: white;
  }
  
  :global(.btn-primary:hover) {
    background: #2563eb;
  }
  
  :global(.modal-progress) {
    margin-top: 24px;
    text-align: center;
  }
  
  :global(.progress-bar) {
    background: #e5e7eb;
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  :global(.progress-fill) {
    background: #3b82f6;
    height: 100%;
    transition: width 0.3s ease;
  }
  
  :global(.progress-text) {
    font-size: 12px;
    color: #6b7280;
  }
  
  /* Quick tips */
  :global(.quick-tip) {
    background: #1f2937;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    max-width: 200px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  :global(.quick-tip.tip-visible) {
    opacity: 1;
    transform: translateY(0);
  }
  
  :global(.quick-tip.argentina-style) {
    background: #3b82f6;
  }
  
  :global(.tip-content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  :global(.tip-text) {
    margin: 0;
    line-height: 1.4;
  }
  
  :global(.tip-close) {
    background: none;
    border: none;
    color: currentColor;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
    padding: 0;
    opacity: 0.8;
  }
  
  :global(.tip-close:hover) {
    opacity: 1;
  }
  
  /* Element highlighting */
  :global(.guidance-highlighted) {
    position: relative;
    z-index: 9999;
  }
  
  :global(.guidance-highlighted::after) {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    pointer-events: none;
    animation: pulse-highlight 2s infinite;
  }
  
  @keyframes pulse-highlight {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    :global(.guidance-tooltip) {
      max-width: 280px;
      font-size: 14px;
    }
    
    :global(.modal-content) {
      width: 95%;
      padding: 16px;
    }
    
    :global(.modal-actions .btn) {
      padding: 10px 20px;
      font-size: 14px;
      min-width: 80px;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    :global(.guidance-tooltip),
    :global(.guidance-modal),
    :global(.quick-tip) {
      transition: none;
    }
    
    :global(.guidance-highlighted::after) {
      animation: none;
    }
  }
  
  /* High contrast */
  @media (prefers-contrast: high) {
    :global(.guidance-tooltip),
    :global(.modal-content) {
      border-width: 2px;
      border-color: #000;
    }
    
    :global(.guidance-highlighted::after) {
      border-color: #000;
      border-width: 3px;
    }
  }
</style>