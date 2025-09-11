# BarberPro Accessibility Guidelines
*Premium Argentina Barber Booking Platform - WCAG 2.1 AA Compliance*

## Accessibility Overview
**Standard:** WCAG 2.1 AA Compliance  
**Target:** Inclusive design for all users in Argentina  
**Priority:** Critical - Legal requirement and premium brand commitment  
**Testing:** Automated + Manual + User testing with disabilities  

---

## 1. Visual Design Accessibility

### **Color Contrast Standards**
```scss
// Minimum contrast ratios
.wcag-aa-normal {
  // Normal text (under 18px): 4.5:1 minimum
  color: #1e293b; // Against white background (8.24:1)
  background: #ffffff;
}

.wcag-aa-large {
  // Large text (18px+ or 14px+ bold): 3:1 minimum
  color: #374151; // Against white background (6.14:1)
  background: #ffffff;
}

.wcag-aa-interactive {
  // Interactive elements: 3:1 minimum
  color: #2563eb; // Primary brand (4.54:1)
  border-color: #2563eb;
  
  &:focus {
    outline: 3px solid #93c5fd; // High contrast focus indicator
    outline-offset: 2px;
  }
}

// Error states - high contrast
.error-state {
  color: #dc2626; // (5.73:1 against white)
  border-color: #dc2626;
  background: #fef2f2; // (19.9:1 with error text)
}

// Success states
.success-state {
  color: #166534; // (7.95:1 against white)
  border-color: #166534;
  background: #f0fdf4; // (18.2:1 with success text)
}

// Warning states
.warning-state {
  color: #92400e; // (5.12:1 against white)
  border-color: #d97706;
  background: #fffbeb; // (16.8:1 with warning text)
}
```

### **High Contrast Mode Support**
```scss
@media (prefers-contrast: high) {
  .service-card {
    border: 2px solid #000000;
    background: #ffffff;
    
    .service-title {
      color: #000000;
      font-weight: 700;
    }
    
    .service-price {
      color: #000000;
      background: #ffffff;
      border: 1px solid #000000;
    }
    
    &:focus {
      outline: 4px solid #000000;
      outline-offset: 2px;
    }
  }
  
  .primary-button {
    background: #000000;
    color: #ffffff;
    border: 2px solid #000000;
    
    &:hover {
      background: #ffffff;
      color: #000000;
    }
  }
  
  .form-input {
    border: 2px solid #000000;
    background: #ffffff;
    color: #000000;
    
    &:focus {
      outline: 3px solid #000000;
      outline-offset: 1px;
    }
  }
}
```

### **Reduced Motion Support**
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .booking-success {
    .success-animation {
      animation: none;
      transform: scale(1);
    }
    
    .checkmark {
      animation: none;
      opacity: 1;
    }
  }
  
  .loading-spinner {
    .spinner {
      animation: none;
      border: 3px solid #e2e8f0;
      border-top: 3px solid #2563eb;
    }
    
    &::after {
      content: 'Cargando...';
      display: block;
      text-align: center;
      margin-top: 0.5rem;
      color: #64748b;
    }
  }
}
```

---

## 2. Keyboard Navigation

### **Tab Order & Focus Management**
```html
<!-- Service Discovery - Logical tab order -->
<main>
  <!-- 1. Skip to content link -->
  <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
  
  <!-- 2. Search functionality -->
  <div role="search" aria-label="Buscar servicios de barbería">
    <input 
      type="search" 
      id="service-search"
      aria-label="Buscar por nombre de barbería, servicio o ubicación"
      placeholder="Buscar barbería o servicio..."
      tabindex="1"
    />
    <button type="submit" aria-label="Buscar servicios" tabindex="2">
      <span aria-hidden="true">🔍</span>
    </button>
  </div>
  
  <!-- 3. Filters -->
  <div class="filters" role="group" aria-label="Filtros de búsqueda">
    <button tabindex="3" aria-pressed="false" aria-describedby="filter-cerca-desc">
      Cerca de mí
    </button>
    <div id="filter-cerca-desc" class="sr-only">
      Mostrar solo servicios a menos de 5km de tu ubicación actual
    </div>
  </div>
  
  <!-- 4. Results -->
  <div id="main-content" class="search-results">
    <h2>Resultados de búsqueda</h2>
    <!-- Service cards with proper tab order -->
  </div>
</main>
```

### **Focus Indicators**
```scss
.focus-visible {
  // Modern focus management
  &:focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  // Fallback for older browsers
  &:focus {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  
  // Remove focus for mouse users
  &:focus:not(:focus-visible) {
    outline: none;
  }
}

// Custom focus styles for different components
.service-card {
  @extend .focus-visible;
  
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
  }
}

.form-input {
  @extend .focus-visible;
  
  &:focus-visible {
    outline-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

.primary-button {
  @extend .focus-visible;
  
  &:focus-visible {
    outline-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.5);
  }
}
```

### **Keyboard Shortcuts**
```javascript
// Global keyboard shortcuts
const keyboardShortcuts = {
  // Navigation
  'Alt + H': () => navigateToHome(),
  'Alt + S': () => focusSearchInput(),
  'Alt + B': () => openBookingModal(),
  'Alt + P': () => openProviderProfile(),
  
  // Modal management
  'Escape': () => closeActiveModal(),
  'Tab': (e) => trapFocusInModal(e),
  'Shift + Tab': (e) => trapFocusInModal(e, true),
  
  // Calendar navigation
  'ArrowLeft': () => navigateCalendar('previous'),
  'ArrowRight': () => navigateCalendar('next'),
  'ArrowUp': () => navigateCalendar('up'),
  'ArrowDown': () => navigateCalendar('down'),
  'Enter': () => selectCalendarDate(),
  'Space': () => selectCalendarDate(),
  
  // Time slot selection
  'ArrowLeft': () => navigateTimeSlots('previous'),
  'ArrowRight': () => navigateTimeSlots('next'),
  
  // Provider dashboard
  'Ctrl + N': () => createNewService(),
  'Ctrl + S': () => saveCurrentForm(),
  'Ctrl + D': () => toggleDashboardView()
};
```

---

## 3. Screen Reader Support

### **Semantic HTML Structure**
```html
<!-- Proper heading hierarchy -->
<h1>BarberPro - Reserva tu turno</h1>
  <h2>Búsqueda de servicios</h2>
    <h3>Filtros disponibles</h3>
  <h2>Resultados encontrados</h2>
    <h3>Barbería Los Amigos</h3>
      <h4>Servicios disponibles</h4>

<!-- Landmark roles -->
<header role="banner">
  <nav role="navigation" aria-label="Navegación principal">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main" aria-label="Contenido principal">
  <section aria-labelledby="search-heading">
    <h2 id="search-heading">Buscar servicios</h2>
    <!-- Search content -->
  </section>
  
  <section aria-labelledby="results-heading">
    <h2 id="results-heading">Resultados de búsqueda</h2>
    <div role="region" aria-live="polite" aria-label="Resultados de búsqueda">
      <!-- Dynamic results -->
    </div>
  </section>
</main>

<aside role="complementary" aria-label="Filtros y opciones">
  <!-- Sidebar content -->
</aside>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

### **ARIA Labels and Descriptions**
```html
<!-- Service cards with rich descriptions -->
<article 
  role="button" 
  tabindex="0"
  aria-labelledby="service-title-1" 
  aria-describedby="service-details-1"
  onclick="selectService(1)"
  onkeypress="handleServiceKeyPress(event, 1)"
>
  <img 
    src="barberia-amigos.jpg" 
    alt="Interior de Barbería Los Amigos mostrando sillones de barbero vintage y ambiente acogedor"
    aria-describedby="service-details-1"
  />
  
  <h3 id="service-title-1">Corte clásico masculino</h3>
  
  <div id="service-details-1">
    <p>
      <span aria-label="Proveedor">Barbería Los Amigos</span> - 
      <span aria-label="Calificación">4.8 de 5 estrellas, basado en 127 reseñas</span> - 
      <span aria-label="Precio">desde 1.500 pesos argentinos</span> - 
      <span aria-label="Distancia">2.3 kilómetros de tu ubicación</span> - 
      <span aria-label="Disponibilidad">Disponible hoy</span>
    </p>
  </div>
  
  <div class="service-actions" role="group" aria-label="Acciones del servicio">
    <button aria-label="Reservar turno para Corte clásico masculino en Barbería Los Amigos">
      Reservar
    </button>
    <button aria-label="Ver más detalles de Barbería Los Amigos">
      Ver detalles
    </button>
  </div>
</article>

<!-- Booking form with comprehensive labels -->
<form role="form" aria-labelledby="booking-form-title">
  <h2 id="booking-form-title">Formulario de reserva</h2>
  
  <fieldset>
    <legend>Información personal</legend>
    
    <div class="field-group">
      <label for="client-name">
        Nombre completo
        <span aria-label="requerido" class="required">*</span>
      </label>
      <input 
        type="text" 
        id="client-name"
        name="clientName"
        required
        aria-describedby="name-help name-error"
        aria-invalid="false"
      />
      <div id="name-help" class="field-help">
        Ingresa tu nombre y apellido como aparece en tu documento
      </div>
      <div id="name-error" class="field-error" aria-live="polite">
        <!-- Error message appears here -->
      </div>
    </div>
    
    <div class="field-group">
      <label for="client-phone">
        Número de teléfono
        <span aria-label="requerido" class="required">*</span>
      </label>
      <input 
        type="tel" 
        id="client-phone"
        name="clientPhone"
        required
        aria-describedby="phone-help phone-error"
        placeholder="11 1234 5678"
        pattern="[0-9\s\-\+\(\)]+"
      />
      <div id="phone-help" class="field-help">
        Incluye código de área. Ejemplo: 11 1234 5678
      </div>
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Selección de fecha y hora</legend>
    
    <div role="group" aria-labelledby="date-selection">
      <h3 id="date-selection">Selecciona una fecha</h3>
      <div 
        role="grid" 
        aria-label="Calendario para selección de fecha"
        aria-describedby="calendar-help"
      >
        <!-- Calendar grid -->
      </div>
      <div id="calendar-help" class="sr-only">
        Usa las teclas de flecha para navegar por el calendario. 
        Presiona Enter o Espacio para seleccionar una fecha.
      </div>
    </div>
  </fieldset>
</form>
```

### **Live Regions for Dynamic Content**
```html
<!-- Search results announcements -->
<div 
  aria-live="polite" 
  aria-atomic="false"
  id="search-status"
  class="sr-only"
>
  <!-- Announced when search completes -->
</div>

<!-- Booking progress announcements -->
<div 
  aria-live="assertive" 
  aria-atomic="true"
  id="booking-status"
  class="sr-only"
>
  <!-- Critical booking updates -->
</div>

<!-- Form validation messages -->
<div 
  aria-live="polite" 
  aria-atomic="false"
  id="form-messages"
  class="sr-only"
>
  <!-- Form validation feedback -->
</div>

<script>
// Announce search results
function announceSearchResults(count, query) {
  const statusElement = document.getElementById('search-status');
  statusElement.textContent = `Se encontraron ${count} resultados para "${query}"`;
}

// Announce booking progress
function announceBookingStep(step, total) {
  const statusElement = document.getElementById('booking-status');
  statusElement.textContent = `Paso ${step} de ${total} completado`;
}

// Announce form errors
function announceFormError(fieldName, errorMessage) {
  const statusElement = document.getElementById('form-messages');
  statusElement.textContent = `Error en ${fieldName}: ${errorMessage}`;
}
</script>
```

---

## 4. Motor Accessibility

### **Touch Target Sizing**
```scss
// Minimum 44x44px touch targets (iOS HIG & Android Guidelines)
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  // Larger targets for critical actions
  &.critical {
    min-width: 56px;
    min-height: 56px;
  }
  
  // Ensure adequate spacing
  margin: 4px;
}

// Service cards - generous touch areas
.service-card {
  min-height: 120px;
  padding: 1rem;
  cursor: pointer;
  
  .service-actions {
    .action-button {
      @extend .touch-target;
      padding: 0.75rem 1.5rem;
      margin: 0.5rem 0;
    }
  }
}

// Form inputs - large enough for easy interaction
.form-input {
  min-height: 48px;
  padding: 0.75rem 1rem;
  font-size: 16px; // Prevents iOS zoom
  border-radius: 8px;
  
  // Larger checkboxes and radio buttons
  &[type="checkbox"],
  &[type="radio"] {
    width: 20px;
    height: 20px;
    margin: 12px; // Ensures 44px total target
  }
}

// Time slot selection - easy to tap
.time-slot {
  @extend .touch-target;
  min-width: 80px;
  min-height: 60px;
  margin: 0.25rem;
  
  @media (max-width: 480px) {
    min-width: 100px;
    min-height: 64px;
  }
}
```

### **Voice Control Support**
```html
<!-- Voice-accessible button labels -->
<button aria-label="Reservar turno">Reservar</button>
<button aria-label="Cancelar reserva">Cancelar</button>
<button aria-label="Confirmar pago">Pagar</button>
<button aria-label="Volver al inicio">Inicio</button>

<!-- Clear navigation labels -->
<nav aria-label="Navegación principal">
  <a href="/" aria-label="Ir a página de inicio">Inicio</a>
  <a href="/buscar" aria-label="Buscar servicios">Buscar</a>
  <a href="/mis-reservas" aria-label="Ver mis reservas">Mis reservas</a>
  <a href="/perfil" aria-label="Ir a mi perfil">Mi perfil</a>
</nav>

<!-- Form labels that work with voice commands -->
<label for="fecha-reserva">Fecha de la reserva</label>
<input type="date" id="fecha-reserva" name="fechaReserva">

<label for="hora-reserva">Hora preferida</label>
<select id="hora-reserva" name="horaReserva">
  <option value="09:00">9:00 AM</option>
  <option value="10:00">10:00 AM</option>
</select>
```

---

## 5. Cognitive Accessibility

### **Clear Content Structure**
```scss
// Consistent visual hierarchy
.content-hierarchy {
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.6;
    color: #374151;
    margin-bottom: 1rem;
    max-width: 70ch; // Optimal reading width
  }
  
  // Clear section breaks
  section + section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }
}
```

### **Error Prevention & Recovery**
```html
<!-- Form validation with clear guidance -->
<form novalidate> <!-- Custom validation for better UX -->
  <div class="field-group">
    <label for="email">Correo electrónico</label>
    <input 
      type="email" 
      id="email"
      aria-describedby="email-help email-error"
      aria-invalid="false"
    />
    <div id="email-help" class="field-help">
      Ejemplo: tu.nombre@gmail.com
    </div>
    <div id="email-error" class="field-error" aria-live="polite">
      <!-- Real-time error feedback -->
    </div>
  </div>
  
  <!-- Confirmation step -->
  <div class="confirmation-section">
    <h3>Confirma tu reserva</h3>
    <div class="booking-summary" aria-labelledby="summary-title">
      <h4 id="summary-title">Resumen de tu reserva</h4>
      <dl>
        <dt>Servicio:</dt>
        <dd id="summary-service">Corte clásico</dd>
        
        <dt>Barbería:</dt>
        <dd id="summary-provider">Los Amigos</dd>
        
        <dt>Fecha:</dt>
        <dd id="summary-date">Viernes 15 de Septiembre</dd>
        
        <dt>Hora:</dt>
        <dd id="summary-time">14:30</dd>
        
        <dt>Precio:</dt>
        <dd id="summary-price">$1.500 ARS</dd>
      </dl>
    </div>
    
    <div class="confirmation-actions">
      <button type="button" onclick="editBooking()">
        Modificar reserva
      </button>
      <button type="submit" class="primary">
        Confirmar y pagar
      </button>
    </div>
  </div>
</form>

<script>
// Gentle error handling
function validateField(field) {
  const value = field.value.trim();
  const errorElement = document.getElementById(field.id + '-error');
  
  // Clear previous errors
  field.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  
  if (field.required && !value) {
    showFieldError(field, 'Este campo es obligatorio');
    return false;
  }
  
  if (field.type === 'email' && value && !isValidEmail(value)) {
    showFieldError(field, 'Por favor ingresa un correo electrónico válido');
    return false;
  }
  
  return true;
}

function showFieldError(field, message) {
  field.setAttribute('aria-invalid', 'true');
  const errorElement = document.getElementById(field.id + '-error');
  errorElement.textContent = message;
  
  // Gentle focus (no aggressive focus stealing)
  if (!field.matches(':focus')) {
    field.focus();
  }
}
</script>
```

### **Progress Indicators**
```html
<!-- Clear booking progress -->
<div class="booking-progress" aria-label="Progreso de reserva">
  <ol class="progress-steps">
    <li class="step completed" aria-current="step">
      <span class="step-number" aria-hidden="true">1</span>
      <span class="step-title">Seleccionar servicio</span>
      <span class="step-status" aria-live="polite">Completado</span>
    </li>
    <li class="step active" aria-current="step">
      <span class="step-number" aria-hidden="true">2</span>
      <span class="step-title">Elegir fecha y hora</span>
      <span class="step-status" aria-live="polite">Actual</span>
    </li>
    <li class="step pending">
      <span class="step-number" aria-hidden="true">3</span>
      <span class="step-title">Confirmar datos</span>
      <span class="step-status">Pendiente</span>
    </li>
    <li class="step pending">
      <span class="step-number" aria-hidden="true">4</span>
      <span class="step-title">Realizar pago</span>
      <span class="step-status">Pendiente</span>
    </li>
  </ol>
</div>
```

---

## 6. Language and Localization

### **Spanish Language Considerations**
```html
<!-- Proper language declarations -->
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <title>BarberPro - Reserva tu turno de barbería online</title>
</head>

<!-- Content with proper language structure -->
<main>
  <h1>Reservá tu turno en las mejores barberías</h1>
  
  <!-- Argentina-specific terms -->
  <p>
    Encontrá la barbería perfecta cerca tuyo y reservá tu turno 
    de forma rápida y segura. Pagá con MercadoPago, transferencia 
    bancaria o efectivo.
  </p>
  
  <!-- Clear date/time formats -->
  <time datetime="2024-09-15T14:30:00-03:00">
    Viernes 15 de septiembre, 14:30 hs
  </time>
  
  <!-- Currency formatting -->
  <span class="price" aria-label="Precio: mil quinientos pesos argentinos">
    $1.500 ARS
  </span>
</main>
```

### **Form Labels in Spanish**
```html
<form>
  <fieldset>
    <legend>Datos personales</legend>
    
    <label for="nombre">Nombre</label>
    <input type="text" id="nombre" required>
    
    <label for="apellido">Apellido</label>
    <input type="text" id="apellido" required>
    
    <label for="telefono">Teléfono</label>
    <input type="tel" id="telefono" placeholder="11 1234 5678" required>
    
    <label for="email">Correo electrónico</label>
    <input type="email" id="email" placeholder="tu.email@ejemplo.com" required>
  </fieldset>
  
  <fieldset>
    <legend>Preferencias</legend>
    
    <label for="observaciones">Observaciones especiales</label>
    <textarea 
      id="observaciones" 
      placeholder="Contanos si tenés alguna preferencia especial o alergia"
    ></textarea>
    
    <div class="checkbox-group">
      <input type="checkbox" id="recordatorios">
      <label for="recordatorios">
        Quiero recibir recordatorios por WhatsApp
      </label>
    </div>
  </fieldset>
</form>
```

---

## 7. Testing and Validation

### **Automated Testing Tools**
```javascript
// axe-core integration for automated testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Service discovery page should be accessible', async () => {
    render(<ServiceDiscoveryPage />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('Booking form should be accessible', async () => {
    render(<BookingForm />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('Provider dashboard should be accessible', async () => {
    render(<ProviderDashboard />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
```

### **Manual Testing Checklist**
```markdown
## Accessibility Testing Checklist

### Visual/Color
- [ ] All text meets 4.5:1 contrast ratio (normal text)
- [ ] Large text meets 3:1 contrast ratio
- [ ] Color is not the only means of conveying information
- [ ] High contrast mode is properly supported
- [ ] Focus indicators are clearly visible

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus is never trapped unexpectedly
- [ ] Keyboard shortcuts work as expected
- [ ] Skip links allow bypassing repetitive content

### Screen Reader
- [ ] All images have appropriate alt text
- [ ] Headings create a logical document outline
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Dynamic content updates are announced

### Motor Accessibility
- [ ] Touch targets are at least 44x44px
- [ ] There's adequate spacing between interactive elements
- [ ] Voice control commands work properly
- [ ] Drag and drop interactions have keyboard alternatives

### Cognitive Accessibility
- [ ] Content is structured clearly
- [ ] Instructions are easy to understand
- [ ] Error messages are helpful and specific
- [ ] Users can review information before submitting
- [ ] Time limits are appropriate or adjustable
```

### **User Testing with Disabilities**
```markdown
## Accessibility User Testing Protocol

### Screen Reader Users
- Test with JAWS, NVDA, and VoiceOver
- Verify navigation efficiency
- Check information completeness
- Validate form completion experience

### Motor Impairment Users
- Test with keyboard-only navigation
- Test with voice control software
- Test with switch control devices
- Verify mobile touch interactions

### Cognitive Accessibility Users
- Test task completion rates
- Verify error recovery processes
- Check comprehension of instructions
- Validate form complexity appropriateness

### Low Vision Users
- Test with screen magnification
- Test with high contrast settings
- Verify custom font settings work
- Check with reduced color vision
```

---

## 8. Implementation Guidelines

### **Development Workflow**
```markdown
## Accessibility-First Development Process

1. **Design Phase**
   - Include accessibility considerations in design mockups
   - Verify color contrast ratios in design tools
   - Plan keyboard navigation flows
   - Design error states and feedback

2. **Development Phase**
   - Write semantic HTML first
   - Add ARIA labels and roles
   - Implement keyboard event handlers
   - Add focus management

3. **Testing Phase**
   - Run automated accessibility tests
   - Perform manual keyboard testing
   - Test with screen readers
   - Validate with users with disabilities

4. **Deployment Phase**
   - Include accessibility in QA checklist
   - Monitor accessibility metrics
   - Collect user feedback
   - Plan regular accessibility audits
```

### **Component Library Standards**
```markdown
## Accessible Component Requirements

Each component must include:
- [ ] Proper semantic HTML structure
- [ ] ARIA labels and descriptions
- [ ] Keyboard event handling
- [ ] Focus management
- [ ] High contrast mode support
- [ ] Screen reader testing documentation
- [ ] Usage examples with accessibility considerations
```

This comprehensive accessibility guide ensures BarberPro meets WCAG 2.1 AA standards while providing an inclusive experience for all users in the Argentina market.