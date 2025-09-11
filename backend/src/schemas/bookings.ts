import { Type } from '@sinclair/typebox';

// Booking creation and management schemas
export const BookingBase = Type.Object({
  serviceId: Type.String({
    description: 'Service ID to book'
  }),
  providerId: Type.String({
    description: 'Provider ID'
  }),
  startTime: Type.String({
    format: 'date-time',
    description: 'Booking start time (ISO 8601)'
  }),
  notes: Type.Optional(Type.String({
    maxLength: 500,
    description: 'Client notes for the booking'
  })),
  clientNotes: Type.Optional(Type.String({
    maxLength: 500,
    description: 'Additional client notes'
  }))
});

export const CreateBookingSchema = Type.Object({
  body: BookingBase
});

export const UpdateBookingSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Booking ID' })
  }),
  body: Type.Object({
    startTime: Type.Optional(Type.String({
      format: 'date-time',
      description: 'New booking start time'
    })),
    notes: Type.Optional(Type.String({
      maxLength: 500,
      description: 'Updated client notes'
    })),
    clientNotes: Type.Optional(Type.String({
      maxLength: 500,
      description: 'Updated additional client notes'
    }))
  })
});

export const GetBookingSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Booking ID' })
  })
});

export const BookingStatusUpdateSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Booking ID' })
  }),
  body: Type.Object({
    status: Type.Union([
      Type.Literal('PENDING'),
      Type.Literal('CONFIRMED'),
      Type.Literal('COMPLETED'),
      Type.Literal('CANCELLED'),
      Type.Literal('NO_SHOW')
    ], {
      description: 'New booking status'
    }),
    internalNotes: Type.Optional(Type.String({
      maxLength: 500,
      description: 'Provider internal notes'
    })),
    cancelReason: Type.Optional(Type.String({
      maxLength: 200,
      description: 'Cancellation reason'
    }))
  })
});

export const BookingCancellationSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Booking ID' })
  }),
  body: Type.Object({
    reason: Type.String({
      minLength: 1,
      maxLength: 200,
      description: 'Cancellation reason'
    }),
    notifyClient: Type.Optional(Type.Boolean({
      default: true,
      description: 'Send notification to client'
    }))
  })
});

export const BookingListSchema = Type.Object({
  querystring: Type.Object({
    status: Type.Optional(Type.Union([
      Type.Literal('PENDING'),
      Type.Literal('CONFIRMED'),
      Type.Literal('COMPLETED'),
      Type.Literal('CANCELLED'),
      Type.Literal('NO_SHOW')
    ], {
      description: 'Filter by status'
    })),
    providerId: Type.Optional(Type.String({
      description: 'Filter by provider'
    })),
    clientId: Type.Optional(Type.String({
      description: 'Filter by client'
    })),
    serviceId: Type.Optional(Type.String({
      description: 'Filter by service'
    })),
    startDate: Type.Optional(Type.String({
      format: 'date',
      description: 'Filter from date (YYYY-MM-DD)'
    })),
    endDate: Type.Optional(Type.String({
      format: 'date',
      description: 'Filter to date (YYYY-MM-DD)'
    })),
    paymentStatus: Type.Optional(Type.Union([
      Type.Literal('PENDING'),
      Type.Literal('PAID'),
      Type.Literal('FAILED'),
      Type.Literal('REFUNDED'),
      Type.Literal('CANCELLED')
    ], {
      description: 'Filter by payment status'
    })),
    sortBy: Type.Optional(Type.Union([
      Type.Literal('startTime'),
      Type.Literal('created'),
      Type.Literal('totalAmount'),
      Type.Literal('status')
    ], {
      default: 'startTime',
      description: 'Sort field'
    })),
    sortOrder: Type.Optional(Type.Union([
      Type.Literal('asc'),
      Type.Literal('desc')
    ], {
      default: 'asc',
      description: 'Sort order'
    })),
    page: Type.Optional(Type.Number({
      minimum: 1,
      default: 1,
      description: 'Page number'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Items per page'
    }))
  })
});

export const BookingConflictCheckSchema = Type.Object({
  querystring: Type.Object({
    providerId: Type.String({
      description: 'Provider ID to check conflicts'
    }),
    startTime: Type.String({
      format: 'date-time',
      description: 'Proposed start time'
    }),
    duration: Type.Number({
      minimum: 15,
      description: 'Service duration in minutes'
    }),
    excludeBookingId: Type.Optional(Type.String({
      description: 'Exclude this booking ID from conflict check'
    }))
  })
});

export const BookingFeedbackSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Booking ID' })
  }),
  body: Type.Object({
    clientRating: Type.Number({
      minimum: 1,
      maximum: 5,
      description: 'Client rating (1-5 stars)'
    }),
    clientFeedback: Type.Optional(Type.String({
      maxLength: 500,
      description: 'Client feedback text'
    })),
    providerFeedback: Type.Optional(Type.String({
      maxLength: 500,
      description: 'Provider feedback text'
    }))
  })
});

// Response schemas
export const BookingResponse = Type.Object({
  id: Type.String(),
  clientId: Type.String(),
  serviceId: Type.String(),
  providerId: Type.String(),
  startTime: Type.String({ format: 'date-time' }),
  endTime: Type.String({ format: 'date-time' }),
  status: Type.String(),
  totalAmount: Type.Number(),
  notes: Type.Optional(Type.String()),
  clientNotes: Type.Optional(Type.String()),
  internalNotes: Type.Optional(Type.String()),
  paymentStatus: Type.String(),
  paymentMethod: Type.Optional(Type.String()),
  paymentId: Type.Optional(Type.String()),
  cancelledBy: Type.Optional(Type.String()),
  cancelReason: Type.Optional(Type.String()),
  cancelledAt: Type.Optional(Type.String({ format: 'date-time' })),
  confirmedAt: Type.Optional(Type.String({ format: 'date-time' })),
  completedAt: Type.Optional(Type.String({ format: 'date-time' })),
  clientRating: Type.Optional(Type.Number()),
  clientFeedback: Type.Optional(Type.String()),
  providerFeedback: Type.Optional(Type.String()),
  remindersSent: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  client: Type.Optional(Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String(),
    phone: Type.Optional(Type.String()),
    avatar: Type.Optional(Type.String())
  })),
  service: Type.Optional(Type.Object({
    id: Type.String(),
    name: Type.String(),
    duration: Type.Number(),
    price: Type.Number(),
    category: Type.Optional(Type.Object({
      id: Type.String(),
      name: Type.String()
    }))
  })),
  provider: Type.Optional(Type.Object({
    id: Type.String(),
    businessName: Type.String(),
    address: Type.String(),
    city: Type.String(),
    province: Type.String(),
    phone: Type.Optional(Type.String()),
    user: Type.Optional(Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String()
    }))
  })),
  payment: Type.Optional(Type.Object({
    id: Type.String(),
    amount: Type.Number(),
    currency: Type.String(),
    status: Type.String(),
    paymentMethod: Type.String(),
    externalId: Type.Optional(Type.String())
  }))
});

export const BookingListResponse = Type.Object({
  data: Type.Array(BookingResponse),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number()
  }),
  stats: Type.Optional(Type.Object({
    totalBookings: Type.Number(),
    pendingBookings: Type.Number(),
    confirmedBookings: Type.Number(),
    completedBookings: Type.Number(),
    cancelledBookings: Type.Number(),
    totalRevenue: Type.Number(),
    averageRating: Type.Optional(Type.Number())
  }))
});

export const BookingConflictResponse = Type.Object({
  hasConflict: Type.Boolean(),
  conflictingBookings: Type.Array(Type.Object({
    id: Type.String(),
    startTime: Type.String({ format: 'date-time' }),
    endTime: Type.String({ format: 'date-time' }),
    status: Type.String(),
    serviceName: Type.String()
  })),
  suggestedSlots: Type.Array(Type.Object({
    startTime: Type.String({ format: 'date-time' }),
    endTime: Type.String({ format: 'date-time' }),
    available: Type.Boolean()
  }))
});

export const BookingStatsResponse = Type.Object({
  totalBookings: Type.Number(),
  totalRevenue: Type.Number(),
  averageRating: Type.Number(),
  statusBreakdown: Type.Object({
    pending: Type.Number(),
    confirmed: Type.Number(),
    completed: Type.Number(),
    cancelled: Type.Number(),
    noShow: Type.Number()
  }),
  monthlyStats: Type.Array(Type.Object({
    month: Type.String(),
    bookings: Type.Number(),
    revenue: Type.Number(),
    averageRating: Type.Number()
  })),
  topServices: Type.Array(Type.Object({
    serviceId: Type.String(),
    serviceName: Type.String(),
    bookings: Type.Number(),
    revenue: Type.Number()
  }))
});