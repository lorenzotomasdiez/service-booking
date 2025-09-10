# Modal System

## Base Modal Structure

### Standard Modal
**Usage**: Confirmations, forms, detailed views
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5); /* neutral-900 with opacity */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease-in-out;
}

.modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.modal-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  max-width: 480px;
  width: 100%;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  transform: scale(0.95) translateY(20px);
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.modal-overlay.open .modal-container {
  transform: scale(1) translateY(0);
}

.modal-header {
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e2e8f0; /* neutral-200 */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: #64748b; /* neutral-500 */
  transition: all 0.2s ease-in-out;
}

.modal-close:hover {
  background: #f1f5f9; /* neutral-100 */
  color: #1e293b; /* neutral-800 */
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 0 24px 24px 24px;
  border-top: 1px solid #e2e8f0; /* neutral-200 */
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}
```

### Full-Screen Modal (Mobile)
**Usage**: Complex forms, booking flows on mobile
```css
@media (max-width: 768px) {
  .modal-fullscreen .modal-overlay {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  
  .modal-fullscreen .modal-container {
    max-width: none;
    max-height: none;
    border-radius: 0;
    height: 100vh;
    transform: translateY(100%);
  }
  
  .modal-fullscreen.open .modal-container {
    transform: translateY(0);
  }
  
  .modal-fullscreen .modal-header {
    padding: max(24px, env(safe-area-inset-top) + 16px) 24px 16px 24px;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .modal-fullscreen .modal-footer {
    padding: 16px 24px max(24px, env(safe-area-inset-bottom) + 16px) 24px;
    background: #ffffff;
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
}
```

## Confirmation Modals

### Delete/Cancel Confirmation
**Usage**: Destructive actions, booking cancellations
```css
.confirmation-modal {
  max-width: 400px;
}

.confirmation-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.confirmation-danger .confirmation-icon {
  background: #fee2e2; /* error-100 */
  color: #dc2626; /* error-600 */
}

.confirmation-warning .confirmation-icon {
  background: #fef3c7; /* warning-100 */
  color: #d97706; /* warning-600 */
}

.confirmation-success .confirmation-icon {
  background: #d1fae5; /* success-100 */
  color: #059669; /* success-600 */
}

.confirmation-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 8px;
}

.confirmation-message {
  text-align: center;
  color: #64748b; /* neutral-500 */
  line-height: 1.5;
  margin-bottom: 24px;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 640px) {
  .confirmation-actions {
    flex-direction: column;
  }
}
```

## Booking Modal

### Service Selection Modal
**Usage**: Booking flow, service details
```css
.booking-modal {
  max-width: 600px;
}

.service-header {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.service-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 4px;
}

.service-provider {
  color: #64748b; /* neutral-500 */
  font-size: 14px;
  margin-bottom: 8px;
}

.service-price {
  font-size: 20px;
  font-weight: 700;
  color: #2563eb; /* primary-600 */
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.time-slot {
  padding: 12px 8px;
  border: 1px solid #e2e8f0; /* neutral-200 */
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: #ffffff;
}

.time-slot:hover:not(:disabled) {
  border-color: #2563eb; /* primary-600 */
  background: #f8fafc; /* neutral-50 */
}

.time-slot.selected {
  background: #2563eb; /* primary-600 */
  border-color: #2563eb;
  color: #ffffff;
}

.time-slot:disabled {
  background: #f1f5f9; /* neutral-100 */
  color: #94a3b8; /* neutral-400 */
  cursor: not-allowed;
}

.booking-summary {
  background: #f8fafc; /* neutral-50 */
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0; /* neutral-200 */
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-weight: 600;
}

.summary-label {
  color: #64748b; /* neutral-500 */
}

.summary-value {
  color: #1e293b; /* neutral-800 */
  font-weight: 500;
}
```

## Image Viewer Modal

### Gallery Modal
**Usage**: Portfolio viewing, before/after photos
```css
.image-modal {
  max-width: 90vw;
  max-height: 90vh;
}

.image-modal .modal-container {
  background: #000000;
  border-radius: 8px;
}

.image-modal .modal-header {
  background: rgba(0, 0, 0, 0.8);
  border-bottom: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.image-modal .modal-title {
  color: #ffffff;
}

.image-modal .modal-close {
  color: #ffffff;
}

.image-modal .modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.image-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}

.image-nav:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-nav-prev {
  left: 16px;
}

.image-nav-next {
  right: 16px;
}

.image-counter {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
}

.image-thumbnails {
  display: flex;
  gap: 8px;
  padding: 16px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.8);
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease-in-out;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.thumbnail:hover,
.thumbnail.active {
  opacity: 1;
  border-color: #2563eb; /* primary-600 */
}
```

## Filter Modal

### Advanced Filters
**Usage**: Search refinement, provider filtering
```css
.filter-modal {
  max-width: 500px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.price-range-slider {
  margin: 16px 0;
}

.price-range-values {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #64748b; /* neutral-500 */
  font-size: 14px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  background: #eff6ff; /* primary-50 */
  color: #2563eb; /* primary-600 */
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.filter-tag:hover {
  background: #dbeafe; /* primary-100 */
}

.filter-tag.selected {
  background: #2563eb; /* primary-600 */
  color: #ffffff;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0; /* neutral-200 */
}

.filter-clear {
  color: #64748b; /* neutral-500 */
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.filter-clear:hover {
  color: #2563eb; /* primary-600 */
}
```

## Loading Modal

### Processing Modal
**Usage**: Payment processing, booking confirmation
```css
.loading-modal {
  max-width: 300px;
  text-align: center;
}

.loading-modal .modal-container {
  padding: 40px 24px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0; /* neutral-200 */
  border-top: 4px solid #2563eb; /* primary-600 */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b; /* neutral-800 */
  margin-bottom: 8px;
}

.loading-message {
  color: #64748b; /* neutral-500 */
  font-size: 14px;
}

.loading-steps {
  margin-top: 20px;
  text-align: left;
}

.loading-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
}

.step-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-completed .step-icon {
  background: #10b981; /* success-500 */
  color: #ffffff;
}

.step-active .step-icon {
  background: #2563eb; /* primary-600 */
  color: #ffffff;
}

.step-pending .step-icon {
  background: #e2e8f0; /* neutral-200 */
  color: #64748b; /* neutral-500 */
}
```

## Mobile Optimizations

### Touch Interactions
```css
.modal-container {
  -webkit-tap-highlight-color: transparent;
}

/* Swipe to dismiss gesture area */
.modal-swipe-area {
  width: 100%;
  height: 4px;
  background: #cbd5e1; /* neutral-300 */
  border-radius: 2px;
  margin: 12px auto 20px;
  cursor: grab;
}

.modal-swipe-area:active {
  cursor: grabbing;
}

/* Mobile-specific close button */
@media (max-width: 640px) {
  .modal-mobile-close {
    position: fixed;
    top: max(16px, env(safe-area-inset-top));
    right: 16px;
    width: 44px;
    height: 44px;
    background: rgba(0, 0, 0, 0.5);
    color: #ffffff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 110;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

## Accessibility Features

### Focus Management
```css
.modal-overlay[aria-hidden="false"] {
  /* Focus trap implementation */
}

.modal-close:focus,
.modal-action:focus {
  outline: 2px solid #2563eb; /* primary-600 */
  outline-offset: 2px;
}
```

### Screen Reader Support
```html
<!-- Modal accessibility attributes -->
<div
  class="modal-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div class="modal-container">
    <h2 id="modal-title">Modal Title</h2>
    <p id="modal-description">Modal description</p>
  </div>
</div>
```

### Keyboard Navigation
- Escape key to close modal
- Tab navigation within modal content
- Focus return to trigger element on close
- Focus trap while modal is open

## Implementation Examples

### SvelteKit Modal Component
```typescript
// Modal.svelte
<script lang="ts">
  export let open = false;
  export let title: string;
  export let size: 'sm' | 'md' | 'lg' | 'fullscreen' = 'md';
  export let onClose: () => void;
  
  let modalElement: HTMLElement;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
  
  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<div
  class="modal-overlay"
  class:open
  class:modal-{size}
  on:click={handleOverlayClick}
  on:keydown={handleKeydown}
  bind:this={modalElement}
>
  <div class="modal-container">
    <div class="modal-header">
      <h2 class="modal-title">{title}</h2>
      <button class="modal-close" on:click={onClose}>
        <CloseIcon />
      </button>
    </div>
    <div class="modal-body">
      <slot />
    </div>
    <div class="modal-footer">
      <slot name="footer" />
    </div>
  </div>
</div>
```

### Usage Guidelines
- Use modals sparingly, prefer inline editing when possible
- Ensure proper focus management and accessibility
- Provide clear close mechanisms (X button, escape key, overlay click)
- Use appropriate modal size for content
- Include loading states for async operations
- Mobile-friendly touch interactions
- Proper keyboard navigation support
- Clear visual hierarchy within modal content