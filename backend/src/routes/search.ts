import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../services/database';
import {
  GeneralSearchSchema,
  GeolocationSearchSchema,
  AutocompleteSearchSchema,
  PopularServicesSchema,
  RecommendedServicesSchema,
  SearchResultResponse,
  AutocompleteResponse,
  PopularServicesResponse,
  RecommendationsResponse
} from '../schemas/search';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate?: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: any;
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to check if provider is currently open
const isProviderOpen = (workingHours: any): boolean => {
  if (!workingHours) return false;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const dayHours = workingHours[currentDay];
  if (!dayHours || !dayHours.isWorkingDay) return false;
  
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Helper function to calculate relevance score
const calculateRelevanceScore = (
  searchQuery: string,
  serviceName: string,
  serviceDescription: string,
  tags: string[],
  rating?: number,
  reviewCount?: number
): number => {
  let score = 0;
  const query = searchQuery.toLowerCase();
  const name = serviceName.toLowerCase();
  const description = (serviceDescription || '').toLowerCase();
  
  // Exact name match
  if (name === query) score += 100;
  // Name starts with query
  else if (name.startsWith(query)) score += 80;
  // Name contains query
  else if (name.includes(query)) score += 60;
  
  // Description contains query
  if (description.includes(query)) score += 30;
  
  // Tags match
  tags.forEach(tag => {
    if (tag.toLowerCase().includes(query)) score += 40;
  });
  
  // Boost based on rating and reviews
  if (rating && reviewCount) {
    score += (rating - 3) * 10; // Boost for high ratings
    score += Math.min(reviewCount * 0.1, 20); // Boost for many reviews (max 20 points)
  }
  
  return Math.round(score);
};

export default async function searchRoutes(fastify: FastifyInstance) {

  // GET /api/search - General search
  fastify.get('/', {
    schema: {
      tags: ['Search'],
      summary: 'General search',
      description: 'Search services, providers, and categories with filters',
      ...GeneralSearchSchema,
      response: {
        200: SearchResultResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      q: string;
      type?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      minPrice?: number;
      maxPrice?: number;
      categoryId?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
      includeInactive?: boolean;
    }
  }>, reply: FastifyReply) => {
    const {
      q,
      type = 'all',
      location,
      latitude,
      longitude,
      radius = 10,
      minPrice,
      maxPrice,
      categoryId,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeInactive = false
    } = request.query;

    const skip = (page - 1) * limit;
    const searchResults: any = {
      services: [],
      providers: [],
      categories: []
    };

    // Build base where clauses
    const serviceWhere: any = { isActive: !includeInactive };
    const providerWhere: any = { isActive: !includeInactive };

    // Add price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      serviceWhere.price = {};
      if (minPrice !== undefined) serviceWhere.price.gte = minPrice;
      if (maxPrice !== undefined) serviceWhere.price.lte = maxPrice;
    }

    // Add category filter
    if (categoryId) {
      serviceWhere.categoryId = categoryId;
    }

    // Add location filters
    if (location) {
      providerWhere.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { province: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } }
      ];
    }

    // Add search query filters
    if (q) {
      serviceWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } }
      ];

      providerWhere.OR = [
        ...(providerWhere.OR || []),
        { businessName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Search services
    if (type === 'all' || type === 'services') {
      const services = await prisma.service.findMany({
        where: serviceWhere,
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true,
              latitude: true,
              longitude: true,
              workingHours: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        take: limit,
        skip: type === 'services' ? skip : 0
      });

      // Calculate distances and relevance scores
      searchResults.services = services.map(service => {
        const distance = latitude && longitude && service.provider.latitude && service.provider.longitude
          ? calculateDistance(latitude, longitude, service.provider.latitude, service.provider.longitude)
          : undefined;

        const withinRadius = !distance || distance <= radius;
        
        if (latitude && longitude && !withinRadius) return null;

        const relevanceScore = q ? calculateRelevanceScore(
          q,
          service.name,
          service.description || '',
          service.tags,
          undefined, // TODO: Add average rating calculation
          service._count.bookings
        ) : 0;

        return {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toNumber(),
          duration: service.duration,
          rating: undefined, // TODO: Calculate from bookings
          reviewCount: service._count.bookings,
          category: service.category,
          provider: {
            ...service.provider,
            distance,
            rating: undefined, // TODO: Calculate provider rating
            reviewCount: service._count.bookings,
            isOpen: isProviderOpen(service.provider.workingHours)
          },
          images: service.images,
          tags: service.tags,
          relevanceScore
        };
      }).filter(Boolean);
    }

    // Search providers
    if (type === 'all' || type === 'providers') {
      const providers = await prisma.provider.findMany({
        where: providerWhere,
        include: {
          services: {
            where: { isActive: !includeInactive },
            select: {
              id: true,
              name: true,
              price: true,
              _count: {
                select: { bookings: true }
              }
            }
          },
          _count: {
            select: { services: true, bookings: true }
          }
        },
        take: limit,
        skip: type === 'providers' ? skip : 0
      });

      searchResults.providers = providers.map(provider => {
        const distance = latitude && longitude && provider.latitude && provider.longitude
          ? calculateDistance(latitude, longitude, provider.latitude, provider.longitude)
          : undefined;

        const withinRadius = !distance || distance <= radius;
        
        if (latitude && longitude && !withinRadius) return null;

        const priceRange = provider.services.length > 0 ? {
          min: Math.min(...provider.services.map(s => s.price.toNumber())),
          max: Math.max(...provider.services.map(s => s.price.toNumber()))
        } : { min: 0, max: 0 };

        const relevanceScore = q ? calculateRelevanceScore(
          q,
          provider.businessName,
          provider.description || '',
          [],
          undefined, // TODO: Add provider rating
          provider._count.bookings
        ) : 0;

        return {
          id: provider.id,
          businessName: provider.businessName,
          description: provider.description,
          address: provider.address,
          city: provider.city,
          province: provider.province,
          distance,
          rating: undefined, // TODO: Calculate from bookings
          reviewCount: provider._count.bookings,
          serviceCount: provider._count.services,
          isOpen: isProviderOpen(provider.workingHours),
          logo: provider.logo,
          coverImage: provider.coverImage,
          priceRange,
          popularServices: provider.services.slice(0, 3).map(s => s.name),
          relevanceScore
        };
      }).filter(Boolean);
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categories = await prisma.serviceCategory.findMany({
        where: {
          isActive: !includeInactive,
          ...(q ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          } : {})
        },
        include: {
          _count: {
            select: { services: true }
          }
        },
        take: limit,
        skip: type === 'categories' ? skip : 0
      });

      searchResults.categories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        serviceCount: category._count.services,
        relevanceScore: q ? calculateRelevanceScore(
          q,
          category.name,
          category.description || '',
          []
        ) : 0
      }));
    }

    // Sort results by relevance or other criteria
    Object.keys(searchResults).forEach(key => {
      if (sortBy === 'relevance') {
        searchResults[key].sort((a: any, b: any) => 
          sortOrder === 'desc' ? b.relevanceScore - a.relevanceScore : a.relevanceScore - b.relevanceScore
        );
      } else if (sortBy === 'distance' && (latitude && longitude)) {
        searchResults[key].sort((a: any, b: any) => {
          const aDistance = a.distance || Infinity;
          const bDistance = b.distance || Infinity;
          return sortOrder === 'desc' ? bDistance - aDistance : aDistance - bDistance;
        });
      } else if (sortBy === 'price') {
        searchResults.services.sort((a: any, b: any) => 
          sortOrder === 'desc' ? b.price - a.price : a.price - b.price
        );
      }
    });

    // Calculate pagination info
    const totalResults = searchResults.services.length + searchResults.providers.length + searchResults.categories.length;

    // Get filter options
    const [categories, priceStats, locationStats] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        include: { _count: { select: { services: true } } }
      }),
      prisma.service.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.provider.groupBy({
        by: ['city', 'province'],
        where: { isActive: true },
        _count: { id: true }
      })
    ]);

    return reply.send({
      data: searchResults,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit)
      },
      filters: {
        appliedFilters: {
          location,
          priceRange: minPrice !== undefined || maxPrice !== undefined ? { min: minPrice || 0, max: maxPrice || 0 } : undefined,
          categoryId,
          radius: latitude && longitude ? radius : undefined
        },
        availableFilters: {
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: cat._count.services
          })),
          priceRanges: [
            { label: 'Económico', min: 0, max: 5000, count: 0 },
            { label: 'Medio', min: 5000, max: 15000, count: 0 },
            { label: 'Premium', min: 15000, max: 50000, count: 0 }
          ],
          locations: locationStats.map(stat => ({
            city: stat.city,
            province: stat.province,
            count: stat._count.id
          }))
        }
      },
      suggestions: q ? {
        didYouMean: undefined, // TODO: Implement spell checking
        relatedSearches: [], // TODO: Implement related searches
        popularSearches: ['corte de cabello', 'barba', 'afeitado', 'peinado']
      } : undefined
    });
  });

  // GET /api/search/geolocation - Geolocation-based search
  fastify.get('/geolocation', {
    schema: {
      tags: ['Search'],
      summary: 'Geolocation search',
      description: 'Find services and providers near a specific location',
      ...GeolocationSearchSchema,
      response: {
        200: SearchResultResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      latitude: number;
      longitude: number;
      radius?: number;
      serviceType?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      openNow?: boolean;
      rating?: number;
      sortBy?: string;
      limit?: number;
    }
  }>, reply: FastifyReply) => {
    const {
      latitude,
      longitude,
      radius = 10,
      serviceType,
      categoryId,
      minPrice,
      maxPrice,
      openNow = false,
      rating,
      sortBy = 'distance',
      limit = 20
    } = request.query;

    // Find providers within radius
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        services: {
          where: {
            isActive: true,
            ...(categoryId ? { categoryId } : {}),
            ...(minPrice !== undefined || maxPrice !== undefined ? {
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {})
              }
            } : {})
          },
          include: {
            category: true,
            _count: {
              select: { bookings: true }
            }
          }
        }
      }
    });

    // Filter by distance and other criteria
    const nearbyProviders = providers
      .map(provider => {
        if (!provider.latitude || !provider.longitude) return null;
        
        const distance = calculateDistance(
          latitude,
          longitude,
          provider.latitude,
          provider.longitude
        );

        if (distance > radius) return null;

        const isOpen = openNow ? isProviderOpen(provider.workingHours) : true;
        if (openNow && !isOpen) return null;

        // TODO: Calculate provider rating
        const providerRating = 4.5; // Placeholder
        if (rating && providerRating < rating) return null;

        return {
          ...provider,
          distance,
          isOpen,
          rating: providerRating
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (sortBy === 'distance') return a.distance - b.distance;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'popularity') return b.services.length - a.services.length;
        return a.distance - b.distance; // default to distance
      })
      .slice(0, limit);

    // Transform to search result format
    const searchResults = {
      services: [] as any[],
      providers: nearbyProviders.map(provider => ({
        id: provider.id,
        businessName: provider.businessName,
        description: provider.description,
        address: provider.address,
        city: provider.city,
        province: provider.province,
        distance: provider.distance,
        rating: provider.rating,
        reviewCount: provider.services.reduce((sum: number, service: any) => sum + service._count.bookings, 0),
        serviceCount: provider.services.length,
        isOpen: provider.isOpen,
        logo: provider.logo,
        coverImage: provider.coverImage,
        priceRange: provider.services.length > 0 ? {
          min: Math.min(...provider.services.map((s: any) => s.price.toNumber())),
          max: Math.max(...provider.services.map((s: any) => s.price.toNumber()))
        } : { min: 0, max: 0 },
        popularServices: provider.services.slice(0, 3).map((s: any) => s.name),
        relevanceScore: 100 - (provider.distance * 10) // Distance-based relevance
      })),
      categories: []
    };

    // Extract services from nearby providers
    nearbyProviders.forEach(provider => {
      provider.services.forEach((service: any) => {
        searchResults.services.push({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toNumber(),
          duration: service.duration,
          rating: undefined, // TODO: Calculate service rating
          reviewCount: service._count.bookings,
          category: service.category,
          provider: {
            id: provider.id,
            businessName: provider.businessName,
            city: provider.city,
            province: provider.province,
            distance: provider.distance,
            rating: provider.rating,
            reviewCount: service._count.bookings,
            isOpen: provider.isOpen
          },
          images: service.images,
          tags: service.tags,
          relevanceScore: 100 - (provider.distance * 10)
        });
      });
    });

    return reply.send({
      data: searchResults,
      pagination: {
        page: 1,
        limit,
        total: searchResults.services.length + searchResults.providers.length,
        totalPages: 1
      },
      filters: {
        appliedFilters: {
          location: `${latitude},${longitude}`,
          radius
        },
        availableFilters: {
          categories: [],
          priceRanges: [],
          locations: []
        }
      }
    });
  });

  // GET /api/search/autocomplete - Autocomplete suggestions
  fastify.get('/autocomplete', {
    schema: {
      tags: ['Search'],
      summary: 'Autocomplete search',
      description: 'Get autocomplete suggestions for search queries',
      ...AutocompleteSearchSchema,
      response: {
        200: AutocompleteResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      q: string;
      type?: string;
      limit?: number;
      location?: string;
    }
  }>, reply: FastifyReply) => {
    const { q, type = 'all', limit = 10, location } = request.query;
    const suggestions: any[] = [];

    // Service name suggestions
    if (type === 'all' || type === 'services') {
      const services = await prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } }
          ]
        },
        select: {
          id: true,
          name: true,
          category: { select: { name: true } },
          provider: { select: { city: true, province: true } }
        },
        take: Math.ceil(limit / 3)
      });

      services.forEach(service => {
        suggestions.push({
          type: 'service',
          id: service.id,
          text: service.name,
          subtitle: service.category?.name,
          location: `${service.provider.city}, ${service.provider.province}`,
          relevanceScore: calculateRelevanceScore(q, service.name, '', [])
        });
      });
    }

    // Provider suggestions
    if (type === 'all' || type === 'providers') {
      const providers = await prisma.provider.findMany({
        where: {
          isActive: true,
          businessName: { contains: q, mode: 'insensitive' }
        },
        select: {
          id: true,
          businessName: true,
          city: true,
          province: true,
          businessType: true
        },
        take: Math.ceil(limit / 3)
      });

      providers.forEach(provider => {
        suggestions.push({
          type: 'provider',
          id: provider.id,
          text: provider.businessName,
          subtitle: provider.businessType,
          location: `${provider.city}, ${provider.province}`,
          relevanceScore: calculateRelevanceScore(q, provider.businessName, '', [])
        });
      });
    }

    // Location suggestions
    if (type === 'all' || type === 'locations') {
      const locations = await prisma.provider.groupBy({
        by: ['city', 'province'],
        where: {
          isActive: true,
          OR: [
            { city: { contains: q, mode: 'insensitive' } },
            { province: { contains: q, mode: 'insensitive' } }
          ]
        },
        _count: { id: true }
      });

      locations.slice(0, Math.ceil(limit / 3)).forEach(loc => {
        suggestions.push({
          type: 'location',
          text: `${loc.city}, ${loc.province}`,
          subtitle: `${loc._count.id} proveedores`,
          relevanceScore: calculateRelevanceScore(q, `${loc.city} ${loc.province}`, '', [])
        });
      });
    }

    // Sort by relevance and limit
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return reply.send({
      suggestions: suggestions.slice(0, limit)
    });
  });

  // GET /api/search/popular - Popular services
  fastify.get('/popular', {
    schema: {
      tags: ['Search'],
      summary: 'Popular services',
      description: 'Get popular services based on booking frequency',
      ...PopularServicesSchema,
      response: {
        200: PopularServicesResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      location?: string;
      period?: string;
      categoryId?: string;
      limit?: number;
    }
  }>, reply: FastifyReply) => {
    const { location, period = 'month', categoryId, limit = 10 } = request.query;

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date(now);
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get services with booking counts
    const popularServices = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(location ? {
          provider: {
            OR: [
              { city: { contains: location, mode: 'insensitive' } },
              { province: { contains: location, mode: 'insensitive' } }
            ]
          }
        } : {}),
        bookings: {
          some: {
            createdAt: { gte: startDate },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          }
        }
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                createdAt: { gte: startDate },
                status: { in: ['CONFIRMED', 'COMPLETED'] }
              }
            }
          }
        }
      },
      orderBy: {
        bookings: { _count: 'desc' }
      },
      take: limit
    });

    // TODO: Calculate ratings from bookings
    const servicesWithStats = popularServices.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price.toNumber(),
      duration: service.duration,
      bookingCount: service._count.bookings,
      rating: 4.5, // Placeholder
      reviewCount: service._count.bookings,
      trendingScore: service._count.bookings * 10, // Simple trending calculation
      category: service.category!,
      provider: service.provider,
      images: service.images
    }));

    return reply.send({
      data: servicesWithStats,
      period,
      location,
      generatedAt: new Date().toISOString()
    });
  });

  // GET /api/search/recommendations - Personalized recommendations
  fastify.get('/recommendations', {
    schema: {
      tags: ['Search'],
      summary: 'Service recommendations',
      description: 'Get personalized service recommendations',
      ...RecommendedServicesSchema,
      response: {
        200: RecommendationsResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      userId?: string;
      location?: string;
      previousBookings?: boolean;
      similarUsers?: boolean;
      limit?: number;
    }
  }>, reply: FastifyReply) => {
    const {
      userId,
      location,
      previousBookings = true,
      similarUsers = true,
      limit = 10
    } = request.query;

    const recommendations: any[] = [];
    const basedOn: string[] = [];

    // Get user's booking history if userId provided
    let userBookings: any[] = [];
    if (userId && previousBookings) {
      userBookings = await prisma.booking.findMany({
        where: {
          clientId: userId,
          status: 'COMPLETED'
        },
        include: {
          service: {
            include: { category: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      if (userBookings.length > 0) {
        basedOn.push('Previous bookings');
      }
    }

    // Recommend based on previous bookings
    if (userBookings.length > 0) {
      const bookedCategories = [...new Set(userBookings.map(b => b.service.categoryId).filter(Boolean))];
      const bookedProviders = [...new Set(userBookings.map(b => b.service.providerId))];

      // Similar services from same categories
      const similarServices = await prisma.service.findMany({
        where: {
          isActive: true,
          categoryId: { in: bookedCategories },
          id: { notIn: userBookings.map(b => b.service.id) },
          ...(location ? {
            provider: {
              OR: [
                { city: { contains: location, mode: 'insensitive' } },
                { province: { contains: location, mode: 'insensitive' } }
              ]
            }
          } : {})
        },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true,
              latitude: true,
              longitude: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        take: Math.ceil(limit / 2)
      });

      similarServices.forEach(service => {
        recommendations.push({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toNumber(),
          duration: service.duration,
          recommendationScore: 85,
          reason: `Similar to services you've booked in ${service.category?.name}`,
          rating: 4.5, // Placeholder
          reviewCount: service._count.bookings,
          category: service.category!,
          provider: service.provider,
          images: service.images,
          tags: service.tags
        });
      });
    }

    // Popular services in user's location
    if (location) {
      const popularLocal = await prisma.service.findMany({
        where: {
          isActive: true,
          provider: {
            OR: [
              { city: { contains: location, mode: 'insensitive' } },
              { province: { contains: location, mode: 'insensitive' } }
            ]
          },
          id: { notIn: recommendations.map(r => r.id) }
        },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: {
          bookings: { _count: 'desc' }
        },
        take: limit - recommendations.length
      });

      popularLocal.forEach(service => {
        recommendations.push({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toNumber(),
          duration: service.duration,
          recommendationScore: 70,
          reason: `Popular in ${service.provider.city}`,
          rating: 4.5, // Placeholder
          reviewCount: service._count.bookings,
          category: service.category!,
          provider: service.provider,
          images: service.images,
          tags: service.tags
        });
      });

      basedOn.push('Popular in your area');
    }

    // If still need more recommendations, add highly rated services
    if (recommendations.length < limit) {
      const topRated = await prisma.service.findMany({
        where: {
          isActive: true,
          id: { notIn: recommendations.map(r => r.id) }
        },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: [
          { bookings: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit - recommendations.length
      });

      topRated.forEach(service => {
        recommendations.push({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toNumber(),
          duration: service.duration,
          recommendationScore: 60,
          reason: 'Highly rated by other users',
          rating: 4.5, // Placeholder
          reviewCount: service._count.bookings,
          category: service.category!,
          provider: service.provider,
          images: service.images,
          tags: service.tags
        });
      });

      basedOn.push('Highly rated services');
    }

    // Sort by recommendation score
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return reply.send({
      data: recommendations.slice(0, limit),
      personalized: !!userId,
      basedOn,
      generatedAt: new Date().toISOString()
    });
  });
}