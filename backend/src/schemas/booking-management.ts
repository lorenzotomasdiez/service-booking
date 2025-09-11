// Booking Management Schema Definitions
// Advanced search, bulk operations, and booking workflow schemas

export const BookingSearchSchema = {
  type: 'object',
  properties: {
    providerId: { type: 'string' },
    clientId: { type: 'string' },
    status: {
      type: 'array',
      items: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] }
    },
    serviceId: { type: 'string' },
    dateRange: {
      type: 'object',
      properties: {
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' }
      }
    },
    searchTerm: { type: 'string', maxLength: 200 },
    sortBy: { type: 'string', enum: ['startTime', 'createdAt', 'totalAmount', 'clientName'] },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  }
};

export const BookingSearchResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    bookings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          totalAmount: { type: 'number' },
          notes: { type: 'string' },
          client: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          provider: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              businessName: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' }
                }
              }
            }
          },
          service: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              duration: { type: 'integer' },
              price: { type: 'number' }
            }
          }
        }
      }
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        totalCount: { type: 'integer' },
        totalPages: { type: 'integer' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' }
      }
    }
  }
};

export const BulkUpdateSchema = {
  type: 'object',
  required: ['bookingIds', 'action'],
  properties: {
    bookingIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 50
    },
    action: { type: 'string', enum: ['confirm', 'cancel', 'complete', 'reschedule'] },
    reason: { type: 'string', maxLength: 500 },
    newDateTime: { type: 'string', format: 'date-time' },
    sendNotification: { type: 'boolean', default: true }
  }
};

export const BulkUpdateResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    action: { type: 'string' },
    results: {
      type: 'object',
      properties: {
        successful: {
          type: 'array',
          items: { type: 'string' }
        },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bookingId: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    summary: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        successful: { type: 'integer' },
        failed: { type: 'integer' }
      }
    },
    message: { type: 'string' }
  }
};

export const ModificationRequestSchema = {
  type: 'object',
  required: ['modificationType'],
  properties: {
    modificationType: { type: 'string', enum: ['reschedule', 'service_change', 'cancellation'] },
    newDateTime: { type: 'string', format: 'date-time' },
    newServiceId: { type: 'string' },
    reason: { type: 'string', maxLength: 500 },
    urgent: { type: 'boolean', default: false }
  }
};

export const ModificationResponseSchema = {
  type: 'object',
  required: ['response'],
  properties: {
    response: { type: 'string', enum: ['approve', 'reject', 'counter_offer'] },
    reason: { type: 'string', maxLength: 500 },
    counterOffer: {
      type: 'object',
      properties: {
        newDateTime: { type: 'string', format: 'date-time' },
        newServiceId: { type: 'string' },
        message: { type: 'string', maxLength: 500 }
      }
    }
  }
};

export const BookingTimelineSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    booking: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' }
      }
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          actor: { type: 'string' },
          actorName: { type: 'string' },
          description: { type: 'string' },
          details: { type: 'object' }
        }
      }
    },
    timelineCount: { type: 'integer' }
  }
};

export const AutomaticExpirationSchema = {
  type: 'object',
  required: ['expirationHours'],
  properties: {
    expirationHours: { type: 'integer', minimum: 1, maximum: 168 },
    notifyBeforeExpiration: { type: 'boolean', default: true },
    notificationHours: { type: 'integer', minimum: 1, maximum: 24, default: 2 }
  }
};

export const ConflictDetectionSchema = {
  type: 'object',
  properties: {
    available: { type: 'boolean' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['OVERLAP', 'BUFFER_VIOLATION', 'OUTSIDE_HOURS', 'BREAK_TIME'] },
          message: { type: 'string' },
          conflictingBooking: { type: 'object' },
          suggestedSlots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    suggestedSlots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        }
      }
    },
    timeSlot: {
      type: 'object',
      properties: {
        start: { type: 'string', format: 'date-time' },
        end: { type: 'string', format: 'date-time' }
      }
    }
  }
};

// Error response schemas
export const ValidationErrorResponseSchema = {
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

export const ConflictErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          message: { type: 'string' },
          conflictingBooking: { type: 'object' }
        }
      }
    },
    suggestedSlots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        }
      }
    },
    statusCode: { type: 'integer' }
  }
};

export const NotFoundErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'integer' }
  }
};

export const ForbiddenErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'integer' }
  }
};

export const InternalServerErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'integer' }
  }
};