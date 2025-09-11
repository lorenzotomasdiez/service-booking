// Booking Store for BarberPro
// Manages booking state, availability, and real-time updates
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { bookingApi } from '$lib/api/booking';
import { socketService, availabilityUpdates, bookingUpdates } from '$lib/services/socket';
import type {
  Booking,
  BookingCreateRequest,
  Service,
  Provider,
  TimeSlot,
  AvailabilityResponse,
  BookingStatus,
  BookingFormData,
  BookingAnalytics
} from '$lib/types/booking';

// =============================================================================
// BOOKING STATE INTERFACES
// =============================================================================

interface BookingState {
  // Current booking flow
  currentBooking: Partial<BookingCreateRequest> | null;
  selectedProvider: Provider | null;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedTimeSlot: TimeSlot | null;
  
  // Availability data
  availableSlots: TimeSlot[];
  availability: AvailabilityResponse | null;
  
  // User bookings
  userBookings: Booking[];
  providerBookings: Booking[];
  
  // UI state
  isLoading: boolean;
  isCreatingBooking: boolean;
  error: string | null;
  
  // Real-time updates
  lastAvailabilityUpdate: Date | null;
  conflictDetected: boolean;
  conflictMessage: string | null;
  suggestedSlots: TimeSlot[];
}

interface ProviderState {
  services: Service[];
  analytics: BookingAnalytics | null;
  schedule: any | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialBookingState: BookingState = {
  currentBooking: null,
  selectedProvider: null,
  selectedService: null,
  selectedDate: null,
  selectedTimeSlot: null,
  availableSlots: [],
  availability: null,
  userBookings: [],
  providerBookings: [],
  isLoading: false,
  isCreatingBooking: false,
  error: null,
  lastAvailabilityUpdate: null,
  conflictDetected: false,
  conflictMessage: null,
  suggestedSlots: []
};

const initialProviderState: ProviderState = {
  services: [],
  analytics: null,
  schedule: null,
  isLoading: false,
  error: null
};

// =============================================================================
// STORE CREATION
// =============================================================================

function createBookingStore() {
  const { subscribe, set, update } = writable<BookingState>(initialBookingState);

  // =============================================================================
  // BOOKING FLOW METHODS
  // =============================================================================

  const startBookingFlow = (provider: Provider, service?: Service) => {
    update(state => ({
      ...state,
      selectedProvider: provider,
      selectedService: service || null,
      currentBooking: {
        providerId: provider.id,
        serviceId: service?.id
      },
      error: null
    }));

    // Subscribe to real-time availability updates
    if (browser) {
      socketService.subscribeToProviderAvailability(provider.id);
      socketService.joinProviderRoom(provider.id);
    }
  };

  const selectService = (service: Service) => {
    update(state => ({
      ...state,
      selectedService: service,
      currentBooking: state.currentBooking ? {
        ...state.currentBooking,
        serviceId: service.id
      } : null,
      // Reset date and time selection when service changes
      selectedDate: null,
      selectedTimeSlot: null,
      availableSlots: []
    }));
  };

  const selectDate = async (date: string) => {
    const state = get({ subscribe });
    
    if (!state.selectedProvider || !state.selectedService) {
      throw new Error('Provider y servicio deben estar seleccionados');
    }

    update(s => ({ ...s, isLoading: true, selectedDate: date, selectedTimeSlot: null }));

    try {
      const response = await bookingApi.getAvailableSlots(
        state.selectedProvider.id,
        date,
        state.selectedService.id
      );

      if (response.success) {
        update(s => ({
          ...s,
          availability: response.data,
          availableSlots: response.data.slots,
          isLoading: false,
          error: null,
          lastAvailabilityUpdate: new Date()
        }));
      }
    } catch (error: any) {
      update(s => ({
        ...s,
        isLoading: false,
        error: error.message || 'Error al cargar disponibilidad'
      }));
    }
  };

  const selectTimeSlot = (timeSlot: TimeSlot) => {
    update(state => ({
      ...state,
      selectedTimeSlot: timeSlot,
      currentBooking: state.currentBooking ? {
        ...state.currentBooking,
        startTime: timeSlot.startTime
      } : null,
      conflictDetected: false,
      conflictMessage: null
    }));
  };

  const createBooking = async (notes?: string, clientInfo?: { phone: string; email: string }) => {
    const state = get({ subscribe });
    
    if (!state.currentBooking || !state.selectedTimeSlot) {
      throw new Error('Datos de reserva incompletos');
    }

    update(s => ({ ...s, isCreatingBooking: true, error: null }));

    try {
      const bookingData: BookingCreateRequest = {
        ...state.currentBooking as BookingCreateRequest,
        startTime: state.selectedTimeSlot.startTime,
        notes,
        clientPhone: clientInfo?.phone,
        clientEmail: clientInfo?.email
      };

      // Try real-time booking first if socket is connected
      if (socketService.isConnected()) {
        const liveResult = await socketService.createLiveBooking(bookingData);
        
        if (liveResult.success && liveResult.booking) {
          update(s => ({
            ...s,
            isCreatingBooking: false,
            userBookings: [...s.userBookings, liveResult.booking!],
            currentBooking: null,
            selectedTimeSlot: null
          }));
          
          resetBookingFlow();
          return { success: true, booking: liveResult.booking };
        } else if (liveResult.conflicts) {
          update(s => ({
            ...s,
            isCreatingBooking: false,
            conflictDetected: true,
            conflictMessage: liveResult.conflicts!.join(', '),
            suggestedSlots: liveResult.suggestedSlots || []
          }));
          return { success: false, error: 'Conflicto detectado', conflicts: liveResult.conflicts };
        }
      }

      // Fallback to traditional API
      const response = await bookingApi.createBooking(bookingData);

      if (response.success) {
        update(s => ({
          ...s,
          isCreatingBooking: false,
          userBookings: [...s.userBookings, response.data],
          currentBooking: null,
          selectedTimeSlot: null
        }));
        
        resetBookingFlow();
        return { success: true, booking: response.data };
      }
    } catch (error: any) {
      update(s => ({
        ...s,
        isCreatingBooking: false,
        error: error.message || 'Error al crear la reserva'
      }));
      return { success: false, error: error.message };
    }
  };

  const resetBookingFlow = () => {
    const state = get({ subscribe });
    
    // Unsubscribe from real-time updates
    if (browser && state.selectedProvider) {
      socketService.unsubscribeFromProviderAvailability(state.selectedProvider.id);
      socketService.leaveProviderRoom(state.selectedProvider.id);
    }

    update(s => ({
      ...s,
      currentBooking: null,
      selectedProvider: null,
      selectedService: null,
      selectedDate: null,
      selectedTimeSlot: null,
      availableSlots: [],
      availability: null,
      conflictDetected: false,
      conflictMessage: null,
      suggestedSlots: []
    }));
  };

  // =============================================================================
  // BOOKING MANAGEMENT METHODS
  // =============================================================================

  const loadUserBookings = async (clientId: string, page = 1, limit = 10) => {
    update(s => ({ ...s, isLoading: true }));

    try {
      const response = await bookingApi.getClientBookingHistory(clientId, page, limit);
      
      if (response.success) {
        update(s => ({
          ...s,
          userBookings: response.data.bookings,
          isLoading: false
        }));
      }
    } catch (error: any) {
      update(s => ({
        ...s,
        isLoading: false,
        error: error.message || 'Error al cargar reservas'
      }));
    }
  };

  const cancelBooking = async (bookingId: string, reason: string) => {
    try {
      const response = await bookingApi.cancelBooking(bookingId, reason);
      
      if (response.success) {
        update(s => ({
          ...s,
          userBookings: s.userBookings.map(b => 
            b.id === bookingId ? { ...b, status: 'CANCELLED' as BookingStatus, cancelReason: reason } : b
          )
        }));
        return { success: true };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateBookingState = async (bookingId: string, newStatus: BookingStatus, reason?: string) => {
    try {
      const response = await bookingApi.updateBookingState({
        bookingId,
        newStatus,
        reason
      });
      
      if (response.success) {
        update(s => ({
          ...s,
          userBookings: s.userBookings.map(b => 
            b.id === bookingId ? { ...b, status: newStatus } : b
          ),
          providerBookings: s.providerBookings.map(b => 
            b.id === bookingId ? { ...b, status: newStatus } : b
          )
        }));
        return { success: true };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // =============================================================================
  // REAL-TIME UPDATE HANDLERS
  // =============================================================================

  const handleAvailabilityUpdate = (updateData: any) => {
    const state = get({ subscribe });
    
    // Only update if it's for the currently selected provider and date
    if (state.selectedProvider?.id === updateData.providerId && 
        state.selectedDate === updateData.date) {
      
      update(s => ({
        ...s,
        availableSlots: updateData.updatedSlots,
        lastAvailabilityUpdate: new Date()
      }));
    }
  };

  const handleBookingUpdate = (updateData: any) => {
    update(s => ({
      ...s,
      userBookings: s.userBookings.map(b => 
        b.id === updateData.booking.id ? updateData.booking : b
      ),
      providerBookings: s.providerBookings.map(b => 
        b.id === updateData.booking.id ? updateData.booking : b
      )
    }));
  };

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  const clearError = () => {
    update(s => ({ ...s, error: null }));
  };

  const clearConflict = () => {
    update(s => ({
      ...s,
      conflictDetected: false,
      conflictMessage: null,
      suggestedSlots: []
    }));
  };

  const refreshAvailability = async () => {
    const state = get({ subscribe });
    
    if (state.selectedProvider && state.selectedService && state.selectedDate) {
      await selectDate(state.selectedDate);
    }
  };

  return {
    subscribe,
    // Booking flow
    startBookingFlow,
    selectService,
    selectDate,
    selectTimeSlot,
    createBooking,
    resetBookingFlow,
    
    // Booking management
    loadUserBookings,
    cancelBooking,
    updateBookingState,
    
    // Real-time handlers
    handleAvailabilityUpdate,
    handleBookingUpdate,
    
    // Utilities
    clearError,
    clearConflict,
    refreshAvailability
  };
}

function createProviderStore() {
  const { subscribe, set, update } = writable<ProviderState>(initialProviderState);

  const loadServices = async (providerId: string) => {
    update(s => ({ ...s, isLoading: true }));

    try {
      const response = await bookingApi.getProviderServices(providerId);
      
      if (response.success) {
        update(s => ({
          ...s,
          services: response.data,
          isLoading: false
        }));
      }
    } catch (error: any) {
      update(s => ({
        ...s,
        isLoading: false,
        error: error.message || 'Error al cargar servicios'
      }));
    }
  };

  const loadAnalytics = async (providerId: string, dateFrom?: string, dateTo?: string) => {
    update(s => ({ ...s, isLoading: true }));

    try {
      const response = await bookingApi.getBookingAnalytics(providerId, dateFrom, dateTo);
      
      if (response.success) {
        update(s => ({
          ...s,
          analytics: response.data,
          isLoading: false
        }));
      }
    } catch (error: any) {
      update(s => ({
        ...s,
        isLoading: false,
        error: error.message || 'Error al cargar analíticas'
      }));
    }
  };

  const createService = async (serviceData: any) => {
    try {
      const response = await bookingApi.createService(serviceData);
      
      if (response.success) {
        update(s => ({
          ...s,
          services: [...s.services, response.data]
        }));
        return { success: true, service: response.data };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateService = async (serviceId: string, serviceData: any) => {
    try {
      const response = await bookingApi.updateService(serviceId, serviceData);
      
      if (response.success) {
        update(s => ({
          ...s,
          services: s.services.map(service => 
            service.id === serviceId ? response.data : service
          )
        }));
        return { success: true, service: response.data };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const response = await bookingApi.deleteService(serviceId);
      
      if (response.success) {
        update(s => ({
          ...s,
          services: s.services.filter(service => service.id !== serviceId)
        }));
        return { success: true };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    subscribe,
    loadServices,
    loadAnalytics,
    createService,
    updateService,
    deleteService
  };
}

// =============================================================================
// STORE INSTANCES & DERIVED STORES
// =============================================================================

export const bookingStore = createBookingStore();
export const providerStore = createProviderStore();

// Derived stores for common UI states
export const isBookingFlowActive = derived(
  bookingStore,
  $booking => $booking.selectedProvider !== null
);

export const canProceedToTimeSelection = derived(
  bookingStore,
  $booking => $booking.selectedProvider && $booking.selectedService && $booking.selectedDate
);

export const canCreateBooking = derived(
  bookingStore,
  $booking => $booking.selectedProvider && $booking.selectedService && 
              $booking.selectedDate && $booking.selectedTimeSlot
);

export const hasAvailableSlots = derived(
  bookingStore,
  $booking => $booking.availableSlots.length > 0
);

export const bookingError = derived(
  bookingStore,
  $booking => $booking.error
);

export const isLoadingAvailability = derived(
  bookingStore,
  $booking => $booking.isLoading
);

// =============================================================================
// REAL-TIME UPDATE SUBSCRIPTIONS
// =============================================================================

if (browser) {
  // Subscribe to real-time availability updates
  availabilityUpdates.subscribe((update) => {
    if (update) {
      bookingStore.handleAvailabilityUpdate(update);
    }
  });

  // Subscribe to real-time booking updates
  bookingUpdates.subscribe((update) => {
    if (update) {
      bookingStore.handleBookingUpdate(update);
    }
  });
}