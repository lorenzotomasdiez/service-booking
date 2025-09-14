<!--
  Design Excellence & Launch Preparation - D11-001
  Comprehensive design documentation for brand consistency and operational excellence
  Accessibility enhancement with quality assurance procedures
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'documentation' | 'accessibility' | 'quality' | 'optimization' | 'insights' | 'standards' = 'documentation';
  export let launchPhase: 'pre-launch' | 'soft-launch' | 'full-launch' | 'post-launch' = 'soft-launch';
  export let complianceLevel: 'basic' | 'standard' | 'premium' | 'enterprise' = 'premium';
  export let argentinaCompliance: boolean = true;
  export let scalabilityFocus: boolean = true;

  const dispatch = createEventDispatcher<{
    designStandard: { standard: string; compliance: number; recommendations: string[] };
    accessibilityImprovement: { component: string; improvement: string; impact: 'high' | 'medium' | 'low' };
    qualityMetric: { metric: string; score: number; target: number; actions: string[] };
    launchReadiness: { area: string; status: 'ready' | 'warning' | 'critical'; details: any };
  }>();

  // Design Excellence & Launch Preparation Data
  const launchReadinessData = {
    designDocumentation: {
      brandGuidelines: {
        logo_usage: {
          status: 'complete',
          compliance: 98,
          variations: 12,
          formats: ['SVG', 'PNG', 'PDF', 'AI'],
          applications: ['Web', 'Mobile', 'Print', 'Social Media']
        },
        color_system: {
          status: 'complete',
          compliance: 100,
          primary_palette: {
            barber: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
            psychology: { primary: '#059669', secondary: '#047857', accent: '#10b981' },
            medical: { primary: '#0891b2', secondary: '#0e7490', accent: '#06b6d4' }
          },
          accessibility_contrast: {
            aa_compliant: '100%',
            aaa_compliant: '89%'
          }
        },
        typography_system: {
          status: 'complete',
          compliance: 95,
          font_families: {
            primary: 'Inter',
            heading: 'Poppins',
            monospace: 'JetBrains Mono'
          },
          scales: {
            mobile: '14px - 32px',
            tablet: '16px - 40px',
            desktop: '18px - 48px'
          },
          argentina_optimization: {
            spanish_characters: true,
            accent_support: true,
            readability_score: 94
          }
        },
        iconography: {
          status: 'complete',
          compliance: 92,
          icon_library: 847,
          custom_icons: 156,
          svg_optimization: true,
          accessibility_labels: '100%'
        }
      },
      componentLibrary: {
        design_tokens: {
          implemented: 145,
          documented: 145,
          compliance: 100,
          cross_platform: true
        },
        ui_components: {
          total_components: 89,
          documented: 89,
          tested: 87,
          accessibility_compliant: 89,
          argentina_localized: 89
        },
        pattern_library: {
          booking_patterns: 23,
          navigation_patterns: 12,
          form_patterns: 18,
          feedback_patterns: 15,
          argentina_specific: 8
        },
        template_scalability: {
          vertical_templates: 3, // barber, psychology, medical
          replication_time: '6-8 weeks',
          customization_points: 47,
          locale_support: ['es-AR', 'en-US']
        }
      },
      designSystem: {
        version: '2.1.0',
        last_updated: '2024-04-15',
        documentation_coverage: 96,
        implementation_consistency: 94,
        cross_team_adoption: 89,
        maintenance_schedule: 'bi-weekly'
      }
    },
    accessibilityExcellence: {
      wcag_compliance: {
        level_a: { compliance: 100, issues: 0 },
        level_aa: { compliance: 98, issues: 3 },
        level_aaa: { compliance: 87, issues: 12 }
      },
      inclusive_design: {
        color_blind_support: {
          deuteranopia: 100,
          protanopia: 100,
          tritanopia: 98,
          total_color_blind: 99
        },
        motor_accessibility: {
          keyboard_navigation: 100,
          touch_targets: 96, // minimum 44px
          gesture_alternatives: 89,
          voice_control: 78
        },
        cognitive_accessibility: {
          clear_language: 94,
          consistent_navigation: 98,
          error_prevention: 92,
          help_documentation: 89
        },
        visual_accessibility: {
          contrast_ratios: 98,
          font_scaling: 100,
          zoom_support: 100,
          reduced_motion: 94
        }
      },
      argentina_accessibility: {
        spanish_screen_readers: 92,
        local_disability_standards: 89,
        government_compliance: 94,
        cultural_sensitivity: 96
      },
      testing_coverage: {
        automated_testing: 87,
        manual_testing: 94,
        user_testing: 78,
        assistive_technology: 89
      }
    },
    qualityAssurance: {
      design_consistency: {
        component_adherence: 94,
        brand_consistency: 97,
        interaction_patterns: 92,
        visual_hierarchy: 95
      },
      user_experience: {
        task_completion_rate: 96.2,
        user_satisfaction: 4.7, // out of 5
        error_recovery_rate: 89.3,
        learning_curve: 'minimal'
      },
      performance_impact: {
        page_load_speed: 'A+', // 1.2s average
        interaction_responsiveness: 'A+', // <100ms
        resource_optimization: 'A', // optimized assets
        mobile_performance: 'A+' // PWA optimized
      },
      cross_browser_testing: {
        chrome: 100,
        safari: 98,
        firefox: 97,
        edge: 96,
        mobile_browsers: 94
      },
      argentina_qa: {
        local_payment_testing: 98, // MercadoPago
        whatsapp_integration: 96,
        spanish_localization: 99,
        cultural_appropriateness: 97
      }
    },
    optimizationFramework: {
      conversion_optimization: {
        booking_flow: {
          completion_rate: 89.2,
          abandonment_points: 2,
          a_b_test_results: {
            form_simplification: '+23% completion',
            trust_indicators: '+15% conversion',
            mobile_optimization: '+31% mobile bookings'
          }
        },
        provider_onboarding: {
          completion_rate: 87.4,
          time_to_first_booking: '2.3 days',
          optimization_opportunities: 3
        }
      },
      performance_optimization: {
        loading_times: {
          first_contentful_paint: '1.1s',
          largest_contentful_paint: '1.4s',
          cumulative_layout_shift: '0.05',
          first_input_delay: '45ms'
        },
        mobile_optimization: {
          pwa_score: 95,
          offline_functionality: 89,
          app_shell_caching: 100,
          push_notifications: 94
        }
      },
      continuous_improvement: {
        user_feedback_integration: 'weekly',
        design_iteration_cycle: '2 weeks',
        performance_monitoring: 'real-time',
        a_b_testing_capacity: '8 concurrent tests'
      }
    },
    businessInsights: {
      market_differentiation: {
        unique_value_props: [
          'Argentina-first design with cultural sensitivity',
          'Premium experience with accessible pricing',
          'Template-based scalability for rapid expansion',
          'AI-powered personalization and recommendations',
          'WhatsApp-native communication integration'
        ],
        competitive_advantages: [
          'Superior mobile experience (31% better than competition)',
          'Faster booking process (45% reduction in steps)',
          'Higher trust indicators (23% more social proof)',
          'Better localization (Spanish-native, not translated)',
          'Stronger accessibility compliance (WCAG 2.1 AA)'
        ]
      },
      user_behavior_insights: {
        argentina_patterns: {
          mobile_preference: 82,
          whatsapp_communication: 67,
          family_booking_behavior: 34,
          siesta_time_impact: 23,
          weekend_activity: 45
        },
        conversion_drivers: [
          { factor: 'Trust indicators', impact: 28 },
          { factor: 'Mobile optimization', impact: 31 },
          { factor: 'Payment security', impact: 25 },
          { factor: 'Social proof', impact: 19 },
          { factor: 'Clear pricing', impact: 22 }
        ]
      },
      scalability_readiness: {
        template_replication: {
          psychology_vertical: 'design-ready',
          medical_vertical: 'design-ready',
          fitness_vertical: 'in-progress',
          beauty_vertical: 'planned'
        },
        operational_scaling: {
          provider_onboarding: 'automated',
          customer_support: 'ai-enhanced',
          quality_assurance: 'systematic',
          localization: 'template-based'
        }
      }
    },
    standardsCompliance: {
      international_standards: {
        iso_9241: { compliance: 94, focus: 'Usability and User Experience' },
        iso_14289: { compliance: 91, focus: 'PDF Accessibility' },
        iso_40500: { compliance: 98, focus: 'WCAG 2.1 AA Compliance' }
      },
      argentina_standards: {
        ley_datos_personales: { compliance: 96, last_audit: '2024-03-15' },
        defensa_consumidor: { compliance: 98, last_audit: '2024-03-20' },
        accesibilidad_web: { compliance: 94, last_audit: '2024-04-01' }
      },
      industry_best_practices: {
        mobile_first_design: 100,
        progressive_enhancement: 96,
        semantic_html: 98,
        aria_implementation: 94,
        performance_budgets: 92
      }
    }
  };

  // Component State
  let currentData = writable({});
  let selectedMetric = 'overall';
  let complianceScore = 0;
  let readinessLevel = 'green';
  let lastAudit = new Date();

  onMount(() => {
    initializeVariant();
    calculateOverallReadiness();
    trackLaunchReadinessView();
  });

  function initializeVariant() {
    switch (variant) {
      case 'documentation':
        initializeDesignDocumentation();
        break;
      case 'accessibility':
        initializeAccessibilityExcellence();
        break;
      case 'quality':
        initializeQualityAssurance();
        break;
      case 'optimization':
        initializeOptimizationFramework();
        break;
      case 'insights':
        initializeBusinessInsights();
        break;
      case 'standards':
        initializeStandardsCompliance();
        break;
    }
  }

  function initializeDesignDocumentation() {
    currentData.set({
      ...launchReadinessData.designDocumentation,
      completionPercentage: 96,
      lastUpdate: '2024-04-15',
      nextMilestone: 'Template finalization for Psychology vertical'
    });
  }

  function initializeAccessibilityExcellence() {
    currentData.set({
      ...launchReadinessData.accessibilityExcellence,
      overallScore: 94.5,
      priorityImprovements: [
        { component: 'Date Picker', issue: 'Keyboard navigation enhancement', priority: 'high' },
        { component: 'Image Gallery', issue: 'Alt text optimization', priority: 'medium' },
        { component: 'Video Player', issue: 'Caption synchronization', priority: 'medium' }
      ]
    });
  }

  function initializeQualityAssurance() {
    currentData.set({
      ...launchReadinessData.qualityAssurance,
      overallQuality: 95.2,
      criticalIssues: 0,
      minorIssues: 8,
      testCoverage: 92.1
    });
  }

  function initializeOptimizationFramework() {
    currentData.set({
      ...launchReadinessData.optimizationFramework,
      optimizationScore: 91.3,
      activeExperiments: 5,
      completedOptimizations: 23
    });
  }

  function initializeBusinessInsights() {
    currentData.set({
      ...launchReadinessData.businessInsights,
      insightScore: 88.7,
      actionableInsights: 12,
      implementedRecommendations: 18
    });
  }

  function initializeStandardsCompliance() {
    currentData.set({
      ...launchReadinessData.standardsCompliance,
      overallCompliance: 95.8,
      pendingUpdates: 3,
      nextAudit: '2024-07-15'
    });
  }

  function calculateOverallReadiness() {
    // Calculate weighted readiness score
    const scores = {
      documentation: 96,
      accessibility: 94.5,
      quality: 95.2,
      optimization: 91.3,
      insights: 88.7,
      standards: 95.8
    };
    
    complianceScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    
    if (complianceScore >= 95) readinessLevel = 'green';
    else if (complianceScore >= 85) readinessLevel = 'yellow';
    else readinessLevel = 'red';
  }

  function trackLaunchReadinessView() {
    uxAnalytics.trackExternalEvent('launch_readiness_dashboard_view', {
      variant,
      launchPhase,
      complianceLevel,
      argentinaCompliance,
      scalabilityFocus
    });
  }

  function handleDesignStandard(standard: string, compliance: number, recommendations: string[]) {
    dispatch('designStandard', { standard, compliance, recommendations });
    
    uxAnalytics.trackExternalEvent('design_standard_reviewed', {
      standard,
      compliance,
      variant
    });
  }

  function handleAccessibilityImprovement(component: string, improvement: string, impact: 'high' | 'medium' | 'low') {
    dispatch('accessibilityImprovement', { component, improvement, impact });
    
    uxAnalytics.trackExternalEvent('accessibility_improvement_initiated', {
      component,
      improvement,
      impact
    });
  }

  function getReadinessColor(level: string): string {
    const colors = {
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.yellow;
  }

  function getComplianceGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    return 'C';
  }

  function getStatusColor(status: string): string {
    const colors = {
      complete: 'text-green-600 bg-green-100',
      'in-progress': 'text-blue-600 bg-blue-100',
      pending: 'text-yellow-600 bg-yellow-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[status] || colors.pending;
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  $: currentVariantData = $currentData;
</script>

<div class="launch-readiness-design" class:enterprise-mode={complianceLevel === 'enterprise'} class:argentina-compliant={argentinaCompliance}>
  {#if variant === 'documentation'}
    <!-- Design Documentation Excellence -->
    <section class="documentation-excellence bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Readiness Score -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Documentación de Diseño</h1>
            <p class="text-gray-600">Documentación integral para consistencia de marca y excelencia operacional</p>
          </div>
          
          <div class="text-center">
            <div class="text-4xl font-bold mb-2 {readinessLevel === 'green' ? 'text-green-600' : readinessLevel === 'yellow' ? 'text-yellow-600' : 'text-red-600'}">
              {complianceScore.toFixed(1)}%
            </div>
            <div class="text-sm text-gray-600">Completitud General</div>
            <div class="px-3 py-1 rounded-full text-xs font-bold mt-2 {getReadinessColor(readinessLevel)}">
              {getComplianceGrade(complianceScore)}
            </div>
          </div>
        </div>

        <!-- Brand Guidelines -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Guías de Marca</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Object.entries(currentVariantData.brandGuidelines || {}) as [guidelineKey, guideline]}
              <div class="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div class="text-center">
                  <div class="text-3xl mb-3">
                    {#if guidelineKey.includes('logo')}🎨
                    {:else if guidelineKey.includes('color')}🌈
                    {:else if guidelineKey.includes('typography')}🔤
                    {:else if guidelineKey.includes('iconography')}📱
                    {:else}📄
                    {/if}
                  </div>
                  
                  <h3 class="text-lg font-bold text-gray-900 mb-3 capitalize">
                    {guidelineKey.replace('_', ' ')}
                  </h3>
                  
                  <div class="mb-4">
                    <span class="px-3 py-1 rounded-full text-sm font-bold {getStatusColor(guideline.status)}">
                      {guideline.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div class="text-2xl font-bold text-blue-600 mb-2">
                    {guideline.compliance}%
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                         style="width: {guideline.compliance}%"></div>
                  </div>
                  
                  {#if guideline.variations}
                    <div class="text-sm text-gray-600 mb-2">
                      {guideline.variations} variaciones
                    </div>
                  {/if}
                  
                  {#if guideline.accessibility_contrast}
                    <div class="text-xs text-green-600">
                      ✓ AA: {guideline.accessibility_contrast.aa_compliant}
                      • AAA: {guideline.accessibility_contrast.aaa_compliant}
                    </div>
                  {/if}
                  
                  {#if guideline.argentina_optimization}
                    <div class="bg-blue-50 rounded-lg p-3 mt-3">
                      <div class="text-xs font-medium text-blue-900 mb-1">🇦🇷 Argentina</div>
                      <div class="text-xs text-blue-700">
                        Legibilidad: {guideline.argentina_optimization.readability_score}%
                      </div>
                    </div>
                  {/if}
                </div>
                
                <button class="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        on:click={() => handleDesignStandard(guidelineKey, guideline.compliance, [])}>
                  Ver Detalles
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Component Library Status -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Librería de Componentes</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Design Tokens -->
            <div class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Design Tokens</h3>
              
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tokens implementados:</span>
                  <span class="font-bold text-green-600">
                    {currentVariantData.componentLibrary?.design_tokens?.implemented || 0}
                  </span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Documentados:</span>
                  <span class="font-bold text-blue-600">
                    {currentVariantData.componentLibrary?.design_tokens?.documented || 0}
                  </span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Cumplimiento:</span>
                  <span class="font-bold text-purple-600">
                    {currentVariantData.componentLibrary?.design_tokens?.compliance || 0}%
                  </span>
                </div>
                
                <div class="bg-green-50 rounded-lg p-4">
                  <div class="flex items-center space-x-2">
                    <span class="text-green-600">✓</span>
                    <span class="text-green-800 font-medium">Cross-platform ready</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- UI Components -->
            <div class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Componentes UI</h3>
              
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Total componentes:</span>
                  <span class="font-bold text-gray-900">
                    {currentVariantData.componentLibrary?.ui_components?.total_components || 0}
                  </span>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center">
                    <div class="text-lg font-bold text-blue-600">
                      {currentVariantData.componentLibrary?.ui_components?.documented || 0}
                    </div>
                    <div class="text-xs text-gray-600">Documentados</div>
                  </div>
                  
                  <div class="text-center">
                    <div class="text-lg font-bold text-green-600">
                      {currentVariantData.componentLibrary?.ui_components?.tested || 0}
                    </div>
                    <div class="text-xs text-gray-600">Testeados</div>
                  </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4">
                  <div class="text-sm font-medium text-blue-900 mb-2">Estado de Accesibilidad</div>
                  <div class="text-lg font-bold text-blue-600">
                    {currentVariantData.componentLibrary?.ui_components?.accessibility_compliant || 0}/{currentVariantData.componentLibrary?.ui_components?.total_components || 0}
                  </div>
                  <div class="text-xs text-blue-700">Componentes WCAG 2.1 AA</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Template Scalability -->
        {#if scalabilityFocus}
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Escalabilidad de Templates</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Replicación Vertical</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span class="text-gray-700">Verticales disponibles:</span>
                    <span class="font-bold text-purple-600">
                      {currentVariantData.componentLibrary?.template_scalability?.vertical_templates || 0}
                    </span>
                  </div>
                  
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span class="text-gray-700">Tiempo de replicación:</span>
                    <span class="font-bold text-green-600">
                      {currentVariantData.componentLibrary?.template_scalability?.replication_time || 'N/A'}
                    </span>
                  </div>
                  
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span class="text-gray-700">Puntos de personalización:</span>
                    <span class="font-bold text-blue-600">
                      {currentVariantData.componentLibrary?.template_scalability?.customization_points || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Soporte de Localización</h3>
                <div class="space-y-3">
                  {#each currentVariantData.componentLibrary?.template_scalability?.locale_support || [] as locale}
                    <div class="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <span class="text-2xl">
                        {#if locale === 'es-AR'}🇦🇷
                        {:else if locale === 'en-US'}🇺🇸
                        {:else}🌍
                        {/if}
                      </span>
                      <span class="font-medium text-gray-900">{locale}</span>
                      <span class="text-green-500 ml-auto">✓</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'accessibility'}
    <!-- Accessibility Excellence Dashboard -->
    <section class="accessibility-excellence bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Excelencia en Accesibilidad</h1>
          <p class="text-gray-700">Experiencia inclusiva para usuarios diversos en el mercado argentino</p>
        </div>

        <!-- WCAG Compliance Overview -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Cumplimiento WCAG 2.1</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each Object.entries(currentVariantData.wcag_compliance || {}) as [level, compliance]}
              <div class="bg-white rounded-xl p-8 shadow-lg text-center">
                <div class="text-3xl mb-4">
                  {#if level === 'level_a'}🥉
                  {:else if level === 'level_aa'}🥈
                  {:else if level === 'level_aaa'}🥇
                  {:else}🏆
                  {/if}
                </div>
                
                <h3 class="text-xl font-bold text-gray-900 mb-4">
                  {level.replace('level_', 'WCAG ').toUpperCase()}
                </h3>
                
                <div class="text-4xl font-bold mb-2"
                     class:text-green-600={compliance.compliance >= 95}
                     class:text-yellow-600={compliance.compliance >= 85 && compliance.compliance < 95}
                     class:text-red-600={compliance.compliance < 85}>
                  {compliance.compliance}%
                </div>
                
                <div class="text-sm text-gray-600 mb-4">
                  {compliance.issues} problemas pendientes
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div class="h-3 rounded-full transition-all duration-1000"
                       class:bg-green-500={compliance.compliance >= 95}
                       class:bg-yellow-500={compliance.compliance >= 85 && compliance.compliance < 95}
                       class:bg-red-500={compliance.compliance < 85}
                       style="width: {compliance.compliance}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Inclusive Design Categories -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Diseño Inclusivo</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Object.entries(currentVariantData.inclusive_design || {}) as [category, metrics]}
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <div class="text-center">
                  <div class="text-3xl mb-3">
                    {#if category.includes('color')}🌈
                    {:else if category.includes('motor')}✋
                    {:else if category.includes('cognitive')}🧠
                    {:else if category.includes('visual')}👁️
                    {:else}♿
                    {/if}
                  </div>
                  
                  <h3 class="font-bold text-gray-900 mb-4 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  
                  <div class="space-y-3">
                    {#each Object.entries(metrics) as [metric, value]}
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600 capitalize">
                          {metric.replace('_', ' ')}:
                        </span>
                        <span class="font-bold"
                              class:text-green-600={value >= 95}
                              class:text-yellow-600={value >= 85 && value < 95}
                              class:text-red-600={value < 85}>
                          {typeof value === 'number' ? `${value}%` : value}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Argentina Accessibility Compliance -->
        {#if argentinaCompliance}
          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">🇦🇷 Cumplimiento Argentina</h2>
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {#each Object.entries(currentVariantData.argentina_accessibility || {}) as [metric, score]}
                  <div class="text-center">
                    <div class="text-2xl font-bold mb-2"
                         class:text-green-600={score >= 95}
                         class:text-yellow-600={score >= 85 && score < 95}
                         class:text-red-600={score < 85}>
                      {score}%
                    </div>
                    <div class="text-sm text-gray-700 capitalize">
                      {metric.replace('_', ' ')}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Priority Improvements -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Mejoras Prioritarias</h2>
          <div class="space-y-4">
            {#each currentVariantData.priorityImprovements || [] as improvement}
              <div class="bg-white rounded-lg p-6 shadow-lg border-l-4"
                   class:border-red-400={improvement.priority === 'high'}
                   class:border-yellow-400={improvement.priority === 'medium'}
                   class:border-green-400={improvement.priority === 'low'}>
                
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <h3 class="text-lg font-bold text-gray-900">{improvement.component}</h3>
                      <span class="px-3 py-1 rounded-full text-xs font-bold"
                            class:bg-red-100={improvement.priority === 'high'}
                            class:text-red-800={improvement.priority === 'high'}
                            class:bg-yellow-100={improvement.priority === 'medium'}
                            class:text-yellow-800={improvement.priority === 'medium'}
                            class:bg-green-100={improvement.priority === 'low'}
                            class:text-green-800={improvement.priority === 'low'}>
                        {improvement.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p class="text-gray-700">{improvement.issue}</p>
                  </div>
                  
                  <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ml-6"
                          on:click={() => handleAccessibilityImprovement(improvement.component, improvement.issue, improvement.priority)}>
                    Implementar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Testing Coverage -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Cobertura de Testing</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Object.entries(currentVariantData.testing_coverage || {}) as [testType, coverage]}
              <div class="text-center p-6 bg-white rounded-xl shadow-lg">
                <div class="text-3xl mb-3">
                  {#if testType.includes('automated')}🤖
                  {:else if testType.includes('manual')}👤
                  {:else if testType.includes('user')}👥
                  {:else if testType.includes('assistive')}♿
                  {:else}🗋
                  {/if}
                </div>
                
                <div class="text-2xl font-bold mb-2"
                     class:text-green-600={coverage >= 90}
                     class:text-yellow-600={coverage >= 80 && coverage < 90}
                     class:text-red-600={coverage < 80}>
                  {coverage}%
                </div>
                
                <div class="text-sm text-gray-700 capitalize">
                  {testType.replace('_', ' ')}
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div class="h-2 rounded-full transition-all duration-1000"
                       class:bg-green-500={coverage >= 90}
                       class:bg-yellow-500={coverage >= 80 && coverage < 90}
                       class:bg-red-500={coverage < 80}
                       style="width: {coverage}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'quality'}
    <!-- Quality Assurance Excellence -->
    <section class="quality-assurance bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Aseguramiento de Calidad</h1>
          <p class="text-gray-700">Procedimientos sistemáticos para excelencia consistente en la experiencia de usuario</p>
        </div>

        <!-- Overall Quality Score -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center space-x-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <div class="text-center">
              <div class="text-5xl font-bold text-blue-600 mb-2">
                {currentVariantData.overallQuality?.toFixed(1) || 0}%
              </div>
              <div class="text-lg font-medium text-gray-700">Calidad General</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {currentVariantData.criticalIssues || 0}
              </div>
              <div class="text-sm text-gray-600">Problemas Críticos</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-yellow-600 mb-2">
                {currentVariantData.minorIssues || 0}
              </div>
              <div class="text-sm text-gray-600">Problemas Menores</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600 mb-2">
                {currentVariantData.testCoverage?.toFixed(1) || 0}%
              </div>
              <div class="text-sm text-gray-600">Cobertura de Tests</div>
            </div>
          </div>
        </div>

        <!-- Design Consistency Metrics -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Consistencia de Diseño</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Object.entries(currentVariantData.design_consistency || {}) as [metric, score]}
              <div class="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div class="text-center">
                  <div class="text-3xl mb-3">
                    {#if metric.includes('component')}🧩
                    {:else if metric.includes('brand')}🎨
                    {:else if metric.includes('interaction')}☝️
                    {:else if metric.includes('hierarchy')}📊
                    {:else}🎯
                    {/if}
                  </div>
                  
                  <h3 class="font-bold text-gray-900 mb-3 capitalize">
                    {metric.replace('_', ' ')}
                  </h3>
                  
                  <div class="text-3xl font-bold mb-2"
                       class:text-green-600={score >= 95}
                       class:text-yellow-600={score >= 85 && score < 95}
                       class:text-red-600={score < 85}>
                    {score}%
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-1000"
                         class:bg-green-500={score >= 95}
                         class:bg-yellow-500={score >= 85 && score < 95}
                         class:bg-red-500={score < 85}
                         style="width: {score}%"></div>
                  </div>
                  
                  <div class="text-xs text-gray-600 mt-2">
                    {getComplianceGrade(score)} Grade
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- User Experience Quality -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Calidad de Experiencia de Usuario</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- UX Metrics -->
            <div class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Métricas UX</h3>
              
              <div class="space-y-6">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tasa de completitud de tareas:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-green-600">
                      {currentVariantData.user_experience?.task_completion_rate || 0}%
                    </div>
                    <div class="text-xs text-gray-500">Objetivo: >95%</div>
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Satisfacción del usuario:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-blue-600">
                      {currentVariantData.user_experience?.user_satisfaction || 0}/5
                    </div>
                    <div class="text-xs text-gray-500">Objetivo: >4.5</div>
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tasa de recuperación de errores:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-purple-600">
                      {currentVariantData.user_experience?.error_recovery_rate || 0}%
                    </div>
                    <div class="text-xs text-gray-500">Objetivo: >85%</div>
                  </div>
                </div>
                
                <div class="bg-green-50 rounded-lg p-4">
                  <div class="flex items-center space-x-2">
                    <span class="text-green-600">✓</span>
                    <span class="text-green-800 font-medium">
                      Curva de aprendizaje: {currentVariantData.user_experience?.learning_curve || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Performance Impact -->
            <div class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Impacto en Rendimiento</h3>
              
              <div class="space-y-6">
                {#each Object.entries(currentVariantData.performance_impact || {}) as [metric, grade]}
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 capitalize">
                      {metric.replace('_', ' ')}:
                    </span>
                    <div class="text-right">
                      <div class="inline-flex items-center space-x-2">
                        <span class="text-xl font-bold"
                              class:text-green-600={grade.includes('A')}
                              class:text-yellow-600={grade.includes('B')}
                              class:text-red-600={grade.includes('C')}>
                          {grade}
                        </span>
                        
                        {#if grade.includes('A')}
                          <span class="text-green-600">✓</span>
                        {:else if grade.includes('B')}
                          <span class="text-yellow-600">⚠️</span>
                        {:else}
                          <span class="text-red-600">❌</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Cross-Browser Testing -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Testing Cross-Browser</h2>
          
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              {#each Object.entries(currentVariantData.cross_browser_testing || {}) as [browser, compatibility]}
                <div class="text-center">
                  <div class="text-4xl mb-3">
                    {#if browser === 'chrome'}🌐
                    {:else if browser === 'safari'}🧢
                    {:else if browser === 'firefox'}🔥
                    {:else if browser === 'edge'}💻
                    {:else if browser.includes('mobile')}📱
                    {:else}🌍
                    {/if}
                  </div>
                  
                  <div class="text-lg font-bold mb-1"
                       class:text-green-600={compatibility >= 98}
                       class:text-yellow-600={compatibility >= 90 && compatibility < 98}
                       class:text-red-600={compatibility < 90}>
                    {compatibility}%
                  </div>
                  
                  <div class="text-sm text-gray-600 capitalize">
                    {browser.replace('_', ' ')}
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div class="h-1 rounded-full"
                         class:bg-green-500={compatibility >= 98}
                         class:bg-yellow-500={compatibility >= 90 && compatibility < 98}
                         class:bg-red-500={compatibility < 90}
                         style="width: {compatibility}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Argentina QA Specifics -->
        {#if argentinaCompliance}
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 QA Específico Argentina</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#each Object.entries(currentVariantData.argentina_qa || {}) as [metric, score]}
                <div class="text-center p-6 bg-white rounded-xl shadow-lg">
                  <div class="text-3xl mb-3">
                    {#if metric.includes('payment')}💳
                    {:else if metric.includes('whatsapp')}💬
                    {:else if metric.includes('spanish')}🇲🇽
                    {:else if metric.includes('cultural')}🎨
                    {:else}🇦🇷
                    {/if}
                  </div>
                  
                  <div class="text-2xl font-bold mb-2"
                       class:text-green-600={score >= 95}
                       class:text-yellow-600={score >= 85 && score < 95}
                       class:text-red-600={score < 85}>
                    {score}%
                  </div>
                  
                  <div class="text-sm text-gray-700 capitalize">
                    {metric.replace('_', ' ')}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'optimization'}
    <!-- Optimization Framework -->
    <section class="optimization-framework bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Marco de Optimización</h1>
          <p class="text-gray-700">Framework de mejora continua para experiencia de usuario post-lanzamiento</p>
        </div>

        <!-- Optimization Score Overview -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center space-x-8 bg-white rounded-2xl p-8 shadow-xl">
            <div class="text-center">
              <div class="text-5xl font-bold text-purple-600 mb-2">
                {currentVariantData.optimizationScore?.toFixed(1) || 0}%
              </div>
              <div class="text-lg font-medium text-gray-700">Score Optimización</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">
                {currentVariantData.activeExperiments || 0}
              </div>
              <div class="text-sm text-gray-600">Experimentos Activos</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {currentVariantData.completedOptimizations || 0}
              </div>
              <div class="text-sm text-gray-600">Optimizaciones Completadas</div>
            </div>
          </div>
        </div>

        <!-- Conversion Optimization -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Optimización de Conversión</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Booking Flow Optimization -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Flujo de Reservas</h3>
              
              <div class="space-y-6">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tasa de completitud:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-green-600">
                      {currentVariantData.conversion_optimization?.booking_flow?.completion_rate || 0}%
                    </div>
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Puntos de abandono:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-red-600">
                      {currentVariantData.conversion_optimization?.booking_flow?.abandonment_points || 0}
                    </div>
                  </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4">
                  <h4 class="font-medium text-blue-900 mb-3">Resultados A/B Testing:</h4>
                  <div class="space-y-2">
                    {#each Object.entries(currentVariantData.conversion_optimization?.booking_flow?.a_b_test_results || {}) as [test, result]}
                      <div class="flex justify-between text-sm">
                        <span class="text-blue-700 capitalize">
                          {test.replace('_', ' ')}:
                        </span>
                        <span class="font-bold text-green-600">{result}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Provider Onboarding -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Onboarding Proveedores</h3>
              
              <div class="space-y-6">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tasa de completitud:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-green-600">
                      {currentVariantData.conversion_optimization?.provider_onboarding?.completion_rate || 0}%
                    </div>
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Tiempo a primera reserva:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-blue-600">
                      {currentVariantData.conversion_optimization?.provider_onboarding?.time_to_first_booking || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Oportunidades de mejora:</span>
                  <div class="text-right">
                    <div class="text-xl font-bold text-yellow-600">
                      {currentVariantData.conversion_optimization?.provider_onboarding?.optimization_opportunities || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Optimization -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Optimización de Rendimiento</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Loading Times -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Tiempos de Carga</h3>
              
              <div class="space-y-4">
                {#each Object.entries(currentVariantData.performance_optimization?.loading_times || {}) as [metric, time]}
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 capitalize">
                      {metric.replace('_', ' ')}:
                    </span>
                    <div class="text-right">
                      <span class="font-bold"
                            class:text-green-600={parseFloat(time) <= 1.5 || parseFloat(time) <= 0.1}
                            class:text-yellow-600={parseFloat(time) > 1.5 && parseFloat(time) <= 3 || parseFloat(time) > 0.1 && parseFloat(time) <= 0.3}
                            class:text-red-600={parseFloat(time) > 3 || parseFloat(time) > 0.3}>
                        {time}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Mobile Optimization -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Optimización Móvil</h3>
              
              <div class="space-y-4">
                {#each Object.entries(currentVariantData.performance_optimization?.mobile_optimization || {}) as [metric, score]}
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 capitalize">
                      {metric.replace('_', ' ')}:
                    </span>
                    <div class="text-right">
                      <span class="font-bold"
                            class:text-green-600={score >= 90}
                            class:text-yellow-600={score >= 80 && score < 90}
                            class:text-red-600={score < 80}>
                        {typeof score === 'number' ? `${score}%` : score}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Continuous Improvement Process -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Proceso de Mejora Continua</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Object.entries(currentVariantData.continuous_improvement || {}) as [process, frequency]}
              <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div class="text-3xl mb-3">
                  {#if process.includes('feedback')}📝
                  {:else if process.includes('iteration')}🔄
                  {:else if process.includes('monitoring')}📈
                  {:else if process.includes('testing')}🧪
                  {:else}⚙️
                  {/if}
                </div>
                
                <h4 class="font-bold text-gray-900 mb-2 capitalize">
                  {process.replace('_', ' ')}
                </h4>
                
                <div class="text-lg font-bold text-purple-600">
                  {frequency}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'insights'}
    <!-- Business Insights & Strategic Direction -->
    <section class="business-insights bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Insights Estratégicos</h1>
          <p class="text-gray-700">Documentación de insights para desarrollo empresarial y asociaciones estratégicas</p>
        </div>

        <!-- Market Differentiation -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Diferenciación en el Mercado</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Unique Value Propositions -->
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Propuestas de Valor Únicas</h3>
              
              <div class="space-y-4">
                {#each currentVariantData.market_differentiation?.unique_value_props || [] as prop, index}
                  <div class="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p class="text-gray-700">{prop}</p>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Competitive Advantages -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Ventajas Competitivas</h3>
              
              <div class="space-y-4">
                {#each currentVariantData.market_differentiation?.competitive_advantages || [] as advantage}
                  <div class="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                    <p class="text-gray-700">{advantage}</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- User Behavior Insights -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Insights de Comportamiento de Usuario</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Argentina Patterns -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">🇦🇷 Patrones Argentina</h3>
              
              <div class="space-y-4">
                {#each Object.entries(currentVariantData.user_behavior_insights?.argentina_patterns || {}) as [pattern, percentage]}
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 capitalize">
                      {pattern.replace('_', ' ')}:
                    </span>
                    <div class="text-right">
                      <div class="text-lg font-bold text-blue-600">{percentage}%</div>
                      <div class="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: {percentage}%"></div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Conversion Drivers -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Drivers de Conversión</h3>
              
              <div class="space-y-4">
                {#each currentVariantData.user_behavior_insights?.conversion_drivers || [] as driver}
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium text-gray-900">{driver.factor}</span>
                      <span class="text-lg font-bold text-green-600">{driver.impact}%</span>
                    </div>
                    
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                           style="width: {driver.impact}%"></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Scalability Readiness -->
        {#if scalabilityFocus}
          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Preparación para Escalabilidad</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Template Replication -->
              <div class="bg-white rounded-xl p-8 shadow-lg">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Replicación de Templates</h3>
                
                <div class="space-y-4">
                  {#each Object.entries(currentVariantData.scalability_readiness?.template_replication || {}) as [vertical, status]}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span class="font-medium text-gray-900 capitalize">
                        {vertical.replace('_', ' ')}
                      </span>
                      
                      <span class="px-3 py-1 rounded-full text-sm font-bold"
                            class:bg-green-100={status === 'design-ready'}
                            class:text-green-800={status === 'design-ready'}
                            class:bg-blue-100={status === 'in-progress'}
                            class:text-blue-800={status === 'in-progress'}
                            class:bg-gray-100={status === 'planned'}
                            class:text-gray-800={status === 'planned'}>
                        {status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
              
              <!-- Operational Scaling -->
              <div class="bg-white rounded-xl p-8 shadow-lg">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Escalamiento Operacional</h3>
                
                <div class="space-y-4">
                  {#each Object.entries(currentVariantData.scalability_readiness?.operational_scaling || {}) as [area, status]}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span class="font-medium text-gray-900 capitalize">
                        {area.replace('_', ' ')}
                      </span>
                      
                      <span class="px-3 py-1 rounded-full text-sm font-bold"
                            class:bg-green-100={status === 'automated' || status === 'systematic'}
                            class:text-green-800={status === 'automated' || status === 'systematic'}
                            class:bg-blue-100={status === 'ai-enhanced' || status === 'template-based'}
                            class:text-blue-800={status === 'ai-enhanced' || status === 'template-based'}>
                        {status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Strategic Recommendations -->
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Recomendaciones Estratégicas</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl p-6 shadow-lg">
              <div class="text-center">
                <div class="text-3xl mb-3">🚀</div>
                <h3 class="font-bold text-gray-900 mb-3">Expansión de Mercado</h3>
                <p class="text-sm text-gray-700 mb-4">
                  Acelerar expansión a GBA Sur y Norte basado en alta demanda identificada (45% crecimiento potencial)
                </p>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
            
            <div class="bg-white rounded-xl p-6 shadow-lg">
              <div class="text-center">
                <div class="text-3xl mb-3">🤖</div>
                <h3 class="font-bold text-gray-900 mb-3">Automatización IA</h3>
                <p class="text-sm text-gray-700 mb-4">
                  Implementar IA para onboarding automatizado y soporte 24/7, reduciendo costos operativos en 35%
                </p>
                <button class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  Planificar
                </button>
              </div>
            </div>
            
            <div class="bg-white rounded-xl p-6 shadow-lg">
              <div class="text-center">
                <div class="text-3xl mb-3">🌐</div>
                <h3 class="font-bold text-gray-900 mb-3">Escalamiento Internacional</h3>
                <p class="text-sm text-gray-700 mb-4">
                  Template probado listo para replicación en otros países LATAM con adaptaciones mínimas
                </p>
                <button class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Explorar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'standards'}
    <!-- Standards Compliance Overview -->
    <section class="standards-compliance bg-gradient-to-br from-gray-50 to-slate-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Estándares de Cumplimiento</h1>
          <p class="text-gray-700">Adherencia a estándares internacionales y requerimientos argentinos</p>
        </div>

        <!-- Overall Compliance Score -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center space-x-8 bg-white rounded-2xl p-8 shadow-xl">
            <div class="text-center">
              <div class="text-5xl font-bold text-blue-600 mb-2">
                {currentVariantData.overallCompliance?.toFixed(1) || 0}%
              </div>
              <div class="text-lg font-medium text-gray-700">Cumplimiento General</div>
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-yellow-600 mb-2">
                {currentVariantData.pendingUpdates || 0}
              </div>
              <div class="text-sm text-gray-600">Actualizaciones Pendientes</div>
            </div>
            
            <div class="text-center">
              <div class="text-lg font-medium text-gray-600">
                Próxima auditoría:
              </div>
              <div class="text-sm text-gray-500">
                {new Date(currentVariantData.nextAudit || Date.now()).toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        <!-- International Standards -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Estándares Internacionales</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each Object.entries(currentVariantData.international_standards || {}) as [standard, data]}
              <div class="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <div class="text-center">
                  <div class="text-3xl mb-4">
                    {#if standard.includes('9241')}👤
                    {:else if standard.includes('14289')}📄
                    {:else if standard.includes('40500')}♿
                    {:else}🏆
                    {/if}
                  </div>
                  
                  <h3 class="text-xl font-bold text-gray-900 mb-3">
                    {standard.toUpperCase()}
                  </h3>
                  
                  <div class="text-3xl font-bold mb-2"
                       class:text-green-600={data.compliance >= 95}
                       class:text-yellow-600={data.compliance >= 85 && data.compliance < 95}
                       class:text-red-600={data.compliance < 85}>
                    {data.compliance}%
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div class="h-3 rounded-full transition-all duration-1000"
                         class:bg-green-500={data.compliance >= 95}
                         class:bg-yellow-500={data.compliance >= 85 && data.compliance < 95}
                         class:bg-red-500={data.compliance < 85}
                         style="width: {data.compliance}%"></div>
                  </div>
                  
                  <p class="text-sm text-gray-600">{data.focus}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Argentina Standards -->
        {#if argentinaCompliance}
          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">🇦🇷 Estándares Argentina</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {#each Object.entries(currentVariantData.argentina_standards || {}) as [standard, data]}
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 shadow-lg border border-blue-200">
                  <div class="text-center">
                    <div class="text-3xl mb-4">
                      {#if standard.includes('datos')}🔒
                      {:else if standard.includes('consumidor')}🛡️
                      {:else if standard.includes('accesibilidad')}♿
                      {:else}🇦🇷
                      {/if}
                    </div>
                    
                    <h3 class="text-lg font-bold text-gray-900 mb-3 capitalize">
                      {standard.replace('_', ' ')}
                    </h3>
                    
                    <div class="text-3xl font-bold mb-2"
                         class:text-green-600={data.compliance >= 95}
                         class:text-yellow-600={data.compliance >= 85 && data.compliance < 95}
                         class:text-red-600={data.compliance < 85}>
                      {data.compliance}%
                    </div>
                    
                    <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div class="h-3 rounded-full transition-all duration-1000"
                           class:bg-green-500={data.compliance >= 95}
                           class:bg-yellow-500={data.compliance >= 85 && data.compliance < 95}
                           class:bg-red-500={data.compliance < 85}
                           style="width: {data.compliance}%"></div>
                    </div>
                    
                    <div class="text-sm text-blue-700">
                      Última auditoría: {new Date(data.last_audit).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Industry Best Practices -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Mejores Prácticas de la Industria</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {#each Object.entries(currentVariantData.industry_best_practices || {}) as [practice, compliance]}
              <div class="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                <div class="text-3xl mb-3">
                  {#if practice.includes('mobile')}📱
                  {:else if practice.includes('progressive')}⬆️
                  {:else if practice.includes('semantic')}🏷️
                  {:else if practice.includes('aria')}♿
                  {:else if practice.includes('performance')}🚀
                  {:else}🏆
                  {/if}
                </div>
                
                <h4 class="font-bold text-gray-900 mb-3 text-sm capitalize">
                  {practice.replace('_', ' ')}
                </h4>
                
                <div class="text-2xl font-bold mb-2"
                     class:text-green-600={compliance >= 95}
                     class:text-yellow-600={compliance >= 85 && compliance < 95}
                     class:text-red-600={compliance < 85}>
                  {compliance}%
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-1000"
                       class:bg-green-500={compliance >= 95}
                       class:bg-yellow-500={compliance >= 85 && compliance < 95}
                       class:bg-red-500={compliance < 85}
                       style="width: {compliance}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .launch-readiness-design {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .enterprise-mode {
    --enterprise-primary: #4338ca;
    --enterprise-secondary: #3730a3;
  }

  .argentina-compliant {
    --argentina-blue: #74b9ff;
    --argentina-celeste: #00b894;
  }

  /* Premium design excellence styling */
  .documentation-excellence {
    background-image: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), 
                      radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  }

  /* Accessibility compliance indicators */
  .accessibility-indicator {
    position: relative;
  }

  .accessibility-indicator::after {
    content: '\267F';
    position: absolute;
    top: -5px;
    right: -5px;
    background: #10b981;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  /* Standards compliance gradients */
  .compliance-excellent {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .compliance-good {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .compliance-needs-improvement {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .launch-readiness-design h1 {
      font-size: 2rem;
    }
    
    .launch-readiness-design .text-3xl {
      font-size: 1.5rem;
    }
    
    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Enhanced accessibility */
  .launch-readiness-design [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Quality assurance visual indicators */
  .qa-passed {
    border-left: 4px solid #10b981;
    background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
  }

  .qa-warning {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);
  }

  .qa-failed {
    border-left: 4px solid #ef4444;
    background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
  }

  /* Launch readiness animations */
  @keyframes readinessCheck {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .readiness-metric {
    animation: readinessCheck 2s ease-in-out infinite;
  }

  /* Argentina-specific design elements */
  .argentina-flag-gradient {
    background: linear-gradient(to bottom, #74b9ff 33%, #ffffff 33%, #ffffff 66%, #00b894 66%);
  }
</style>