/**
 * PAY9-002: Multi-Vertical Payment Optimization
 * Customized payment flows and compliance for different service verticals
 * Healthcare, beauty, fitness, professional services payment optimization
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import paymentConfig from '../config/payment';
import MercadoPagoPaymentService from './payment';

export interface ServiceVertical {
  id: string;
  name: string;
  category: 'healthcare' | 'beauty' | 'fitness' | 'professional' | 'wellness' | 'education';
  description: string;
  regulatoryRequirements: RegulatoryRequirement[];
  paymentConfiguration: VerticalPaymentConfig;
  complianceRules: ComplianceRule[];
  customFields: CustomField[];
  argentinaSpecific: ArgentinaVerticalConfig;
}

export interface RegulatoryRequirement {
  type: 'license_verification' | 'insurance_required' | 'certification_needed' | 'tax_withholding';
  description: string;
  argentinianRegulation?: string;
  complianceLevel: 'mandatory' | 'recommended' | 'optional';
  validationProcess: string[];
  penalties: {
    nonCompliance: string;
    fineRange: { min: number; max: number };
  };
}

export interface VerticalPaymentConfig {
  allowedPaymentMethods: string[];
  restrictedPaymentMethods: string[];
  minimumAmount: number;
  maximumAmount: number;
  installmentOptions: {
    enabled: boolean;
    maxInstallments: number;
    interestRates: Record<number, number>;
    restrictions: string[];
  };
  holdPeriod: {
    standard: number;
    highRisk: number;
    regulatory: number;
  };
  commissionStructure: {
    baseRate: number;
    riskAdjustment: number;
    complianceDiscount: number;
    volumeIncentives: Record<string, number>;
  };
  refundPolicy: {
    allowedReasons: string[];
    processingTime: number;
    restrictions: string[];
    argentinaSpecific: string[];
  };
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  applicableCountries: string[];
  ruleType: 'payment_verification' | 'data_protection' | 'professional_licensing' | 'tax_compliance';
  automationLevel: 'automated' | 'manual_review' | 'hybrid';
  consequences: {
    violation: string[];
    remediation: string[];
  };
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'argentina_cuit';
  required: boolean;
  validation: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    options?: string[];
  };
  argentinaSpecific: boolean;
}

export interface ArgentinaVerticalConfig {
  afipIntegrationRequired: boolean;
  professionalRegistryValidation: boolean;
  consumerProtectionCompliance: boolean;
  healthMinistryReporting: boolean;
  specificTaxRules: {
    category: string;
    ivaRate: number;
    withholdingRequired: boolean;
    specialDeductions: string[];
  };
  mandatoryInsurance: {
    required: boolean;
    minimumCoverage: number;
    acceptedProviders: string[];
  };
}

export interface VerticalPaymentFlow {
  verticalId: string;
  flowSteps: PaymentFlowStep[];
  validationSteps: ValidationStep[];
  complianceChecks: ComplianceCheck[];
  userExperience: UXOptimization;
  argentinaLocalizations: ArgentinaLocalization[];
}

export interface PaymentFlowStep {
  id: string;
  name: string;
  order: number;
  type: 'verification' | 'selection' | 'processing' | 'confirmation' | 'compliance';
  configuration: Record<string, any>;
  conditionalDisplay: {
    showIf: string;
    hideIf: string;
  };
  validationRequired: boolean;
}

export interface ValidationStep {
  id: string;
  name: string;
  validationType: 'identity' | 'license' | 'insurance' | 'payment_method' | 'amount_limit';
  rules: ValidationRule[];
  failureActions: string[];
  successActions: string[];
}

export interface ValidationRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
  errorMessage: string;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  automated: boolean;
  requiredFields: string[];
  verificationMethod: string;
  argentinianLaw?: string;
  consequences: {
    pass: string[];
    fail: string[];
  };
}

export interface UXOptimization {
  theme: 'healthcare' | 'beauty' | 'fitness' | 'professional';
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  terminology: Record<string, string>;
  icons: Record<string, string>;
  layouts: {
    mobile: string;
    desktop: string;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

export interface ArgentinaLocalization {
  field: string;
  spanishLabel: string;
  helpText: string;
  placeholder: string;
  validationMessage: string;
}

export interface VerticalAnalytics {
  verticalId: string;
  metrics: {
    totalTransactions: number;
    successRate: number;
    averageTransactionAmount: number;
    complianceRate: number;
    disputeRate: number;
  };
  complianceMetrics: {
    licenseVerificationRate: number;
    insuranceValidationRate: number;
    taxComplianceRate: number;
    regulatoryAlerts: number;
  };
  paymentMethodPreferences: Record<string, number>;
  customerSatisfactionScore: number;
  argentinaSpecificMetrics: {
    afipComplianceRate: number;
    consumerLawCompliance: number;
    professionalRegistryValidation: number;
  };
}

export class MultiVerticalPaymentService extends EventEmitter {
  private prisma: PrismaClient;
  private paymentService: MercadoPagoPaymentService;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.paymentService = new MercadoPagoPaymentService(prisma);
  }

  /**
   * Get supported service verticals with Argentina-specific configurations
   */
  async getSupportedVerticals(): Promise<ServiceVertical[]> {
    console.log('🏥 Getting supported service verticals for Argentina market...');

    return [
      {
        id: 'healthcare',
        name: 'Salud y Medicina',
        category: 'healthcare',
        description: 'Servicios médicos, terapias y cuidados de salud',
        regulatoryRequirements: [
          {
            type: 'license_verification',
            description: 'Verificación de matrícula profesional',
            argentinianRegulation: 'Ley Nacional de Ejercicio de la Medicina N° 17.132',
            complianceLevel: 'mandatory',
            validationProcess: [
              'Verificación en Registro Nacional de Profesionales',
              'Validación de especialidad médica',
              'Control de habilitación vigente',
            ],
            penalties: {
              nonCompliance: 'Ejercicio ilegal de la medicina',
              fineRange: { min: 50000, max: 500000 },
            },
          },
          {
            type: 'insurance_required',
            description: 'Seguro de mala praxis obligatorio',
            complianceLevel: 'mandatory',
            validationProcess: [
              'Verificación de póliza vigente',
              'Validación de cobertura mínima',
              'Control de pagos al día',
            ],
            penalties: {
              nonCompliance: 'Inhabilitación profesional',
              fineRange: { min: 100000, max: 1000000 },
            },
          },
        ],
        paymentConfiguration: {
          allowedPaymentMethods: ['credit_card', 'debit_card', 'bank_transfer', 'obras_sociales'],
          restrictedPaymentMethods: ['rapipago', 'pagofacil'],
          minimumAmount: 500,
          maximumAmount: 50000,
          installmentOptions: {
            enabled: true,
            maxInstallments: 6,
            interestRates: { 1: 0, 3: 5, 6: 12 },
            restrictions: ['No aplica para emergencias médicas'],
          },
          holdPeriod: {
            standard: 7,
            highRisk: 14,
            regulatory: 30,
          },
          commissionStructure: {
            baseRate: 0.025,
            riskAdjustment: 0.005,
            complianceDiscount: -0.003,
            volumeIncentives: { '50+': -0.002, '100+': -0.005 },
          },
          refundPolicy: {
            allowedReasons: [
              'Cancelación médica justificada',
              'Error en diagnóstico inicial',
              'Incompatibilidad de tratamiento',
            ],
            processingTime: 7,
            restrictions: ['No aplica después de iniciado el tratamiento'],
            argentinaSpecific: ['Ley de Defensa del Consumidor Art. 34'],
          },
        },
        complianceRules: [
          {
            id: 'medical_license_check',
            name: 'Verificación de Matrícula Médica',
            description: 'Validación automática de licencia médica',
            applicableCountries: ['AR'],
            ruleType: 'professional_licensing',
            automationLevel: 'automated',
            consequences: {
              violation: ['Suspensión de cuenta', 'Reporte a autoridades'],
              remediation: ['Presentar matrícula actualizada', 'Proceso de revalidación'],
            },
          },
        ],
        customFields: [
          {
            id: 'medical_license',
            name: 'Número de Matrícula',
            type: 'text',
            required: true,
            validation: { pattern: '^[0-9]{6,8}$', minLength: 6, maxLength: 8 },
            argentinaSpecific: true,
          },
          {
            id: 'specialty',
            name: 'Especialidad Médica',
            type: 'select',
            required: true,
            validation: {
              options: [
                'Medicina General',
                'Dermatología',
                'Cardiología',
                'Neurología',
                'Psiquiatría',
                'Ginecología',
                'Pediatría',
              ],
            },
            argentinaSpecific: false,
          },
        ],
        argentinaSpecific: {
          afipIntegrationRequired: true,
          professionalRegistryValidation: true,
          consumerProtectionCompliance: true,
          healthMinistryReporting: true,
          specificTaxRules: {
            category: 'Servicios Médicos',
            ivaRate: 0,
            withholdingRequired: false,
            specialDeductions: ['Exención IVA servicios médicos'],
          },
          mandatoryInsurance: {
            required: true,
            minimumCoverage: 1000000,
            acceptedProviders: ['Sancor Seguros', 'La Caja ART', 'Provincia ART'],
          },
        },
      },
      {
        id: 'psychology',
        name: 'Psicología y Terapias',
        category: 'healthcare',
        description: 'Servicios de psicología, terapia y salud mental',
        regulatoryRequirements: [
          {
            type: 'license_verification',
            description: 'Matrícula en Colegio de Psicólogos',
            argentinianRegulation: 'Ley Federal de Psicólogos N° 23.277',
            complianceLevel: 'mandatory',
            validationProcess: [
              'Verificación en Colegio Provincial de Psicólogos',
              'Validación de especialización',
              'Control de formación continua',
            ],
            penalties: {
              nonCompliance: 'Ejercicio ilegal de la psicología',
              fineRange: { min: 25000, max: 250000 },
            },
          },
        ],
        paymentConfiguration: {
          allowedPaymentMethods: ['credit_card', 'debit_card', 'bank_transfer', 'obras_sociales'],
          restrictedPaymentMethods: ['cash_payments'],
          minimumAmount: 300,
          maximumAmount: 15000,
          installmentOptions: {
            enabled: true,
            maxInstallments: 12,
            interestRates: { 1: 0, 3: 0, 6: 3, 12: 8 },
            restrictions: ['Planes de tratamiento solo'],
          },
          holdPeriod: {
            standard: 3,
            highRisk: 7,
            regulatory: 14,
          },
          commissionStructure: {
            baseRate: 0.02,
            riskAdjustment: 0.003,
            complianceDiscount: -0.005,
            volumeIncentives: { '25+': -0.003, '50+': -0.005 },
          },
          refundPolicy: {
            allowedReasons: [
              'Incompatibilidad terapéutica',
              'Cambio de enfoque de tratamiento',
              'Situación económica del paciente',
            ],
            processingTime: 5,
            restrictions: ['Máximo 48hs después de la sesión'],
            argentinaSpecific: ['Confidencialidad según Art. 43 CN'],
          },
        },
        complianceRules: [
          {
            id: 'psychology_license_check',
            name: 'Verificación Colegio de Psicólogos',
            description: 'Validación de matrícula psicológica',
            applicableCountries: ['AR'],
            ruleType: 'professional_licensing',
            automationLevel: 'automated',
            consequences: {
              violation: ['Suspensión inmediata', 'Reporte colegial'],
              remediation: ['Regularizar matrícula', 'Capacitación ética'],
            },
          },
        ],
        customFields: [
          {
            id: 'psychology_license',
            name: 'Matrícula de Psicólogo',
            type: 'text',
            required: true,
            validation: { pattern: '^MP[0-9]{4,6}$' },
            argentinaSpecific: true,
          },
          {
            id: 'therapeutic_approach',
            name: 'Enfoque Terapéutico',
            type: 'select',
            required: false,
            validation: {
              options: [
                'Terapia Cognitivo-Conductual',
                'Psicoanálisis',
                'Terapia Sistémica',
                'Gestalt',
                'Psicología Positiva',
              ],
            },
            argentinaSpecific: false,
          },
        ],
        argentinaSpecific: {
          afipIntegrationRequired: true,
          professionalRegistryValidation: true,
          consumerProtectionCompliance: true,
          healthMinistryReporting: false,
          specificTaxRules: {
            category: 'Servicios de Psicología',
            ivaRate: 0,
            withholdingRequired: false,
            specialDeductions: ['Exención IVA servicios psicológicos'],
          },
          mandatoryInsurance: {
            required: true,
            minimumCoverage: 500000,
            acceptedProviders: ['Federación de Psicólogos ART'],
          },
        },
      },
      {
        id: 'beauty_wellness',
        name: 'Belleza y Bienestar',
        category: 'beauty',
        description: 'Servicios de belleza, estética y bienestar',
        regulatoryRequirements: [
          {
            type: 'certification_needed',
            description: 'Certificación en cosmetología/estética',
            complianceLevel: 'recommended',
            validationProcess: [
              'Certificado de curso reconocido',
              'Habilitación municipal',
              'Control sanitario',
            ],
            penalties: {
              nonCompliance: 'Multa municipal',
              fineRange: { min: 5000, max: 50000 },
            },
          },
        ],
        paymentConfiguration: {
          allowedPaymentMethods: [
            'credit_card',
            'debit_card',
            'bank_transfer',
            'rapipago',
            'pagofacil',
            'account_money',
          ],
          restrictedPaymentMethods: [],
          minimumAmount: 200,
          maximumAmount: 25000,
          installmentOptions: {
            enabled: true,
            maxInstallments: 18,
            interestRates: { 1: 0, 3: 0, 6: 5, 12: 12, 18: 18 },
            restrictions: [],
          },
          holdPeriod: {
            standard: 1,
            highRisk: 3,
            regulatory: 7,
          },
          commissionStructure: {
            baseRate: 0.035,
            riskAdjustment: 0.002,
            complianceDiscount: -0.002,
            volumeIncentives: { '100+': -0.005, '200+': -0.008 },
          },
          refundPolicy: {
            allowedReasons: [
              'Insatisfacción con resultado',
              'Reacción alérgica',
              'Cancelación anticipada',
            ],
            processingTime: 3,
            restrictions: ['24hs para tratamientos faciales'],
            argentinaSpecific: ['Derecho al arrepentimiento'],
          },
        },
        complianceRules: [],
        customFields: [
          {
            id: 'service_category',
            name: 'Categoría de Servicio',
            type: 'select',
            required: true,
            validation: {
              options: [
                'Corte y Peinado',
                'Coloración',
                'Tratamientos Capilares',
                'Manicuría/Pedicuría',
                'Depilación',
                'Tratamientos Faciales',
              ],
            },
            argentinaSpecific: false,
          },
        ],
        argentinaSpecific: {
          afipIntegrationRequired: true,
          professionalRegistryValidation: false,
          consumerProtectionCompliance: true,
          healthMinistryReporting: false,
          specificTaxRules: {
            category: 'Servicios de Belleza',
            ivaRate: 21,
            withholdingRequired: false,
            specialDeductions: [],
          },
          mandatoryInsurance: {
            required: false,
            minimumCoverage: 0,
            acceptedProviders: [],
          },
        },
      },
      {
        id: 'fitness',
        name: 'Fitness y Entrenamiento',
        category: 'fitness',
        description: 'Servicios de entrenamiento personal y fitness',
        regulatoryRequirements: [
          {
            type: 'certification_needed',
            description: 'Certificación en educación física',
            argentinianRegulation: 'Registro Nacional de Profesores de Educación Física',
            complianceLevel: 'recommended',
            validationProcess: [
              'Título habilitante',
              'Registro profesional',
              'Seguro de responsabilidad civil',
            ],
            penalties: {
              nonCompliance: 'Inhabilitación temporal',
              fineRange: { min: 10000, max: 100000 },
            },
          },
        ],
        paymentConfiguration: {
          allowedPaymentMethods: [
            'credit_card',
            'debit_card',
            'bank_transfer',
            'rapipago',
            'pagofacil',
            'account_money',
          ],
          restrictedPaymentMethods: [],
          minimumAmount: 500,
          maximumAmount: 30000,
          installmentOptions: {
            enabled: true,
            maxInstallments: 12,
            interestRates: { 1: 0, 3: 0, 6: 3, 12: 10 },
            restrictions: ['Planes mensuales con descuento'],
          },
          holdPeriod: {
            standard: 1,
            highRisk: 3,
            regulatory: 7,
          },
          commissionStructure: {
            baseRate: 0.03,
            riskAdjustment: 0.002,
            complianceDiscount: -0.003,
            volumeIncentives: { '50+': -0.003, '100+': -0.005 },
          },
          refundPolicy: {
            allowedReasons: [
              'Lesión médica documentada',
              'Cambio de ciudad',
              'Insatisfacción con servicio',
            ],
            processingTime: 5,
            restrictions: ['Después de 3 sesiones no aplica'],
            argentinaSpecific: ['Ley del Consumidor - Servicios deportivos'],
          },
        },
        complianceRules: [],
        customFields: [
          {
            id: 'training_type',
            name: 'Tipo de Entrenamiento',
            type: 'select',
            required: true,
            validation: {
              options: [
                'Entrenamiento Personal',
                'Funcional',
                'Crossfit',
                'Yoga',
                'Pilates',
                'Calistenia',
              ],
            },
            argentinaSpecific: false,
          },
        ],
        argentinaSpecific: {
          afipIntegrationRequired: true,
          professionalRegistryValidation: false,
          consumerProtectionCompliance: true,
          healthMinistryReporting: false,
          specificTaxRules: {
            category: 'Servicios Deportivos',
            ivaRate: 21,
            withholdingRequired: false,
            specialDeductions: ['Deducción gastos profesionales'],
          },
          mandatoryInsurance: {
            required: true,
            minimumCoverage: 300000,
            acceptedProviders: ['Seguros deportivos especializados'],
          },
        },
      },
    ];
  }

  /**
   * Create customized payment flow for specific vertical
   */
  async createVerticalPaymentFlow(verticalId: string): Promise<VerticalPaymentFlow> {
    console.log(`🎯 Creating customized payment flow for vertical: ${verticalId}...`);

    const verticals = await this.getSupportedVerticals();
    const vertical = verticals.find(v => v.id === verticalId);
    
    if (!vertical) {
      throw new Error(`Vertical ${verticalId} not supported`);
    }

    // Create customized flow based on vertical requirements
    const flow: VerticalPaymentFlow = {
      verticalId,
      flowSteps: [
        {
          id: 'identity_verification',
          name: 'Verificación de Identidad',
          order: 1,
          type: 'verification',
          configuration: {
            requiredDocuments: ['DNI', 'CUIL'],
            argentinaSpecific: true,
          },
          conditionalDisplay: {
            showIf: 'new_user',
            hideIf: 'verified_user',
          },
          validationRequired: true,
        },
        {
          id: 'professional_validation',
          name: 'Validación Profesional',
          order: 2,
          type: 'verification',
          configuration: {
            licenseRequired: vertical.regulatoryRequirements.some(r => r.type === 'license_verification'),
            insuranceRequired: vertical.regulatoryRequirements.some(r => r.type === 'insurance_required'),
          },
          conditionalDisplay: {
            showIf: 'healthcare,psychology',
            hideIf: 'beauty_wellness,fitness',
          },
          validationRequired: vertical.category === 'healthcare',
        },
        {
          id: 'payment_method_selection',
          name: 'Selección de Método de Pago',
          order: 3,
          type: 'selection',
          configuration: {
            allowedMethods: vertical.paymentConfiguration.allowedPaymentMethods,
            restrictedMethods: vertical.paymentConfiguration.restrictedPaymentMethods,
            installmentOptions: vertical.paymentConfiguration.installmentOptions,
          },
          conditionalDisplay: {
            showIf: 'always',
            hideIf: 'never',
          },
          validationRequired: true,
        },
        {
          id: 'compliance_acknowledgment',
          name: 'Aceptación de Términos de Compliance',
          order: 4,
          type: 'compliance',
          configuration: {
            requiredAcknowledgments: vertical.complianceRules.map(r => r.name),
            argentinaLaws: ['Ley de Defensa del Consumidor', 'Protección de Datos Personales'],
          },
          conditionalDisplay: {
            showIf: 'healthcare',
            hideIf: 'beauty_wellness',
          },
          validationRequired: vertical.category === 'healthcare',
        },
        {
          id: 'payment_processing',
          name: 'Procesamiento de Pago',
          order: 5,
          type: 'processing',
          configuration: {
            holdPeriod: vertical.paymentConfiguration.holdPeriod.standard,
            commissionRate: vertical.paymentConfiguration.commissionStructure.baseRate,
          },
          conditionalDisplay: {
            showIf: 'always',
            hideIf: 'never',
          },
          validationRequired: true,
        },
        {
          id: 'confirmation_receipt',
          name: 'Confirmación y Comprobante',
          order: 6,
          type: 'confirmation',
          configuration: {
            generateAfipInvoice: vertical.argentinaSpecific.afipIntegrationRequired,
            includeRegulatoryInfo: vertical.category === 'healthcare',
          },
          conditionalDisplay: {
            showIf: 'always',
            hideIf: 'never',
          },
          validationRequired: false,
        },
      ],
      validationSteps: [
        {
          id: 'amount_validation',
          name: 'Validación de Monto',
          validationType: 'amount_limit',
          rules: [
            {
              field: 'amount',
              operator: 'greater_than',
              value: vertical.paymentConfiguration.minimumAmount,
              errorMessage: `El monto mínimo es ARS ${vertical.paymentConfiguration.minimumAmount}`,
            },
            {
              field: 'amount',
              operator: 'less_than',
              value: vertical.paymentConfiguration.maximumAmount,
              errorMessage: `El monto máximo es ARS ${vertical.paymentConfiguration.maximumAmount}`,
            },
          ],
          failureActions: ['show_error', 'suggest_alternative'],
          successActions: ['continue_flow'],
        },
      ],
      complianceChecks: vertical.complianceRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        automated: rule.automationLevel === 'automated',
        requiredFields: ['license_number', 'insurance_policy'],
        verificationMethod: 'api_integration',
        argentinianLaw: rule.applicableCountries.includes('AR') ? 'Normativa Argentina' : undefined,
        consequences: {
          pass: ['continue_payment'],
          fail: ['block_payment', 'request_documentation'],
        },
      })),
      userExperience: {
        theme: vertical.category,
        colorScheme: {
          primary: vertical.category === 'healthcare' ? '#2563eb' : '#10b981',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        terminology: {
          payment: vertical.category === 'healthcare' ? 'Consulta' : 'Servicio',
          provider: vertical.category === 'healthcare' ? 'Profesional' : 'Especialista',
          booking: vertical.category === 'healthcare' ? 'Cita' : 'Reserva',
        },
        icons: {
          payment: vertical.category === 'healthcare' ? 'medical' : 'service',
          verification: 'shield-check',
          confirmation: 'check-circle',
        },
        layouts: {
          mobile: 'single_column',
          desktop: 'two_column',
        },
        accessibility: {
          highContrast: vertical.category === 'healthcare',
          largeText: true,
          screenReader: true,
        },
      },
      argentinaLocalizations: [
        {
          field: 'payment_method',
          spanishLabel: 'Método de Pago',
          helpText: 'Selecciona tu forma de pago preferida',
          placeholder: 'Elige un método...',
          validationMessage: 'Debes seleccionar un método de pago',
        },
        {
          field: 'installments',
          spanishLabel: 'Cuotas',
          helpText: 'Divide tu pago en cuotas sin interés',
          placeholder: 'Seleccionar cuotas...',
          validationMessage: 'Selecciona el número de cuotas',
        },
      ],
    };

    console.log(`✅ Created customized payment flow with ${flow.flowSteps.length} steps`);
    console.log(`🔍 Compliance checks: ${flow.complianceChecks.length}`);
    console.log(`🌐 Argentina localizations: ${flow.argentinaLocalizations.length}`);

    return flow;
  }

  /**
   * Process vertical-specific payment with compliance validation
   */
  async processVerticalPayment(data: {
    verticalId: string;
    providerId: string;
    amount: number;
    paymentMethodId: string;
    complianceData: Record<string, any>;
    customFields: Record<string, any>;
  }): Promise<{
    paymentId: string;
    complianceStatus: 'approved' | 'pending' | 'rejected';
    validationResults: Record<string, any>;
    holdPeriod: number;
    commissionRate: number;
  }> {
    console.log(`💳 Processing vertical payment for ${data.verticalId}...`);

    try {
      const verticals = await this.getSupportedVerticals();
      const vertical = verticals.find(v => v.id === data.verticalId);
      
      if (!vertical) {
        throw new Error(`Vertical ${data.verticalId} not supported`);
      }

      // Validate amount limits
      if (data.amount < vertical.paymentConfiguration.minimumAmount) {
        throw new Error(`Amount below minimum: ARS ${vertical.paymentConfiguration.minimumAmount}`);
      }

      if (data.amount > vertical.paymentConfiguration.maximumAmount) {
        throw new Error(`Amount above maximum: ARS ${vertical.paymentConfiguration.maximumAmount}`);
      }

      // Process compliance validations
      const complianceResults = await this.validateCompliance(vertical, data.complianceData);
      
      // Calculate commission with vertical-specific rates
      const baseCommission = vertical.paymentConfiguration.commissionStructure.baseRate;
      const riskAdjustment = vertical.paymentConfiguration.commissionStructure.riskAdjustment;
      const complianceDiscount = complianceResults.status === 'approved' 
        ? vertical.paymentConfiguration.commissionStructure.complianceDiscount 
        : 0;
      
      const finalCommissionRate = baseCommission + riskAdjustment + complianceDiscount;

      // Determine hold period
      const holdPeriod = complianceResults.highRisk 
        ? vertical.paymentConfiguration.holdPeriod.highRisk
        : vertical.paymentConfiguration.holdPeriod.standard;

      // Create payment with MercadoPago
      const paymentResponse = await this.paymentService.createPayment({
        bookingId: `booking-${uuidv4()}`,
        amount: data.amount,
        currency: 'ARS',
        paymentMethod: data.paymentMethodId,
        description: `Pago ${vertical.name}`,
        clientEmail: 'client@example.com',
        clientName: 'Cliente Test',
        returnUrls: {
          success: 'https://barberpro.com.ar/success',
          failure: 'https://barberpro.com.ar/failure',
          pending: 'https://barberpro.com.ar/pending',
        },
        metadata: {
          verticalId: data.verticalId,
          complianceStatus: complianceResults.status,
          customFields: data.customFields,
        },
      });

      console.log(`✅ Vertical payment processed successfully`);
      console.log(`🏥 Vertical: ${vertical.name}`);
      console.log(`💰 Amount: ARS ${data.amount}`);
      console.log(`⏱️ Hold period: ${holdPeriod} days`);
      console.log(`💼 Commission: ${(finalCommissionRate * 100).toFixed(2)}%`);

      return {
        paymentId: paymentResponse.id,
        complianceStatus: complianceResults.status,
        validationResults: complianceResults.details,
        holdPeriod,
        commissionRate: finalCommissionRate,
      };
    } catch (error: any) {
      console.error('❌ Error processing vertical payment:', error);
      throw new Error(`Failed to process vertical payment: ${error.message}`);
    }
  }

  /**
   * Get vertical-specific analytics
   */
  async getVerticalAnalytics(
    verticalId: string, 
    dateRange?: { from: Date; to: Date }
  ): Promise<VerticalAnalytics> {
    console.log(`📊 Generating analytics for vertical: ${verticalId}...`);

    try {
      // Mock implementation - in production would query actual data
      const analytics: VerticalAnalytics = {
        verticalId,
        metrics: {
          totalTransactions: 1540,
          successRate: 97.8,
          averageTransactionAmount: 4850,
          complianceRate: 94.2,
          disputeRate: 1.8,
        },
        complianceMetrics: {
          licenseVerificationRate: verticalId === 'healthcare' ? 98.5 : 0,
          insuranceValidationRate: verticalId === 'healthcare' ? 96.8 : 0,
          taxComplianceRate: 99.1,
          regulatoryAlerts: 3,
        },
        paymentMethodPreferences: {
          credit_card: 45.2,
          debit_card: 28.6,
          bank_transfer: 15.3,
          obras_sociales: verticalId === 'healthcare' || verticalId === 'psychology' ? 8.9 : 0,
          others: 2.0,
        },
        customerSatisfactionScore: 4.7,
        argentinaSpecificMetrics: {
          afipComplianceRate: 98.9,
          consumerLawCompliance: 97.5,
          professionalRegistryValidation: verticalId === 'healthcare' ? 99.2 : 0,
        },
      };

      console.log(`📈 Analytics generated for ${verticalId}:`);
      console.log(`  💳 Transactions: ${analytics.metrics.totalTransactions}`);
      console.log(`  ✅ Success Rate: ${analytics.metrics.successRate}%`);
      console.log(`  💰 Avg Amount: ARS ${analytics.metrics.averageTransactionAmount}`);
      console.log(`  ⚖️ Compliance Rate: ${analytics.metrics.complianceRate}%`);

      return analytics;
    } catch (error: any) {
      console.error('❌ Error generating vertical analytics:', error);
      throw new Error(`Failed to generate analytics: ${error.message}`);
    }
  }

  /**
   * Template-based payment configuration for rapid vertical deployment
   */
  async generateVerticalTemplate(baseVerticalId: string, customizations: {
    name: string;
    category: ServiceVertical['category'];
    specificRequirements: Partial<RegulatoryRequirement>[];
    paymentAdjustments: Partial<VerticalPaymentConfig>;
  }): Promise<ServiceVertical> {
    console.log(`📋 Generating payment template for new vertical: ${customizations.name}...`);

    try {
      const verticals = await this.getSupportedVerticals();
      const baseVertical = verticals.find(v => v.id === baseVerticalId);
      
      if (!baseVertical) {
        throw new Error(`Base vertical ${baseVerticalId} not found`);
      }

      // Create new vertical based on template
      const newVertical: ServiceVertical = {
        id: customizations.name.toLowerCase().replace(/\s+/g, '_'),
        name: customizations.name,
        category: customizations.category,
        description: `Servicios de ${customizations.name}`,
        regulatoryRequirements: [
          ...baseVertical.regulatoryRequirements,
          ...customizations.specificRequirements.map((req, index) => ({
            type: 'certification_needed' as const,
            description: req.description || 'Requisito específico',
            complianceLevel: 'recommended' as const,
            validationProcess: req.validationProcess || ['Verificación manual'],
            penalties: req.penalties || { nonCompliance: 'Multa', fineRange: { min: 1000, max: 10000 } },
            ...req,
          })),
        ],
        paymentConfiguration: {
          ...baseVertical.paymentConfiguration,
          ...customizations.paymentAdjustments,
        },
        complianceRules: [...baseVertical.complianceRules],
        customFields: [...baseVertical.customFields],
        argentinaSpecific: {
          ...baseVertical.argentinaSpecific,
          specificTaxRules: {
            ...baseVertical.argentinaSpecific.specificTaxRules,
            category: `Servicios de ${customizations.name}`,
          },
        },
      };

      console.log(`✅ Generated vertical template: ${newVertical.name}`);
      console.log(`🔧 Based on: ${baseVertical.name}`);
      console.log(`⚙️ Custom requirements: ${customizations.specificRequirements.length}`);

      return newVertical;
    } catch (error: any) {
      console.error('❌ Error generating vertical template:', error);
      throw new Error(`Failed to generate template: ${error.message}`);
    }
  }

  // Private helper methods

  private async validateCompliance(
    vertical: ServiceVertical, 
    complianceData: Record<string, any>
  ): Promise<{
    status: 'approved' | 'pending' | 'rejected';
    highRisk: boolean;
    details: Record<string, any>;
  }> {
    console.log('🔍 Validating compliance requirements...');

    // Mock compliance validation
    const results = {
      status: 'approved' as const,
      highRisk: false,
      details: {
        licenseVerified: vertical.category === 'healthcare' ? complianceData.license_number : true,
        insuranceValid: vertical.category === 'healthcare' ? complianceData.insurance_policy : true,
        taxCompliant: true,
        documentsComplete: true,
      },
    };

    // Check for high-risk indicators
    if (vertical.category === 'healthcare' && !complianceData.license_number) {
      results.status = 'rejected';
      results.highRisk = true;
      results.details.licenseVerified = false;
    }

    console.log(`✅ Compliance validation: ${results.status}`);
    console.log(`⚠️ High risk: ${results.highRisk}`);

    return results;
  }
}

export const multiVerticalPayment = new MultiVerticalPaymentService(
  new PrismaClient()
);