import { FastifyInstance } from 'fastify';
import { geoLocationService, ARGENTINA_CITIES } from './geo-location';

// Argentina Localization and Timezone Service
// T7A-001: Argentina timezone and regional preference handling

export interface ArgentinaLocale {
  timeZone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  phoneFormat: string;
  addressFormat: string;
  dialCode: string;
  province: string;
  culturalPreferences: {
    workingHours: {
      start: string;
      end: string;
      lunchBreak: { start: string; end: string };
    };
    holidays: string[];
    businessDays: string[];
    siesta: boolean;
  };
}

// Argentina regional preferences by province
const ARGENTINA_REGIONAL_PREFERENCES: Record<string, ArgentinaLocale> = {
  'Ciudad Autónoma de Buenos Aires': {
    timeZone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 11 ####-####',
    addressFormat: '{street} {number}, {neighborhood}, CABA, Argentina',
    dialCode: '+54 11',
    province: 'Ciudad Autónoma de Buenos Aires',
    culturalPreferences: {
      workingHours: { start: '09:00', end: '18:00', lunchBreak: { start: '12:00', end: '13:00' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: false
    }
  },
  'Buenos Aires': {
    timeZone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 ### ###-####',
    addressFormat: '{street} {number}, {city}, Buenos Aires, Argentina',
    dialCode: '+54',
    province: 'Buenos Aires',
    culturalPreferences: {
      workingHours: { start: '08:30', end: '17:30', lunchBreak: { start: '12:00', end: '13:30' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: true
    }
  },
  'Córdoba': {
    timeZone: 'America/Argentina/Cordoba',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 351 ###-####',
    addressFormat: '{street} {number}, {neighborhood}, Córdoba, Argentina',
    dialCode: '+54 351',
    province: 'Córdoba',
    culturalPreferences: {
      workingHours: { start: '08:00', end: '17:00', lunchBreak: { start: '12:00', end: '14:00' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: true
    }
  },
  'Santa Fe': {
    timeZone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 341 ###-####',
    addressFormat: '{street} {number}, {city}, Santa Fe, Argentina',
    dialCode: '+54 341',
    province: 'Santa Fe',
    culturalPreferences: {
      workingHours: { start: '08:00', end: '17:00', lunchBreak: { start: '12:00', end: '14:00' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: true
    }
  },
  'Mendoza': {
    timeZone: 'America/Argentina/Mendoza',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 261 ###-####',
    addressFormat: '{street} {number}, {city}, Mendoza, Argentina',
    dialCode: '+54 261',
    province: 'Mendoza',
    culturalPreferences: {
      workingHours: { start: '08:00', end: '17:00', lunchBreak: { start: '12:30', end: '14:30' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: true
    }
  },
  'Tucumán': {
    timeZone: 'America/Argentina/Tucuman',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    phoneFormat: '+54 381 ###-####',
    addressFormat: '{street} {number}, {city}, Tucumán, Argentina',
    dialCode: '+54 381',
    province: 'Tucumán',
    culturalPreferences: {
      workingHours: { start: '07:30', end: '16:30', lunchBreak: { start: '12:00', end: '14:00' } },
      holidays: ['2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-07-09', '2024-08-17', '2024-10-12', '2024-11-18', '2024-12-08', '2024-12-25'],
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      siesta: true
    }
  }
};

class ArgentinaLocalizationService {
  // Get localization preferences based on location
  getLocaleByLocation(latitude: number, longitude: number): ArgentinaLocale {
    const nearestCity = geoLocationService.findNearestCity(latitude, longitude);
    return ARGENTINA_REGIONAL_PREFERENCES[nearestCity.province] || ARGENTINA_REGIONAL_PREFERENCES['Buenos Aires'];
  }

  // Get localization preferences by province
  getLocaleByProvince(province: string): ArgentinaLocale {
    return ARGENTINA_REGIONAL_PREFERENCES[province] || ARGENTINA_REGIONAL_PREFERENCES['Buenos Aires'];
  }

  // Convert UTC time to Argentina regional timezone
  convertToLocalTime(utcTime: Date, province: string): Date {
    const locale = this.getLocaleByProvince(province);
    
    // Use Intl.DateTimeFormat for accurate timezone conversion
    const localTime = new Intl.DateTimeFormat('es-AR', {
      timeZone: locale.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(utcTime);

    // Reconstruct date in local timezone
    const year = parseInt(localTime.find(part => part.type === 'year')?.value || '2024');
    const month = parseInt(localTime.find(part => part.type === 'month')?.value || '1') - 1;
    const day = parseInt(localTime.find(part => part.type === 'day')?.value || '1');
    const hour = parseInt(localTime.find(part => part.type === 'hour')?.value || '0');
    const minute = parseInt(localTime.find(part => part.type === 'minute')?.value || '0');
    const second = parseInt(localTime.find(part => part.type === 'second')?.value || '0');

    return new Date(year, month, day, hour, minute, second);
  }

  // Format date according to Argentina regional preferences
  formatDate(date: Date, province: string): string {
    const locale = this.getLocaleByProvince(province);
    
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: locale.timeZone,
      dateStyle: 'short'
    }).format(date);
  }

  // Format time according to Argentina regional preferences
  formatTime(date: Date, province: string): string {
    const locale = this.getLocaleByProvince(province);
    
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: locale.timeZone,
      timeStyle: 'short',
      hour12: false
    }).format(date);
  }

  // Format phone number according to regional format
  formatPhoneNumber(phone: string, province: string): string {
    const locale = this.getLocaleByProvince(province);
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Handle different phone number formats
    if (cleanPhone.startsWith('54')) {
      // International format
      if (province === 'Ciudad Autónoma de Buenos Aires') {
        return `+54 11 ${cleanPhone.slice(4, 8)}-${cleanPhone.slice(8)}`;
      } else {
        const areaCode = cleanPhone.slice(2, 5);
        const number = cleanPhone.slice(5);
        return `+54 ${areaCode} ${number.slice(0, 3)}-${number.slice(3)}`;
      }
    } else if (cleanPhone.startsWith('11') && province === 'Ciudad Autónoma de Buenos Aires') {
      // Buenos Aires local format
      return `+54 11 ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
    } else {
      // Local format for other provinces
      return `${locale.dialCode} ${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
    }
  }

  // Check if current time is during business hours
  isBusinessHours(province: string): boolean {
    const locale = this.getLocaleByProvince(province);
    const now = new Date();
    const localTime = this.convertToLocalTime(now, province);
    
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const startTime = this.parseTime(locale.culturalPreferences.workingHours.start);
    const endTime = this.parseTime(locale.culturalPreferences.workingHours.end);
    const lunchStart = this.parseTime(locale.culturalPreferences.workingHours.lunchBreak.start);
    const lunchEnd = this.parseTime(locale.culturalPreferences.workingHours.lunchBreak.end);
    
    // Check if it's a business day
    const dayOfWeek = localTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!locale.culturalPreferences.businessDays.includes(dayOfWeek)) {
      return false;
    }
    
    // Check if it's during working hours (excluding lunch break)
    const isWorkingHours = currentTime >= startTime && currentTime <= endTime;
    const isLunchBreak = locale.culturalPreferences.siesta && 
                        currentTime >= lunchStart && 
                        currentTime <= lunchEnd;
    
    return isWorkingHours && !isLunchBreak;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check if date is a holiday
  isHoliday(date: Date, province: string): boolean {
    const locale = this.getLocaleByProvince(province);
    const dateString = date.toISOString().split('T')[0];
    return locale.culturalPreferences.holidays.includes(dateString);
  }

  // Get next available business day
  getNextBusinessDay(province: string): Date {
    const locale = this.getLocaleByProvince(province);
    let nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (true) {
      const dayOfWeek = nextDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const isBusinessDay = locale.culturalPreferences.businessDays.includes(dayOfWeek);
      const isNotHoliday = !this.isHoliday(nextDay, province);
      
      if (isBusinessDay && isNotHoliday) {
        break;
      }
      
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  // Get optimal booking times based on regional preferences
  getOptimalBookingTimes(province: string, date: Date): string[] {
    const locale = this.getLocaleByProvince(province);
    const times: string[] = [];
    
    const startTime = this.parseTime(locale.culturalPreferences.workingHours.start);
    const endTime = this.parseTime(locale.culturalPreferences.workingHours.end);
    const lunchStart = this.parseTime(locale.culturalPreferences.workingHours.lunchBreak.start);
    const lunchEnd = this.parseTime(locale.culturalPreferences.workingHours.lunchBreak.end);
    
    // Generate 30-minute slots
    for (let time = startTime; time < endTime; time += 30) {
      // Skip lunch break if siesta is observed
      if (locale.culturalPreferences.siesta && time >= lunchStart && time < lunchEnd) {
        continue;
      }
      
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      times.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    return times;
  }

  // Get province-specific currency formatting
  formatCurrency(amount: number, province: string): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Get localized user preferences
  getLocalizedUserPreferences(latitude?: number, longitude?: number, province?: string) {
    let locale: ArgentinaLocale;
    
    if (latitude && longitude) {
      locale = this.getLocaleByLocation(latitude, longitude);
    } else if (province) {
      locale = this.getLocaleByProvince(province);
    } else {
      locale = ARGENTINA_REGIONAL_PREFERENCES['Buenos Aires']; // Default
    }
    
    return {
      locale,
      isBusinessHours: this.isBusinessHours(locale.province),
      nextBusinessDay: this.getNextBusinessDay(locale.province),
      optimalBookingTimes: this.getOptimalBookingTimes(locale.province, new Date()),
      currentTime: this.convertToLocalTime(new Date(), locale.province)
    };
  }
}

export const argentinaLocalizationService = new ArgentinaLocalizationService();

// Register localization routes
export function registerLocalizationRoutes(server: FastifyInstance) {
  // Get user localization preferences
  server.post('/api/v1/localization/preferences', {
    schema: {
      tags: ['Localization'],
      summary: 'Get localization preferences for Argentina region',
      body: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          province: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { latitude, longitude, province } = request.body as any;
      
      const preferences = argentinaLocalizationService.getLocalizedUserPreferences(
        latitude,
        longitude,
        province
      );
      
      return reply.send({
        success: true,
        data: preferences
      });
    } catch (error) {
      server.log.error('Localization preferences error:', error);
      return reply.code(500).send({
        error: 'Error retrieving localization preferences',
        message: 'Error al obtener preferencias de localización'
      });
    }
  });

  // Get optimal booking times for region
  server.get('/api/v1/localization/booking-times/:province', {
    schema: {
      tags: ['Localization'],
      summary: 'Get optimal booking times for Argentina province'
    }
  }, async (request, reply) => {
    try {
      const { province } = request.params as any;
      const { date } = request.query as any;
      
      const bookingDate = date ? new Date(date) : new Date();
      const times = argentinaLocalizationService.getOptimalBookingTimes(province, bookingDate);
      
      return reply.send({
        success: true,
        data: {
          province,
          date: bookingDate.toISOString().split('T')[0],
          availableTimes: times,
          isBusinessDay: argentinaLocalizationService.isBusinessHours(province)
        }
      });
    } catch (error) {
      server.log.error('Booking times error:', error);
      return reply.code(500).send({
        error: 'Error retrieving booking times',
        message: 'Error al obtener horarios de reserva'
      });
    }
  });

  // Format phone number for region
  server.post('/api/v1/localization/format-phone', {
    schema: {
      tags: ['Localization'],
      summary: 'Format phone number according to Argentina regional standards'
    }
  }, async (request, reply) => {
    try {
      const { phone, province } = request.body as any;
      
      const formattedPhone = argentinaLocalizationService.formatPhoneNumber(phone, province);
      
      return reply.send({
        success: true,
        data: {
          originalPhone: phone,
          formattedPhone,
          province
        }
      });
    } catch (error) {
      server.log.error('Phone formatting error:', error);
      return reply.code(500).send({
        error: 'Error formatting phone number',
        message: 'Error al formatear número de teléfono'
      });
    }
  });
}