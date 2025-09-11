// Provider Schedule Management Schema Definitions
// Working hours, schedule templates, exceptions, and bulk operations schemas

export const WorkingHoursSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      isOpen: { type: 'boolean' },
      openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
      closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
      breaks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
            end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
          },
          required: ['start', 'end']
        }
      }
    },
    required: ['isOpen']
  }
};

export const ScheduleGetResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    providerId: { type: 'string' },
    providerName: { type: 'string' },
    workingHours: WorkingHoursSchema,
    timezone: { type: 'string' },
    lastUpdated: { type: 'string', format: 'date-time' }
  }
};

export const ScheduleUpdateSchema = {
  type: 'object',
  required: ['workingHours'],
  properties: {
    workingHours: WorkingHoursSchema
  }
};

export const ScheduleUpdateResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    providerId: { type: 'string' },
    workingHours: WorkingHoursSchema,
    message: { type: 'string' },
    lastUpdated: { type: 'string', format: 'date-time' }
  }
};

export const ScheduleTemplateSchema = {
  type: 'object',
  required: ['name', 'workingHours'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    workingHours: WorkingHoursSchema
  }
};

export const ScheduleTemplateResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    templateId: { type: 'string' },
    template: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        workingHours: WorkingHoursSchema
      }
    },
    message: { type: 'string' }
  }
};

export const ScheduleExceptionSchema = {
  type: 'object',
  required: ['date', 'type'],
  properties: {
    date: { type: 'string', format: 'date' },
    type: { type: 'string', enum: ['closed', 'special_hours'] },
    specialHours: {
      type: 'object',
      properties: {
        openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        breaks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
            }
          }
        }
      }
    },
    reason: { type: 'string', maxLength: 200 },
    recurring: { type: 'boolean', default: false }
  }
};

export const ScheduleExceptionResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    exceptionId: { type: 'string' },
    exception: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date' },
        type: { type: 'string' },
        specialHours: { type: 'object' },
        reason: { type: 'string' },
        recurring: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    },
    affectedBookingsCount: { type: 'integer' },
    message: { type: 'string' }
  }
};

export const BulkScheduleUpdateSchema = {
  type: 'object',
  required: ['operation'],
  properties: {
    operation: { type: 'string', enum: ['apply_template', 'set_hours', 'add_breaks'] },
    templateId: { type: 'string' },
    days: {
      type: 'array',
      items: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
    },
    workingHours: {
      type: 'object',
      properties: {
        openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        breaks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
            }
          }
        }
      }
    }
  }
};

export const BulkScheduleUpdateResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    providerId: { type: 'string' },
    operation: { type: 'string' },
    affectedDays: {
      type: 'array',
      items: { type: 'string' }
    },
    workingHours: WorkingHoursSchema,
    message: { type: 'string' }
  }
};

export const ScheduleValidationSchema = {
  type: 'object',
  required: ['proposedSchedule'],
  properties: {
    proposedSchedule: WorkingHoursSchema,
    dateRange: {
      type: 'object',
      properties: {
        from: { type: 'string', format: 'date' },
        to: { type: 'string', format: 'date' }
      }
    }
  }
};

export const ScheduleValidationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    hasConflicts: { type: 'boolean' },
    conflictsCount: { type: 'integer' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['day_closed', 'outside_hours', 'break_conflict'] },
          bookingId: { type: 'string' },
          clientName: { type: 'string' },
          serviceName: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          proposedHours: { type: 'string' },
          breakTime: { type: 'string' },
          message: { type: 'string' }
        }
      }
    },
    totalBookingsChecked: { type: 'integer' },
    dateRange: {
      type: 'object',
      properties: {
        from: { type: 'string', format: 'date' },
        to: { type: 'string', format: 'date' }
      }
    },
    canApplyChanges: { type: 'boolean' }
  }
};

// Availability schemas for integration
export const AvailabilitySlotSchema = {
  type: 'object',
  properties: {
    start: { type: 'string', format: 'date-time' },
    end: { type: 'string', format: 'date-time' },
    available: { type: 'boolean', default: true },
    bufferBefore: { type: 'integer', default: 0 },
    bufferAfter: { type: 'integer', default: 0 }
  }
};

export const DailyAvailabilitySchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    providerId: { type: 'string' },
    serviceId: { type: 'string' },
    date: { type: 'string', format: 'date' },
    availableSlots: {
      type: 'array',
      items: AvailabilitySlotSchema
    },
    count: { type: 'integer' },
    workingHours: {
      type: 'object',
      properties: {
        isOpen: { type: 'boolean' },
        openTime: { type: 'string' },
        closeTime: { type: 'string' },
        breaks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

// Real-time update schemas
export const ScheduleUpdateNotificationSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['schedule_updated', 'exception_added', 'template_applied'] },
    providerId: { type: 'string' },
    workingHours: WorkingHoursSchema,
    changes: {
      type: 'array',
      items: { type: 'string' }
    },
    timestamp: { type: 'string', format: 'date-time' }
  }
};

// Error response schemas for schedule management
export const ScheduleValidationErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    details: {
      type: 'array',
      items: { type: 'string' }
    },
    statusCode: { type: 'integer' }
  }
};

export const ScheduleConflictErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'string' },
          issue: { type: 'string' },
          suggestion: { type: 'string' }
        }
      }
    },
    statusCode: { type: 'integer' }
  }
};

// Argentina-specific schema additions
export const ArgentinaTimezoneSchema = {
  type: 'object',
  properties: {
    timezone: { type: 'string', default: 'America/Argentina/Buenos_Aires' },
    dstOffset: { type: 'integer' },
    standardOffset: { type: 'integer' },
    isDST: { type: 'boolean' }
  }
};

export const ArgentinaHolidaySchema = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['national', 'provincial', 'local'] },
    recurring: { type: 'boolean' },
    affectsSchedule: { type: 'boolean', default: true }
  }
};