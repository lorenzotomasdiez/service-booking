// Booking API Client for BarberPro
// Handles all booking-related API communication
import { apiClient, type ApiResponse } from './client';
import type {
  Booking,
  BookingCreateRequest,
  RecurringBookingRequest,
  GroupBookingRequest,
  BookingStateTransition,
  AvailabilityRequest,
  AvailabilityResponse,
  BookingAnalytics,
  WaitlistEntry,
  BookingModification,
  BookingListResponse,
  ProviderScheduleResponse,
  BookingSearchParams,
  Service,
  ServiceFormData,
  Provider,
  ProviderSearchParams
} from '$lib/types/booking';

class BookingApi {
  
  // =============================================================================
  // CORE BOOKING OPERATIONS
  // =============================================================================
  
  /**
   * Create a new booking with conflict detection
   */
  async createBooking(data: BookingCreateRequest): Promise<ApiResponse<Booking>> {
    return apiClient.post<ApiResponse<Booking>>('/v1/bookings/advanced/create-with-lock', data);
  }

  /**
   * Create recurring bookings
   */
  async createRecurringBooking(data: RecurringBookingRequest): Promise<ApiResponse<Booking[]>> {
    return apiClient.post<ApiResponse<Booking[]>>('/v1/bookings/advanced/recurring', data);
  }

  /**
   * Create group booking
   */
  async createGroupBooking(data: GroupBookingRequest): Promise<ApiResponse<Booking>> {
    return apiClient.post<ApiResponse<Booking>>('/v1/bookings/advanced/group', data);
  }

  /**
   * Update booking state with business rules validation
   */
  async updateBookingState(data: BookingStateTransition): Promise<ApiResponse<Booking>> {
    return apiClient.post<ApiResponse<Booking>>('/v1/bookings/advanced/state-transition', data);
  }

  /**
   * Modify existing booking
   */
  async modifyBooking(data: BookingModification): Promise<ApiResponse<Booking>> {
    return apiClient.put<ApiResponse<Booking>>(`/v1/bookings/advanced/modify`, data);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason: string): Promise<ApiResponse<Booking>> {
    return apiClient.patch<ApiResponse<Booking>>(`/v1/bookings/${bookingId}/cancel`, { reason });
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.get<ApiResponse<Booking>>(`/v1/bookings/${bookingId}`);
  }

  /**
   * Search bookings with filters
   */
  async searchBookings(params: BookingSearchParams): Promise<ApiResponse<BookingListResponse>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return apiClient.get<ApiResponse<BookingListResponse>>(`/v1/bookings?${searchParams.toString()}`);
  }

  // =============================================================================
  // AVAILABILITY & SCHEDULING
  // =============================================================================

  /**
   * Check real-time availability
   */
  async checkAvailability(data: AvailabilityRequest): Promise<ApiResponse<{ isAvailable: boolean; conflicts?: string[] }>> {
    return apiClient.post<ApiResponse<{ isAvailable: boolean; conflicts?: string[] }>>('/v1/bookings/advanced/availability/check', data);
  }

  /**
   * Get available time slots for a provider and date
   */
  async getAvailableSlots(providerId: string, date: string, serviceId?: string): Promise<ApiResponse<AvailabilityResponse>> {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    return apiClient.get<ApiResponse<AvailabilityResponse>>(`/v1/bookings/advanced/availability/${providerId}/${date}${params}`);
  }

  /**
   * Get provider schedule for a specific date
   */
  async getProviderSchedule(providerId: string, date: string): Promise<ApiResponse<ProviderScheduleResponse>> {
    return apiClient.get<ApiResponse<ProviderScheduleResponse>>(`/v1/providers/schedule/${providerId}/${date}`);
  }

  /**
   * Update provider working hours
   */
  async updateProviderSchedule(providerId: string, workingHours: any): Promise<ApiResponse<Provider>> {
    return apiClient.put<ApiResponse<Provider>>(`/v1/providers/${providerId}/schedule`, { workingHours });
  }

  // =============================================================================
  // WAITLIST MANAGEMENT
  // =============================================================================

  /**
   * Add client to waitlist
   */
  async addToWaitlist(data: Omit<WaitlistEntry, 'id' | 'createdAt'>): Promise<ApiResponse<WaitlistEntry>> {
    return apiClient.post<ApiResponse<WaitlistEntry>>('/v1/bookings/advanced/waitlist', data);
  }

  /**
   * Get waitlist entries for a provider
   */
  async getWaitlist(providerId: string): Promise<ApiResponse<WaitlistEntry[]>> {
    return apiClient.get<ApiResponse<WaitlistEntry[]>>(`/v1/bookings/advanced/waitlist/${providerId}`);
  }

  /**
   * Remove from waitlist
   */
  async removeFromWaitlist(waitlistId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/v1/bookings/advanced/waitlist/${waitlistId}`);
  }

  // =============================================================================
  // ANALYTICS & REPORTING
  // =============================================================================

  /**
   * Get booking analytics for provider
   */
  async getBookingAnalytics(providerId: string, dateFrom?: string, dateTo?: string): Promise<ApiResponse<BookingAnalytics>> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const queryString = params.toString();
    const url = `/v1/bookings/advanced/analytics/${providerId}${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ApiResponse<BookingAnalytics>>(url);
  }

  /**
   * Get client booking history
   */
  async getClientBookingHistory(clientId: string, page = 1, limit = 10): Promise<ApiResponse<BookingListResponse>> {
    return apiClient.get<ApiResponse<BookingListResponse>>(`/v1/bookings/client/${clientId}?page=${page}&limit=${limit}`);
  }

  /**
   * Get provider booking history
   */
  async getProviderBookingHistory(providerId: string, page = 1, limit = 10): Promise<ApiResponse<BookingListResponse>> {
    return apiClient.get<ApiResponse<BookingListResponse>>(`/v1/bookings/provider/${providerId}?page=${page}&limit=${limit}`);
  }

  // =============================================================================
  // SERVICE MANAGEMENT
  // =============================================================================

  /**
   * Create new service
   */
  async createService(data: ServiceFormData): Promise<ApiResponse<Service>> {
    // Handle file uploads separately if images are provided
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      data.images.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      // Add other service data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${apiClient['baseUrl']}/v1/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      return response.json();
    } else {
      return apiClient.post<ApiResponse<Service>>('/v1/services', data);
    }
  }

  /**
   * Update service
   */
  async updateService(serviceId: string, data: Partial<ServiceFormData>): Promise<ApiResponse<Service>> {
    return apiClient.put<ApiResponse<Service>>(`/v1/services/${serviceId}`, data);
  }

  /**
   * Delete service
   */
  async deleteService(serviceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/v1/services/${serviceId}`);
  }

  /**
   * Get provider services
   */
  async getProviderServices(providerId: string): Promise<ApiResponse<Service[]>> {
    return apiClient.get<ApiResponse<Service[]>>(`/v1/services/provider/${providerId}`);
  }

  /**
   * Get service by ID
   */
  async getService(serviceId: string): Promise<ApiResponse<Service>> {
    return apiClient.get<ApiResponse<Service>>(`/v1/services/${serviceId}`);
  }

  /**
   * Upload service images
   */
  async uploadServiceImages(serviceId: string, images: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    images.forEach((file, index) => {
      formData.append(`images`, file);
    });

    return apiClient.upload<ApiResponse<string[]>>(`/v1/services/${serviceId}/images`, images[0], {});
  }

  // =============================================================================
  // PROVIDER SEARCH & DISCOVERY
  // =============================================================================

  /**
   * Search providers
   */
  async searchProviders(params: ProviderSearchParams): Promise<ApiResponse<{ providers: Provider[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return apiClient.get<ApiResponse<{ providers: Provider[]; pagination: any }>>(`/v1/providers/search?${searchParams.toString()}`);
  }

  /**
   * Get provider details
   */
  async getProvider(providerId: string): Promise<ApiResponse<Provider>> {
    return apiClient.get<ApiResponse<Provider>>(`/v1/providers/${providerId}`);
  }

  /**
   * Get featured providers
   */
  async getFeaturedProviders(limit = 10): Promise<ApiResponse<Provider[]>> {
    return apiClient.get<ApiResponse<Provider[]>>(`/v1/providers/featured?limit=${limit}`);
  }

  // =============================================================================
  // REVIEWS & RATINGS
  // =============================================================================

  /**
   * Add booking review
   */
  async addBookingReview(bookingId: string, rating: number, review: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<ApiResponse<Booking>>(`/v1/bookings/${bookingId}/review`, { rating, review });
  }

  /**
   * Get provider reviews
   */
  async getProviderReviews(providerId: string, page = 1, limit = 10): Promise<ApiResponse<any>> {
    return apiClient.get<ApiResponse<any>>(`/v1/providers/${providerId}/reviews?page=${page}&limit=${limit}`);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1] || null;
  }

  /**
   * Format date for API calls
   */
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time for API calls
   */
  formatTimeForApi(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  }

  /**
   * Parse API date response
   */
  parseApiDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Calculate end time based on start time and duration
   */
  calculateEndTime(startTime: Date, durationMinutes: number): Date {
    return new Date(startTime.getTime() + durationMinutes * 60000);
  }
}

export const bookingApi = new BookingApi();