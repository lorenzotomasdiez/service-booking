# D3-001: High-Fidelity Authentication Flow Designs
*BarberPro - Premium Argentina Barber Booking Platform*

## Overview
High-fidelity authentication designs optimized for Argentina market with premium positioning, mobile-first approach, and complete accessibility compliance.

---

## 1. Login Screen High-Fidelity Design

### Mobile Design (375px)
```
┌─────────────────────────────────────┐
│              BarberPro              │ 
│       [B] Logo (Brand Blue)         │
│                                     │
│          Iniciar Sesión             │
│      Bienvenido a BarberPro         │
│                                     │
│  ¿No tienes cuenta? [Regístrate]    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📧 Correo Electrónico           │ │
│ │ tu@email.com                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔒 Contraseña            [👁]   │ │
│ │ ••••••••••••                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☑ Recordarme    ¿Olvidaste         │
│                 tu contraseña?      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Iniciar Sesión             │ │ Primary Button
│ └─────────────────────────────────┘ │
│                                     │
│         ─── O continúa con ───      │
│                                     │
│  [G] Google    [F] Facebook        │
│                                     │
│  ¿Problemas? Contacta soporte      │
└─────────────────────────────────────┘
```

### Key Design Specifications

#### Visual Hierarchy
- **Logo**: 64px x 64px, brand blue (#2563eb), rounded-xl
- **Title**: Poppins 24px, font-bold, text-neutral-800
- **Subtitle**: Inter 14px, text-neutral-600
- **Form Labels**: Inter 14px, font-medium, text-neutral-700

#### Form Components
```css
/* Email Input Field */
.form-input-auth {
  @apply w-full px-4 py-3 border border-neutral-300 rounded-lg;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply text-base text-neutral-800 placeholder-neutral-400;
  @apply transition-all duration-200;
  min-height: 48px; /* 44px + 4px border for touch target */
}

/* Password Field with Eye Toggle */
.password-container {
  @apply relative;
}

.password-toggle {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply w-5 h-5 text-neutral-400 hover:text-neutral-600;
  @apply cursor-pointer transition-colors;
}

/* Primary Login Button */
.btn-login-primary {
  @apply w-full bg-primary-600 hover:bg-primary-700;
  @apply text-white font-semibold py-3 px-4 rounded-lg;
  @apply transition-all duration-200 active:scale-[0.98];
  @apply focus:ring-4 focus:ring-primary-500/30;
  min-height: 48px;
}
```

#### Argentina-Specific Adaptations
- Phone number format placeholder: "+54 9 11 1234-5678"
- Error messages in Argentine Spanish
- MercadoPago integration ready (hidden for login)
- WhatsApp support link integration

---

## 2. Registration Flow High-Fidelity Design

### User Type Selection (Step 1)
```
┌─────────────────────────────────────┐
│              BarberPro              │
│       [B] Logo (Brand Blue)         │
│                                     │
│            Crear Cuenta             │
│     Únete a la mejor plataforma     │
│         de servicios premium       │
│                                     │
│  ¿Ya tienes cuenta? [Inicia sesión] │
│                                     │
│  ¿Cómo quieres usar BarberPro?      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Cliente                      │ │ SELECTED
│ │ Reserva servicios de barbería   │ │ (Primary border)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✂️ Profesional                  │ │
│ │ Ofrece servicios de barbería    │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Continuar]                 │
└─────────────────────────────────────┘
```

### Personal Information (Step 2)
```
┌─────────────────────────────────────┐
│  [←] Crear Cuenta - Paso 2 de 3     │
│                                     │
│         Información Personal        │
│                                     │
│ ┌─────────────────┬─────────────────┐ │
│ │ Nombre *        │ Apellido *      │ │
│ │ Juan            │ Pérez           │ │
│ └─────────────────┴─────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📧 Correo Electrónico *         │ │
│ │ juan@email.com                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Teléfono *                   │ │
│ │ +54 9 11 1234-5678             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────┬─────────────────┐ │
│ │ 🔒 Contraseña   │ Confirmar       │ │
│ │ ••••••••   [👁] │ ••••••••   [👁] │ │
│ └─────────────────┴─────────────────┘ │
│                                     │
│              [Continuar]            │
└─────────────────────────────────────┘
```

### Terms & Verification (Step 3)
```
┌─────────────────────────────────────┐
│  [←] Crear Cuenta - Paso 3 de 3     │
│                                     │
│     Términos y Verificación         │
│                                     │
│ ☑ Acepto los [Términos y           │
│   Condiciones] y la [Política       │
│   de Privacidad] de BarberPro *     │
│                                     │
│ ☐ Acepto recibir comunicaciones     │
│   promocionales por email y SMS    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Código de Verificación       │ │
│ │ Enviado a +54 9 11 ****-5678    │ │
│ │                                 │ │
│ │   [_] [_] [_] [_] [_] [_]       │ │
│ │                                 │ │
│ │   ¿No recibiste el código?       │ │
│ │   [Reenviar] (45s)              │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Crear Mi Cuenta]           │
└─────────────────────────────────────┘
```

#### Progressive Form Validation
```css
/* Success State */
.form-input-success {
  @apply border-success-500 bg-success-50;
}

.form-input-success:focus {
  @apply ring-success-500 border-success-500;
}

/* Error State */  
.form-input-error {
  @apply border-error-500 bg-error-50;
}

.form-input-error:focus {
  @apply ring-error-500 border-error-500;
}

/* Loading State */
.form-input-loading {
  @apply border-warning-500 bg-warning-50;
}
```

---

## 3. Password Reset Flow

### Password Reset Request
```
┌─────────────────────────────────────┐
│  [←] BarberPro                      │
│                                     │
│        ¿Olvidaste tu contraseña?    │
│                                     │
│   No te preocupes, te ayudamos a    │
│   recuperar el acceso a tu cuenta   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📧 Correo Electrónico           │ │
│ │ tu@email.com                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Enviar Enlace de Reset      │ │
│ └─────────────────────────────────┘ │
│                                     │
│      ¿Recordaste tu contraseña?     │
│           [Volver al login]         │
└─────────────────────────────────────┘
```

### Password Reset Success
```
┌─────────────────────────────────────┐
│              BarberPro              │
│                                     │
│        ✅ Enlace Enviado            │
│                                     │
│   Hemos enviado un enlace de        │
│   recuperación a tu email:          │
│                                     │
│        juan@email.com               │
│                                     │
│   Revisa tu bandeja de entrada      │
│   y también la carpeta de spam      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Abrir Email              │ │
│ └─────────────────────────────────┘ │
│                                     │
│   ¿No recibiste el email?          │
│   [Reenviar] · [Cambiar email]     │
│                                     │
│      [Volver al inicio]             │
└─────────────────────────────────────┘
```

---

## 4. Welcome & Onboarding Screens

### Welcome Screen (Post-Registration)
```
┌─────────────────────────────────────┐
│              BarberPro              │
│                                     │
│         🎉 ¡Bienvenido!             │
│                                     │
│      Hola Juan, tu cuenta ha        │
│      sido creada exitosamente      │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  [👤] Perfil de Usuario     │  │
│    │  Completa tu información    │  │
│    │  personal y preferencias    │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  [🔍] Explora Servicios     │  │
│    │  Descubre los mejores       │  │
│    │  profesionales cerca tuyo   │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  [📱] App Móvil             │  │
│    │  Instala nuestra app para   │  │
│    │  una mejor experiencia      │  │
│    └─────────────────────────────┘  │
│                                     │
│      [Comenzar a Explorar]          │
└─────────────────────────────────────┘
```

### Client Onboarding (Step 1 - Preferences)
```
┌─────────────────────────────────────┐
│  [←] Configuración Inicial 1/3      │
│                                     │
│        Tus Preferencias             │
│                                     │
│   ¿Qué servicios te interesan?      │
│                                     │
│ ☑ Corte de Cabello                 │ SELECTED
│ ☑ Arreglo de Barba                 │ SELECTED
│ ☐ Tratamientos Capilares           │
│ ☐ Afeitado Clásico                 │
│ ☐ Coloración                       │
│                                     │
│   ¿Con qué frecuencia te cortas     │
│   el cabello?                       │
│                                     │
│ ○ Cada 2-3 semanas                 │
│ ● Cada mes                          │ SELECTED
│ ○ Cada 2-3 meses                   │
│ ○ Ocasionalmente                   │
│                                     │
│              [Continuar]            │
└─────────────────────────────────────┘
```

---

## 5. Social Login Integration (Future-Ready)

### Social Login Options
```css
/* Google Button */
.btn-google {
  @apply w-full bg-white border border-neutral-300;
  @apply text-neutral-700 hover:bg-neutral-50;
  @apply flex items-center justify-center py-3 px-4;
  @apply rounded-lg transition-all duration-200;
}

/* Facebook Button */
.btn-facebook {
  @apply w-full bg-blue-600 hover:bg-blue-700;
  @apply text-white flex items-center justify-center;
  @apply py-3 px-4 rounded-lg transition-all;
}

/* WhatsApp Integration (Argentina Specific) */
.btn-whatsapp-support {
  @apply fixed bottom-6 right-6 bg-green-500 hover:bg-green-600;
  @apply text-white rounded-full w-14 h-14;
  @apply flex items-center justify-center shadow-lg;
  @apply transition-all duration-200 z-50;
}
```

---

## 6. Form Validation & Error States

### Real-time Validation Messages (Argentina Spanish)
```json
{
  "email": {
    "required": "El correo electrónico es obligatorio",
    "invalid": "Ingresa un correo electrónico válido",
    "exists": "Este correo ya está registrado"
  },
  "phone": {
    "required": "El teléfono es obligatorio", 
    "invalid": "Formato: +54 9 11 1234-5678",
    "exists": "Este teléfono ya está registrado"
  },
  "password": {
    "required": "La contraseña es obligatoria",
    "weak": "Mínimo 8 caracteres, incluye números y letras",
    "mismatch": "Las contraseñas no coinciden"
  },
  "terms": {
    "required": "Debes aceptar los términos y condiciones"
  }
}
```

### Error Display Components
```
┌─────────────────────────────────────┐
│ ⚠️ Error en el Formulario          │
│                                     │
│ Corrige los siguientes errores:     │
│ • El correo electrónico no es válido│
│ • La contraseña debe tener al menos │
│   8 caracteres                      │
│ • Debes aceptar los términos        │
└─────────────────────────────────────┘
```

---

## 7. Accessibility Features

### Screen Reader Support
```html
<!-- Login Form Accessibility -->
<form role="form" aria-labelledby="login-title">
  <h1 id="login-title">Iniciar Sesión en BarberPro</h1>
  
  <div class="form-group">
    <label for="email" class="sr-only">Correo Electrónico</label>
    <input 
      id="email"
      type="email"
      placeholder="Correo Electrónico"
      aria-describedby="email-error"
      aria-required="true"
    />
    <div id="email-error" class="error-message" aria-live="polite"></div>
  </div>
</form>
```

### Keyboard Navigation
- Tab order: Logo → Email → Password → Remember → Forgot → Login → Social
- Enter key submits form from any input
- Escape key clears current field
- Space bar toggles checkboxes

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .form-input-auth {
    @apply border-2 border-neutral-900;
  }
  
  .btn-login-primary {
    @apply bg-neutral-900 border-2 border-neutral-900;
  }
}
```

---

## 8. Mobile-First Responsive Design

### Breakpoint Specifications
- **Mobile**: 375px - 767px (Primary design)
- **Tablet**: 768px - 1023px (Enhanced layout)
- **Desktop**: 1024px+ (Side-by-side layout)

### Touch Target Optimization
- Minimum 44px touch targets
- 8px spacing between interactive elements
- Thumb-friendly form layouts
- Swipe gestures for onboarding steps

### Performance Considerations
- Lazy load social login icons
- Progressive enhancement for animations
- 3G network optimization
- Minimal bundle size impact

---

## 9. Implementation Notes

### TailwindCSS Integration
```css
/* Add to globals.css */
.form-input-auth {
  @apply w-full px-4 py-3 border border-neutral-300 rounded-lg;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply text-base text-neutral-800 placeholder-neutral-400;
  @apply transition-all duration-200;
}

.btn-brand-primary {
  @apply w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800;
  @apply text-white font-semibold py-3 px-4 rounded-lg;
  @apply transition-all duration-200 active:scale-[0.98];
  @apply focus:ring-4 focus:ring-primary-500/30;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### Animation Specifications
- Form transitions: 200ms ease-in-out
- Button press: 150ms active scale
- Error shakes: 400ms ease-out
- Success checkmarks: 300ms ease-in

### Argentina Market Adaptations
- Currency format: ARS with proper formatting
- Phone validation: +54 area code handling
- Address autocomplete: Argentina cities/provinces
- Payment methods: MercadoPago prominence

---

## Implementation Checklist

### Phase 1: Core Authentication (Week 1)
- [ ] Login form with validation
- [ ] Registration multi-step flow
- [ ] Password reset functionality
- [ ] Form error handling
- [ ] Loading states

### Phase 2: Enhancement (Week 2)  
- [ ] Social login integration
- [ ] Phone verification
- [ ] Welcome onboarding
- [ ] Accessibility testing
- [ ] Performance optimization

### Phase 3: Argentina Localization (Week 3)
- [ ] Spanish translations
- [ ] Argentina phone validation
- [ ] MercadoPago integration prep
- [ ] WhatsApp support integration
- [ ] Local user testing

---

**Design Quality:** Premium, accessible, Argentina-optimized  
**Status:** Ready for frontend implementation  
**Next Phase:** Provider dashboard and booking flow designs