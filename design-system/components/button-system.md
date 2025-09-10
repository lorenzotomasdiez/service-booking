# Button Component System

## Button Variants

### Primary Button
**Usage**: Main actions, CTA buttons, form submissions
```css
.btn-primary {
  background: #2563eb; /* primary-600 */
  color: #ffffff;
  border: 2px solid #2563eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.25;
  transition: all 0.2s ease-in-out;
}

.btn-primary:hover {
  background: #1d4ed8; /* primary-700 */
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.btn-primary:active {
  background: #1e40af; /* primary-800 */
  transform: translateY(0);
}

.btn-primary:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: #94a3b8; /* neutral-400 */
  border-color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Secondary Button
**Usage**: Secondary actions, cancel buttons, alternative options
```css
.btn-secondary {
  background: transparent;
  color: #2563eb; /* primary-600 */
  border: 2px solid #2563eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.25;
  transition: all 0.2s ease-in-out;
}

.btn-secondary:hover {
  background: #eff6ff; /* primary-50 */
  border-color: #1d4ed8; /* primary-700 */
  color: #1d4ed8;
}

.btn-secondary:active {
  background: #dbeafe; /* primary-100 */
}
```

### Ghost Button
**Usage**: Tertiary actions, menu items, subtle interactions
```css
.btn-ghost {
  background: transparent;
  color: #64748b; /* neutral-500 */
  border: 2px solid transparent;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.25;
  transition: all 0.2s ease-in-out;
}

.btn-ghost:hover {
  background: #f1f5f9; /* neutral-100 */
  color: #334155; /* neutral-700 */
}
```

### Success Button
**Usage**: Confirmation actions, booking completion, positive outcomes
```css
.btn-success {
  background: #059669; /* success-600 */
  color: #ffffff;
  border: 2px solid #059669;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.25;
}

.btn-success:hover {
  background: #047857; /* success-700 */
  border-color: #047857;
}
```

### Danger Button
**Usage**: Destructive actions, cancellations, deletions
```css
.btn-danger {
  background: #dc2626; /* error-600 */
  color: #ffffff;
  border: 2px solid #dc2626;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.25;
}

.btn-danger:hover {
  background: #b91c1c; /* error-700 */
  border-color: #b91c1c;
}
```

## Button Sizes

### Large Button (Desktop CTA)
```css
.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
  border-radius: 10px;
  min-height: 56px;
}
```

### Standard Button (Default)
```css
.btn {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  min-height: 48px;
}
```

### Small Button (Secondary actions)
```css
.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 6px;
  min-height: 40px;
}
```

### Extra Small Button (Compact spaces)
```css
.btn-xs {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  min-height: 32px;
}
```

## Button with Icons

### Icon + Text
```css
.btn-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
```

### Icon Only
```css
.btn-icon-only {
  padding: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-only svg {
  width: 24px;
  height: 24px;
}
```

## Loading States

### Loading Button
```css
.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

## Mobile Optimization

### Touch Target Size
- Minimum 44px height for mobile tap targets
- Increased padding on mobile devices
- Adequate spacing between buttons (minimum 8px)

### Mobile-Specific Styles
```css
@media (max-width: 768px) {
  .btn {
    min-height: 48px;
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 14px 24px;
  }
  
  .btn-lg {
    min-height: 56px;
    padding: 18px 32px;
    font-size: 18px;
  }
}
```

## Accessibility Features

### Focus Management
- Clear focus indicators with 2px outline
- Focus trap for modal buttons
- Skip links for keyboard navigation

### Screen Reader Support
- Descriptive button text or aria-labels
- Loading state announcements
- Disabled state communication

### Keyboard Interaction
- Enter and Space key activation
- Tab navigation support
- Escape key for modal dismissal

## Button Groups

### Horizontal Group
```css
.btn-group {
  display: flex;
  gap: 12px;
}

.btn-group-connected .btn {
  border-radius: 0;
}

.btn-group-connected .btn:first-child {
  border-radius: 8px 0 0 8px;
}

.btn-group-connected .btn:last-child {
  border-radius: 0 8px 8px 0;
}
```

### Vertical Stack (Mobile)
```css
.btn-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 640px) {
  .btn-stack .btn {
    width: 100%;
  }
}
```

## Implementation Examples

### SvelteKit Button Component
```typescript
// Button.svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' = 'primary';
  export let size: 'xs' | 'sm' | 'base' | 'lg' = 'base';
  export let disabled = false;
  export let loading = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button
  class="btn btn-{variant} btn-{size}"
  class:btn-loading={loading}
  {disabled}
  {type}
  on:click
>
  <slot />
</button>
```

### Usage Guidelines
- Use primary buttons sparingly (1 per section/modal)
- Secondary buttons for alternative actions
- Ghost buttons for tertiary actions
- Loading states for async operations
- Disabled states with proper feedback
- Consistent spacing and alignment
- Mobile-first responsive behavior