---
created: 2025-10-10T03:05:12Z
last_updated: 2025-10-10T03:05:12Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## Target Users

### Primary User Personas

**1. Service Customers (End Users)**
- **Profile**: Argentina residents seeking barber/beauty services
- **Age Range**: 18-45 years old
- **Tech Savvy**: Mobile-first, familiar with WhatsApp, comfortable with digital payments
- **Pain Points**:
  - Difficulty finding available appointment times
  - No-show providers or last-minute cancellations
  - Unclear pricing and service options
  - Limited payment flexibility
- **Goals**:
  - Quick and easy booking
  - Reliable service providers
  - Transparent pricing
  - Flexible payment options

**2. Service Providers (Barbers/Stylists)**
- **Profile**: Independent barbers and salon owners in Argentina
- **Business Size**: Solo practitioners to small teams (1-10 employees)
- **Pain Points**:
  - Managing bookings via WhatsApp/phone calls
  - Double-bookings and scheduling conflicts
  - Tracking payments and revenue
  - Customer no-shows
  - Limited analytics on business performance
- **Goals**:
  - Automated booking management
  - Reduced no-shows
  - Payment tracking and analytics
  - Business growth insights
  - Professional online presence

**3. Enterprise Clients (Future)**
- **Profile**: Multi-location salon chains
- **Business Size**: 10+ locations, 50+ employees
- **Needs**: Multi-tenant management, white-label branding, advanced analytics

## Core Functionality

### Booking System
- **Service Catalog**: Browse available services with pricing
- **Calendar View**: Visual availability calendar
- **Appointment Scheduling**: Select date, time, provider, and service
- **Booking Confirmation**: SMS/WhatsApp/Email notifications
- **Reminders**: Automated reminders to reduce no-shows
- **Rescheduling**: Easy modification of existing bookings
- **Cancellation**: Flexible cancellation policies

### Payment Processing
- **MercadoPago Integration**: Primary payment gateway for Argentina
- **Multiple Payment Methods**:
  - Credit/debit cards
  - Digital wallets (MercadoPago, Rapipago, PagoFacil)
  - Buy Now Pay Later (BNPL) options
- **Payment Tracking**: Transaction history for customers and providers
- **AFIP Compliance**: Automatic tax reporting for providers
- **Pricing**: Dynamic pricing with inflation adjustments (ARS)

### User Management
- **Authentication**: JWT-based secure login
- **User Profiles**: Customer and provider profiles
- **Preferences**: Service preferences, favorite providers
- **History**: Booking and payment history
- **Reviews & Ratings**: Rate services and providers

### Provider Tools
- **Dashboard**: Business analytics and insights
- **Schedule Management**: Set availability, block time slots
- **Service Configuration**: Define services, pricing, duration
- **Customer Management**: View customer history and preferences
- **Revenue Analytics**: Track earnings and payment trends
- **Performance Metrics**: Booking rates, customer retention

### Communication
- **WhatsApp Business Integration**: Primary communication channel
- **In-App Notifications**: Real-time updates via Socket.io
- **SMS Notifications**: Appointment reminders and confirmations
- **Email**: Transaction confirmations and newsletters

### AI-Powered Features
- **Smart Scheduling Assistant**: Recommend optimal appointment times
- **Predictive Analytics**: Forecast demand and busy periods
- **Intelligent Notifications**: Context-aware alerts
- **Enhanced Search**: Fuzzy search for services and providers
- **Personalized Recommendations**: Suggest services based on history

## Use Cases

### Customer Use Cases

**UC-1: Book a Haircut**
1. Browse barber services in the area
2. Select preferred barber and service
3. Choose available time slot
4. Confirm booking
5. Receive WhatsApp confirmation
6. Get reminder 24 hours before appointment
7. Check-in and complete service
8. Pay via MercadoPago
9. Rate the service

**UC-2: Reschedule Appointment**
1. View upcoming bookings
2. Select appointment to modify
3. Choose new date/time
4. Confirm reschedule
5. Receive updated confirmation

**UC-3: Find Services by Location**
1. Enter location or use GPS
2. View nearby providers
3. Filter by service type, price, rating
4. Select provider and book

### Provider Use Cases

**UC-4: Manage Weekly Schedule**
1. Log into provider dashboard
2. View weekly calendar
3. Block out personal time
4. Review upcoming bookings
5. Modify availability as needed
6. Save changes

**UC-5: Track Revenue**
1. Access analytics dashboard
2. View daily/weekly/monthly revenue
3. Download payment reports
4. Review AFIP tax summaries
5. Export data for accounting

**UC-6: Handle No-Show**
1. Mark customer as no-show
2. System sends follow-up message
3. Apply cancellation policy
4. Free up time slot for other bookings

## Argentina-Specific Requirements

### Localization
- **Language**: Spanish (es-AR) throughout the platform
- **Phone Numbers**: Format as +54 9 11 1234-5678
- **DNI Formatting**: 12.345.678 pattern for identification
- **Currency**: Peso argentino (ARS) with comma as decimal separator
- **Timezone**: America/Argentina/Buenos_Aires

### Cultural Adaptations
- **WhatsApp First**: Primary communication channel (not SMS)
- **Informal Tone**: Friendly, approachable language
- **Regional Holidays**: Respect Argentina calendar for scheduling
- **Regional Expansion**: Buenos Aires → Córdoba → Rosario → La Plata

### Payment Requirements
- **MercadoPago**: Mandatory payment gateway
- **AFIP Integration**: Tax compliance for service providers
- **Inflation Handling**: Dynamic pricing adjustments
- **CUIT/CUIL**: Tax ID validation for providers

### Legal & Compliance
- **Data Protection**: Argentina data privacy laws
- **Consumer Protection**: Cancellation rights and refund policies
- **Tax Reporting**: Automated AFIP submissions
- **Invoice Generation**: Digital invoices (facturas electrónicas)

## Vertical Replication Strategy

### Barber Services (Current)
- **Services**: Haircuts, beard trims, styling, coloring
- **Providers**: Individual barbers, barbershops, salons
- **Booking Duration**: 30-90 minutes

### Future Verticals (Template-Ready)

**Psychology/Therapy**
- **Services**: Therapy sessions, consultations
- **Providers**: Licensed psychologists
- **Booking Duration**: 45-60 minutes
- **Special Requirements**: HIPAA-like privacy, video sessions

**Medical Services**
- **Services**: General consultations, specialist visits
- **Providers**: Doctors, clinics
- **Booking Duration**: 15-45 minutes
- **Special Requirements**: Medical records, prescriptions

**Fitness & Wellness**
- **Services**: Personal training, yoga, massage
- **Providers**: Trainers, therapists
- **Booking Duration**: 30-90 minutes

**Home Services**
- **Services**: Cleaning, repairs, maintenance
- **Providers**: Service professionals
- **Booking Duration**: 1-4 hours

### Replication Efficiency
- **Target**: 85% code reuse across verticals
- **Configuration**: `/niche-configs/{vertical}.json` for customization
- **Timeline**: 2-4 weeks per vertical (vs. 6+ months from scratch)

## Success Metrics

### Customer Metrics
- **Booking Conversion Rate**: % of searches that result in bookings
- **Rebooking Rate**: % of customers who book again
- **Average Rating**: Customer satisfaction (4.5+ target)
- **Time to Book**: < 3 minutes from search to confirmation

### Provider Metrics
- **No-Show Rate**: < 10% target
- **Schedule Utilization**: % of available time slots booked
- **Revenue Growth**: Month-over-month increase
- **Customer Retention**: % of repeat customers

### Platform Metrics
- **Daily Active Users**: Customers and providers combined
- **Booking Volume**: Total appointments per day/week/month
- **Payment Success Rate**: > 98% successful transactions
- **System Uptime**: 99.9% availability target

## Competitive Advantages

1. **Argentina-First Design**: Built specifically for Argentina market needs
2. **WhatsApp Integration**: Native support for preferred communication channel
3. **MercadoPago + AFIP**: Seamless payment and tax compliance
4. **Template Replication**: Rapid expansion to new service verticals
5. **Enterprise Features**: Multi-tenant, white-label, advanced analytics
6. **AI-Powered**: Smart scheduling, predictive analytics, personalization
7. **Mobile-First**: Optimized for mobile devices and low-bandwidth
8. **PWA**: Offline capability and app-like experience
