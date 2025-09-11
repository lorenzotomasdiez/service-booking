// TypeScript types for BarberPro Booking System
// Comprehensive type definitions for booking workflows

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  isActive: boolean;
  providerId: string;
  images?: string[];
  requirements?: string;
  cancellationPolicy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  profileImage?: string;
  coverImage?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  isVerified: boolean;
  workingHours: WorkingHours;
  services: Service[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string; // HH:mm format
    closeTime: string; // HH:mm format
    breaks?: Array<{
      startTime: string;
      endTime: string;
      description?: string;
    }>;
  };
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  price?: number;
  conflicts?: string[];
}

export interface BookingCreateRequest {
  providerId: string;
  serviceId: string;
  startTime: Date;
  notes?: string;
  clientPhone?: string;
  clientEmail?: string;
}

export interface RecurringBookingRequest extends BookingCreateRequest {
  recurrencePattern: RecurrencePattern;
  occurrences?: number;
  endDate?: Date;
}

export interface GroupBookingRequest {
  providerId: string;
  serviceId: string;
  startTime: Date;
  participants: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  maxParticipants: number;
  notes?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  clientPhone?: string;
  clientEmail?: string;
  cancelReason?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  provider?: Provider;
  service?: Service;
  
  // Group booking info
  isGroupBooking?: boolean;
  groupBookingId?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  
  // Recurring booking info
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  parentBookingId?: string;
  childBookings?: Booking[];
}

export interface BookingStateTransition {
  bookingId: string;
  newStatus: BookingStatus;
  reason?: string;
  notifyClient?: boolean;
}

export interface AvailabilityRequest {
  providerId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  duration?: number;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  providerWorkingHours: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  breaks: Array<{
    startTime: string;
    endTime: string;
    description?: string;
  }>;
}

export interface BookingAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  averageRating: number;
  popularServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
  }>;
  busyHours: Array<{
    hour: number;
    bookingCount: number;
  }>;
  recentBookings: Booking[];
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  preferredDate: Date;
  preferredTimeSlots: string[];
  maxWaitTime: number; // in hours
  isActive: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
}

export interface BookingModification {
  bookingId: string;
  newStartTime?: Date;
  newServiceId?: string;
  newNotes?: string;
  reason: string;
}

// Real-time Socket Events
export interface SocketBookingEvents {
  'availability:updated': {
    providerId: string;
    date: string;
    updatedSlots: TimeSlot[];
  };
  
  'booking:created': {
    booking: Booking;
    affectedSlots: TimeSlot[];
  };
  
  'booking:updated': {
    booking: Booking;
    previousStatus: BookingStatus;
  };
  
  'booking:cancelled': {
    bookingId: string;
    reason: string;
    releasedSlots: TimeSlot[];
  };
  
  'booking:conflict': {
    providerId: string;
    serviceId: string;
    requestedTime: Date;
    suggestedSlots: TimeSlot[];
    conflictReason: string;
  };
  
  'waitlist:notification': {
    waitlistEntryId: string;
    availableSlot: TimeSlot;
    expiresAt: Date;
  };
}

// Form validation schemas
export interface BookingFormData {
  serviceId: string;
  date: string;
  timeSlot: string;
  notes: string;
  clientInfo?: {
    phone: string;
    email: string;
  };
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  requirements: string;
  cancellationPolicy: string;
  images: File[];
  isActive: boolean;
}

// API Response types
export interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: BookingStatus;
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface ProviderScheduleResponse {
  providerId: string;
  date: string;
  workingHours: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
  breaks: Array<{
    startTime: string;
    endTime: string;
    description?: string;
  }>;
  bookings: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    service: {
      id: string;
      name: string;
    };
    client: {
      firstName: string;
      lastName: string;
    };
  }>;
  availableSlots: TimeSlot[];
}

// Search and filtering
export interface BookingSearchParams {
  providerId?: string;
  clientId?: string;
  status?: BookingStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  serviceId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startTime' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ProviderSearchParams {
  location?: string;
  services?: string[];
  rating?: number;
  availability?: {
    date: string;
    timeFrom?: string;
    timeTo?: string;
  };
  page?: number;
  limit?: number;
}

// Notification preferences
export interface NotificationPreferences {
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  bookingCancellation: boolean;
  bookingRescheduled: boolean;
  newReview: boolean;
  promotions: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
  };
}

// Payment integration types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  bookingId: string;
  paymentMethod: 'mercadopago' | 'transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  mercadopagoPreferenceId?: string;
}