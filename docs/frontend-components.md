# BarberPro Frontend Components Documentation

## Overview
This document provides a comprehensive overview of all 121+ Svelte components available in the BarberPro service booking platform frontend. The components are organized into a modular, mobile-first architecture optimized for the Argentina market.

## Component Architecture
- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Localization**: Argentina-specific formatting (phones, currency, DNI)
- **Accessibility**: ARIA-compliant with focus management
- **Performance**: Lazy loading and code splitting support

---

## Core Components
*Location: `/frontend/src/lib/components/`*

### Button.svelte
**Purpose**: Versatile button component with multiple variants and states
**Props**:
- `variant`: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean (shows spinner)
- `type`: 'button' | 'submit' | 'reset'
- `href`: string (renders as anchor)
- `target`: string
- `fullWidth`: boolean
- `className`: string

**Features**:
- Animated loading state with spinner
- Hover effects with scale transforms
- Touch-optimized for mobile
- Supports both button and anchor modes

### Input.svelte
**Purpose**: Form input with Argentina-specific formatting support
**Props**:
- `type`: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
- `format`: 'none' | 'phone' | 'dni' | 'currency'
- `label`, `placeholder`, `error`, `success`, `hint`: string
- Standard HTML input attributes
- `className`, `inputClassName`: string

**Features**:
- Argentina phone formatting: +54 9 11 1234-5678
- DNI formatting: 12.345.678
- Currency formatting with decimal support
- Visual feedback for error/success states
- Accessibility compliant with proper labeling

### Modal.svelte
**Purpose**: Accessible modal dialog with focus management
**Props**:
- `open`: boolean
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closable`, `closeOnEscape`, `closeOnBackdrop`: boolean
- `title`: string
- Various className props for customization

**Features**:
- Focus trapping and restoration
- Scroll lock with scrollbar compensation
- Backdrop blur effect
- Scale-in animation
- Keyboard navigation support

### Card.svelte
**Purpose**: Flexible card container for content display
**Props**:
- `variant`: 'default' | 'elevated' | 'outlined' | 'interactive'
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `rounded`: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- `shadow`: 'none' | 'sm' | 'md' | 'lg'
- `hover`, `clickable`: boolean
- Provider-specific props: `imageUrl`, `title`, `rating`, `price`, etc.

### Loading.svelte
**Purpose**: Loading states and skeleton screens
**Props**:
- `variant`: 'spinner' | 'skeleton' | 'pulse' | 'dots'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'neutral' | 'white'

### Other Core Components
- **ImageUpload.svelte**: File upload with preview and validation
- **ProgressIndicator.svelte**: Progress bars and step indicators
- **OnboardingFlow.svelte**: Multi-step onboarding process
- **SkeletonLoader.svelte**: Skeleton loading states
- **ErrorBoundary.svelte**: Error handling and display

---

## Booking Components
*Location: `/frontend/src/lib/components/booking/`*

### BookingCalendar.svelte
**Purpose**: Interactive calendar for appointment scheduling
**Features**:
- Argentina date/time formatting (es-AR locale)
- Real-time availability updates via WebSocket
- Conflict detection and alternative suggestions
- Mobile-optimized touch interactions

### BookingForm.svelte
**Purpose**: Complete booking form with validation
**Features**:
- Multi-step form flow
- Argentina-specific field validation
- Payment integration ready
- Real-time price calculation

### ServiceSelector.svelte
**Purpose**: Service selection with filtering and search
**Features**:
- Category-based filtering
- Price range selection
- Duration-based filtering
- Visual service previews

### Other Booking Components
- **BookingConfirmation.svelte**: Booking confirmation display
- **BookingFlow.svelte**: Complete booking workflow
- **AdvancedFilters.svelte**: Advanced search and filtering
- **WaitlistManager.svelte**: Waitlist functionality
- **GroupBookingInterface.svelte**: Group booking management
- **AdvancedBookingManager.svelte**: Provider booking management

---

## Provider Components
*Location: `/frontend/src/lib/components/provider/`*

### ServiceManager.svelte
**Purpose**: Service creation and management for providers
**Features**:
- CRUD operations for services
- Image upload and management
- Category management
- Pricing and duration settings

### AnalyticsDashboard.svelte
**Purpose**: Provider analytics and insights
**Features**:
- Revenue tracking
- Booking analytics
- Customer insights
- Performance metrics

### Other Provider Components
- **PromotionManager.svelte**: Promotion and discount management
- **AdvancedAnalyticsDashboard.svelte**: Enhanced analytics
- **InteractiveAnalyticsDashboard.svelte**: Interactive charts
- **PremiumProviderDashboard.svelte**: Premium tier features
- **AdvancedCalendarView.svelte**: Advanced calendar management
- **MultiLocationInterface.svelte**: Multi-location management
- **SubscriptionManager.svelte**: Subscription management
- **CRMInterface.svelte**: Customer relationship management
- **PremiumOnboarding.svelte**: Premium onboarding flow

---

## AI & Intelligence Components
*Location: `/frontend/src/lib/components/ai/` & `/frontend/src/lib/components/intelligence/`*

### AI Components
- **AIEnhancedSearch.svelte**: AI-powered search functionality
- **AIEnhancedUX.svelte**: AI-driven user experience optimization
- **SmartSchedulingAssistant.svelte**: AI scheduling recommendations
- **IntelligentNotificationCenter.svelte**: Smart notifications
- **PredictiveAnalyticsDashboard.svelte**: Predictive analytics

### Intelligence Components
- **CustomerEngagementAutomation.svelte**: Automated customer engagement
- **PersonalizedDashboard.svelte**: Personalized user experience
- **SmartRecommendationEngine.svelte**: Recommendation system
- **IntelligentSearchInterface.svelte**: Enhanced search interface

---

## Argentina-Specific Components
*Location: `/frontend/src/lib/components/argentina/`*

### PesoPaymentOptimizer.svelte
**Purpose**: Argentina peso payment optimization
**Features**:
- Currency conversion handling
- Inflation adjustment calculations
- Local payment method integration

### WhatsAppBusinessIntegration.svelte
**Purpose**: WhatsApp Business API integration
**Features**:
- Direct WhatsApp communication
- Appointment confirmations via WhatsApp
- Customer support integration

### EnhancedLocationServices.svelte
**Purpose**: Argentina-specific location services
**Features**:
- Argentina address validation
- Local transportation integration
- Neighborhood-based search

### CulturalEngagementOptimizer.svelte
**Purpose**: Cultural adaptation for Argentina market
**Features**:
- Local holiday integration
- Cultural preference handling
- Regional customization

---

## Search Components
*Location: `/frontend/src/lib/components/search/`*

- **AdvancedSearch.svelte**: Advanced search functionality
- **AdvancedSearchSystem.svelte**: Complete search system
- **IntelligentSearch.svelte**: Smart search with AI
- **EnhancedIntelligentSearch.svelte**: Enhanced intelligent search

---

## UX & Optimization Components
*Location: `/frontend/src/lib/components/ux/` & `/frontend/src/lib/components/optimization/`*

### UX Components
- **LoadingStates.svelte**: Advanced loading states
- **ProgressiveForm.svelte**: Progressive form enhancement
- **MicroInteractions.svelte**: Micro-interactions and animations
- **DataDrivenOptimizer.svelte**: Data-driven UX optimization
- **AdvancedUserOnboarding.svelte**: Enhanced onboarding experience
- **UserGuidance.svelte**: User guidance and tooltips
- **MarketLaunchExperience.svelte**: Market launch UX
- **CustomerSuccessExperience.svelte**: Customer success optimization
- **BusinessIntelligenceExperience.svelte**: BI experience optimization

### Optimization Components
- **ConversionOptimizer.svelte**: Conversion rate optimization
- **MobileBookingOptimizer.svelte**: Mobile booking optimization

---

## Mobile & Performance Components
*Location: `/frontend/src/lib/components/mobile/` & `/frontend/src/lib/components/performance/`*

### Mobile Components
- **AdvancedMobileGestures.svelte**: Advanced mobile gesture support

### Performance Components
- **LazyImage.svelte**: Lazy-loaded image component
- **CodeSplitLoader.svelte**: Code splitting and lazy loading

---

## Enterprise & Premium Components
*Location: `/frontend/src/lib/components/enterprise/` & `/frontend/src/lib/components/premium/`*

### Enterprise Components
- **EnterpriseManagementDashboard.svelte**: Enterprise management interface
- **EnterpriseDesignSystem.svelte**: Enterprise design system
- **WhiteLabelCustomizer.svelte**: White-label customization

### Premium Components
- **PremiumExperienceOptimizer.svelte**: Premium user experience optimization

---

## Communication & Social Components
*Location: `/frontend/src/lib/components/communication/` & `/frontend/src/lib/components/social/`*

### Communication Components
- **RealTimeChat.svelte**: Real-time chat functionality

### Social Components
- **SocialFeatures.svelte**: Social media integration
- **SocialFeaturesOptimizer.svelte**: Social features optimization

---

## Specialized Components

### Payment Components
*Location: `/frontend/src/lib/components/payments/`*
- **AdvancedPaymentFeatures.svelte**: Advanced payment functionality

### Psychology Components
*Location: `/frontend/src/lib/components/psychology/`*
- **PrivacyFocusedInterface.svelte**: Privacy-focused UI
- **TherapistProviderProfile.svelte**: Therapist-specific profiles

### Analytics Components
*Location: `/frontend/src/lib/components/analytics/`*
- **FrontendAnalyticsDashboard.svelte**: Frontend analytics
- **BusinessOperationsDashboard.svelte**: Business operations analytics
- **CustomerHealthWidget.svelte**: Customer health metrics

### Monitoring Components
*Location: `/frontend/src/lib/components/monitoring/`*
- **LiveMonitoringDashboard.svelte**: Live system monitoring
- **UXMonitoringDashboard.svelte**: UX monitoring and analytics
- **ErrorBoundary.svelte**: Error monitoring and handling
- **SoftLaunchDashboard.svelte**: Soft launch monitoring

### Notification Components
*Location: `/frontend/src/lib/components/notifications/`*
- **NotificationCenter.svelte**: Basic notification center
- **EnhancedNotificationCenter.svelte**: Enhanced notifications

### Onboarding Components
*Location: `/frontend/src/lib/components/onboarding/`*
- **OnboardingAnalytics.svelte**: Onboarding analytics
- **ProviderOnboardingFlow.svelte**: Provider onboarding
- **CustomerSupportInterface.svelte**: Customer support integration

### Form Components
*Location: `/frontend/src/lib/components/forms/`*
- **SmartAutoCompleteForm.svelte**: Smart auto-complete functionality

### Design System Components
*Location: `/frontend/src/lib/components/design/`*
- **AdvancedDesignSystem.svelte**: Advanced design system

### Template Components
*Location: `/frontend/src/lib/components/template/`*
- **TemplateVisualSystem.svelte**: Template visualization system

### Workflow Components
*Location: `/frontend/src/lib/components/workflow/`*
- **AdvancedWorkflowSystem.svelte**: Advanced workflow management

### Profile Components
*Location: `/frontend/src/lib/components/profile/`*
- **AdvancedProfileCustomization.svelte**: Advanced profile customization

### Feedback Components
*Location: `/frontend/src/lib/components/feedback/`*
- **ArgentinaFeedbackCollector.svelte**: Argentina-specific feedback collection
- **CustomerFeedbackInterface.svelte**: Customer feedback interface

---

## Component Usage Guidelines

### Import Pattern
```typescript
import { Button, Input, Modal } from '$lib/components';
// or
import Button from '$lib/components/Button.svelte';
```

### Design System
All components follow the BarberPro design system with:
- Consistent color palette (primary, secondary, success, error, neutral)
- Standard spacing and typography scales
- Mobile-first responsive design
- Argentina cultural considerations

### Accessibility
- All interactive components support keyboard navigation
- Proper ARIA labels and roles
- Screen reader compatibility
- High contrast support

### Performance
- Components are optimized for mobile devices
- Lazy loading where appropriate
- Minimal bundle impact
- Code splitting support

---

## Component Statistics
- **Total Components**: 121+
- **Component Categories**: 29
- **Core Components**: 8
- **Booking Components**: 8
- **Provider Components**: 9
- **Specialized Categories**: 20+

This comprehensive component library provides everything needed to build a full-featured, Argentina-optimized service booking platform with enterprise-grade capabilities.