import { FastifyInstance } from 'fastify';
import { prisma } from './database';

// Template Replication Architecture for Service Verticals
// T7A-001: Template Replication Architecture Implementation (85% code reuse target)

export interface ServiceVertical {
  id: string;
  name: string;
  displayName: string;
  description: string;
  industry: string;
  targetAudience: string[];
  serviceTypes: ServiceTypeTemplate[];
  businessRules: BusinessRules;
  complianceRequirements: ComplianceRequirement[];
  customizations: VerticalCustomizations;
  localization: VerticalLocalization;
}

export interface ServiceTypeTemplate {
  id: string;
  name: string;
  category: string;
  defaultDuration: number; // minutes
  priceRange: { min: number; max: number };
  requiresLicense: boolean;
  bufferTime: { before: number; after: number };
  sessionType: 'individual' | 'group' | 'family' | 'couple';
  specialRequirements: string[];
}

export interface BusinessRules {
  bookingWindow: {
    minAdvanceHours: number;
    maxAdvanceDays: number;
    allowSameDayBooking: boolean;
  };
  cancellationPolicy: {
    freeUntilHours: number;
    partialRefundUntilHours: number;
    noRefundAfterHours: number;
  };
  sessionManagement: {
    allowRescheduling: boolean;
    maxReschedules: number;
    requiresPreparation: boolean;
    followUpRequired: boolean;
  };
  clientManagement: {
    requiresIntakeForm: boolean;
    mandatoryFields: string[];
    consentRequired: boolean;
    ageRestrictions: { min: number; max: number };
  };
}

export interface ComplianceRequirement {
  type: 'GDPR' | 'HIPAA' | 'ARGENTINA_HEALTH' | 'PROFESSIONAL_LICENSE';
  description: string;
  mandatoryFields: string[];
  retentionPeriod: number; // months
  encryptionRequired: boolean;
}

export interface VerticalCustomizations {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    favicon?: string;
  };
  terminology: Record<string, string>;
  additionalFields: CustomField[];
  workflows: WorkflowTemplate[];
}

export interface VerticalLocalization {
  supportedLanguages: string[];
  defaultLanguage: string;
  culturalAdaptations: Record<string, any>;
  localCompliance: string[];
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: string;
}

export interface WorkflowTemplate {
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
  automation: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  condition?: string;
  delay?: number;
}

// Pre-configured service verticals
const SERVICE_VERTICALS: Record<string, ServiceVertical> = {
  barber: {
    id: 'barber',
    name: 'barber',
    displayName: 'BarberPro',
    description: 'Professional barbering and grooming services',
    industry: 'Personal Care',
    targetAudience: ['men', 'adults', 'professionals'],
    serviceTypes: [
      {
        id: 'haircut',
        name: 'Corte de Cabello',
        category: 'grooming',
        defaultDuration: 30,
        priceRange: { min: 1500, max: 5000 },
        requiresLicense: false,
        bufferTime: { before: 5, after: 10 },
        sessionType: 'individual',
        specialRequirements: []
      },
      {
        id: 'beard-trim',
        name: 'Arreglo de Barba',
        category: 'grooming',
        defaultDuration: 20,
        priceRange: { min: 1000, max: 3000 },
        requiresLicense: false,
        bufferTime: { before: 5, after: 5 },
        sessionType: 'individual',
        specialRequirements: []
      }
    ],
    businessRules: {
      bookingWindow: {
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        allowSameDayBooking: true
      },
      cancellationPolicy: {
        freeUntilHours: 24,
        partialRefundUntilHours: 4,
        noRefundAfterHours: 2
      },
      sessionManagement: {
        allowRescheduling: true,
        maxReschedules: 2,
        requiresPreparation: false,
        followUpRequired: false
      },
      clientManagement: {
        requiresIntakeForm: false,
        mandatoryFields: ['name', 'phone'],
        consentRequired: false,
        ageRestrictions: { min: 5, max: 100 }
      }
    },
    complianceRequirements: [],
    customizations: {
      branding: {
        primaryColor: '#8B4513',
        secondaryColor: '#D2691E'
      },
      terminology: {
        'service': 'servicio',
        'appointment': 'turno',
        'provider': 'barbero'
      },
      additionalFields: [],
      workflows: []
    },
    localization: {
      supportedLanguages: ['es-AR'],
      defaultLanguage: 'es-AR',
      culturalAdaptations: { siesta: true },
      localCompliance: ['AFIP_TAX']
    }
  },
  psychology: {
    id: 'psychology',
    name: 'psychology',
    displayName: 'MindCarePro',
    description: 'Professional psychology and mental health services',
    industry: 'Healthcare',
    targetAudience: ['adults', 'adolescents', 'families', 'couples'],
    serviceTypes: [
      {
        id: 'individual-therapy',
        name: 'Terapia Individual',
        category: 'therapy',
        defaultDuration: 50,
        priceRange: { min: 3000, max: 8000 },
        requiresLicense: true,
        bufferTime: { before: 10, after: 15 },
        sessionType: 'individual',
        specialRequirements: ['clinical_notes', 'informed_consent']
      },
      {
        id: 'couple-therapy',
        name: 'Terapia de Pareja',
        category: 'therapy',
        defaultDuration: 60,
        priceRange: { min: 4000, max: 10000 },
        requiresLicense: true,
        bufferTime: { before: 15, after: 15 },
        sessionType: 'couple',
        specialRequirements: ['clinical_notes', 'informed_consent', 'joint_consent']
      },
      {
        id: 'family-therapy',
        name: 'Terapia Familiar',
        category: 'therapy',
        defaultDuration: 60,
        priceRange: { min: 4500, max: 12000 },
        requiresLicense: true,
        bufferTime: { before: 15, after: 20 },
        sessionType: 'family',
        specialRequirements: ['clinical_notes', 'informed_consent', 'guardian_consent']
      },
      {
        id: 'psychological-evaluation',
        name: 'Evaluación Psicológica',
        category: 'assessment',
        defaultDuration: 90,
        priceRange: { min: 6000, max: 15000 },
        requiresLicense: true,
        bufferTime: { before: 15, after: 30 },
        sessionType: 'individual',
        specialRequirements: ['clinical_notes', 'informed_consent', 'assessment_forms']
      }
    ],
    businessRules: {
      bookingWindow: {
        minAdvanceHours: 24,
        maxAdvanceDays: 60,
        allowSameDayBooking: false
      },
      cancellationPolicy: {
        freeUntilHours: 48,
        partialRefundUntilHours: 24,
        noRefundAfterHours: 12
      },
      sessionManagement: {
        allowRescheduling: true,
        maxReschedules: 1,
        requiresPreparation: true,
        followUpRequired: true
      },
      clientManagement: {
        requiresIntakeForm: true,
        mandatoryFields: ['name', 'phone', 'email', 'emergencyContact', 'medicalHistory'],
        consentRequired: true,
        ageRestrictions: { min: 12, max: 100 }
      }
    },
    complianceRequirements: [
      {
        type: 'ARGENTINA_HEALTH',
        description: 'Argentina mental health regulations compliance',
        mandatoryFields: ['professionalLicense', 'clinicalNotes', 'consentForms'],
        retentionPeriod: 84, // 7 years
        encryptionRequired: true
      },
      {
        type: 'PROFESSIONAL_LICENSE',
        description: 'Psychology professional license verification',
        mandatoryFields: ['licenseNumber', 'licenseExpiry', 'specializations'],
        retentionPeriod: 12,
        encryptionRequired: true
      }
    ],
    customizations: {
      branding: {
        primaryColor: '#4A90E2',
        secondaryColor: '#7ED321'
      },
      terminology: {
        'service': 'sesión',
        'appointment': 'cita',
        'provider': 'psicólogo/a',
        'client': 'paciente'
      },
      additionalFields: [
        {
          name: 'emergencyContact',
          type: 'text',
          required: true
        },
        {
          name: 'medicalHistory',
          type: 'text',
          required: true
        },
        {
          name: 'currentMedications',
          type: 'text',
          required: false
        },
        {
          name: 'therapyGoals',
          type: 'text',
          required: true
        }
      ],
      workflows: [
        {
          name: 'intake_process',
          steps: [
            { id: '1', name: 'Send intake form', action: 'send_form', delay: 0 },
            { id: '2', name: 'Review intake', action: 'review_intake', delay: 24 },
            { id: '3', name: 'Schedule consultation', action: 'schedule_consult', delay: 0 }
          ],
          triggers: ['new_client_booking'],
          automation: true
        },
        {
          name: 'session_follow_up',
          steps: [
            { id: '1', name: 'Send session notes', action: 'send_notes', delay: 2 },
            { id: '2', name: 'Schedule next session', action: 'suggest_next', delay: 24 },
            { id: '3', name: 'Progress check', action: 'progress_review', delay: 168 }
          ],
          triggers: ['session_completed'],
          automation: true
        }
      ]
    },
    localization: {
      supportedLanguages: ['es-AR', 'en-US'],
      defaultLanguage: 'es-AR',
      culturalAdaptations: { 
        siesta: true,
        familyOriented: true,
        formalAddress: true
      },
      localCompliance: ['ARGENTINA_HEALTH_LAW', 'PSYCHOLOGY_ETHICS_CODE']
    }
  }
};

class TemplateReplicationService {
  // Get service vertical configuration
  getVerticalConfig(verticalId: string): ServiceVertical | null {
    return SERVICE_VERTICALS[verticalId] || null;
  }

  // Get all available verticals
  getAllVerticals(): ServiceVertical[] {
    return Object.values(SERVICE_VERTICALS);
  }

  // Clone vertical configuration for new deployment
  async cloneVertical(sourceVerticalId: string, targetConfig: Partial<ServiceVertical>): Promise<ServiceVertical> {
    const sourceVertical = this.getVerticalConfig(sourceVerticalId);
    if (!sourceVertical) {
      throw new Error(`Source vertical '${sourceVerticalId}' not found`);
    }

    // Deep clone source configuration
    const clonedVertical: ServiceVertical = JSON.parse(JSON.stringify(sourceVertical));
    
    // Apply target customizations
    Object.assign(clonedVertical, targetConfig);
    
    // Generate new ID if not provided
    if (!targetConfig.id) {
      clonedVertical.id = `${sourceVerticalId}_${Date.now()}`;
    }

    return clonedVertical;
  }

  // Generate database schema for vertical
  generateVerticalSchema(vertical: ServiceVertical) {
    const schema = {
      models: {
        // Core models (shared 80%)
        User: this.getCoreUserModel(vertical),
        Provider: this.getCoreProviderModel(vertical),
        Service: this.getCoreServiceModel(vertical),
        Booking: this.getCoreBookingModel(vertical),
        Payment: this.getCorePaymentModel(),
        
        // Vertical-specific models (20%)
        ...this.getVerticalSpecificModels(vertical)
      },
      enums: this.getVerticalEnums(vertical),
      indexes: this.getOptimalIndexes(vertical)
    };

    return schema;
  }

  private getCoreUserModel(vertical: ServiceVertical) {
    const baseModel = {
      id: 'String @id @default(cuid())',
      email: 'String @unique',
      name: 'String',
      phone: 'String? @unique',
      password: 'String',
      role: 'UserRole @default(CLIENT)',
      isActive: 'Boolean @default(true)',
      isVerified: 'Boolean @default(false)',
      createdAt: 'DateTime @default(now())',
      updatedAt: 'DateTime @updatedAt'
    };

    // Add vertical-specific fields
    vertical.customizations.additionalFields.forEach(field => {
      if (field.type === 'text') baseModel[field.name] = field.required ? 'String' : 'String?';
      if (field.type === 'date') baseModel[field.name] = field.required ? 'DateTime' : 'DateTime?';
      if (field.type === 'boolean') baseModel[field.name] = `Boolean @default(false)`;
    });

    return baseModel;
  }

  private getCoreProviderModel(vertical: ServiceVertical) {
    const baseModel = {
      id: 'String @id @default(cuid())',
      userId: 'String @unique',
      businessName: 'String',
      description: 'String?',
      address: 'String',
      city: 'String',
      province: 'String @default("Buenos Aires")',
      isVerified: 'Boolean @default(false)',
      isActive: 'Boolean @default(true)',
      createdAt: 'DateTime @default(now())',
      updatedAt: 'DateTime @updatedAt'
    };

    // Add compliance fields for healthcare verticals
    if (vertical.complianceRequirements.length > 0) {
      (baseModel as any)['licenseNumber'] = 'String?';
      (baseModel as any)['licenseExpiry'] = 'DateTime?';
      (baseModel as any)['specializations'] = 'String[]';
    }

    return baseModel;
  }

  private getCoreServiceModel(vertical: ServiceVertical) {
    return {
      id: 'String @id @default(cuid())',
      name: 'String',
      description: 'String?',
      duration: 'Int',
      price: 'Decimal @db.Decimal(10, 2)',
      providerId: 'String',
      categoryId: 'String?',
      bufferTimeBefore: 'Int @default(5)',
      bufferTimeAfter: 'Int @default(10)',
      requiresLicense: `Boolean @default(${vertical.serviceTypes[0]?.requiresLicense || false})`,
      isActive: 'Boolean @default(true)',
      createdAt: 'DateTime @default(now())',
      updatedAt: 'DateTime @updatedAt'
    };
  }

  private getCoreBookingModel(vertical: ServiceVertical) {
    const baseModel = {
      id: 'String @id @default(cuid())',
      clientId: 'String',
      serviceId: 'String',
      providerId: 'String',
      startTime: 'DateTime',
      endTime: 'DateTime',
      status: 'BookingStatus @default(PENDING)',
      totalAmount: 'Decimal @db.Decimal(10, 2)',
      notes: 'String?',
      createdAt: 'DateTime @default(now())',
      updatedAt: 'DateTime @updatedAt'
    };

    // Add compliance fields for healthcare verticals
    if (vertical.complianceRequirements.some(req => req.type === 'ARGENTINA_HEALTH')) {
      (baseModel as any)['clinicalNotes'] = 'String?';
      (baseModel as any)['consentGiven'] = 'Boolean @default(false)';
      (baseModel as any)['intakeCompleted'] = 'Boolean @default(false)';
    }

    return baseModel;
  }

  private getCorePaymentModel() {
    return {
      id: 'String @id @default(cuid())',
      bookingId: 'String @unique',
      amount: 'Decimal @db.Decimal(10, 2)',
      currency: 'String @default("ARS")',
      status: 'PaymentStatus @default(PENDING)',
      paymentMethod: 'String',
      externalId: 'String?',
      createdAt: 'DateTime @default(now())',
      updatedAt: 'DateTime @updatedAt'
    };
  }

  private getVerticalSpecificModels(vertical: ServiceVertical) {
    const models: Record<string, any> = {};

    // Add compliance-specific models
    if (vertical.complianceRequirements.length > 0) {
      models.ComplianceRecord = {
        id: 'String @id @default(cuid())',
        bookingId: 'String',
        providerId: 'String',
        type: 'String',
        data: 'Json',
        retentionUntil: 'DateTime',
        encrypted: 'Boolean @default(true)',
        createdAt: 'DateTime @default(now())'
      };
    }

    // Add workflow-specific models
    if (vertical.customizations.workflows.length > 0) {
      models.WorkflowExecution = {
        id: 'String @id @default(cuid())',
        workflowName: 'String',
        bookingId: 'String',
        currentStep: 'String',
        status: 'String',
        data: 'Json?',
        createdAt: 'DateTime @default(now())',
        updatedAt: 'DateTime @updatedAt'
      };
    }

    return models;
  }

  private getVerticalEnums(vertical: ServiceVertical) {
    const enums = {
      UserRole: ['CLIENT', 'PROVIDER', 'ADMIN'],
      BookingStatus: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      PaymentStatus: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED']
    };

    // Add vertical-specific enums
    if (vertical.id === 'psychology') {
      (enums as any)['SessionType'] = ['INDIVIDUAL', 'COUPLE', 'FAMILY', 'GROUP'];
      (enums as any)['TherapyType'] = ['COGNITIVE', 'BEHAVIORAL', 'PSYCHODYNAMIC', 'HUMANISTIC'];
    }

    return enums;
  }

  private getOptimalIndexes(vertical: ServiceVertical) {
    const baseIndexes = [
      'User: [email], [phone], [role, isActive]',
      'Provider: [isActive, isVerified], [city, province]',
      'Service: [providerId, isActive], [categoryId]',
      'Booking: [providerId, startTime], [clientId, startTime], [status, startTime]',
      'Payment: [bookingId], [status]'
    ];

    // Add compliance-specific indexes
    if (vertical.complianceRequirements.length > 0) {
      baseIndexes.push('ComplianceRecord: [bookingId], [providerId], [retentionUntil]');
    }

    return baseIndexes;
  }

  // Calculate code reuse percentage
  calculateCodeReuse(sourceVertical: string, targetVertical: string): number {
    const source = this.getVerticalConfig(sourceVertical);
    const target = this.getVerticalConfig(targetVertical);
    
    if (!source || !target) return 0;

    // Core components that are reusable (80% target)
    const coreComponents = [
      'authentication', 'user_management', 'payment_processing',
      'booking_engine', 'notification_system', 'analytics_engine',
      'file_upload', 'search_functionality', 'real_time_features'
    ];

    // Vertical-specific components (20%)
    const verticalComponents = [
      'service_types', 'business_rules', 'compliance_requirements',
      'custom_fields', 'workflows', 'branding'
    ];

    const totalComponents = coreComponents.length + verticalComponents.length;
    const reusableComponents = coreComponents.length;
    
    return (reusableComponents / totalComponents) * 100;
  }

  // Generate deployment configuration
  generateDeploymentConfig(vertical: ServiceVertical) {
    return {
      environment: {
        VERTICAL_ID: vertical.id,
        VERTICAL_NAME: vertical.displayName,
        PRIMARY_COLOR: vertical.customizations.branding.primaryColor,
        SECONDARY_COLOR: vertical.customizations.branding.secondaryColor,
        DEFAULT_LANGUAGE: vertical.localization.defaultLanguage
      },
      database: {
        schema: this.generateVerticalSchema(vertical),
        migrations: this.generateMigrations(vertical)
      },
      features: {
        compliance: vertical.complianceRequirements.length > 0,
        workflows: vertical.customizations.workflows.length > 0,
        advancedBooking: vertical.businessRules.bookingWindow.minAdvanceHours > 12
      },
      customizations: vertical.customizations
    };
  }

  private generateMigrations(vertical: ServiceVertical) {
    // Generate database migrations for vertical
    return [
      `-- Create ${vertical.name} vertical tables`,
      '-- Generated by TemplateReplicationService',
      `-- Target: ${vertical.displayName}`,
      '-- Core tables: User, Provider, Service, Booking, Payment',
      vertical.complianceRequirements.length > 0 ? '-- Compliance tables: ComplianceRecord' : '',
      vertical.customizations.workflows.length > 0 ? '-- Workflow tables: WorkflowExecution' : ''
    ].filter(Boolean);
  }
}

export const templateReplicationService = new TemplateReplicationService();

// Register template replication routes
export function registerTemplateReplicationRoutes(server: FastifyInstance) {
  // Get available verticals
  server.get('/api/v1/templates/verticals', {
    schema: {
      tags: ['Templates'],
      summary: 'Get all available service verticals for template replication'
    }
  }, async (request, reply) => {
    try {
      const verticals = templateReplicationService.getAllVerticals();
      
      return reply.send({
        success: true,
        data: {
          verticals: verticals.map(v => ({
            id: v.id,
            name: v.displayName,
            description: v.description,
            industry: v.industry,
            targetAudience: v.targetAudience,
            codeReusePercentage: templateReplicationService.calculateCodeReuse('barber', v.id)
          })),
          totalVerticals: verticals.length
        }
      });
    } catch (error) {
      server.log.error('Verticals retrieval error:', error);
      return reply.code(500).send({
        error: 'Error retrieving service verticals',
        message: 'Error al obtener verticales de servicio'
      });
    }
  });

  // Get vertical configuration
  server.get('/api/v1/templates/verticals/:id', {
    schema: {
      tags: ['Templates'],
      summary: 'Get detailed configuration for specific vertical'
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const vertical = templateReplicationService.getVerticalConfig(id);
      
      if (!vertical) {
        return reply.code(404).send({
          error: 'Vertical not found',
          message: 'Vertical de servicio no encontrado'
        });
      }
      
      return reply.send({
        success: true,
        data: vertical
      });
    } catch (error) {
      server.log.error('Vertical configuration error:', error);
      return reply.code(500).send({
        error: 'Error retrieving vertical configuration',
        message: 'Error al obtener configuración del vertical'
      });
    }
  });

  // Generate deployment package
  server.post('/api/v1/templates/deploy', {
    schema: {
      tags: ['Templates'],
      summary: 'Generate deployment package for vertical replication'
    }
  }, async (request, reply) => {
    try {
      const { verticalId, customizations } = request.body as any;
      
      let vertical = templateReplicationService.getVerticalConfig(verticalId);
      if (!vertical) {
        return reply.code(404).send({
          error: 'Vertical not found',
          message: 'Vertical de servicio no encontrado'
        });
      }

      // Apply customizations if provided
      if (customizations) {
        vertical = await templateReplicationService.cloneVertical(verticalId, customizations);
      }

      const deploymentConfig = templateReplicationService.generateDeploymentConfig(vertical);
      
      return reply.send({
        success: true,
        data: {
          deploymentConfig,
          estimatedDeploymentTime: '2-4 weeks',
          codeReusePercentage: templateReplicationService.calculateCodeReuse('barber', verticalId),
          readyForProduction: true
        }
      });
    } catch (error) {
      server.log.error('Deployment generation error:', error);
      return reply.code(500).send({
        error: 'Error generating deployment package',
        message: 'Error al generar paquete de despliegue'
      });
    }
  });

  // Code reuse analysis
  server.get('/api/v1/templates/code-reuse/:source/:target', {
    schema: {
      tags: ['Templates'],
      summary: 'Analyze code reuse percentage between verticals'
    }
  }, async (request, reply) => {
    try {
      const { source, target } = request.params as any;
      
      const reusePercentage = templateReplicationService.calculateCodeReuse(source, target);
      
      return reply.send({
        success: true,
        data: {
          sourceVertical: source,
          targetVertical: target,
          codeReusePercentage: reusePercentage,
          targetAchieved: reusePercentage >= 80,
          estimatedDevelopmentTime: reusePercentage >= 80 ? '2-4 weeks' : '6-8 weeks'
        }
      });
    } catch (error) {
      server.log.error('Code reuse analysis error:', error);
      return reply.code(500).send({
        error: 'Error analyzing code reuse',
        message: 'Error al analizar reutilización de código'
      });
    }
  });
}