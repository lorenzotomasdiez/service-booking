import { Type } from '@sinclair/typebox';

// Service category schemas
export const ServiceCategoryBase = Type.Object({
  name: Type.String({ 
    minLength: 2, 
    maxLength: 50,
    description: 'Category name'
  }),
  description: Type.Optional(Type.String({ 
    maxLength: 200,
    description: 'Category description'
  })),
  icon: Type.Optional(Type.String({
    description: 'Icon name or URL'
  })),
  sortOrder: Type.Optional(Type.Number({
    minimum: 0,
    description: 'Sort order for display'
  })),
  isActive: Type.Optional(Type.Boolean({
    default: true,
    description: 'Category active status'
  }))
});

export const CreateServiceCategorySchema = Type.Object({
  body: ServiceCategoryBase
});

export const UpdateServiceCategorySchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Category ID' })
  }),
  body: Type.Partial(ServiceCategoryBase)
});

// Service schemas
export const ServiceBase = Type.Object({
  name: Type.String({ 
    minLength: 2, 
    maxLength: 100,
    description: 'Service name'
  }),
  description: Type.Optional(Type.String({ 
    maxLength: 500,
    description: 'Service description'
  })),
  duration: Type.Number({ 
    minimum: 15, 
    maximum: 480,
    description: 'Service duration in minutes'
  }),
  price: Type.Number({ 
    minimum: 0,
    description: 'Service price in ARS'
  }),
  categoryId: Type.Optional(Type.String({
    description: 'Service category ID'
  })),
  depositRequired: Type.Optional(Type.Boolean({
    default: false,
    description: 'Whether deposit is required'
  })),
  depositAmount: Type.Optional(Type.Number({
    minimum: 0,
    description: 'Deposit amount in ARS'
  })),
  bufferTimeBefore: Type.Optional(Type.Number({
    minimum: 0,
    maximum: 60,
    default: 5,
    description: 'Buffer time before service in minutes'
  })),
  bufferTimeAfter: Type.Optional(Type.Number({
    minimum: 0,
    maximum: 60,
    default: 10,
    description: 'Buffer time after service in minutes'
  })),
  maxAdvanceBookingDays: Type.Optional(Type.Number({
    minimum: 1,
    maximum: 365,
    default: 30,
    description: 'Maximum days in advance for booking'
  })),
  allowSameDayBooking: Type.Optional(Type.Boolean({
    default: true,
    description: 'Allow same day booking'
  })),
  requiresConsultation: Type.Optional(Type.Boolean({
    default: false,
    description: 'Service requires consultation'
  })),
  tags: Type.Optional(Type.Array(Type.String({
    maxLength: 30
  }), {
    description: 'Searchable tags'
  })),
  sortOrder: Type.Optional(Type.Number({
    minimum: 0,
    description: 'Sort order for display'
  })),
  isActive: Type.Optional(Type.Boolean({
    default: true,
    description: 'Service active status'
  }))
});

export const CreateServiceSchema = Type.Object({
  body: ServiceBase
});

export const UpdateServiceSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Service ID' })
  }),
  body: Type.Partial(ServiceBase)
});

export const GetServiceSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Service ID' })
  })
});

export const ServiceSearchSchema = Type.Object({
  querystring: Type.Object({
    q: Type.Optional(Type.String({
      minLength: 1,
      description: 'Search query'
    })),
    categoryId: Type.Optional(Type.String({
      description: 'Filter by category'
    })),
    providerId: Type.Optional(Type.String({
      description: 'Filter by provider'
    })),
    minPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Minimum price filter'
    })),
    maxPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Maximum price filter'
    })),
    minDuration: Type.Optional(Type.Number({
      minimum: 15,
      description: 'Minimum duration filter'
    })),
    maxDuration: Type.Optional(Type.Number({
      minimum: 15,
      description: 'Maximum duration filter'
    })),
    tags: Type.Optional(Type.String({
      description: 'Comma-separated tags'
    })),
    sortBy: Type.Optional(Type.Union([
      Type.Literal('price'),
      Type.Literal('duration'),
      Type.Literal('name'),
      Type.Literal('created'),
      Type.Literal('popularity')
    ], {
      default: 'name',
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
    })),
    isActive: Type.Optional(Type.Boolean({
      default: true,
      description: 'Filter by active status'
    }))
  })
});

// Service availability schemas
export const ServiceAvailabilitySchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Service ID' })
  }),
  querystring: Type.Object({
    date: Type.String({
      format: 'date',
      description: 'Date to check availability (YYYY-MM-DD)'
    }),
    duration: Type.Optional(Type.Number({
      minimum: 15,
      description: 'Override service duration'
    }))
  })
});

// File upload schemas
export const ServicePhotoUploadSchema = Type.Object({
  params: Type.Object({
    id: Type.String({ description: 'Service ID' })
  })
});

// Response schemas
export const ServiceCategoryResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  icon: Type.Optional(Type.String()),
  sortOrder: Type.Number(),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  _count: Type.Optional(Type.Object({
    services: Type.Number()
  }))
});

export const ServiceResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  duration: Type.Number(),
  price: Type.Number(),
  isActive: Type.Boolean(),
  categoryId: Type.Optional(Type.String()),
  providerId: Type.String(),
  depositRequired: Type.Boolean(),
  depositAmount: Type.Optional(Type.Number()),
  bufferTimeBefore: Type.Number(),
  bufferTimeAfter: Type.Number(),
  maxAdvanceBookingDays: Type.Number(),
  allowSameDayBooking: Type.Boolean(),
  requiresConsultation: Type.Boolean(),
  images: Type.Array(Type.String()),
  tags: Type.Array(Type.String()),
  sortOrder: Type.Number(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  category: Type.Optional(ServiceCategoryResponse),
  provider: Type.Optional(Type.Object({
    id: Type.String(),
    businessName: Type.String(),
    city: Type.String(),
    province: Type.String()
  })),
  _count: Type.Optional(Type.Object({
    bookings: Type.Number()
  }))
});

export const ServiceListResponse = Type.Object({
  data: Type.Array(ServiceResponse),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number()
  }),
  filters: Type.Object({
    categories: Type.Array(ServiceCategoryResponse),
    priceRange: Type.Object({
      min: Type.Number(),
      max: Type.Number()
    }),
    durationRange: Type.Object({
      min: Type.Number(),
      max: Type.Number()
    })
  })
});

export const ServiceAvailabilityResponse = Type.Object({
  serviceId: Type.String(),
  date: Type.String({ format: 'date' }),
  availableSlots: Type.Array(Type.Object({
    startTime: Type.String({ format: 'time' }),
    endTime: Type.String({ format: 'time' }),
    isAvailable: Type.Boolean()
  })),
  workingHours: Type.Object({
    start: Type.String({ format: 'time' }),
    end: Type.String({ format: 'time' }),
    isWorkingDay: Type.Boolean()
  }),
  blockedSlots: Type.Array(Type.Object({
    startTime: Type.String({ format: 'time' }),
    endTime: Type.String({ format: 'time' }),
    reason: Type.String()
  }))
});