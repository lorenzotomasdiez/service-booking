# Card Component System

## Base Card Structure

### Standard Card
**Usage**: General content containers, information display
```css
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0; /* neutral-200 */
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.card-header {
  padding: 20px 24px 0 24px;
}

.card-body {
  padding: 20px 24px;
}

.card-footer {
  padding: 0 24px 20px 24px;
  margin-top: auto;
}
```

### Elevated Card
**Usage**: Important content, featured items, modals
```css
.card-elevated {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.card-elevated:hover {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### Flat Card
**Usage**: Subtle separations, dashboard widgets
```css
.card-flat {
  box-shadow: none;
  border: 1px solid #e2e8f0; /* neutral-200 */
}

.card-flat:hover {
  border-color: #cbd5e1; /* neutral-300 */
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
}
```

## Service Provider Cards

### Provider Profile Card
**Usage**: Barber/service provider listings, search results
```css
.provider-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.provider-card:hover {
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  transform: translateY(-2px);
}

.provider-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: #f1f5f9; /* neutral-100 */
}

.provider-card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.provider-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.provider-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.provider-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin: 0;
}

.provider-info p {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
  margin: 0;
}
```

### Rating Component
```css
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  width: 16px;
  height: 16px;
  color: #fbbf24; /* yellow-400 */
}

.star-empty {
  color: #d1d5db; /* neutral-300 */
}

.rating-text {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
  margin-left: 4px;
}
```

### Service Tags
```css
.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.service-tag {
  background: #eff6ff; /* primary-50 */
  color: #2563eb; /* primary-600 */
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.service-tag-premium {
  background: #fef3c7; /* secondary-100 */
  color: #d97706; /* secondary-700 */
}
```

### Location and Distance
```css
.provider-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b; /* neutral-500 */
  font-size: 14px;
  margin-bottom: 12px;
}

.location-icon {
  width: 16px;
  height: 16px;
}

.distance-badge {
  background: #f1f5f9; /* neutral-100 */
  color: #334155; /* neutral-700 */
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
```

### Availability Status
```css
.availability-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-available .status-dot {
  background: #10b981; /* success-500 */
}

.status-busy .status-dot {
  background: #f59e0b; /* warning-500 */
}

.status-unavailable .status-dot {
  background: #ef4444; /* error-500 */
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.status-available .status-text {
  color: #059669; /* success-600 */
}

.status-busy .status-text {
  color: #d97706; /* warning-600 */
}

.status-unavailable .status-text {
  color: #dc2626; /* error-600 */
}
```

### Pricing Display
```css
.pricing-info {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0; /* neutral-200 */
}

.price-range {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
}

.price-label {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
  margin-top: 2px;
}
```

## Service Cards

### Service Detail Card
**Usage**: Individual service listings, booking selection
```css
.service-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.service-card:hover {
  border-color: #2563eb; /* primary-600 */
  background: #f8fafc; /* neutral-50 */
}

.service-card-selected {
  border-color: #2563eb; /* primary-600 */
  background: #eff6ff; /* primary-50 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #eff6ff; /* primary-50 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb; /* primary-600 */
  flex-shrink: 0;
}

.service-details {
  flex: 1;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 4px;
}

.service-description {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
  margin-bottom: 8px;
}

.service-duration {
  font-size: 12px;
  color: #64748b; /* neutral-500 */
}

.service-price {
  text-align: right;
  flex-shrink: 0;
}

.price-amount {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
}

.price-currency {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
}
```

## Booking Summary Card

### Appointment Summary
**Usage**: Booking confirmation, appointment details
```css
.booking-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.booking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.booking-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-confirmed {
  background: #d1fae5; /* success-100 */
  color: #047857; /* success-700 */
}

.status-pending {
  background: #fef3c7; /* warning-100 */
  color: #b45309; /* warning-700 */
}

.status-cancelled {
  background: #fee2e2; /* error-100 */
  color: #b91c1c; /* error-700 */
}

.booking-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 640px) {
  .booking-details {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  width: 20px;
  height: 20px;
  color: #64748b; /* neutral-500 */
  flex-shrink: 0;
}

.detail-text {
  flex: 1;
}

.detail-label {
  font-size: 12px;
  color: #64748b; /* neutral-500 */
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 16px;
  color: #1e293b; /* neutral-800 */
  font-weight: 500;
}
```

## Dashboard Cards

### Metric Card
**Usage**: Statistics, KPIs, dashboard widgets
```css
.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s ease-in-out;
}

.metric-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.metric-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.metric-icon-primary {
  background: #2563eb; /* primary-600 */
}

.metric-icon-success {
  background: #059669; /* success-600 */
}

.metric-icon-warning {
  background: #d97706; /* warning-600 */
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #64748b; /* neutral-500 */
  margin-bottom: 12px;
}

.metric-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.metric-change-positive {
  color: #059669; /* success-600 */
}

.metric-change-negative {
  color: #dc2626; /* error-600 */
}

.change-icon {
  width: 16px;
  height: 16px;
}
```

## Mobile Optimizations

### Mobile Card Layout
```css
@media (max-width: 768px) {
  .card {
    border-radius: 8px;
    margin: 0 -4px; /* Extend to screen edges */
  }
  
  .provider-card-image {
    height: 160px; /* Smaller images on mobile */
  }
  
  .provider-card-content {
    padding: 16px;
  }
  
  .service-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .service-price {
    text-align: left;
    margin-top: 12px;
  }
}
```

### Touch Optimization
```css
.card-interactive {
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(37, 99, 235, 0.1);
}

.card-interactive:active {
  transform: scale(0.98);
}
```

## Loading States

### Card Skeleton
```css
.card-skeleton {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-line {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-line-short {
  width: 60%;
}

.skeleton-line-medium {
  width: 80%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  background: #e2e8f0;
  border-radius: 50%;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: #e2e8f0;
  border-radius: 8px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## Accessibility Features

### Screen Reader Support
- Proper heading hierarchy within cards
- Descriptive alt text for images
- ARIA labels for interactive elements
- Semantic markup for card structure

### Keyboard Navigation
- Focus indicators for interactive cards
- Tab order management
- Enter/Space key activation
- Arrow key navigation for card grids

### Color Accessibility
- Sufficient color contrast ratios
- Information not conveyed by color alone
- High contrast mode support
- Focus indicators clearly visible

## Implementation Examples

### SvelteKit Provider Card Component
```typescript
// ProviderCard.svelte
<script lang="ts">
  export let provider: Provider;
  export let onClick: () => void;
</script>

<div class="provider-card" on:click={onClick} on:keydown={handleKeydown}>
  <img 
    src={provider.imageUrl} 
    alt={provider.name}
    class="provider-card-image"
  />
  <div class="provider-card-content">
    <!-- Card content -->
  </div>
</div>
```

### Usage Guidelines
- Use consistent card heights in grids
- Maintain proper spacing between cards
- Provide clear hover states for interactive cards
- Include loading states for async content
- Ensure mobile-friendly touch targets
- Use semantic HTML structure
- Include proper ARIA labels and roles