import { Type } from '@sinclair/typebox';

// General search schema
export const GeneralSearchSchema = Type.Object({
  querystring: Type.Object({
    q: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Search query'
    }),
    type: Type.Optional(Type.Union([
      Type.Literal('services'),
      Type.Literal('providers'),
      Type.Literal('categories'),
      Type.Literal('all')
    ], {
      default: 'all',
      description: 'Search type filter'
    })),
    location: Type.Optional(Type.String({
      description: 'Location filter (city, province, address)'
    })),
    latitude: Type.Optional(Type.Number({
      minimum: -90,
      maximum: 90,
      description: 'Latitude for geo search'
    })),
    longitude: Type.Optional(Type.Number({
      minimum: -180,
      maximum: 180,
      description: 'Longitude for geo search'
    })),
    radius: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Search radius in kilometers'
    })),
    minPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Minimum price filter'
    })),
    maxPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Maximum price filter'
    })),
    categoryId: Type.Optional(Type.String({
      description: 'Service category filter'
    })),
    sortBy: Type.Optional(Type.Union([
      Type.Literal('relevance'),
      Type.Literal('price'),
      Type.Literal('rating'),
      Type.Literal('distance'),
      Type.Literal('popularity'),
      Type.Literal('newest')
    ], {
      default: 'relevance',
      description: 'Sort field'
    })),
    sortOrder: Type.Optional(Type.Union([
      Type.Literal('asc'),
      Type.Literal('desc')
    ], {
      default: 'desc',
      description: 'Sort order'
    })),
    page: Type.Optional(Type.Number({
      minimum: 1,
      default: 1,
      description: 'Page number'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 50,
      default: 20,
      description: 'Items per page'
    })),
    includeInactive: Type.Optional(Type.Boolean({
      default: false,
      description: 'Include inactive services/providers'
    }))
  })
});

// Geolocation search schema
export const GeolocationSearchSchema = Type.Object({
  querystring: Type.Object({
    latitude: Type.Number({
      minimum: -90,
      maximum: 90,
      description: 'User latitude'
    }),
    longitude: Type.Number({
      minimum: -180,
      maximum: 180,
      description: 'User longitude'
    }),
    radius: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Search radius in kilometers'
    })),
    serviceType: Type.Optional(Type.String({
      description: 'Filter by service type'
    })),
    categoryId: Type.Optional(Type.String({
      description: 'Filter by category'
    })),
    minPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Minimum price filter'
    })),
    maxPrice: Type.Optional(Type.Number({
      minimum: 0,
      description: 'Maximum price filter'
    })),
    openNow: Type.Optional(Type.Boolean({
      default: false,
      description: 'Filter providers open now'
    })),
    rating: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 5,
      description: 'Minimum rating filter'
    })),
    sortBy: Type.Optional(Type.Union([
      Type.Literal('distance'),
      Type.Literal('rating'),
      Type.Literal('price'),
      Type.Literal('popularity')
    ], {
      default: 'distance',
      description: 'Sort field'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 50,
      default: 20,
      description: 'Results limit'
    }))
  })
});

// Autocomplete search schema
export const AutocompleteSearchSchema = Type.Object({
  querystring: Type.Object({
    q: Type.String({
      minLength: 1,
      maxLength: 50,
      description: 'Search query for autocomplete'
    }),
    type: Type.Optional(Type.Union([
      Type.Literal('services'),
      Type.Literal('providers'),
      Type.Literal('locations'),
      Type.Literal('all')
    ], {
      default: 'all',
      description: 'Autocomplete type'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Results limit'
    })),
    location: Type.Optional(Type.String({
      description: 'Location context for results'
    }))
  })
});

// Popular services schema
export const PopularServicesSchema = Type.Object({
  querystring: Type.Object({
    location: Type.Optional(Type.String({
      description: 'Location filter'
    })),
    period: Type.Optional(Type.Union([
      Type.Literal('week'),
      Type.Literal('month'),
      Type.Literal('quarter'),
      Type.Literal('year')
    ], {
      default: 'month',
      description: 'Time period for popularity calculation'
    })),
    categoryId: Type.Optional(Type.String({
      description: 'Filter by category'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 50,
      default: 10,
      description: 'Results limit'
    }))
  })
});

// Recommended services schema
export const RecommendedServicesSchema = Type.Object({
  querystring: Type.Object({
    userId: Type.Optional(Type.String({
      description: 'User ID for personalized recommendations'
    })),
    location: Type.Optional(Type.String({
      description: 'Location context'
    })),
    previousBookings: Type.Optional(Type.Boolean({
      default: true,
      description: 'Consider user booking history'
    })),
    similarUsers: Type.Optional(Type.Boolean({
      default: true,
      description: 'Consider similar users preferences'
    })),
    limit: Type.Optional(Type.Number({
      minimum: 1,
      maximum: 50,
      default: 10,
      description: 'Results limit'
    }))
  })
});

// Response schemas
export const SearchResultResponse = Type.Object({
  data: Type.Object({
    services: Type.Array(Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.Optional(Type.String()),
      price: Type.Number(),
      duration: Type.Number(),
      rating: Type.Optional(Type.Number()),
      reviewCount: Type.Number(),
      category: Type.Optional(Type.Object({
        id: Type.String(),
        name: Type.String()
      })),
      provider: Type.Object({
        id: Type.String(),
        businessName: Type.String(),
        city: Type.String(),
        province: Type.String(),
        distance: Type.Optional(Type.Number()),
        rating: Type.Optional(Type.Number()),
        reviewCount: Type.Number(),
        isOpen: Type.Optional(Type.Boolean())
      }),
      images: Type.Array(Type.String()),
      tags: Type.Array(Type.String()),
      relevanceScore: Type.Optional(Type.Number())
    })),
    providers: Type.Array(Type.Object({
      id: Type.String(),
      businessName: Type.String(),
      description: Type.Optional(Type.String()),
      address: Type.String(),
      city: Type.String(),
      province: Type.String(),
      distance: Type.Optional(Type.Number()),
      rating: Type.Optional(Type.Number()),
      reviewCount: Type.Number(),
      serviceCount: Type.Number(),
      isOpen: Type.Optional(Type.Boolean()),
      logo: Type.Optional(Type.String()),
      coverImage: Type.Optional(Type.String()),
      priceRange: Type.Object({
        min: Type.Number(),
        max: Type.Number()
      }),
      popularServices: Type.Array(Type.String()),
      relevanceScore: Type.Optional(Type.Number())
    })),
    categories: Type.Array(Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.Optional(Type.String()),
      icon: Type.Optional(Type.String()),
      serviceCount: Type.Number(),
      relevanceScore: Type.Optional(Type.Number())
    }))
  }),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number()
  }),
  filters: Type.Object({
    appliedFilters: Type.Object({
      location: Type.Optional(Type.String()),
      priceRange: Type.Optional(Type.Object({
        min: Type.Number(),
        max: Type.Number()
      })),
      categoryId: Type.Optional(Type.String()),
      radius: Type.Optional(Type.Number())
    }),
    availableFilters: Type.Object({
      categories: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
        count: Type.Number()
      })),
      priceRanges: Type.Array(Type.Object({
        label: Type.String(),
        min: Type.Number(),
        max: Type.Number(),
        count: Type.Number()
      })),
      locations: Type.Array(Type.Object({
        city: Type.String(),
        province: Type.String(),
        count: Type.Number()
      }))
    })
  }),
  suggestions: Type.Optional(Type.Object({
    didYouMean: Type.Optional(Type.String()),
    relatedSearches: Type.Array(Type.String()),
    popularSearches: Type.Array(Type.String())
  }))
});

export const AutocompleteResponse = Type.Object({
  suggestions: Type.Array(Type.Object({
    type: Type.String(),
    id: Type.Optional(Type.String()),
    text: Type.String(),
    subtitle: Type.Optional(Type.String()),
    category: Type.Optional(Type.String()),
    location: Type.Optional(Type.String()),
    relevanceScore: Type.Number()
  }))
});

export const PopularServicesResponse = Type.Object({
  data: Type.Array(Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    price: Type.Number(),
    duration: Type.Number(),
    bookingCount: Type.Number(),
    rating: Type.Optional(Type.Number()),
    reviewCount: Type.Number(),
    trendingScore: Type.Number(),
    category: Type.Object({
      id: Type.String(),
      name: Type.String()
    }),
    provider: Type.Object({
      id: Type.String(),
      businessName: Type.String(),
      city: Type.String(),
      province: Type.String()
    }),
    images: Type.Array(Type.String())
  })),
  period: Type.String(),
  location: Type.Optional(Type.String()),
  generatedAt: Type.String({ format: 'date-time' })
});

export const RecommendationsResponse = Type.Object({
  data: Type.Array(Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    price: Type.Number(),
    duration: Type.Number(),
    recommendationScore: Type.Number(),
    reason: Type.String(),
    rating: Type.Optional(Type.Number()),
    reviewCount: Type.Number(),
    category: Type.Object({
      id: Type.String(),
      name: Type.String()
    }),
    provider: Type.Object({
      id: Type.String(),
      businessName: Type.String(),
      city: Type.String(),
      province: Type.String(),
      distance: Type.Optional(Type.Number())
    }),
    images: Type.Array(Type.String()),
    tags: Type.Array(Type.String())
  })),
  personalized: Type.Boolean(),
  basedOn: Type.Array(Type.String()),
  generatedAt: Type.String({ format: 'date-time' })
});