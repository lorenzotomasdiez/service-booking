# BarberPro - User Acceptance Testing Scenarios (Argentina Market)

**Document Version**: 1.0  
**Created**: September 10, 2025  
**Product Owner**: Claude  
**Target Market**: Argentina  
**Language**: Spanish (es-AR)

## Overview

This document contains comprehensive User Acceptance Testing (UAT) scenarios specifically designed for the BarberPro platform in the Argentina market. All scenarios include Argentina-specific validations, Spanish language requirements, and cultural considerations.

## Test Environment Setup

### Required Test Data
- **Valid Argentina DNI**: 12.345.678
- **Valid Argentina CUIT**: 20-12345678-9
- **Valid Argentina Phone**: +54-11-1234-5678
- **Test Email Domains**: @test.barberpro.com.ar
- **Argentina Timezone**: America/Argentina/Buenos_Aires
- **Currency**: ARS (Argentine Peso)

### Test Users
- **Client**: juan.perez@test.barberpro.com.ar / TestPass123
- **Provider**: maria.rodriguez@test.barberpro.com.ar / TestPass123
- **Admin**: admin@barberpro.com.ar / AdminPass123

## 🔐 Authentication Flow Testing

### UAT-001: Client Registration Flow
**Priority**: CRITICAL  
**Duration**: 10 minutes  
**Prerequisites**: Clean browser, valid test data

#### Test Steps:
1. **Navigate to Registration**
   - Go to https://app.barberpro.com.ar/registro
   - Verify page loads in Spanish
   - Confirm Argentina-specific elements visible

2. **Fill Registration Form**
   - Name: "Juan Carlos Pérez"
   - Email: "juan.perez@test.barberpro.com.ar"
   - Password: "TestPass123"
   - Confirm Password: "TestPass123"
   - Phone: "+54-11-1234-5678"
   - DNI: "12.345.678"
   - Birth Date: "1990-05-15"
   - Role: "CLIENT"

3. **Validate Form Behavior**
   - Test DNI format validation
   - Test phone format validation
   - Test email format validation
   - Test password strength validation

4. **Submit Registration**
   - Click "Registrarse" button
   - Verify loading state in Spanish
   - Confirm success message appears

#### Expected Results:
- ✅ Form displays in Spanish (es-AR)
- ✅ Argentina validations work correctly
- ✅ Registration completes successfully
- ✅ Welcome email sent (Spanish)
- ✅ User redirected to CLIENT dashboard
- ✅ Profile shows correct Argentina data

#### Pass Criteria:
- All validations work properly
- Spanish language throughout
- Argentina-specific features functional
- No errors in console
- Database record created correctly

---

### UAT-002: Provider Registration Flow
**Priority**: CRITICAL  
**Duration**: 15 minutes  
**Prerequisites**: Clean browser, valid provider data

#### Test Steps:
1. **Navigate to Provider Registration**
   - Go to https://app.barberpro.com.ar/registro/profesional
   - Verify professional registration form
   - Confirm additional provider fields visible

2. **Fill Provider Form**
   - Business Name: "Barbería El Corte Perfecto"
   - Professional Name: "María Elena Rodríguez"
   - Email: "maria.rodriguez@test.barberpro.com.ar"
   - Password: "ProviderPass123"
   - Phone: "+54-11-5678-1234"
   - DNI: "23.456.789"
   - CUIT: "27-23456789-4"
   - Business Address: "Av. Corrientes 1234, CABA"
   - Specialty: "Barbero Profesional"
   - Experience: "5 años"

3. **Upload Documents**
   - Professional License
   - Business Registration
   - AFIP Certificate

4. **Set Business Information**
   - Working Hours: 9:00 - 18:00
   - Working Days: Monday to Saturday
   - Services: Corte, Barba, Combo

#### Expected Results:
- ✅ Provider-specific form displays
- ✅ CUIT validation works
- ✅ File uploads successful
- ✅ Business hours configuration saved
- ✅ Account created with PENDING status
- ✅ Admin notification sent for approval

---

### UAT-003: Login Flow Testing
**Priority**: CRITICAL  
**Duration**: 5 minutes  
**Prerequisites**: Valid user accounts created

#### Test Steps:
1. **Client Login**
   - Email: "juan.perez@test.barberpro.com.ar"
   - Password: "TestPass123"
   - Remember me: checked

2. **Provider Login**
   - Email: "maria.rodriguez@test.barberpro.com.ar"
   - Password: "ProviderPass123"
   - Remember me: unchecked

3. **Admin Login**
   - Email: "admin@barberpro.com.ar"
   - Password: "AdminPass123"

#### Expected Results:
- ✅ Correct role-based redirects
- ✅ JWT tokens generated properly
- ✅ Remember me functionality works
- ✅ Dashboard access appropriate to role
- ✅ Spanish interface maintained

---

## 👤 Profile Management Testing

### UAT-004: Client Profile Completion
**Priority**: HIGH  
**Duration**: 10 minutes  
**Prerequisites**: Logged in as CLIENT

#### Test Steps:
1. **Access Profile Settings**
   - Navigate to "Mi Perfil"
   - Verify all profile sections visible
   - Confirm editing capabilities

2. **Update Personal Information**
   - Upload profile photo
   - Update phone number: "+54-11-9876-5432"
   - Add birth date: "1985-12-25"
   - Update DNI: "34.567.890"

3. **Set Preferences**
   - Timezone: America/Argentina/Buenos_Aires
   - Language: es-AR
   - Notification preferences
   - Privacy settings

4. **Save Changes**
   - Click "Guardar Cambios"
   - Verify success message
   - Confirm updates persist

#### Expected Results:
- ✅ Profile photo uploads correctly
- ✅ Argentina validations apply
- ✅ Changes save successfully
- ✅ Profile completeness increases
- ✅ Timeline shows Argentina timezone

---

### UAT-005: Provider Profile Setup
**Priority**: HIGH  
**Duration**: 20 minutes  
**Prerequisites**: Logged in as approved PROVIDER

#### Test Steps:
1. **Complete Business Profile**
   - Business description in Spanish
   - Service portfolio with photos
   - Professional certifications
   - Working hours configuration

2. **Set Service Offerings**
   - Corte Clásico: $800 ARS, 30 minutes
   - Afeitado Tradicional: $600 ARS, 20 minutes
   - Arreglo de Barba: $400 ARS, 15 minutes
   - Combo Completo: $1200 ARS, 60 minutes

3. **Configure Availability**
   - Monday-Friday: 9:00-18:00
   - Saturday: 9:00-15:00
   - Sunday: Closed
   - Holiday calendar: Argentina holidays

4. **Payment Setup**
   - MercadoPago account connection
   - Tax information (AFIP)
   - Pricing in Argentine Pesos

#### Expected Results:
- ✅ Business profile complete
- ✅ Services properly configured
- ✅ Availability correctly set
- ✅ Payment integration working
- ✅ Prices display in ARS

---

## 📅 Service Management Testing

### UAT-006: Service Creation and Management
**Priority**: HIGH  
**Duration**: 15 minutes  
**Prerequisites**: Logged in as PROVIDER

#### Test Steps:
1. **Create New Service**
   - Service Name: "Corte Moderno"
   - Description: "Corte actualizado con técnicas modernas"
   - Duration: 45 minutes
   - Price: $1000 ARS
   - Category: "Corte de Cabello"

2. **Set Service Details**
   - Required tools and equipment
   - Preparation instructions
   - Aftercare recommendations
   - Photo gallery

3. **Configure Booking Rules**
   - Advance booking: 2 hours minimum
   - Cancellation: 24 hours notice
   - Buffer time: 15 minutes between services
   - Maximum daily bookings: 8

#### Expected Results:
- ✅ Service created successfully
- ✅ Pricing in Argentine Pesos
- ✅ Booking rules applied
- ✅ Service visible to clients
- ✅ Photos uploaded correctly

---

### UAT-007: Availability Management
**Priority**: HIGH  
**Duration**: 10 minutes  
**Prerequisites**: Provider with services configured

#### Test Steps:
1. **Set Regular Schedule**
   - Monday-Friday: 9:00-18:00
   - Break times: 13:00-14:00
   - Weekend availability: Saturday 9:00-15:00

2. **Block Specific Times**
   - Block December 25 (Christmas)
   - Block January 1 (New Year)
   - Block personal vacation days

3. **Set Special Hours**
   - Extended hours for weekends
   - Holiday surcharge rates
   - Peak hour pricing

#### Expected Results:
- ✅ Schedule saves correctly
- ✅ Blocked times unavailable for booking
- ✅ Argentina holidays recognized
- ✅ Special pricing applied
- ✅ Calendar displays properly

---

## 💳 Payment Integration Testing

### UAT-008: MercadoPago Payment Flow
**Priority**: CRITICAL  
**Duration**: 15 minutes  
**Prerequisites**: Valid MercadoPago sandbox setup

#### Test Steps:
1. **Select Service and Book**
   - Choose "Corte Clásico" service
   - Select available time slot
   - Confirm booking details

2. **Payment Process**
   - Select MercadoPago as payment method
   - Use test card: 4509 9535 6623 3704
   - CVV: 123, Expiry: 11/25
   - Name: APRO

3. **Complete Transaction**
   - Enter payment details
   - Confirm payment authorization
   - Verify transaction completion

4. **Verify Results**
   - Check booking confirmation
   - Verify payment receipt
   - Confirm provider notification

#### Expected Results:
- ✅ MercadoPago integration works
- ✅ Test payment processes successfully
- ✅ Booking confirmed automatically
- ✅ Receipt generated in Spanish
- ✅ Notifications sent to both parties

---

### UAT-009: Refund and Cancellation
**Priority**: HIGH  
**Duration**: 10 minutes  
**Prerequisites**: Confirmed booking with payment

#### Test Steps:
1. **Client-Initiated Cancellation**
   - Access "Mis Citas" section
   - Select booking to cancel
   - Choose cancellation reason
   - Confirm within policy timeframe

2. **Refund Processing**
   - Verify refund amount calculation
   - Check refund method (original payment)
   - Confirm refund timeline notification

3. **Provider Notification**
   - Verify provider receives cancellation notice
   - Check calendar availability updates
   - Confirm compensation if applicable

#### Expected Results:
- ✅ Cancellation processes correctly
- ✅ Refund calculated properly
- ✅ Notifications sent in Spanish
- ✅ Calendar updates automatically
- ✅ Policy rules enforced

---

## 📱 Mobile and Cross-Browser Testing

### UAT-010: Mobile PWA Functionality
**Priority**: HIGH  
**Duration**: 15 minutes  
**Prerequisites**: Mobile device with modern browser

#### Test Steps:
1. **PWA Installation**
   - Visit site on mobile browser
   - Accept "Add to Home Screen" prompt
   - Open app from home screen
   - Verify app-like behavior

2. **Mobile Registration**
   - Complete registration form on mobile
   - Test touch interactions
   - Verify responsive form layout
   - Test camera integration for photos

3. **Mobile Booking Flow**
   - Browse services on mobile
   - Select service and time
   - Complete payment on mobile
   - Verify confirmation process

#### Expected Results:
- ✅ PWA installs correctly
- ✅ Mobile layout responsive
- ✅ Touch interactions smooth
- ✅ Camera integration works
- ✅ Payment flow mobile-optimized

---

### UAT-011: Cross-Browser Compatibility
**Priority**: MEDIUM  
**Duration**: 20 minutes  
**Prerequisites**: Access to multiple browsers

#### Test Steps:
1. **Chrome Testing**
   - Complete registration flow
   - Test payment integration
   - Verify all features work

2. **Firefox Testing**
   - Login and navigation
   - Profile management
   - Service booking

3. **Safari Testing (iOS)**
   - Mobile browser functionality
   - PWA installation
   - Payment processing

4. **Edge Testing**
   - Basic functionality verification
   - Form submissions
   - Real-time features

#### Expected Results:
- ✅ Consistent behavior across browsers
- ✅ No JavaScript errors
- ✅ Forms submit correctly
- ✅ Payments process properly
- ✅ Responsive design maintained

---

## 🎨 UI/UX and Localization Testing

### UAT-012: Spanish Language Validation
**Priority**: HIGH  
**Duration**: 15 minutes  
**Prerequisites**: Complete application access

#### Test Steps:
1. **Interface Language Check**
   - Navigate through all main sections
   - Verify buttons, labels, and menus in Spanish
   - Check form validation messages
   - Verify error messages in Spanish

2. **Content Accuracy**
   - Review service descriptions
   - Check help and support content
   - Verify email templates
   - Validate SMS messages

3. **Cultural Appropriateness**
   - Argentina-specific terminology
   - Local business practices
   - Currency displays (ARS)
   - Date/time formatting

#### Expected Results:
- ✅ All text displays in Spanish
- ✅ Argentina-specific terms used
- ✅ Currency properly formatted
- ✅ Cultural context appropriate
- ✅ No English text visible

---

### UAT-013: Argentina Business Logic
**Priority**: HIGH  
**Duration**: 10 minutes  
**Prerequisites**: Provider and client accounts

#### Test Steps:
1. **Business Hours Validation**
   - Test Argentina standard business hours
   - Verify holiday calendar integration
   - Check timezone handling
   - Validate working day logic

2. **Payment and Tax Logic**
   - Verify AFIP integration readiness
   - Check tax calculations
   - Validate invoice generation
   - Test receipt formatting

3. **Communication Preferences**
   - WhatsApp Business integration ready
   - SMS format for Argentina (+54)
   - Email template localization
   - Notification timing preferences

#### Expected Results:
- ✅ Business hours respect Argentina norms
- ✅ Holiday calendar accurate
- ✅ Tax logic compliant
- ✅ Communication properly formatted
- ✅ Cultural preferences considered

---

## 🔒 Security and Performance Testing

### UAT-014: Security Validation
**Priority**: CRITICAL  
**Duration**: 15 minutes  
**Prerequisites**: Admin and user accounts

#### Test Steps:
1. **Authentication Security**
   - Test password requirements
   - Verify JWT token expiration
   - Check session management
   - Test logout functionality

2. **Data Protection**
   - Verify DNI/CUIT encryption
   - Check payment data handling
   - Test personal information access
   - Validate GDPR compliance

3. **Role-Based Access**
   - Test CLIENT role restrictions
   - Verify PROVIDER permissions
   - Check ADMIN capabilities
   - Validate cross-role access prevention

#### Expected Results:
- ✅ Strong authentication implemented
- ✅ Sensitive data encrypted
- ✅ Role permissions enforced
- ✅ No unauthorized access possible
- ✅ Security headers present

---

### UAT-015: Performance Validation
**Priority**: MEDIUM  
**Duration**: 10 minutes  
**Prerequisites**: Stable internet connection

#### Test Steps:
1. **Page Load Times**
   - Measure homepage load time
   - Test dashboard loading speed
   - Check image loading performance
   - Verify API response times

2. **Argentina Infrastructure**
   - Test from Buenos Aires location
   - Verify CDN performance
   - Check database response times
   - Validate payment processing speed

3. **Mobile Performance**
   - Test on 4G connection
   - Verify offline capabilities
   - Check resource optimization
   - Validate caching behavior

#### Expected Results:
- ✅ Pages load under 3 seconds
- ✅ Argentina response times optimal
- ✅ Mobile performance acceptable
- ✅ Offline functionality works
- ✅ Caching improves performance

---

## 📊 Success Criteria and Validation

### Overall Pass Criteria
- **Functionality**: All core features work correctly
- **Localization**: Complete Spanish language support
- **Argentina Compliance**: All Argentina-specific requirements met
- **Performance**: Acceptable load times and responsiveness
- **Security**: No critical security vulnerabilities
- **User Experience**: Intuitive and culturally appropriate

### Metrics to Track
- **Registration Completion Rate**: >90%
- **Payment Success Rate**: >95%
- **Mobile Usability Score**: >8/10
- **Page Load Time**: <3 seconds in Argentina
- **Error Rate**: <1% for critical flows
- **User Satisfaction**: >4/5 rating

### Critical Blockers
- BUG-001: Registration API validation (IMMEDIATE FIX REQUIRED)
- Payment integration failures
- Security vulnerabilities
- Performance issues in Argentina
- Spanish localization errors

---

## 🔄 Test Execution Tracking

### Test Status Template
```
UAT-XXX: [Test Name]
Status: [PASS/FAIL/BLOCKED/PENDING]
Executed By: [Tester Name]
Date: [Execution Date]
Duration: [Actual Duration]
Notes: [Key findings]
Blockers: [Any blocking issues]
```

### Reporting Template
- **Total Tests**: 15 scenarios
- **Passed**: [Number]
- **Failed**: [Number]
- **Blocked**: [Number]
- **Coverage**: [Percentage]
- **Critical Issues**: [List]
- **Recommendations**: [Next steps]

---

**Document Owner**: Product Owner (Claude)  
**Review Schedule**: Daily during UAT execution  
**Update Frequency**: After each test iteration  
**Approval Required**: QA Lead, Product Owner, Tech Lead