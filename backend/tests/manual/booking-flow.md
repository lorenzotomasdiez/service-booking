# Manual Testing: Comprehensive Booking Flow

## Test Environment Setup
- **Base URL**: http://localhost:3000
- **Database**: Clean test database with providers and services
- **Date**: December 10, 2024
- **Tester**: QA Engineer
- **Prerequisites**: Providers, services, and clients registered

## Test Data Setup

### Test Users
1. **Provider: Carlos** (Barbería Don Carlos)
2. **Provider: Martín** (Independent Barber)
3. **Client: Diego** (Family Man)
4. **Client: Sofía** (Professional)
5. **Client: Rodrigo** (Premium Client)

### Test Services
1. **Corte Clásico** - $1,200 ARS - 30min
2. **Corte Ejecutivo** - $1,800 ARS - 45min
3. **Servicio Premium** - $3,500 ARS - 90min
4. **Arreglo de Barba** - $800 ARS - 20min

## Test Scenarios

### 1. Basic Booking Creation (Diego Scenario)

**Objective**: Test standard booking flow for family client

**Test Data**:
```json
{
  "serviceId": "corte-clasico-id",
  "providerId": "carlos-provider-id",
  "scheduledAt": "2024-12-15T14:00:00-03:00",
  "notes": "Corte no muy corto, tengo reunión el lunes"
}
```

**Steps**:
1. Login as client (Diego)
2. Search for available services
3. Select service and provider
4. Choose available time slot
5. Add booking notes
6. Submit booking request
7. Verify booking confirmation

**Expected Results**:
- Status Code: 201 Created
- Booking ID generated
- Status: PENDING (awaiting provider confirmation)
- Argentina timezone properly handled (-03:00)
- Total price calculated correctly
- Client and provider notifications triggered

**Acceptance Criteria**:
- ✅ Booking created with PENDING status
- ✅ Argentina timezone conversion accurate
- ✅ Price calculation includes service price
- ✅ Notes stored with Spanish characters
- ✅ Notification preferences respected

### 2. Executive Booking (Sofía Scenario)

**Objective**: Test professional client booking with specific requirements

**Test Data**:
```json
{
  "serviceId": "corte-ejecutivo-id",
  "providerId": "martin-provider-id",
  "scheduledAt": "2024-12-16T12:00:00-03:00",
  "notes": "Reunión importante a las 15:00, por favor puntual",
  "notificationPreferences": {
    "whatsapp": true,
    "email": true,
    "sms": false
  }
}
```

**Steps**:
1. Login as professional client (Sofía)
2. Select executive service
3. Choose lunch time slot
4. Specify notification preferences
5. Add urgency notes
6. Confirm booking

**Expected Results**:
- Booking scheduled during lunch hours
- WhatsApp and email notifications enabled
- Professional service pricing applied
- Urgency noted in booking details

### 3. Premium Service Booking (Rodrigo Scenario)

**Objective**: Test premium client with luxury service

**Test Data**:
```json
{
  "serviceId": "servicio-premium-id",
  "providerId": "carlos-provider-id",
  "scheduledAt": "2024-12-17T10:00:00-03:00",
  "notes": "Cliente VIP - servicio completo premium",
  "specialRequests": [
    "Productos importados",
    "Ambiente relajante",
    "Música suave"
  ]
}
```

**Steps**:
1. Login as premium client (Rodrigo)
2. Select premium service (90 minutes)
3. Choose morning slot
4. Add VIP special requests
5. Confirm premium pricing

**Expected Results**:
- Premium service pricing ($3,500)
- Extended duration (90 minutes)
- Special requests captured
- VIP status noted

### 4. Booking Status Management

**Objective**: Test complete booking lifecycle

#### 4.1 Provider Confirmation (Carlos Confirming Diego's Booking)

**Steps**:
1. Login as provider (Carlos)
2. View pending bookings
3. Review booking details
4. Confirm booking
5. Verify status change to CONFIRMED
6. Check client notification sent

**Endpoint**: `PATCH /api/bookings/{bookingId}/confirm`

**Expected Results**:
- Status: PENDING → CONFIRMED
- ConfirmedAt timestamp set
- Client receives confirmation notification
- Provider calendar updated

#### 4.2 Provider Rejection

**Test Data**:
```json
{
  "reason": "No disponible en ese horario, propongo 15:00"
}
```

**Steps**:
1. Provider views booking request
2. Rejects with alternative time suggestion
3. Verify status change to REJECTED
4. Check rejection reason stored
5. Verify client notification with alternative

**Expected Results**:
- Status: PENDING → REJECTED
- Rejection reason stored
- Alternative time suggested
- Client notified of rejection

#### 4.3 Client Cancellation

**Test Data**:
```json
{
  "reason": "Cambio de planes familiares"
}
```

**Steps**:
1. Client views upcoming bookings
2. Selects booking to cancel
3. Provides cancellation reason
4. Confirms cancellation
5. Verify refund if applicable

**Expected Results**:
- Status: CONFIRMED → CANCELLED
- Cancellation reason stored
- Provider notified
- Time slot becomes available

#### 4.4 Booking Completion

**Steps**:
1. Service appointment time arrives
2. Provider marks service as completed
3. Client receives completion notification
4. Service marked as COMPLETED
5. Payment processing triggered

**Expected Results**:
- Status: CONFIRMED → COMPLETED
- CompletedAt timestamp set
- Payment processed
- Review request sent to client

### 5. Time Slot Validation

**Objective**: Test booking time restrictions and availability

#### 5.1 Double Booking Prevention

**Steps**:
1. Create confirmed booking for 14:00
2. Attempt second booking for 14:00
3. Verify rejection with conflict message
4. Test overlapping time slots

**Expected Result**: 409 Conflict - Time slot already booked

#### 5.2 Business Hours Validation

**Test Cases**:
- ✅ Booking during business hours (9:00-18:00)
- ❌ Booking outside hours (22:00)
- ❌ Booking on closed days (Sunday)
- ⚠️ Booking during siesta (14:00-16:00) - Provider specific

**Steps**:
1. Attempt booking outside business hours
2. Verify rejection with business hours message
3. Test weekend availability
4. Check holiday restrictions

#### 5.3 Past Date Validation

**Steps**:
1. Attempt booking for yesterday
2. Verify rejection with past date error
3. Test booking for today (edge case)
4. Confirm future dates accepted

**Expected Result**: 400 Bad Request - Cannot book in the past

### 6. Argentina-Specific Features

**Objective**: Test Argentina market-specific functionality

#### 6.1 Holiday Restrictions

**Argentina Holidays to Test**:
- Día de la Independencia (July 9)
- Día del Trabajador (May 1)
- Navidad (December 25)

**Steps**:
1. Attempt booking on national holiday
2. Verify holiday restriction message
3. Check holiday calendar integration
4. Test regional holidays

**Expected Result**: 400 Bad Request - Holiday restriction

#### 6.2 WhatsApp Notification Preferences

**Test Data**:
```json
{
  "notificationPreferences": {
    "whatsapp": true,
    "phone": "+5491123456789"
  }
}
```

**Steps**:
1. Enable WhatsApp notifications
2. Verify Argentina phone format required
3. Test notification delivery
4. Check WhatsApp Business API integration

**Requirements**:
- Phone must be Argentina format (+549...)
- WhatsApp Business API configured
- Message templates in Spanish

#### 6.3 Siesta Time Handling

**Steps**:
1. Attempt booking during siesta (14:00-16:00)
2. Check provider-specific settings
3. Verify cultural consideration
4. Test different regions (CABA vs interior)

**Expected Behavior**:
- Some providers may restrict siesta hours
- Regional variations supported
- Clear messaging about availability

### 7. Booking Modifications

**Objective**: Test booking change functionality

#### 7.1 Rescheduling

**Test Data**:
```json
{
  "scheduledAt": "2024-12-16T15:00:00-03:00",
  "reason": "Cambio de horario laboral"
}
```

**Steps**:
1. Client requests reschedule
2. Check new time availability
3. Update booking time
4. Notify provider of change
5. Verify old slot becomes available

**Restrictions**:
- Cannot reschedule within 2 hours of appointment
- New time must be available
- Provider confirmation may be required

#### 7.2 Service Change

**Steps**:
1. Client wants to upgrade service
2. Check price difference
3. Update service and price
4. Adjust appointment duration
5. Process additional payment

**Expected Results**:
- Service updated
- Price difference calculated
- Duration adjusted
- Payment processed

#### 7.3 Adding Notes

**Test Data**:
```json
{
  "additionalNotes": "Por favor traer factura para reintegro empresa"
}
```

**Steps**:
1. Client adds notes to existing booking
2. Provider receives updated information
3. Notes appear in provider dashboard
4. History of changes maintained

### 8. Payment Integration Testing

**Objective**: Test Argentina payment methods

#### 8.1 MercadoPago Integration

**Test Scenarios**:
1. Payment with MercadoPago account
2. Credit card through MercadoPago
3. Debit card payment
4. Bank transfer option

**Steps**:
1. Complete booking creation
2. Redirect to MercadoPago
3. Process test payment
4. Handle payment confirmation
5. Update booking status

#### 8.2 Cash Payment Option

**Steps**:
1. Select cash payment method
2. Booking confirmed without payment
3. Payment marked as pending
4. Provider confirms cash receipt
5. Booking marked as paid

#### 8.3 Payment Failure Handling

**Steps**:
1. Simulate payment failure
2. Verify booking remains PENDING
3. Allow payment retry
4. Test timeout scenarios
5. Handle partial payments

### 9. Mobile Responsiveness

**Objective**: Test booking flow on mobile devices

**Devices to Test**:
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad/Android)

**Key Features**:
1. Touch-friendly time selection
2. Date picker functionality
3. Form validation
4. WhatsApp integration
5. Payment flow

**Steps**:
1. Complete full booking flow on mobile
2. Test touch interactions
3. Verify responsive design
4. Check loading performance
5. Test offline behavior

### 10. Real-time Features

**Objective**: Test live updates and notifications

#### 10.1 Live Availability Updates

**Steps**:
1. Open booking page in two browsers
2. Book time slot in first browser
3. Verify immediate unavailability in second
4. Test WebSocket connections
5. Check real-time calendar updates

#### 10.2 Instant Notifications

**Test Scenarios**:
1. Booking confirmation notifications
2. Status change alerts
3. Reminder notifications
4. Cancellation notices

**Channels to Test**:
- WhatsApp messages
- Email notifications
- SMS alerts
- In-app notifications

### 11. Stress Testing

**Objective**: Test booking system under load

**Scenarios**:
1. Multiple concurrent bookings
2. High-frequency booking attempts
3. Large number of time slot queries
4. Payment processing under load

**Performance Metrics**:
- Booking creation: < 1 second
- Availability check: < 500ms
- Payment processing: < 10 seconds
- Notification delivery: < 30 seconds

## Test Execution Results Template

```
Booking Flow Testing Results
Date: [Date]
Tester: [Name]
Environment: [Test/Staging]

Test Summary:
- Total Booking Scenarios: [Number]
- Passed: [Number]
- Failed: [Number]
- Critical Issues: [Number]

Booking Creation Tests:
✅ Basic booking flow
✅ Professional booking
❌ Premium booking (Payment issue)
✅ Time slot validation

Status Management Tests:
✅ Provider confirmation
✅ Provider rejection
⚠️ Client cancellation (Performance slow)
✅ Service completion

Argentina-Specific Tests:
✅ Holiday restrictions
❌ WhatsApp integration (API error)
✅ Siesta time handling
✅ Spanish language support

Payment Integration Tests:
⚠️ MercadoPago integration (Sandbox issues)
✅ Cash payment option
❌ Payment failure handling (Error states)

Mobile Responsiveness:
✅ iPhone Safari
✅ Android Chrome
⚠️ Tablet view (Layout issues)

Performance Results:
- Booking creation: 847ms (❌ > 1 second)
- Availability check: 234ms (✅ < 500ms)
- Payment processing: 3.2s (✅ < 10 seconds)

Critical Issues Found:
1. Premium booking payment timeout
2. WhatsApp API authentication failure
3. Mobile layout breaks on tablets
4. Booking creation performance degradation

Recommendations:
1. Optimize database queries for booking creation
2. Fix WhatsApp Business API integration
3. Responsive design improvements for tablets
4. Add loading states for payment processing
```

## Common Issues to Monitor

1. **Timezone Issues**
   - Argentina timezone not applied
   - Daylight saving time handling
   - UTC conversion errors

2. **Payment Integration**
   - MercadoPago sandbox issues
   - Payment state synchronization
   - Failed payment recovery

3. **Real-time Updates**
   - WebSocket connection drops
   - Stale availability data
   - Notification delivery failures

4. **Mobile Experience**
   - Touch targets too small
   - Form validation on mobile
   - Payment flow on small screens

5. **Performance Issues**
   - Slow booking creation
   - Database timeout under load
   - Large result set handling