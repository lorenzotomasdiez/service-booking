<!--
  Design Intelligence & Continuous Optimization Framework - D13-001
  Design analytics with user behavior tracking and experience optimization insights
  A/B testing design framework with conversion optimization and performance tracking
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'analytics' | 'testing' | 'optimization' | 'documentation' | 'quality' | 'achievements' = 'analytics';
  export let realTimeTracking: boolean = true;
  export let aiPoweredInsights: boolean = true;
  export let argentinaMarketOptimized: boolean = true;
  export let teamScalingReady: boolean = true;

  const dispatch = createEventDispatcher<{
    optimizationAction: { type: string; target: string; expectedImprovement: number };
    testingInitiated: { testName: string; hypothesis: string; duration: number };
    qualityIssue: { component: string; severity: 'high' | 'medium' | 'low'; action: string };
    achievementUnlocked: { milestone: string; impact: string; team: string };
  }>();

  // Design Intelligence & Optimization Framework Data
  const designIntelligenceData = {
    analyticsInsights: {
      userBehaviorTracking: {
        pageViews: {
          total_views: 234567,
          unique_visitors: 89234,
          bounce_rate: 23.4,
          avg_session_duration: 342, // seconds
          pages_per_session: 4.2,
          mobile_percentage: 78.3
        },
        interactionPatterns: {
          click_heatmaps: {
            primary_cta: 67.8, // % of users who click
            secondary_navigation: 34.2,
            provider_profiles: 89.1,
            booking_button: 56.7,
            whatsapp_contact: 78.9
          },
          scroll_behavior: {
            avg_scroll_depth: 68.5, // % of page
            scroll_to_booking: 78.2,
            content_engagement_zones: ['Hero: 95%', 'Services: 78%', 'Reviews: 82%', 'Footer: 23%']
          },
          form_interactions: {
            field_completion_rate: 89.4,
            field_errors: {
              email: 12.3,
              phone: 8.7,
              date_selection: 5.2,
              payment_info: 15.6
            },
            abandonment_points: ['Payment step: 23%', 'Registration: 18%', 'Service selection: 12%']
          }
        },
        argentinaBehaviorInsights: {
          cultural_preferences: {
            whatsapp_preference: 82.1, // % prefer WhatsApp over email
            family_booking_patterns: 45.8, // % book for family members
            siesta_hour_activity: 12.3, // % active 14:00-17:00
            weekend_family_usage: 67.9, // % higher weekend family bookings
            mate_break_awareness: 34.7 // % appreciate mate break messaging
          },
          local_optimization: {
            buenos_aires_preferences: 'Fast booking, premium focus',
            cordoba_preferences: 'Value pricing, family services',
            rosario_preferences: 'Local providers, community feel',
            mendoza_preferences: 'Quality services, wine event prep'
          }
        }
      },
      experienceOptimization: {
        conversionFunnelAnalysis: {
          landing_to_browse: { rate: 87.3, drop_reasons: ['Slow loading', 'Poor mobile UX'] },
          browse_to_select: { rate: 72.8, drop_reasons: ['Too many options', 'Unclear pricing'] },
          select_to_booking: { rate: 68.4, drop_reasons: ['Complex form', 'Registration required'] },
          booking_to_payment: { rate: 84.2, drop_reasons: ['Payment failures', 'Security concerns'] },
          overall_conversion: 36.8
        },
        performanceMetrics: {
          loading_times: {
            first_contentful_paint: 1.2, // seconds
            largest_contentful_paint: 2.1,
            cumulative_layout_shift: 0.08,
            first_input_delay: 0.05,
            mobile_performance_score: 92
          },
          accessibility_compliance: {
            wcag_aa_score: 96,
            color_contrast_issues: 2,
            keyboard_navigation_score: 98,
            screen_reader_compatibility: 94,
            spanish_language_support: 99
          }
        }
      },
      realTimeInsights: [
        {
          insight: 'Mobile users prefer larger touch targets',
          confidence: 89,
          impact: 'high',
          action: 'Increase button sizes by 20% on mobile',
          expected_improvement: 15
        },
        {
          insight: 'WhatsApp integration drives 34% higher conversions',
          confidence: 94,
          impact: 'high',
          action: 'Promote WhatsApp option more prominently',
          expected_improvement: 28
        },
        {
          insight: 'Family booking flow needs simplification',
          confidence: 82,
          impact: 'medium',
          action: 'Create dedicated family booking path',
          expected_improvement: 22
        }
      ]
    },
    abTestingFramework: {
      activeTests: [
        {
          test_name: 'Hero Section Argentina Cultural Elements',
          hypothesis: 'Adding Argentina cultural elements will increase engagement by 25%',
          variations: ['Current Design', 'With Mate Icons', 'With Argentina Colors', 'With Local Phrases'],
          start_date: '2024-03-15',
          duration_days: 14,
          sample_size: 5000,
          statistical_significance: 95,
          current_results: {
            control: { conversion: 24.3, sample: 1250 },
            variation_a: { conversion: 28.7, sample: 1250 },
            variation_b: { conversion: 26.1, sample: 1250 },
            variation_c: { conversion: 31.2, sample: 1250 }
          },
          status: 'running'
        },
        {
          test_name: 'Mobile Booking Flow Optimization',
          hypothesis: 'Reducing booking steps from 5 to 3 will improve mobile conversion by 35%',
          variations: ['5-Step Flow', '3-Step Flow', '3-Step + Progress Indicator'],
          start_date: '2024-03-10',
          duration_days: 21,
          sample_size: 8000,
          statistical_significance: 95,
          current_results: {
            control: { conversion: 18.4, sample: 2667 },
            variation_a: { conversion: 24.8, sample: 2667 },
            variation_b: { conversion: 26.3, sample: 2666 }
          },
          status: 'completed',
          winner: 'variation_b'
        },
        {
          test_name: 'Payment Method Display Argentina',
          hypothesis: 'Prominently featuring MercadoPago will increase payment completion by 40%',
          variations: ['All Equal', 'MercadoPago Featured', 'MercadoPago + Local Banks'],
          start_date: '2024-03-20',
          duration_days: 10,
          sample_size: 3000,
          statistical_significance: 90,
          current_results: {
            control: { conversion: 76.2, sample: 1000 },
            variation_a: { conversion: 84.7, sample: 1000 },
            variation_b: { conversion: 81.3, sample: 1000 }
          },
          status: 'running'
        }
      ],
      testingBestPractices: {
        argentina_specific: [
          'Test cultural elements separately',
          'Include WhatsApp vs. email preferences',
          'Test family vs. individual flows',
          'Validate mate break timing messaging',
          'Test peso vs. dollar pricing display'
        ],
        statistical_rigor: [
          'Minimum 1000 users per variation',
          '95% statistical significance required',
          '14-day minimum test duration',
          'Pre-define success metrics',
          'Account for seasonality'
        ],
        mobile_first: [
          'Test mobile variations first',
          'Separate mobile/desktop results',
          'Touch-friendly element testing',
          'Performance impact measurement',
          'Mobile app feature validation'
        ]
      }
    },
    optimizationProcedures: {
      continuousImprovement: {
        optimization_cycles: [
          {
            cycle: 'Weekly Performance Review',
            frequency: 'Every Monday',
            focus_areas: ['Page load times', 'Conversion rates', 'User feedback'],
            action_threshold: '5% degradation',
            automated_alerts: true
          },
          {
            cycle: 'Monthly UX Audit',
            frequency: 'First Friday of month',
            focus_areas: ['User journey analysis', 'Mobile experience', 'Accessibility'],
            action_threshold: 'WCAG compliance < 95%',
            automated_alerts: false
          },
          {
            cycle: 'Quarterly Argentina Market Review',
            frequency: 'Every 3 months',
            focus_areas: ['Cultural alignment', 'Local preferences', 'Competitive analysis'],
            action_threshold: 'Market fit score < 85%',
            automated_alerts: true
          }
        ],
        dataInputSources: [
          'Google Analytics 4',
          'Hotjar heatmaps and recordings',
          'User feedback surveys',
          'Support ticket analysis',
          'Provider feedback sessions',
          'Competitive analysis reports'
        ],
        optimizationPriority: {
          high: ['Conversion blockers', 'Performance issues', 'Accessibility violations'],
          medium: ['UX improvements', 'Cultural adaptations', 'Feature enhancements'],
          low: ['Visual refinements', 'Micro-interactions', 'Nice-to-have features']
        }
      },
      automatedOptimization: {
        ai_powered_insights: {
          pattern_recognition: 'ML models identify user behavior patterns',
          anomaly_detection: 'Automatic alerts for unusual metrics',
          predictive_analysis: 'Forecast conversion rate changes',
          recommendation_engine: 'Suggest optimization actions',
          confidence_scoring: 'Rate recommendation reliability'
        },
        real_time_adjustments: [
          'Dynamic button sizing based on device',
          'Automatic image optimization',
          'Smart content prioritization',
          'Adaptive loading strategies',
          'Personalized user flows'
        ]
      }
    },
    designDocumentation: {
      teamScaling: {
        design_system_documentation: {
          component_library: 'Comprehensive Figma + Storybook docs',
          design_tokens: 'Standardized colors, typography, spacing',
          usage_guidelines: 'When and how to use components',
          accessibility_standards: 'WCAG 2.1 AA compliance rules',
          argentina_adaptations: 'Cultural customization guidelines'
        },
        onboarding_materials: [
          'BarberPro Design Philosophy',
          'Argentina Market Design Guidelines',
          'Component Usage Tutorials',
          'A/B Testing Process Documentation',
          'Quality Assurance Checklists'
        ],
        knowledge_transfer: {
          design_decisions_log: 'Historical context for design choices',
          user_research_repository: 'Centralized user feedback and insights',
          argentina_cultural_guide: 'Cultural considerations for design',
          performance_benchmarks: 'Target metrics and thresholds',
          competitive_analysis_archive: 'Ongoing competitor tracking'
        }
      },
      processDocumentation: {
        design_workflow: [
          'User Research → Insights → Hypothesis',
          'Design → Prototype → Test → Iterate',
          'Component Documentation → Implementation',
          'Launch → Monitor → Optimize'
        ],
        review_process: [
          'Accessibility Review (WCAG 2.1 AA)',
          'Argentina Cultural Review',
          'Performance Impact Assessment',
          'Brand Consistency Check',
          'User Testing Validation'
        ]
      }
    },
    qualityAssurance: {
      brandConsistency: {
        visual_consistency_score: 96,
        messaging_consistency_score: 94,
        experience_consistency_score: 92,
        cultural_consistency_score: 98,
        automated_checks: [
          'Color palette adherence',
          'Typography consistency',
          'Spacing standard compliance',
          'Icon usage validation',
          'Image style consistency'
        ]
      },
      userExperienceValidation: {
        usability_testing: {
          monthly_sessions: 8,
          argentina_participants: 78, // % from Argentina
          task_completion_rate: 94.2,
          average_satisfaction: 4.7,
          issues_identified: 12,
          issues_resolved: 11
        },
        accessibility_monitoring: {
          automated_scans: 'Daily Axe Core scans',
          manual_testing: 'Weekly keyboard navigation tests',
          screen_reader_testing: 'Bi-weekly NVDA/JAWS testing',
          color_contrast_validation: 'Continuous monitoring',
          compliance_score: 96
        }
      }
    },
    achievementTracking: {
      designMilestones: [
        {
          milestone: 'WCAG 2.1 AA Compliance Achievement',
          achieved: true,
          date: '2024-02-15',
          impact: '15% increase in accessibility user satisfaction',
          team_effort: 'Design + Dev + QA collaboration',
          next_target: 'WCAG 2.2 AAA compliance by Q3'
        },
        {
          milestone: 'Argentina Cultural Adaptation Excellence',
          achieved: true,
          date: '2024-03-01',
          impact: '28% improvement in local user engagement',
          team_effort: 'Design + Market Research + Cultural Consultants',
          next_target: 'Expand to other LATAM markets'
        },
        {
          milestone: 'Mobile-First Performance Optimization',
          achieved: true,
          date: '2024-03-10',
          impact: '35% faster loading on 3G networks',
          team_effort: 'Design + Engineering + Performance team',
          next_target: 'Sub-1-second load times on 4G'
        },
        {
          milestone: '50-Customer Soft Launch Success',
          achieved: true,
          date: '2024-03-15',
          impact: '4.7/5 customer satisfaction rating',
          team_effort: 'Full product team + Customer Success',
          next_target: 'Scale to 500 customers with maintained quality'
        }
      ],
      businessImpactMetrics: {
        design_driven_improvements: {
          conversion_rate_increase: 47, // % improvement since launch
          user_satisfaction_increase: 23,
          accessibility_compliance_increase: 38,
          brand_consistency_increase: 29,
          argentina_market_fit_increase: 52
        },
        team_productivity_gains: {
          design_velocity_increase: 34, // % faster design delivery
          development_handoff_efficiency: 28,
          qa_iteration_reduction: 42,
          documentation_completeness: 96
        }
      }
    }
  };

  // Component State
  let currentData = writable({});
  let selectedTimeframe = '30d';
  let activeInsights = writable([]);
  let optimizationQueue = writable([]);
  let lastUpdate = new Date();

  onMount(() => {
    initializeVariant();
    if (realTimeTracking) {
      startRealTimeTracking();
    }
    trackDesignIntelligenceUsage();
  });

  function initializeVariant() {
    switch (variant) {
      case 'analytics':
        initializeAnalyticsInsights();
        break;
      case 'testing':
        initializeABTestingFramework();
        break;
      case 'optimization':
        initializeOptimizationProcedures();
        break;
      case 'documentation':
        initializeDesignDocumentation();
        break;
      case 'quality':
        initializeQualityAssurance();
        break;
      case 'achievements':
        initializeAchievementTracking();
        break;
    }
  }

  function initializeAnalyticsInsights() {
    currentData.set({
      ...designIntelligenceData.analyticsInsights,
      insightsCount: designIntelligenceData.analyticsInsights.realTimeInsights.length,
      highImpactInsights: designIntelligenceData.analyticsInsights.realTimeInsights.filter(i => i.impact === 'high').length
    });
  }

  function initializeABTestingFramework() {
    currentData.set({
      ...designIntelligenceData.abTestingFramework,
      activeTestsCount: designIntelligenceData.abTestingFramework.activeTests.filter(t => t.status === 'running').length,
      completedTestsCount: designIntelligenceData.abTestingFramework.activeTests.filter(t => t.status === 'completed').length
    });
  }

  function initializeOptimizationProcedures() {
    currentData.set({
      ...designIntelligenceData.optimizationProcedures,
      optimizationScore: 87,
      automationLevel: 73
    });
  }

  function initializeDesignDocumentation() {
    currentData.set({
      ...designIntelligenceData.designDocumentation,
      documentationCompleteness: 96,
      teamOnboardingScore: 89
    });
  }

  function initializeQualityAssurance() {
    currentData.set({
      ...designIntelligenceData.qualityAssurance,
      overallQualityScore: 94,
      complianceScore: 96
    });
  }

  function initializeAchievementTracking() {
    currentData.set({
      ...designIntelligenceData.achievementTracking,
      milestonesCompleted: designIntelligenceData.achievementTracking.designMilestones.filter(m => m.achieved).length,
      totalMilestones: designIntelligenceData.achievementTracking.designMilestones.length
    });
  }

  function startRealTimeTracking() {
    setInterval(() => {
      updateRealTimeMetrics();
      lastUpdate = new Date();
    }, 30000); // Update every 30 seconds
  }

  function updateRealTimeMetrics() {
    // Simulate real-time analytics updates
    const newInsight = {
      insight: 'Real-time user behavior change detected',
      confidence: Math.floor(Math.random() * 20) + 80,
      impact: Math.random() > 0.7 ? 'high' : 'medium',
      action: 'Monitor and analyze pattern',
      expected_improvement: Math.floor(Math.random() * 15) + 10
    };

    activeInsights.update(insights => [newInsight, ...insights.slice(0, 4)]);
  }

  function handleOptimizationAction(type: string, target: string, expectedImprovement: number) {
    dispatch('optimizationAction', { type, target, expectedImprovement });

    uxAnalytics.trackExternalEvent('design_optimization_action', {
      type,
      target,
      expectedImprovement,
      variant
    });
  }

  function handleTestingInitiation(testName: string, hypothesis: string, duration: number) {
    dispatch('testingInitiated', { testName, hypothesis, duration });

    uxAnalytics.trackExternalEvent('ab_test_initiated', {
      testName,
      hypothesis,
      duration,
      variant
    });
  }

  function trackDesignIntelligenceUsage() {
    uxAnalytics.trackExternalEvent('design_intelligence_framework_view', {
      variant,
      realTimeTracking,
      aiPoweredInsights,
      argentinaMarketOptimized,
      teamScalingReady
    });
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function getPerformanceColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getImpactColor(impact: string): string {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-300',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'low': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[impact] || colors.medium;
  }

  function getTestStatusColor(status: string): string {
    const colors = {
      'running': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'planned': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.planned;
  }

  $: currentVariantData = $currentData;
  $: liveInsights = $activeInsights;
</script>

<div class="design-intelligence-framework" class:real-time-enabled={realTimeTracking} class:ai-powered={aiPoweredInsights}>
  {#if variant === 'analytics'}
    <!-- Design Analytics & User Behavior Tracking -->
    <section class="analytics-section bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Design Analytics Intelligence</h1>
          <p class="text-gray-700 text-lg">Seguimiento de comportamiento del usuario e insights de optimización</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              Insights Activos: {currentVariantData.insightsCount || 0}
            </div>
            <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Alto Impacto: {currentVariantData.highImpactInsights || 0}
            </div>
            {#if realTimeTracking}
              <div class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Tiempo Real</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- User Behavior Metrics -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Métricas de Comportamiento del Usuario</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <!-- Page Views -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Visualizaciones de Página</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-700">Total vistas:</span>
                  <span class="font-bold text-blue-600">
                    {(currentVariantData.userBehaviorTracking?.pageViews?.total_views || 234567).toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Visitantes únicos:</span>
                  <span class="font-bold text-indigo-600">
                    {(currentVariantData.userBehaviorTracking?.pageViews?.unique_visitors || 89234).toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Bounce rate:</span>
                  <span class="font-bold {getPerformanceColor(100 - (currentVariantData.userBehaviorTracking?.pageViews?.bounce_rate || 23.4))}">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.pageViews?.bounce_rate || 23.4)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Móvil:</span>
                  <span class="font-bold text-purple-600">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.pageViews?.mobile_percentage || 78.3)}
                  </span>
                </div>
              </div>
            </div>

            <!-- Interaction Patterns -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Patrones de Interacción</h3>
              <div class="space-y-3">
                {#each Object.entries(currentVariantData.userBehaviorTracking?.interactionPatterns?.click_heatmaps || {}) as [element, percentage]}
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 text-sm capitalize">
                      {element.replace('_', ' ')}:
                    </span>
                    <div class="flex items-center space-x-2">
                      <div class="w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: {percentage}%"></div>
                      </div>
                      <span class="font-bold text-green-600 text-sm">{formatPercentage(percentage)}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Performance Metrics -->
            <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Métricas de Rendimiento</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-700">FCP:</span>
                  <span class="font-bold text-green-600">
                    {currentVariantData.experienceOptimization?.performanceMetrics?.loading_times?.first_contentful_paint || 1.2}s
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">LCP:</span>
                  <span class="font-bold text-blue-600">
                    {currentVariantData.experienceOptimization?.performanceMetrics?.loading_times?.largest_contentful_paint || 2.1}s
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">CLS:</span>
                  <span class="font-bold text-purple-600">
                    {currentVariantData.experienceOptimization?.performanceMetrics?.loading_times?.cumulative_layout_shift || 0.08}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Score móvil:</span>
                  <span class="font-bold text-orange-600">
                    {currentVariantData.experienceOptimization?.performanceMetrics?.loading_times?.mobile_performance_score || 92}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Argentina Behavior Insights -->
          {#if argentinaMarketOptimized}
            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">🇦🇷 Insights de Comportamiento Argentina</h3>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-blue-600 mb-1">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.argentinaBehaviorInsights?.cultural_preferences?.whatsapp_preference || 82.1)}
                  </div>
                  <div class="text-xs text-gray-600">Prefiere WhatsApp</div>
                </div>

                <div class="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-green-600 mb-1">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.argentinaBehaviorInsights?.cultural_preferences?.family_booking_patterns || 45.8)}
                  </div>
                  <div class="text-xs text-gray-600">Reservas Familiares</div>
                </div>

                <div class="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-purple-600 mb-1">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.argentinaBehaviorInsights?.cultural_preferences?.weekend_family_usage || 67.9)}
                  </div>
                  <div class="text-xs text-gray-600">Uso Familiar Weekends</div>
                </div>

                <div class="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-yellow-600 mb-1">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.argentinaBehaviorInsights?.cultural_preferences?.siesta_hour_activity || 12.3)}
                  </div>
                  <div class="text-xs text-gray-600">Actividad Siesta</div>
                </div>

                <div class="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-orange-600 mb-1">
                    {formatPercentage(currentVariantData.userBehaviorTracking?.argentinaBehaviorInsights?.cultural_preferences?.mate_break_awareness || 34.7)}
                  </div>
                  <div class="text-xs text-gray-600">Aprecia Mate Break</div>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Real-time Insights -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <span>Insights en Tiempo Real</span>
            {#if aiPoweredInsights}
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                🤖 IA
              </span>
            {/if}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each currentVariantData.realTimeInsights || [] as insight}
              <div class="border rounded-xl p-6 hover:shadow-lg transition-all"
                   class:bg-red-50={insight.impact === 'high'}
                   class:border-red-200={insight.impact === 'high'}
                   class:bg-yellow-50={insight.impact === 'medium'}
                   class:border-yellow-200={insight.impact === 'medium'}
                   class:bg-green-50={insight.impact === 'low'}
                   class:border-green-200={insight.impact === 'low'}>

                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 mb-2">{insight.insight}</h3>
                    <p class="text-sm text-gray-700 mb-3">{insight.action}</p>
                  </div>

                  <span class="px-2 py-1 rounded-full text-xs font-bold border {getImpactColor(insight.impact)}">
                    {insight.impact.toUpperCase()}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="text-sm">
                    <span class="text-gray-600">Confianza:</span>
                    <span class="font-bold text-blue-600">{insight.confidence}%</span>
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-600">Mejora esperada:</span>
                    <span class="font-bold text-green-600">+{insight.expected_improvement}%</span>
                  </div>
                </div>

                <button class="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                        on:click={() => handleOptimizationAction('implement_insight', insight.insight, insight.expected_improvement)}>
                  Implementar Optimización
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'testing'}
    <!-- A/B Testing Framework -->
    <section class="testing-section bg-gradient-to-br from-blue-50 to-cyan-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Framework de A/B Testing</h1>
          <p class="text-gray-700 text-lg">Optimización de conversión y seguimiento de rendimiento</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              Tests Activos: {currentVariantData.activeTestsCount || 0}
            </div>
            <div class="bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full font-medium">
              Tests Completados: {currentVariantData.completedTestsCount || 0}
            </div>
          </div>
        </div>

        <!-- Active Tests -->
        <div class="space-y-8">
          {#each currentVariantData.activeTests || [] as test}
            <div class="bg-white rounded-2xl p-8 shadow-xl border-l-4"
                 class:border-blue-500={test.status === 'running'}
                 class:border-green-500={test.status === 'completed'}>

              <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">{test.test_name}</h2>
                  <p class="text-gray-700 mb-4"><strong>Hipótesis:</strong> {test.hypothesis}</p>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Inicio:</span>
                      <div class="font-medium">{new Date(test.start_date).toLocaleDateString('es-AR')}</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Duración:</span>
                      <div class="font-medium">{test.duration_days} días</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Muestra:</span>
                      <div class="font-medium">{test.sample_size.toLocaleString()}</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Significancia:</span>
                      <div class="font-medium">{test.statistical_significance}%</div>
                    </div>
                  </div>
                </div>

                <span class="px-3 py-1 rounded-full text-sm font-bold {getTestStatusColor(test.status)}">
                  {test.status.toUpperCase()}
                </span>
              </div>

              <!-- Test Results -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {#each Object.entries(test.current_results) as [variation, results]}
                  <div class="p-4 rounded-lg border border-gray-200"
                       class:bg-green-50={test.winner === variation}
                       class:border-green-300={test.winner === variation}>

                    <div class="text-center">
                      <h3 class="font-bold text-gray-900 mb-2 capitalize">
                        {variation === 'control' ? 'Control' : variation.replace('_', ' ')}
                      </h3>

                      <div class="text-3xl font-bold mb-2"
                           class:text-green-600={test.winner === variation}
                           class:text-blue-600={test.winner !== variation}>
                        {formatPercentage(results.conversion)}
                      </div>

                      <div class="text-sm text-gray-600 mb-3">
                        Conversión ({results.sample.toLocaleString()} usuarios)
                      </div>

                      {#if test.winner === variation}
                        <div class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                          🏆 GANADOR
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Test Variations -->
              <div class="mb-6">
                <h3 class="font-bold text-gray-900 mb-3">Variaciones:</h3>
                <div class="flex flex-wrap gap-2">
                  {#each test.variations as variation}
                    <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {variation}
                    </span>
                  {/each}
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  {#if test.status === 'running'}
                    Test en progreso - Recolectando datos...
                  {:else if test.status === 'completed'}
                    Test completado - Resultados finales disponibles
                  {/if}
                </div>

                <div class="space-x-3">
                  {#if test.status === 'running'}
                    <button class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                      Detener Test
                    </button>
                  {:else if test.status === 'completed'}
                    <button class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      Implementar Ganador
                    </button>
                  {/if}

                  <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Testing Best Practices -->
        <div class="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Mejores Prácticas de Testing</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Argentina Specific -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
              <h3 class="font-bold text-gray-900 mb-4 text-center">🇦🇷 Específico Argentina</h3>
              <div class="space-y-2">
                {#each currentVariantData.testingBestPractices?.argentina_specific || [] as practice}
                  <div class="flex items-start space-x-2">
                    <span class="text-blue-500 text-sm">•</span>
                    <span class="text-sm text-gray-700">{practice}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Statistical Rigor -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
              <h3 class="font-bold text-gray-900 mb-4 text-center">📊 Rigor Estadístico</h3>
              <div class="space-y-2">
                {#each currentVariantData.testingBestPractices?.statistical_rigor || [] as practice}
                  <div class="flex items-start space-x-2">
                    <span class="text-green-500 text-sm">•</span>
                    <span class="text-sm text-gray-700">{practice}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Mobile First -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
              <h3 class="font-bold text-gray-900 mb-4 text-center">📱 Mobile First</h3>
              <div class="space-y-2">
                {#each currentVariantData.testingBestPractices?.mobile_first || [] as practice}
                  <div class="flex items-start space-x-2">
                    <span class="text-purple-500 text-sm">•</span>
                    <span class="text-sm text-gray-700">{practice}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <div class="text-center mt-8">
            <button class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                    on:click={() => handleTestingInitiation('New Cultural Test', 'Argentina elements increase engagement', 14)}>
              Crear Nuevo Test
            </button>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'optimization'}
    <!-- Optimization Procedures -->
    <section class="optimization-section bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Procedimientos de Optimización</h1>
          <p class="text-gray-700 text-lg">Mejora continua y optimización automática</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              Score Optimización: {currentVariantData.optimizationScore || 87}/100
            </div>
            <div class="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-medium">
              Nivel Automatización: {currentVariantData.automationLevel || 73}%
            </div>
          </div>
        </div>

        <!-- Continuous Improvement Cycles -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Ciclos de Mejora Continua</h2>

          <div class="space-y-6">
            {#each currentVariantData.continuousImprovement?.optimization_cycles || [] as cycle}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">{cycle.cycle}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span class="text-gray-600">Frecuencia:</span>
                        <div class="font-medium">{cycle.frequency}</div>
                      </div>
                      <div>
                        <span class="text-gray-600">Umbral acción:</span>
                        <div class="font-medium">{cycle.action_threshold}</div>
                      </div>
                      <div>
                        <span class="text-gray-600">Alertas automáticas:</span>
                        <div class="font-medium">{cycle.automated_alerts ? '✅ Sí' : '❌ No'}</div>
                      </div>
                      <div>
                        <span class="text-gray-600">Áreas foco:</span>
                        <div class="font-medium">{cycle.focus_areas.length} áreas</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-gray-700 mb-2">Áreas de Enfoque:</h4>
                  <div class="flex flex-wrap gap-2">
                    {#each cycle.focus_areas as area}
                      <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {area}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Automated Optimization -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- AI-Powered Insights -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <span>Insights Potenciados por IA</span>
              <span class="text-2xl">🤖</span>
            </h3>

            <div class="space-y-4">
              {#each Object.entries(currentVariantData.automatedOptimization?.ai_powered_insights || {}) as [feature, description]}
                <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 class="font-medium text-purple-900 mb-2 capitalize">
                    {feature.replace('_', ' ')}
                  </h4>
                  <p class="text-sm text-purple-800">{description}</p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Real-time Adjustments -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Ajustes en Tiempo Real</h3>

            <div class="space-y-3">
              {#each currentVariantData.automatedOptimization?.real_time_adjustments || [] as adjustment}
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span class="text-blue-800 text-sm">{adjustment}</span>
                  <span class="text-blue-600 text-xl">⚡</span>
                </div>
              {/each}
            </div>

            <div class="mt-6 text-center">
              <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                Configurar Automatización
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'documentation'}
    <!-- Design Documentation -->
    <section class="documentation-section bg-gradient-to-br from-orange-50 to-red-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Documentación de Diseño</h1>
          <p class="text-gray-700 text-lg">Escalamiento del equipo e implementación consistente</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">
              Completitud: {currentVariantData.documentationCompleteness || 96}%
            </div>
            <div class="bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium">
              Score Onboarding: {currentVariantData.teamOnboardingScore || 89}/100
            </div>
          </div>
        </div>

        <!-- Team Scaling Documentation -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Documentación para Escalamiento del Equipo</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Design System Documentation -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Sistema de Diseño</h3>
              <div class="space-y-3">
                {#each Object.entries(currentVariantData.teamScaling?.design_system_documentation || {}) as [component, description]}
                  <div class="flex items-start space-x-3">
                    <span class="text-orange-500 text-lg">📚</span>
                    <div>
                      <div class="font-medium text-gray-900 capitalize">{component.replace('_', ' ')}</div>
                      <div class="text-sm text-gray-600">{description}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Onboarding Materials -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Materiales de Onboarding</h3>
              <div class="space-y-2">
                {#each currentVariantData.teamScaling?.onboarding_materials || [] as material}
                  <div class="flex items-center space-x-3 p-2 bg-orange-50 rounded-lg">
                    <span class="text-orange-500">✓</span>
                    <span class="text-gray-700 text-sm">{material}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Knowledge Transfer -->
        <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Transferencia de Conocimiento</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each Object.entries(currentVariantData.teamScaling?.knowledge_transfer || {}) as [category, description]}
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-3 text-center capitalize">
                  {category.replace('_', ' ')}
                </h3>
                <p class="text-sm text-gray-700 text-center">{description}</p>

                <div class="text-center mt-4">
                  <button class="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                    Acceder
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'quality'}
    <!-- Quality Assurance -->
    <section class="quality-section bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Aseguramiento de Calidad</h1>
          <p class="text-gray-700 text-lg">Consistencia de marca y validación de experiencia de usuario</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Score General: {currentVariantData.overallQualityScore || 94}/100
            </div>
            <div class="bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-medium">
              Compliance: {currentVariantData.complianceScore || 96}%
            </div>
          </div>
        </div>

        <!-- Brand Consistency -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <!-- Brand Consistency Metrics -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Consistencia de Marca</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.brandConsistency || {}) as [metric, score]}
                <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span class="text-gray-700 capitalize">{metric.replace('_', ' ')}:</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 rounded-full h-2">
                      <div class="bg-purple-500 h-2 rounded-full" style="width: {score}%"></div>
                    </div>
                    <span class="font-bold {getPerformanceColor(score)}">{score}%</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Accessibility Monitoring -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Monitoreo de Accesibilidad</h3>
            <div class="space-y-4">
              <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-green-900">Score WCAG 2.1 AA</span>
                  <span class="text-2xl font-bold text-green-600">
                    {currentVariantData.userExperienceValidation?.accessibility_monitoring?.compliance_score || 96}%
                  </span>
                </div>
                <div class="text-sm text-green-700">
                  Cumplimiento estándares internacionales
                </div>
              </div>

              <div class="space-y-2">
                <div class="text-sm font-medium text-gray-700">Validaciones automáticas:</div>
                <div class="text-xs bg-blue-100 text-blue-800 p-2 rounded">
                  {currentVariantData.userExperienceValidation?.accessibility_monitoring?.automated_scans || 'Daily Axe Core scans'}
                </div>
                <div class="text-xs bg-green-100 text-green-800 p-2 rounded">
                  {currentVariantData.userExperienceValidation?.accessibility_monitoring?.manual_testing || 'Weekly keyboard navigation tests'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Usability Testing Results -->
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Resultados de Testing de Usabilidad</h2>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div class="text-center p-4 bg-white rounded-lg shadow-sm">
              <div class="text-2xl font-bold text-purple-600 mb-1">
                {currentVariantData.userExperienceValidation?.usability_testing?.monthly_sessions || 8}
              </div>
              <div class="text-sm text-gray-600">Sesiones Mensuales</div>
            </div>

            <div class="text-center p-4 bg-white rounded-lg shadow-sm">
              <div class="text-2xl font-bold text-blue-600 mb-1">
                {formatPercentage(currentVariantData.userExperienceValidation?.usability_testing?.argentina_participants || 78)}
              </div>
              <div class="text-sm text-gray-600">Participantes ARG</div>
            </div>

            <div class="text-center p-4 bg-white rounded-lg shadow-sm">
              <div class="text-2xl font-bold text-green-600 mb-1">
                {formatPercentage(currentVariantData.userExperienceValidation?.usability_testing?.task_completion_rate || 94.2)}
              </div>
              <div class="text-sm text-gray-600">Tasa Completitud</div>
            </div>

            <div class="text-center p-4 bg-white rounded-lg shadow-sm">
              <div class="text-2xl font-bold text-yellow-600 mb-1">
                {currentVariantData.userExperienceValidation?.usability_testing?.average_satisfaction || 4.7}⭐
              </div>
              <div class="text-sm text-gray-600">Satisfacción Promedio</div>
            </div>

            <div class="text-center p-4 bg-white rounded-lg shadow-sm">
              <div class="text-2xl font-bold text-orange-600 mb-1">
                {currentVariantData.userExperienceValidation?.usability_testing?.issues_resolved || 11}/{currentVariantData.userExperienceValidation?.usability_testing?.issues_identified || 12}
              </div>
              <div class="text-sm text-gray-600">Issues Resueltos</div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'achievements'}
    <!-- Achievement Tracking -->
    <section class="achievements-section bg-gradient-to-br from-yellow-50 to-amber-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Seguimiento de Logros</h1>
          <p class="text-gray-700 text-lg">Hitos de diseño y métricas de impacto empresarial</p>
          <div class="mt-4">
            <div class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium inline-block">
              Hitos Completados: {currentVariantData.milestonesCompleted || 0}/{currentVariantData.totalMilestones || 0}
            </div>
          </div>
        </div>

        <!-- Design Milestones -->
        <div class="space-y-6 mb-12">
          {#each currentVariantData.designMilestones || [] as milestone}
            <div class="bg-white rounded-2xl p-8 shadow-xl border-l-4"
                 class:border-green-500={milestone.achieved}
                 class:border-gray-300={!milestone.achieved}>

              <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-3">
                    <h2 class="text-2xl font-bold text-gray-900">{milestone.milestone}</h2>
                    {#if milestone.achieved}
                      <span class="text-3xl">🏆</span>
                    {:else}
                      <span class="text-3xl">⏳</span>
                    {/if}
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Fecha:</span>
                      <div class="font-medium">
                        {milestone.date ? new Date(milestone.date).toLocaleDateString('es-AR') : 'Pendiente'}
                      </div>
                    </div>
                    <div>
                      <span class="text-gray-600">Equipo:</span>
                      <div class="font-medium">{milestone.team_effort}</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Próximo objetivo:</span>
                      <div class="font-medium text-blue-600">{milestone.next_target}</div>
                    </div>
                  </div>
                </div>

                <span class="px-3 py-1 rounded-full text-sm font-bold"
                      class:bg-green-100={milestone.achieved}
                      class:text-green-800={milestone.achieved}
                      class:bg-gray-100={!milestone.achieved}
                      class:text-gray-800={!milestone.achieved}>
                  {milestone.achieved ? 'COMPLETADO' : 'EN PROGRESO'}
                </span>
              </div>

              <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                <h3 class="font-bold text-gray-900 mb-2">Impacto Medido:</h3>
                <p class="text-gray-700">{milestone.impact}</p>
              </div>
            </div>
          {/each}
        </div>

        <!-- Business Impact Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Design-Driven Improvements -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Mejoras Impulsadas por Diseño</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.businessImpactMetrics?.design_driven_improvements || {}) as [metric, improvement]}
                <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span class="text-gray-700 text-sm capitalize">
                    {metric.replace('_', ' ').replace('increase', '')}:
                  </span>
                  <span class="text-lg font-bold text-green-600">+{improvement}%</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Team Productivity Gains -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Ganancias de Productividad del Equipo</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.businessImpactMetrics?.team_productivity_gains || {}) as [metric, gain]}
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span class="text-gray-700 text-sm capitalize">
                    {metric.replace('_', ' ').replace('increase', '').replace('reduction', '')}:
                  </span>
                  <span class="text-lg font-bold text-blue-600">
                    {metric.includes('reduction') ? '-' : '+'}{gain}%
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .design-intelligence-framework {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .real-time-enabled {
    --realtime-color: #10b981;
    --realtime-pulse: 2s infinite;
  }

  .ai-powered {
    --ai-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Analytics section styling */
  .analytics-section {
    background-image: radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%);
  }

  /* Testing section styling */
  .testing-section {
    background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%);
  }

  /* Optimization section styling */
  .optimization-section {
    background-image: radial-gradient(circle at 30% 70%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
  }

  /* Documentation section styling */
  .documentation-section {
    background-image: linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%);
  }

  /* Quality section styling */
  .quality-section {
    background-image: radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%);
  }

  /* Achievements section styling */
  .achievements-section {
    background-image: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
  }

  /* Real-time pulse animation */
  @keyframes realtimePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .realtime-indicator {
    animation: realtimePulse var(--realtime-pulse);
  }

  /* Progress bars animation */
  .progress-bar {
    transition: width 1s ease-in-out;
  }

  /* Test result cards */
  .test-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    transition: all 0.3s ease;
  }

  .test-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  /* Achievement unlock animation */
  @keyframes achievementUnlock {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .achievement-unlocked {
    animation: achievementUnlock 0.6s ease-out forwards;
  }

  /* Quality score indicators */
  .quality-excellent {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .quality-good {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .quality-needs-improvement {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .design-intelligence-framework h1 {
      font-size: 2.5rem;
    }

    .design-intelligence-framework .text-4xl {
      font-size: 2rem;
    }

    .grid.grid-cols-5 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Accessibility enhancements */
  .design-intelligence-framework [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* AI-powered insights styling */
  .ai-insight {
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
    border: 1px solid rgba(147, 51, 234, 0.2);
  }

  /* Data visualization elements */
  .metric-visualization {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .heatmap-cell {
    transition: all 0.3s ease;
  }

  .heatmap-cell:hover {
    transform: scale(1.05);
    z-index: 10;
  }

  /* Testing status indicators */
  .test-running {
    position: relative;
    overflow: hidden;
  }

  .test-running::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
    transition: left 2s infinite;
  }

  .test-running:hover::before {
    left: 100%;
  }

  /* Documentation completeness indicators */
  .documentation-complete {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  }

  .documentation-incomplete {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
  }
</style>