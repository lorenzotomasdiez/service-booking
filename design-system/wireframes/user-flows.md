# BarberPro User Flow Wireframes

## 1. Login/Registration Flow

### Mobile Wireframe (375px)

#### Welcome Screen
```
┌─────────────────────────────────┐
│ BarberPro                   ☰   │
├─────────────────────────────────┤
│                                 │
│      [✂️ Logo + Brand]          │
│                                 │
│  Encuentra tu barbero ideal     │
│  en Argentina                   │
│                                 │
│  ┌─────────────────────────────┐ │
│  │   📱 Continuar con Google   │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │   📧 Continuar con Email    │ │
│  └─────────────────────────────┘ │
│                                 │
│  ¿Ya tienes cuenta? Inicia      │
│  sesión                         │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

#### Email Registration
```
┌─────────────────────────────────┐
│ ⬅️ Crear Cuenta             ✕   │
├─────────────────────────────────┤
│                                 │
│  Nombre Completo *              │
│  ┌─────────────────────────────┐ │
│  │ Juan Pérez                  │ │
│  └─────────────────────────────┘ │
│                                 │
│  Email *                        │
│  ┌─────────────────────────────┐ │
│  │ juan@email.com              │ │
│  └─────────────────────────────┘ │
│                                 │
│  Teléfono                       │
│  ┌─────────────────────────────┐ │
│  │ +54 9 11 1234-5678          │ │
│  └─────────────────────────────┘ │
│                                 │
│  Contraseña *                   │
│  ┌─────────────────────────────┐ │
│  │ ••••••••••••        👁️      │ │
│  └─────────────────────────────┘ │
│                                 │
│  ☑️ Acepto términos y           │
│     condiciones                 │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      Crear Cuenta           │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Login Screen
```
┌─────────────────────────────────┐
│ ⬅️ Iniciar Sesión           ✕   │
├─────────────────────────────────┤
│                                 │
│  Bienvenido de nuevo            │
│                                 │
│  Email                          │
│  ┌─────────────────────────────┐ │
│  │ juan@email.com              │ │
│  └─────────────────────────────┘ │
│                                 │
│  Contraseña                     │
│  ┌─────────────────────────────┐ │
│  │ ••••••••••••        👁️      │ │
│  └─────────────────────────────┘ │
│                                 │
│  ¿Olvidaste tu contraseña?      │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      Iniciar Sesión         │ │
│  └─────────────────────────────┘ │
│                                 │
│  ────────── o ──────────        │
│                                 │
│  ┌─────────────────────────────┐ │
│  │   📱 Continuar con Google   │ │
│  └─────────────────────────────┘ │
│                                 │
│  ¿No tienes cuenta? Regístrate  │
│                                 │
└─────────────────────────────────┘
```

### Desktop Layout (1024px+)
```
┌───────────────────────────────────────────────────────────────┐
│ BarberPro                                      [🌐 ES] [👤]   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │                     │  │                                 │ │
│  │    [✂️ Hero Image]  │  │     Encuentra tu barbero        │ │
│  │                     │  │     ideal en Argentina          │ │
│  │    Professional     │  │                                 │ │
│  │    Barber at Work   │  │  ┌─────────────────────────────┐ │ │
│  │                     │  │  │ 📱 Continuar con Google     │ │ │
│  │                     │  │  └─────────────────────────────┘ │ │
│  │                     │  │                                 │ │
│  │                     │  │  ┌─────────────────────────────┐ │ │
│  │                     │  │  │ 📧 Continuar con Email      │ │ │
│  │                     │  │  └─────────────────────────────┘ │ │
│  │                     │  │                                 │ │
│  │                     │  │  ¿Ya tienes cuenta?             │ │
│  │                     │  │  Inicia sesión                  │ │
│  │                     │  │                                 │ │
│  └─────────────────────┘  └─────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 2. Service Discovery/Search Flow

### Mobile Search Home
```
┌─────────────────────────────────┐
│  🔍 Buscar barberos...      ⚙️  │
├─────────────────────────────────┤
│                                 │
│  📍 Tu ubicación actual         │
│  Buenos Aires, Palermo          │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [🎯] Cerca de ti            │ │
│  │ 15+ barberos disponibles    │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [⭐] Mejor valorados        │ │
│  │ 4.5+ estrellas             │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [💎] Premium                │ │
│  │ Servicios exclusivos        │ │
│  └─────────────────────────────┘ │
│                                 │
│  Categorías populares:          │
│  [Corte] [Barba] [Afeitado]     │
│  [Bigote] [Cejas] [Premium]     │
│                                 │
│  ── Barberos destacados ──      │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [📷]  Carlos Mendoza        │ │
│  │       ⭐⭐⭐⭐⭐ (127)        │ │
│  │       🏠 Palermo · $890     │ │
│  └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [🔍] [📅] [💬] [👤]      │
└─────────────────────────────────┘
```

### Search Results
```
┌─────────────────────────────────┐
│ ⬅️ "Corte de cabello"      🔧   │
├─────────────────────────────────┤
│                                 │
│  📍 Palermo, Buenos Aires       │
│  🔍 23 barberos encontrados     │
│                                 │
│  [📊 Filtros] [🗂️ Ordenar]    │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [👤] Carlos Mendoza    🟢   │ │
│  │      ⭐⭐⭐⭐⭐ (127)         │ │
│  │      📍 0.8km · $890        │ │
│  │      ⏰ Disponible hoy      │ │
│  │      [Ver perfil]           │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [👤] Martín López      🟡   │ │
│  │      ⭐⭐⭐⭐☆ (89)          │ │
│  │      📍 1.2km · $750        │ │
│  │      ⏰ Próxima: 15:30      │ │
│  │      [Ver perfil]           │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ [👤] Diego Ramírez     🔴   │ │
│  │      ⭐⭐⭐⭐⭐ (156)         │ │
│  │      📍 2.1km · $950        │ │
│  │      ⏰ Ocupado hasta 18h   │ │
│  │      [Ver perfil]           │ │
│  └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [🔍] [📅] [💬] [👤]      │
└─────────────────────────────────┘
```

### Provider Profile
```
┌─────────────────────────────────┐
│ ⬅️ Carlos Mendoza           ⭐  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐ │
│  │     [Hero Image/Video]      │ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                 │
│  👤 Carlos Mendoza         🟢   │
│  ⭐⭐⭐⭐⭐ 4.9 (127 reseñas)     │
│  📍 Av. Santa Fe 1234, Palermo  │
│  🕒 Abierto hasta 20:00         │
│                                 │
│  💎 Barbero Premium · 8 años    │
│  ✅ Verificado por BarberPro    │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      📅 Reservar Cita       │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      💬 Enviar Mensaje      │ │
│  └─────────────────────────────┘ │
│                                 │
│  ── Servicios ──                │
│                                 │
│  ✂️ Corte Clásico          $890 │
│  🧔 Arreglo de Barba       $450 │
│  💈 Corte + Barba         $1200 │
│  🪒 Afeitado Tradicional   $350 │
│                                 │
│  ── Galería ──                  │
│  [📷] [📷] [📷] [📷] +12        │
│                                 │
├─────────────────────────────────┤
│ [🏠] [🔍] [📅] [💬] [👤]      │
└─────────────────────────────────┘
```

### Desktop Search (1024px+)
```
┌───────────────────────────────────────────────────────────────┐
│ BarberPro    [🔍 Buscar barberos...      ] [📍 Palermo] [👤] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │                 │  │                                     │ │
│  │   🔧 Filtros    │  │  📍 Palermo · 23 resultados        │ │
│  │                 │  │  [⭐ Rating] [💰 Price] [📍 Distance] │ │
│  │  📍 Ubicación   │  │                                     │ │
│  │  ○ < 1km        │  │  ┌─────────────────────────────────┐ │ │
│  │  ● < 3km        │  │  │ [img] Carlos Mendoza      🟢   │ │ │
│  │  ○ < 5km        │  │  │       ⭐⭐⭐⭐⭐ 4.9 (127)      │ │ │
│  │                 │  │  │       📍 0.8km · Desde $890    │ │ │
│  │  💰 Precio      │  │  │       ⏰ Disponible hoy        │ │ │
│  │  [─────●────]   │  │  │       [Ver Perfil] [Reservar]   │ │ │
│  │  $500 - $1500   │  │  └─────────────────────────────────┘ │ │
│  │                 │  │                                     │ │
│  │  ⭐ Calificación │  │  ┌─────────────────────────────────┐ │ │
│  │  ☑️ 4+ estrellas │  │  │ [img] Martín López       🟡   │ │ │
│  │  ☑️ 4.5+ estrellas │  │       ⭐⭐⭐⭐☆ 4.2 (89)       │ │ │
│  │  ○ 5 estrellas  │  │  │       📍 1.2km · Desde $750    │ │ │
│  │                 │  │  │       ⏰ Próxima: 15:30        │ │ │
│  │  🎯 Servicios   │  │  │       [Ver Perfil] [Reservar]   │ │ │
│  │  ☑️ Corte       │  │  └─────────────────────────────────┘ │ │
│  │  ☑️ Barba       │  │                                     │ │
│  │  ○ Afeitado     │  │  [Cargar más resultados...]         │ │
│  │  ○ Premium      │  │                                     │ │
│  │                 │  │                                     │ │
│  └─────────────────┘  └─────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 3. Booking Flow

### Service Selection (Mobile)
```
┌─────────────────────────────────┐
│ ⬅️ Carlos Mendoza               │
├─────────────────────────────────┤
│                                 │
│  Selecciona tu servicio         │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ ✂️ Corte Clásico      $890  │ │
│  │    Includes wash & style    │ │
│  │    ⏰ 45 min               │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🧔 Arreglo de Barba    $450 ● │
│  │    Beard trim & shape       │ │
│  │    ⏰ 30 min               │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 💈 Combo Corte+Barba $1200  │ │
│  │    Complete service         │ │
│  │    ⏰ 75 min               │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🪒 Afeitado Tradicional $350 │ │
│  │    Hot towel & razor        │ │
│  │    ⏰ 30 min               │ │
│  └─────────────────────────────┘ │
│                                 │
│  ──────────────────────         │
│  Total: $450                    │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      Continuar              │ │
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Date & Time Selection
```
┌─────────────────────────────────┐
│ ⬅️ Seleccionar horario           │
├─────────────────────────────────┤
│                                 │
│  📅 Selecciona la fecha         │
│                                 │
│  [<] Marzo 2024 [>]             │
│                                 │
│  L  M  M  J  V  S  D            │
│              1  2  3            │
│  4  5  6  7  8  9  10           │
│  11 12 13 ●14 15 16 17          │
│  18 19 20 21 22 23 24           │
│  25 26 27 28 29 30 31           │
│                                 │
│  🕒 Horarios disponibles        │
│  Jueves 14 de Marzo             │
│                                 │
│  [09:00] [09:30] [10:00]        │
│  [10:30] [●11:00] [11:30]       │
│  [14:00] [14:30] [15:00]        │
│  [15:30] [16:00] [16:30]        │
│  [17:00] [17:30] [18:00]        │
│                                 │
│  ── Resumen ──                  │
│  📋 Arreglo de Barba            │
│  📅 Jueves 14 Mar - 11:00       │
│  👤 Carlos Mendoza              │
│  ⏰ 30 minutos                  │
│  💰 $450                        │
│                                 │
│  ┌─────────────────────────────┐ │
│  │      Continuar              │ │
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Payment & Confirmation
```
┌─────────────────────────────────┐
│ ⬅️ Confirmar reserva             │
├─────────────────────────────────┤
│                                 │
│  💳 Método de pago              │
│                                 │
│  ● 💳 Tarjeta (MercadoPago)     │
│  ○ 💰 Efectivo en local         │
│  ○ 🏦 Transferencia             │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ •••• •••• •••• 1234         │ │
│  │ JUAN PEREZ                  │ │
│  │ 💳 Visa                     │ │
│  └─────────────────────────────┘ │
│                                 │
│  + Agregar nueva tarjeta        │
│                                 │
│  ── Resumen de la reserva ──    │
│                                 │
│  🧔 Arreglo de Barba      $450  │
│  📅 Jueves 14 Mar, 11:00        │
│  👤 Carlos Mendoza              │
│  📍 Av. Santa Fe 1234           │
│  ⏰ Duración: 30 min            │
│                                 │
│  Subtotal              $450     │
│  Comisión BarberPro     $16     │
│  ──────────────────────         │
│  Total                 $466     │
│                                 │
│  ☑️ Acepto términos y política  │
│      de cancelación             │
│                                 │
│  ┌─────────────────────────────┐ │
│  │  💳 Confirmar y Pagar       │ │
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Booking Confirmation
```
┌─────────────────────────────────┐
│                               ✕ │
├─────────────────────────────────┤
│                                 │
│         ✅                      │
│                                 │
│    ¡Reserva Confirmada!         │
│                                 │
│  Tu cita ha sido programada     │
│  exitosamente                   │
│                                 │
│  ── Detalles de la cita ──      │
│                                 │
│  🎫 Código: #BP-2024-001        │
│  🧔 Arreglo de Barba            │
│  📅 Jueves 14 Mar, 11:00        │
│  👤 Carlos Mendoza              │
│  📍 Av. Santa Fe 1234           │
│  💰 $466 - Pagado               │
│                                 │
│  ┌─────────────────────────────┐ │
│  │     Ver en Calendario       │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │     Enviar por WhatsApp     │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │     Calificar más tarde     │ │
│  └─────────────────────────────┘ │
│                                 │
│  ℹ️ Recibirás recordatorios     │
│     24h y 2h antes de tu cita   │
│                                 │
└─────────────────────────────────┘
```

## 4. Provider Dashboard

### Dashboard Overview (Mobile)
```
┌─────────────────────────────────┐
│ Carlos Mendoza              ☰   │
├─────────────────────────────────┤
│                                 │
│  🟢 Disponible                  │
│                                 │
│  ── Hoy, 14 Marzo ──            │
│                                 │
│  📊 Estadísticas del día        │
│  ┌─────────────────────────────┐ │
│  │ 💰 $1,350  📅 5   ⭐ 4.9   │ │
│  │ Ingresos   Citas  Rating    │ │
│  └─────────────────────────────┘ │
│                                 │
│  📅 Próximas citas              │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 11:00 - Juan Pérez     🟢   │ │
│  │ Arreglo de Barba · $450     │ │
│  │ [💬 Chat] [📞 Llamar]       │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 14:00 - María López    🟡   │ │
│  │ Corte + Barba · $1200       │ │
│  │ [💬 Chat] [📞 Llamar]       │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 16:30 - Diego Soto     ⏰   │ │
│  │ Corte Clásico · $890        │ │
│  │ [💬 Chat] [📞 Llamar]       │ │
│  └─────────────────────────────┘ │
│                                 │
│  + Bloquear horario             │
│                                 │
├─────────────────────────────────┤
│ [📊] [📅] [💬] [⚙️] [👤]      │
└─────────────────────────────────┘
```

### Calendar View (Mobile)
```
┌─────────────────────────────────┐
│ ⬅️ Calendario               ➕   │
├─────────────────────────────────┤
│                                 │
│  [<] Marzo 2024 [>]             │
│                                 │
│  L  M  M  J  V  S  D            │
│              1  2  3            │
│  4  5  6  7  8  9  10           │
│  11 12 13 ●14 15 16 17          │
│  18 19 20 21 22 23 24           │
│  25 26 27 28 29 30 31           │
│                                 │
│  📅 Jueves 14 de Marzo          │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 09:00 ████████████████ 10:30│ │
│  │ Juan Pérez - Corte          │ │
│  │ 💰 $890 · ✅ Confirmado     │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 11:00 ████████ 11:30        │ │
│  │ María López - Barba         │ │
│  │ 💰 $450 · ⏰ Pendiente      │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 14:00 ████████████████ 15:15│ │
│  │ Diego Soto - Combo          │ │
│  │ 💰 $1200 · ✅ Confirmado    │ │
│  └─────────────────────────────┘ │
│                                 │
│  16:00 - 20:00                  │
│  ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│  Horarios disponibles           │
│                                 │
├─────────────────────────────────┤
│ [📊] [📅] [💬] [⚙️] [👤]      │
└─────────────────────────────────┘
```

### Desktop Dashboard (1024px+)
```
┌───────────────────────────────────────────────────────────────┐
│ BarberPro | Carlos Mendoza          [🔔] [⚙️] [👤 Carlos ▼] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │                 │  │  📊 Dashboard Overview             │ │
│  │  🟢 Disponible  │  │                                     │ │
│  │                 │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │ │
│  │  Hoy 14 Mar     │  │  │💰   │ │📅   │ │⭐   │ │👥   │   │ │
│  │                 │  │  │$1.3k│ │5    │ │4.9  │ │89   │   │ │
│  │  📅 5 citas     │  │  │Hoy  │ │Citas│ │Rate │ │Total│   │ │
│  │  💰 $1,350      │  │  └─────┘ └─────┘ └─────┘ └─────┘   │ │
│  │  📈 +12% sem    │  │                                     │ │
│  │                 │  │  ── Próximas Citas ──              │ │
│  │  ┌─────────────┐ │  │                                     │ │
│  │  │ Cambiar     │ │  │  11:00  Juan P.      Barba   $450  │ │
│  │  │ Estado      │ │  │  14:00  María L.     Combo  $1200  │ │
│  │  └─────────────┘ │  │  16:30  Diego S.     Corte   $890  │ │
│  │                 │  │  18:00  Ana M.       Barba   $450  │ │
│  │  + Nueva Cita   │  │  19:30  [Disponible]               │ │
│  │  🚫 Bloquear    │  │                                     │ │
│  │                 │  │  [Ver todas las citas]             │ │
│  └─────────────────┘  └─────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📅 Vista Semanal                                      │ │
│  │                                                         │ │
│  │  L12  M13  M14  J15  V16  S17  D18                      │ │
│  │  ───  ───  ███  ███  ███  ███  ───                      │ │
│  │        4    5    6    8    3    0    Citas              │ │
│  │                                                         │ │
│  │  [Ver calendario completo]                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Design System Notes

### Key Mobile Design Principles
1. **Touch-First**: 44px minimum touch targets
2. **Thumb Navigation**: Important actions in thumb-reach zone
3. **Progressive Disclosure**: Show essential info first, details on tap
4. **Context Preservation**: Clear navigation breadcrumbs
5. **Offline Support**: Local storage for critical booking data

### Responsive Breakpoints
- **Mobile**: 375px - 767px (primary design target)
- **Tablet**: 768px - 1023px (adapted mobile layouts)
- **Desktop**: 1024px+ (enhanced multi-column layouts)

### Information Architecture
- **Client Flow**: Search → Select → Book → Confirm
- **Provider Flow**: Overview → Calendar → Messages → Settings
- **Consistent Navigation**: Bottom tabs (mobile) / Top nav (desktop)
- **State Management**: Clear loading, error, and success states

### Argentina-Specific Considerations
- **Payment Integration**: MercadoPago prominence
- **Communication**: WhatsApp integration expectations
- **Trust Indicators**: Verification badges, reviews prominence
- **Local Patterns**: Familiar e-commerce flow patterns
- **Language**: Spanish-first with proper accent handling

These wireframes provide the foundation for implementing BarberPro's core user flows with mobile-first design, Argentina market considerations, and scalable component patterns.