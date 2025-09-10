# Form Elements System

## Input Fields

### Text Input
**Usage**: Basic text entry, names, emails, search
```css
.input-text {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 8px;
  font-size: 16px; /* Prevents iOS zoom */
  font-family: 'Inter', system-ui, sans-serif;
  background: #ffffff;
  color: #1e293b; /* neutral-800 */
  transition: all 0.2s ease-in-out;
}

.input-text:focus {
  outline: none;
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-text:hover:not(:disabled) {
  border-color: #cbd5e1; /* neutral-300 */
}

.input-text:disabled {
  background: #f1f5f9; /* neutral-100 */
  color: #64748b; /* neutral-500 */
  cursor: not-allowed;
  opacity: 0.6;
}

.input-text::placeholder {
  color: #94a3b8; /* neutral-400 */
}
```

### Input with Icon
```css
.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon {
  padding-left: 48px; /* Space for icon */
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #64748b; /* neutral-500 */
  pointer-events: none;
}

.input-group:focus-within .input-icon {
  color: #2563eb; /* primary-600 */
}
```

### Search Input
```css
.input-search {
  padding-left: 48px;
  padding-right: 48px;
  background-image: url("data:image/svg+xml;charset=utf-8,...");
  background-repeat: no-repeat;
  background-position: 16px center;
  background-size: 20px 20px;
}

.search-clear {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}
```

## Input States

### Default State
- Neutral border color
- Clear typography
- Appropriate padding and spacing

### Focus State
```css
.input-focus {
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Error State
```css
.input-error {
  border-color: #dc2626; /* error-600 */
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### Success State
```css
.input-success {
  border-color: #059669; /* success-600 */
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.success-message {
  color: #059669;
  font-size: 14px;
  margin-top: 4px;
}
```

## Textarea

### Standard Textarea
```css
.textarea {
  width: 100%;
  min-height: 96px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 8px;
  font-size: 16px;
  font-family: 'Inter', system-ui, sans-serif;
  resize: vertical;
  transition: all 0.2s ease-in-out;
}

.textarea:focus {
  outline: none;
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

## Select Dropdown

### Custom Select
```css
.select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select {
  width: 100%;
  padding: 12px 48px 12px 16px; /* Space for chevron */
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 8px;
  font-size: 16px;
  background: #ffffff;
  cursor: pointer;
  appearance: none; /* Remove native styling */
}

.select-chevron {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #64748b; /* neutral-500 */
  pointer-events: none;
}

.select:focus {
  outline: none;
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Multi-Select Tags
```css
.multiselect {
  min-height: 48px;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.multiselect-tag {
  background: #eff6ff; /* primary-50 */
  color: #2563eb; /* primary-600 */
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}
```

## Checkbox and Radio

### Checkbox
```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 4px;
  background: #ffffff;
  position: relative;
  cursor: pointer;
  appearance: none;
}

.checkbox:checked {
  background: #2563eb; /* primary-600 */
  border-color: #2563eb;
}

.checkbox:checked::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 6px;
  width: 4px;
  height: 8px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.checkbox-label {
  font-size: 16px;
  color: #1e293b; /* neutral-800 */
  cursor: pointer;
}
```

### Radio Button
```css
.radio-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.radio {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 50%;
  background: #ffffff;
  position: relative;
  cursor: pointer;
  appearance: none;
}

.radio:checked {
  border-color: #2563eb; /* primary-600 */
}

.radio:checked::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb; /* primary-600 */
}

.radio:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Radio Group
```css
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-group-horizontal {
  flex-direction: row;
  gap: 24px;
}

@media (max-width: 640px) {
  .radio-group-horizontal {
    flex-direction: column;
    gap: 12px;
  }
}
```

## Toggle Switch

### Switch Component
```css
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #cbd5e1; /* neutral-300 */
  transition: 0.2s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-input:checked + .switch-slider {
  background: #2563eb; /* primary-600 */
}

.switch-input:checked + .switch-slider:before {
  transform: translateX(24px);
}

.switch-input:focus + .switch-slider {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

## Form Layout

### Form Group
```css
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1e293b; /* neutral-800 */
  font-size: 16px;
}

.form-help {
  margin-top: 4px;
  font-size: 14px;
  color: #64748b; /* neutral-500 */
}

.form-required::after {
  content: " *";
  color: #dc2626; /* error-600 */
}
```

### Two-Column Layout
```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

## File Upload

### File Input Styling
```css
.file-upload {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: #ffffff;
  border: 2px dashed #cbd5e1; /* neutral-300 */
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.file-upload:hover {
  border-color: #2563eb; /* primary-600 */
  background: #f8fafc; /* neutral-50 */
}

.file-upload-input {
  position: absolute;
  left: -9999px;
}

.file-upload-text {
  color: #64748b; /* neutral-500 */
  font-size: 16px;
}

.file-upload-button {
  margin-top: 12px;
}
```

### Drag and Drop
```css
.file-drop-active {
  border-color: #2563eb; /* primary-600 */
  background: #eff6ff; /* primary-50 */
}

.file-drop-rejected {
  border-color: #dc2626; /* error-600 */
  background: #fef2f2; /* error-50 */
}
```

## Mobile Optimizations

### Touch Targets
- Minimum 44px height for all interactive elements
- Adequate spacing between form elements (minimum 16px)
- Larger touch areas for checkboxes and radio buttons

### iOS Specific
```css
/* Prevent zoom on input focus */
input[type="text"],
input[type="email"],
input[type="tel"],
input[type="password"],
textarea,
select {
  font-size: 16px;
}

/* Remove iOS default styling */
input[type="text"],
input[type="email"],
input[type="tel"],
input[type="password"],
textarea {
  -webkit-appearance: none;
  -webkit-border-radius: 0;
}
```

## Accessibility Features

### Screen Reader Support
- Proper label association
- Error message announcement
- Required field indication
- Fieldset and legend for groups

### Keyboard Navigation
- Tab order management
- Enter key submission
- Arrow key navigation for radio groups
- Escape key for cancellation

### Error Handling
- Inline validation messages
- Form-level error summary
- Clear error descriptions
- Success confirmations

## Validation Patterns

### Real-time Validation
```javascript
// Example validation states
const validationStates = {
  pristine: 'neutral',
  valid: 'success',
  invalid: 'error',
  validating: 'loading'
};
```

### Argentina-Specific Validation
- Phone number format: +54 9 11 1234-5678
- CUIT/CUIL validation for business registration
- Postal code format validation
- Province/region selection