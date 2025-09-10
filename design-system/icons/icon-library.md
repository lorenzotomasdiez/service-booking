# BarberPro Icon Library

## Recommended Icon System: Heroicons v2

### Why Heroicons?
- **Consistent Design**: 24x24px base size, 1.5px stroke width
- **Two Variants**: Outline (interface) and Solid (states)
- **Excellent Performance**: Optimized SVG format
- **Accessibility**: Designed for screen readers
- **Argentina-Friendly**: Clear, universal symbols

### Installation
```bash
npm install @heroicons/react
# or
npm install heroicons
```

## Core Icon Categories

### 1. Navigation & Interface Icons

#### Primary Navigation
```typescript
// Mobile bottom navigation
export const navigationIcons = {
  home: 'HomeIcon',           // Home/Dashboard
  search: 'MagnifyingGlassIcon', // Search providers
  calendar: 'CalendarIcon',    // Appointments
  chat: 'ChatBubbleLeftIcon',  // Messages
  user: 'UserIcon',           // Profile
  
  // Secondary navigation
  menu: 'Bars3Icon',          // Hamburger menu
  close: 'XMarkIcon',         // Close/Cancel
  back: 'ChevronLeftIcon',    // Back navigation
  forward: 'ChevronRightIcon', // Forward navigation
  
  // Actions
  filter: 'AdjustmentsVerticalIcon', // Filter options
  sort: 'BarsArrowUpIcon',    // Sort options
  refresh: 'ArrowPathIcon',   // Refresh content
  settings: 'Cog6ToothIcon',  // Settings
};
```

#### Form & Input Icons
```typescript
export const formIcons = {
  // Input states
  check: 'CheckIcon',         // Success/Completed
  warning: 'ExclamationTriangleIcon', // Warning
  error: 'ExclamationCircleIcon',     // Error
  info: 'InformationCircleIcon',      // Information
  
  // Input types
  email: 'EnvelopeIcon',      // Email input
  phone: 'PhoneIcon',         // Phone input
  lock: 'LockClosedIcon',     // Password input
  eye: 'EyeIcon',            // Show password
  eyeSlash: 'EyeSlashIcon',  // Hide password
  
  // Form actions
  search: 'MagnifyingGlassIcon', // Search input
  clear: 'XMarkIcon',        // Clear input
  upload: 'CloudArrowUpIcon', // File upload
  camera: 'CameraIcon',      // Photo capture
};
```

### 2. Service & Business Icons

#### Barber Services
```typescript
export const serviceIcons = {
  // Core services (custom SVGs needed)
  scissors: 'scissors',       // Hair cutting
  razor: 'razor',            // Shaving
  comb: 'comb',             // Hair styling
  beard: 'beard',           // Beard services
  mustache: 'mustache',     // Mustache services
  
  // General service indicators
  star: 'StarIcon',          // Rating/Premium
  clock: 'ClockIcon',        // Duration/Time
  currency: 'CurrencyDollarIcon', // Pricing
  certificate: 'AcademicCapIcon', // Certification
  award: 'TrophyIcon',       // Awards/Recognition
};
```

#### Custom Barber Service SVGs
```svg
<!-- Scissors Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M8 12l4-4 8 8-4 4-8-8z"/>
  <path d="M4 4l4 4"/>
  <path d="M12 8l-4 4"/>
  <circle cx="6" cy="6" r="2"/>
  <circle cx="6" cy="18" r="2"/>
</svg>

<!-- Razor Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="8" y="2" width="8" height="6" rx="1"/>
  <path d="M12 8v14"/>
  <path d="M10 22h4"/>
</svg>

<!-- Comb Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="6" y="2" width="12" height="4" rx="1"/>
  <line x1="8" y1="6" x2="8" y2="22"/>
  <line x1="10" y1="6" x2="10" y2="18"/>
  <line x1="12" y1="6" x2="12" y2="22"/>
  <line x1="14" y1="6" x2="14" y2="18"/>
  <line x1="16" y1="6" x2="16" y2="22"/>
</svg>

<!-- Beard Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 2C8.5 2 6 4.5 6 8v4c0 2 1 4 3 5 1 0.5 2 1.5 3 1.5s2-1 3-1.5c2-1 3-3 3-5V8c0-3.5-2.5-6-6-6z"/>
  <path d="M9 14c0 1.5 1.5 3 3 3s3-1.5 3-3"/>
</svg>
```

### 3. Status & Feedback Icons

#### Booking Status
```typescript
export const statusIcons = {
  // Availability states
  available: 'CheckBadgeIcon',     // Available/Confirmed
  busy: 'ClockIcon',              // Busy/Pending
  unavailable: 'XCircleIcon',     // Unavailable/Cancelled
  
  // Booking states
  confirmed: 'CheckCircleIcon',   // Confirmed booking
  pending: 'ClockIcon',           // Pending confirmation
  cancelled: 'XCircleIcon',       // Cancelled booking
  completed: 'HandThumbUpIcon',   // Service completed
  
  // Payment states
  paid: 'CreditCardIcon',         // Payment completed
  unpaid: 'ExclamationCircleIcon', // Payment pending
  refunded: 'ArrowUturnLeftIcon', // Refunded
};
```

#### Rating & Reviews
```typescript
export const ratingIcons = {
  star: 'StarIcon',              // Rating star
  heart: 'HeartIcon',            // Favorite/Like
  thumbUp: 'HandThumbUpIcon',    // Positive feedback
  thumbDown: 'HandThumbDownIcon', // Negative feedback
  flag: 'FlagIcon',              // Report content
  share: 'ShareIcon',            // Share profile/review
};
```

### 4. Location & Communication Icons

#### Location Services
```typescript
export const locationIcons = {
  location: 'MapPinIcon',        // Location marker
  directions: 'MapIcon',         // Get directions
  distance: 'ScaleIcon',         // Distance indicator
  gps: 'GlobeAmericasIcon',      // GPS/Current location
  building: 'BuildingStorefrontIcon', // Barber shop
};
```

#### Communication
```typescript
export const communicationIcons = {
  message: 'ChatBubbleLeftIcon', // Chat message
  whatsapp: 'whatsapp',          // WhatsApp (custom)
  call: 'PhoneIcon',             // Phone call
  email: 'EnvelopeIcon',         // Email
  notification: 'BellIcon',       // Notifications
  alert: 'BellAlertIcon',        // Alert notification
};
```

#### Custom WhatsApp Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.687"/>
</svg>
```

### 5. Payment & Financial Icons

#### Payment Methods
```typescript
export const paymentIcons = {
  creditCard: 'CreditCardIcon',   // Credit card
  cash: 'BanknotesIcon',         // Cash payment
  transfer: 'ArrowsRightLeftIcon', // Bank transfer
  mercadoPago: 'mercadoPago',    // MercadoPago (custom)
  wallet: 'WalletIcon',          // Digital wallet
  
  // Financial
  receipt: 'ReceiptPercentIcon', // Receipt/Invoice
  refund: 'ArrowUturnLeftIcon',  // Refund
  discount: 'TagIcon',           // Discount/Promo
  earnings: 'CurrencyDollarIcon', // Earnings
};
```

### 6. Dashboard & Analytics Icons

#### Provider Dashboard
```typescript
export const dashboardIcons = {
  // Analytics
  chart: 'ChartBarIcon',         // Bar chart
  trend: 'ChartLineUpIcon',      // Trend line
  growth: 'TrendingUpIcon',      // Growth indicator
  decline: 'TrendingDownIcon',   // Decline indicator
  
  // Management
  calendar: 'CalendarDaysIcon',  // Calendar view
  clients: 'UsersIcon',          // Client management
  services: 'RectangleStackIcon', // Service management
  reports: 'DocumentChartBarIcon', // Reports
  
  // Actions
  add: 'PlusIcon',               // Add new
  edit: 'PencilIcon',            // Edit
  delete: 'TrashIcon',           // Delete
  duplicate: 'DocumentDuplicateIcon', // Duplicate
};
```

### 7. System & Technical Icons

#### System States
```typescript
export const systemIcons = {
  loading: 'ArrowPathIcon',      // Loading spinner
  offline: 'WifiIcon',           // Offline mode
  sync: 'ArrowPathIcon',         // Syncing
  cloud: 'CloudIcon',            // Cloud storage
  
  // Security
  verified: 'ShieldCheckIcon',   // Verified provider
  secure: 'LockClosedIcon',      // Secure connection
  privacy: 'EyeSlashIcon',       // Privacy mode
  
  // Quality
  premium: 'SparklesIcon',       // Premium service
  featured: 'StarIcon',          // Featured provider
  recommended: 'HandThumbUpIcon', // Recommended
};
```

## Icon Usage Guidelines

### Size Standards
```css
/* Icon sizes */
.icon-xs { width: 16px; height: 16px; } /* Small UI elements */
.icon-sm { width: 20px; height: 20px; } /* Buttons, inputs */
.icon-base { width: 24px; height: 24px; } /* Default size */
.icon-lg { width: 32px; height: 32px; } /* Large buttons */
.icon-xl { width: 48px; height: 48px; } /* Feature icons */
```

### Color Standards
```css
/* Icon colors */
.icon-primary { color: #2563eb; }    /* Primary actions */
.icon-success { color: #059669; }    /* Success states */
.icon-warning { color: #d97706; }    /* Warning states */
.icon-error { color: #dc2626; }      /* Error states */
.icon-neutral { color: #64748b; }    /* Default/inactive */
.icon-white { color: #ffffff; }      /* On dark backgrounds */
```

### Implementation Examples

#### React/SvelteKit Usage
```typescript
// React with Heroicons
import { StarIcon, MapPinIcon } from '@heroicons/react/24/outline';

function ProviderCard({ provider }) {
  return (
    <div className="provider-card">
      <div className="rating">
        <StarIcon className="icon-sm icon-warning" />
        <span>{provider.rating}</span>
      </div>
      <div className="location">
        <MapPinIcon className="icon-sm icon-neutral" />
        <span>{provider.distance}km</span>
      </div>
    </div>
  );
}

// Svelte with Heroicons
<script>
  import { Star, MapPin } from 'lucide-svelte';
</script>

<div class="provider-card">
  <div class="rating">
    <Star class="icon-sm icon-warning" />
    <span>{provider.rating}</span>
  </div>
  <div class="location">
    <MapPin class="icon-sm icon-neutral" />
    <span>{provider.distance}km</span>
  </div>
</div>
```

### Accessibility Requirements

#### Screen Reader Support
```html
<!-- Decorative icons -->
<Star aria-hidden="true" />

<!-- Informative icons -->
<Star aria-label="4.5 star rating" />

<!-- Interactive icons -->
<button aria-label="Add to favorites">
  <Heart aria-hidden="true" />
</button>
```

#### High Contrast Support
```css
@media (prefers-contrast: high) {
  .icon {
    stroke-width: 2px; /* Thicker strokes */
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-loading {
    animation: none;
  }
}
```

### Custom Icon Creation

#### SVG Standards
- **Viewbox**: 24x24 (consistent with Heroicons)
- **Stroke Width**: 1.5px (matches Heroicons)
- **Format**: Outline style (consistent interface)
- **Optimization**: Run through SVGO for performance
- **Naming**: kebab-case (scissors-icon.svg)

#### File Organization
```
design-system/icons/
├── heroicons/          # Standard Heroicons
├── custom/             # Custom service icons
│   ├── scissors.svg
│   ├── razor.svg
│   ├── comb.svg
│   └── beard.svg
├── logos/              # Brand logos
│   ├── barberpro-logo.svg
│   ├── mercadopago.svg
│   └── whatsapp.svg
└── exports/            # Optimized exports
    ├── sprite.svg      # Icon sprite
    └── icon-font/      # Icon font files
```

## Argentina Market Considerations

### Cultural Icon Preferences
- **Trust Indicators**: Shield, checkmark, verified badges
- **Communication**: WhatsApp integration essential
- **Payment**: MercadoPago prominence
- **Location**: Clear distance and direction indicators
- **Social Proof**: Star ratings, review counts

### Mobile Optimization
- **Touch Targets**: Minimum 44px for interactive icons
- **Visibility**: High contrast for outdoor mobile use
- **Loading**: Progressive icon loading for slow networks
- **Offline**: Cached essential icons for offline use

This icon library provides a comprehensive, scalable foundation for BarberPro's visual interface while maintaining consistency with modern web standards and Argentina market expectations.