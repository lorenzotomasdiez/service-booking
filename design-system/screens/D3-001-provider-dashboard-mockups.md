# D3-001: Provider Dashboard High-Fidelity Mockups
*BarberPro - Premium Argentina Barber Booking Platform*

## Overview
Comprehensive provider dashboard designs optimized for Argentina barber professionals, featuring calendar management, service creation, earnings analytics, and client relationship management.

---

## 1. Provider Dashboard Overview (Desktop)

### Main Dashboard Layout (1280px+)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰] BarberPro    Dashboard    [🔔4] [👤 Carlos]    [⚙️]                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ¡Hola Carlos! 👋             [+ Nuevo Servicio] [📅 Horarios]          │
│ Gestiona tu negocio y mantente al día                                    │
│                                                                          │
│ ┌─ Optimiza tu perfil ────────────────────────────────────────────┐     │
│ │ ✅ Tu perfil está 78% completo. Completa para atraer 3x más    │ [×] │
│ │ ████████████████████████████░░░░░░░░░░ 78%                     │     │
│ │ [Completar Perfil] ✨ ¡Excelente progreso!                     │     │
│ └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ ┌─ Stats Cards ──────────────┬─────────────┬─────────────┬────────────┐ │
│ │ 📅 Total Reservas          │ ⏰ Hoy      │ ✂️ Servicios │ 💰 Ingresos │ │
│ │    156                     │    8        │    12       │ $87.500     │ │
│ └────────────────────────────┴─────────────┴─────────────┴────────────┘ │
│                                                                          │
│ ┌─ Citas de Hoy ─────────────────────────────────┐ ┌─ Acciones Rápidas ┐│
│ │                                                 │ │                   ││
│ │ 🕙 10:00 | Juan Pérez                          │ │ [+ Nuevo Servicio]││
│ │ Corte + Barba | $2.500 | ✅ Confirmada        │ │ [⏰ Horarios]     ││
│ │                                                 │ │ [👥 Clientes]     ││
│ │ 🕚 11:30 | Carlos González                      │ │ [📊 Análisis]     ││
│ │ Corte Clásico | $1.800 | ✅ Confirmada        │ │                   ││
│ │                                                 │ │ ── Resumen ──     ││
│ │ 🕑 14:00 | Luis Martinez                       │ │ 📈 Citas: 23      ││
│ │ Tratamiento | $3.200 | ⏳ Pendiente          │ │ 💰 $18.500        ││
│ │                                                 │ │ 👤 Nuevos: 5      ││
│ │ [Ver todas las citas]                          │ │ ⭐ Rating: 4.8    ││
│ └─────────────────────────────────────────────────┘ └───────────────────┘│
│                                                                          │
│ ┌─ Notificaciones ──────────────────────────────────────────────────────┐ │
│ │ 🟦 Nueva reserva: Carlos González para mañana 15:00                   │ │
│ │ 🟨 Recordatorio: Actualiza horario para próxima semana                │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile Dashboard (375px)
```
┌─────────────────────────────────────┐
│ [☰] BarberPro        [🔔4] [👤]     │
├─────────────────────────────────────┤
│                                     │
│ ¡Hola Carlos! 👋                   │
│ Gestiona tu negocio                 │
│                                     │
│ ┌─ Perfil 78% completo ───────────┐ │
│ │ ████████████████████░░░░░ 78%   │ │
│ │ [Completar]      ✨ Excelente   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───┬───┬───┬───┐ Stats Grid       │
│ │156│ 8 │12 │$87│                  │
│ │📅 │⏰ │✂️ │💰 │                  │
│ └───┴───┴───┴───┘                  │
│                                     │
│ ── Citas de Hoy ──                  │
│                                     │
│ 🕙 10:00 Juan Pérez                │
│ Corte + Barba    $2.500 ✅         │
│                                     │
│ 🕚 11:30 Carlos González            │
│ Corte Clásico   $1.800 ✅          │
│                                     │
│ 🕑 14:00 Luis Martinez              │
│ Tratamiento     $3.200 ⏳          │
│                                     │
│ [Ver todas]                         │
│                                     │
│ ── Acciones Rápidas ──              │
│ [+ Servicio] [⏰ Horarios]         │
│ [👥 Clientes] [📊 Análisis]        │
└─────────────────────────────────────┘
```

---

## 2. Calendar & Booking Management

### Calendar View (Weekly)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [←] Semana del 10-16 Septiembre 2024 [→]    [📅 Mes] [📋 Lista] [⚙️]   │
├──────────────────────────────────────────────────────────────────────────┤
│        │ LUN 10 │ MAR 11 │ MIÉ 12 │ JUE 13 │ VIE 14 │ SÁB 15 │ DOM 16  │
│ ───────┼────────┼────────┼────────┼────────┼────────┼────────┼──────── │
│  9:00  │   ·    │   ·    │   ·    │   ·    │   ·    │ ┌────┐ │   ·     │
│        │        │        │        │        │        │ │ JP │ │         │
│ 10:00  │ ┌────┐ │   ·    │ ┌────┐ │   ·    │ ┌────┐ │ │$25k│ │ CERRADO │
│        │ │ CG │ │        │ │ LM │ │        │ │ MA │ │ └────┘ │         │
│ 11:00  │ │$18k│ │ ┌────┐ │ │$32k│ │ ┌────┐ │ │$22k│ │   ·    │         │
│        │ └────┘ │ │ RP │ │ └────┘ │ │ DR │ │ └────┘ │        │         │
│ 12:00  │   ·    │ │$15k│ │   ·    │ │$28k│ │   ·    │ ┌────┐ │         │
│        │        │ └────┘ │        │ └────┘ │        │ │ KL │ │         │
│ 13:00  │   ·    │   ·    │   ·    │   ·    │   ·    │ │$30k│ │         │
│        │        │        │        │        │        │ └────┘ │         │
├──────────────────────────────────────────────────────────────────────────┤
│ 💰 Semana: $145.000   📈 +12% vs anterior   ⭐ 4.8 rating              │
└──────────────────────────────────────────────────────────────────────────┘

Legend:
CG = Carlos González | LM = Luis Martinez | JP = Juan Pérez
$18k = $1.800 (ARS pricing) | Color coding by service type
```

### Appointment Detail Modal
```
┌─────────────────────────────────────────────┐
│ ✂️ Detalle de Cita                  [×]    │
├─────────────────────────────────────────────┤
│                                             │
│ 👤 Juan Pérez                               │
│ 📱 +54 9 11 1234-5678                      │
│ 📧 juan.perez@email.com                     │
│                                             │
│ 📅 Lunes 10 Sept, 10:00 - 11:00            │
│ ✂️ Corte + Barba                           │
│ 💰 $2.500 (ARS)                            │
│ ✅ Confirmada                               │
│                                             │
│ ── Historial del Cliente ──                 │
│ • 5 visitas anteriores                     │
│ • Cliente desde: Marzo 2024                │
│ • Última visita: 15 Agosto                 │
│ • Servicios favoritos: Corte clásico       │
│                                             │
│ ── Notas ──                                 │
│ "Prefiere corte degradado, barba recortada │
│ sin aceites. Puntual y buen cliente."      │
│                                             │
│ ── Acciones ──                              │
│ [📝 Editar] [❌ Cancelar] [✅ Confirmar]   │
│ [💬 Mensaje] [📞 Llamar] [📧 Email]       │
└─────────────────────────────────────────────┘
```

---

## 3. Service Creation & Management

### Service Creation Form
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [←] Crear Nuevo Servicio                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Información Básica ──────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Nombre del Servicio *                                                  │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Corte + Barba Premium                                              │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                        │ │
│ │ Descripción                                                            │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Corte de cabello personalizado con técnicas modernas              │ │ │
│ │ │ + arreglo de barba con productos premium y acabado              │ │ │
│ │ │ profesional. Incluye lavado y peinado.                            │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                        │ │
│ │ Categoría *                  Duración *              Precio *          │ │
│ │ ┌─────────────────┐        ┌─────────────┐        ┌─────────────────┐  │ │
│ │ │ Corte + Barba ▼ │        │ 60 minutos ▼│        │ $ 2.500         │  │ │
│ │ └─────────────────┘        └─────────────┘        └─────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Galería de Fotos ────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │ │
│ │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │  +  │ Agregar                       │ │
│ │ │Foto1│ │Foto2│ │Foto3│ │Foto4│ │     │ Fotos                         │ │
│ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                              │ │
│ │                                                                        │ │
│ │ 💡 Sube fotos de alta calidad (mín. 800x600px) para atraer más       │ │
│ │    clientes. Las fotos de antes/después funcionan muy bien.           │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Configuración Avanzada ──────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ ☑ Permitir reservas online          ☑ Requiere depósito               │ │
│ │ ☐ Solo para clientes VIP            ☐ Preparación especial            │ │
│ │                                                                        │ │
│ │ Depósito requerido: $ 500 (20%)                                       │ │
│ │ Política de cancelación: 24 horas                                     │ │
│ │                                                                        │ │
│ │ Productos utilizados:                                                  │ │
│ │ • Shampoo orgánico premium                                            │ │
│ │ • Aceite para barba artesanal                                         │ │
│ │ • Cera fijadora importada                                              │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ [💾 Guardar Borrador]  [👁️ Vista Previa]  [✅ Publicar Servicio]         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Service Management Grid
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Mis Servicios (12)                           [🔍 Buscar] [+ Nuevo]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Corte Clásico ──────────────────────┐ ┌─ Corte + Barba ────────────┐ │
│ │ ⭐⭐⭐⭐⭐ 4.8 (23 reseñas)            │ │ ⭐⭐⭐⭐⭐ 4.9 (41 reseñas)  │ │
│ │                                       │ │                             │ │
│ │ 💰 $1.800 • ⏱️ 45 min                │ │ 💰 $2.500 • ⏱️ 60 min      │ │
│ │ 📈 156 reservas este mes              │ │ 📈 98 reservas este mes     │ │
│ │ 🟢 Activo                             │ │ 🟢 Activo                   │ │
│ │                                       │ │                             │ │
│ │ [✏️ Editar] [📊 Análisis] [⚙️]       │ │ [✏️ Editar] [📊 Análisis]   │ │
│ └───────────────────────────────────────┘ └─────────────────────────────┘ │
│                                                                          │
│ ┌─ Arreglo de Barba ───────────────────┐ ┌─ Tratamiento Capilar ──────┐ │
│ │ ⭐⭐⭐⭐⭐ 4.7 (18 reseñas)            │ │ ⭐⭐⭐⭐☆ 4.3 (12 reseñas)    │ │
│ │                                       │ │                             │ │
│ │ 💰 $1.200 • ⏱️ 30 min                │ │ 💰 $3.200 • ⏱️ 90 min      │ │
│ │ 📈 67 reservas este mes               │ │ 📈 15 reservas este mes     │ │
│ │ 🟢 Activo                             │ │ 🟡 Agotado                  │ │
│ │                                       │ │                             │ │
│ │ [✏️ Editar] [📊 Análisis] [⚙️]       │ │ [✏️ Editar] [📦 Stock]      │ │
│ └───────────────────────────────────────┘ └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Earnings & Analytics Dashboard

### Revenue Analytics (Argentina Market)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 💰 Panel de Ingresos                    [📅 Septiembre 2024] [📊 Export]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Resumen Mensual ──────────────────────────────────────────────────────┐ │
│ │ 💰 $387.500 ARS    📈 +23% vs mes anterior    ⭐ 4.8 rating promedio  │ │
│ │ 📅 156 servicios   👥 87 clientes únicos      🔄 68% clientes recurrentes│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Gráfico de Ingresos (Últimos 30 días) ──────────────────────────────┐ │
│ │ $25k │                                                     ██          │ │
│ │      │                                                   ██  ██        │ │
│ │ $20k │                                           ██    ██      ██      │ │
│ │      │                                         ██  ██            ██    │ │
│ │ $15k │                               ██      ██                    ██  │ │
│ │      │                             ██  ██  ██                        ██│ │
│ │ $10k │                           ██        ██                          │ │
│ │      │     ██    ██    ██      ██                                      │ │
│ │  $5k │   ██  ██    ██    ██  ██                                        │ │
│ │      │ ██      ██        ████                                          │ │
│ │   $0 └──────────────────────────────────────────────────────────────── │ │
│ │       1   5   10   15   20   25   30                                   │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Por Servicio ─────────────┬─ Por Método de Pago ─────────────────────┐ │
│ │                            │                                          │ │
│ │ Corte + Barba      $145.2k │ 💳 MercadoPago      67% ($259.7k)        │ │
│ │ ████████████████   37.5%   │ 💵 Efectivo         28% ($108.5k)        │ │
│ │                            │ 🏦 Transferencia    5% ($19.3k)          │ │
│ │ Corte Clásico      $98.7k  │                                          │ │
│ │ ███████████        25.5%   │ ── Próximos Pagos ──                    │ │
│ │                            │ Lunes 16 Sept: $12.400                   │ │
│ │ Arreglo Barba      $67.3k  │ Martes 17 Sept: $8.750                   │ │
│ │ ███████            17.4%   │ Miércoles 18 Sept: $15.200              │ │
│ │                            │                                          │ │
│ │ Tratamiento        $48.1k  │ 📊 Comisión BarberPro: $13.562 (3.5%)   │ │
│ │ █████              12.4%   │ 💰 Neto a recibir: $373.938             │ │
│ └────────────────────────────┴──────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Impuestos y Declaraciones (Argentina) ───────────────────────────────┐ │
│ │                                                                        │ │
│ │ 📋 IVA Responsable Inscripto                                          │ │
│ │ • Base imponible: $325.420                                            │ │
│ │ • IVA 21%: $68.338                                                     │ │
│ │ • Retenciones AFIP: $11.462                                           │ │
│ │                                                                        │ │
│ │ 📄 [Descargar Facturación] [AFIP - Mis Comprobantes]                 │ │
│ │                                                                        │ │
│ │ 💡 Recordatorio: Declaración AFIP vence el 21 de cada mes            │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Performance Metrics
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 📊 Análisis de Rendimiento                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Horarios Más Productivos ────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ 🕙 9:00-12:00   ████████████████████ 78% ocupación                    │ │
│ │ 🕐 13:00-16:00  ████████████████████████ 92% ocupación                │ │
│ │ 🕕 17:00-20:00  ██████████████████ 65% ocupación                      │ │
│ │                                                                        │ │
│ │ 💡 Sugerencia: Considera aumentar precios en horario pico (13-16h)    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Días de la Semana ────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Lunes      ██████████        $45.2k                                   │ │
│ │ Martes     ████████████      $52.1k                                   │ │
│ │ Miércoles  ██████████████    $58.7k                                   │ │
│ │ Jueves     ████████████████  $67.3k 👑 Mejor día                     │ │
│ │ Viernes    ██████████████    $61.2k                                   │ │
│ │ Sábado     ████████████████████ $78.5k 🔥 Día más activo            │ │
│ │ Domingo    ██████            $24.5k                                   │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Tendencias y Predicciones ───────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ 📈 Crecimiento mensual: +23% (muy por encima del promedio del 8%)     │ │
│ │ 🎯 Proyección octubre: $475.000 ARS                                   │ │
│ │ 📅 Temporada alta detectada: Sept-Dic (bodas y fiestas)               │ │
│ │                                                                        │ │
│ │ 🎯 Objetivos sugeridos:                                               │ │
│ │ • Aumentar reservas dominicales (+40% potencial)                      │ │
│ │ • Lanzar promoción para tratamientos capilares                        │ │
│ │ • Implementar programa de fidelidad                                   │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Client Management Interface

### Client Database
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 👥 Gestión de Clientes (147)      [🔍 Buscar cliente] [📁 Filtros]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Juan Pérez ──────────────────────────────────────────────────────────┐ │
│ │ 👤 📱 +54 9 11 1234-5678 • 📧 juan@email.com • 🎂 32 años           │ │
│ │                                                                        │ │
│ │ 💰 Cliente VIP • 💎 Cliente Premium desde Mar 2024                   │ │
│ │ 📈 Total gastado: $34.500 • 🔄 15 visitas • ⭐ 5.0 rating promedio   │ │
│ │                                                                        │ │
│ │ ── Última visita ──                                                   │ │
│ │ 📅 15 Agosto 2024 • Corte + Barba • $2.500 • ⭐⭐⭐⭐⭐              │ │
│ │                                                                        │ │
│ │ ── Preferencias ──                                                    │ │
│ │ • Corte: Degradado medio • Barba: Recortada sin aceites              │ │
│ │ • Frecuencia: Cada 3 semanas • Horario preferido: Sábados 10-12h     │ │
│ │                                                                        │ │
│ │ ── Próxima cita ──                                                    │ │
│ │ 📅 Lunes 16 Sept, 10:00 • Corte + Barba • ✅ Confirmada              │ │
│ │                                                                        │ │
│ │ [💬 Mensaje] [📞 Llamar] [📅 Agendar] [👁️ Ver historial]            │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Carlos González ─────────────────────────────────────────────────────┐ │
│ │ 👤 📱 +54 9 11 5678-1234 • 📧 carlos@email.com • 🎂 45 años         │ │
│ │                                                                        │ │
│ │ 👥 Cliente Regular • 🆕 Nuevo cliente desde Sept 2024                │ │
│ │ 📈 Total gastado: $7.200 • 🔄 4 visitas • ⭐ 4.8 rating promedio     │ │
│ │                                                                        │ │
│ │ ── Última visita ──                                                   │ │
│ │ 📅 8 Septiembre 2024 • Corte Clásico • $1.800 • ⭐⭐⭐⭐⭐           │ │
│ │                                                                        │ │
│ │ ── Notas ──                                                           │ │
│ │ "Cliente ejecutivo, prefiere citas temprano. Muy puntual."           │ │
│ │                                                                        │ │
│ │ [💬 Mensaje] [📞 Llamar] [📅 Agendar] [📝 Agregar nota]              │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ── Segmentación de Clientes ──                                          │
│ 💎 VIP (12): +$25k gastado/año    👥 Regular (89): $5-25k/año          │
│ 🆕 Nuevo (31): <3 visitas          ⚠️ Inactivo (15): >60 días           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Client Communication Center
```
┌─────────────────────────────────────────────┐
│ 💬 Centro de Comunicación            [×]   │
├─────────────────────────────────────────────┤
│                                             │
│ Para: Juan Pérez (+54 9 11 1234-5678)      │
│                                             │
│ ┌─ Plantillas Rápidas ─────────────────────┐ │
│ │ 📅 Recordatorio de cita                  │ │
│ │ 🎉 Promoción especial                    │ │
│ │ ⭐ Solicitud de reseña                   │ │
│ │ 🎂 Felicitación cumpleaños              │ │
│ │ ❌ Cancelación de cita                   │ │
│ └───────────────────────────────────────────┘ │
│                                             │
│ Mensaje:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Hola Juan! 👋                           │ │
│ │                                         │ │
│ │ Te recordamos tu cita para mañana       │ │
│ │ lunes 16/09 a las 10:00 hs.            │ │
│ │                                         │ │
│ │ ✂️ Servicio: Corte + Barba             │ │
│ │ 💰 Precio: $2.500                      │ │
│ │ 📍 Barbería Carlos - San Telmo         │ │
│ │                                         │ │
│ │ Si necesitas reprogramar, responde      │ │
│ │ a este mensaje.                         │ │
│ │                                         │ │
│ │ ¡Te esperamos! 😊                      │ │
│ │                                         │ │
│ │ Carlos - BarberPro                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [📱 WhatsApp] [📧 Email] [📞 Llamada]     │
│                                             │
│ [📝 Guardar plantilla] [📤 Enviar]         │
└─────────────────────────────────────────────┘
```

---

## 6. Notification & Alert System

### Notification Center
```
┌─────────────────────────────────────────────┐
│ 🔔 Notificaciones (4)             [×]      │
├─────────────────────────────────────────────┤
│                                             │
│ 🟦 Nueva reserva                  2min      │
│ Carlos González reservó para mañana         │
│ 16 Sept a las 15:00 - Corte Clásico       │
│ [Ver detalles] [Confirmar]                 │
│                                             │
│ ────────────────────────────────────────────│
│                                             │
│ 🟨 Recordatorio                   15min     │
│ Actualiza tu horario para la                │
│ próxima semana (23-29 Sept)                │
│ [Configurar horarios]                      │
│                                             │
│ ────────────────────────────────────────────│
│                                             │
│ 🟩 Pago recibido                  1h        │
│ MercadoPago - $2.500 de Juan Pérez         │
│ Cita del 16 Sept confirmada                │
│ [Ver comprobante]                          │
│                                             │
│ ────────────────────────────────────────────│
│                                             │
│ 🟪 Reseña nueva                   3h        │
│ Luis Martinez te calificó ⭐⭐⭐⭐⭐         │
│ "Excelente servicio y atención"            │
│ [Responder] [Compartir]                    │
│                                             │
│ ────────────────────────────────────────────│
│                                             │
│ [📱 Configurar notificaciones push]        │
│ [📧 Configurar emails]                     │
└─────────────────────────────────────────────┘
```

### Real-time Alerts
```css
/* Toast Notification Styles */
.toast-notification {
  @apply fixed top-4 right-4 z-50;
  @apply bg-white border border-neutral-200 rounded-lg shadow-lg;
  @apply p-4 max-w-sm w-full;
  animation: slideIn 300ms ease-out;
}

.toast-success {
  @apply border-l-4 border-l-success-500 bg-success-50;
}

.toast-warning {
  @apply border-l-4 border-l-warning-500 bg-warning-50;
}

.toast-error {
  @apply border-l-4 border-l-error-500 bg-error-50;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## 7. Settings & Profile Management

### Provider Profile Settings
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Configuración de Perfil                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─ Información del Negocio ─────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Nombre del Negocio                                                     │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Barbería Carlos - San Telmo                                        │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                        │ │
│ │ Descripción                                                            │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Barbería tradicional argentina con más de 15 años de              │ │ │
│ │ │ experiencia. Especialistas en cortes clásicos y modernos          │ │ │
│ │ │ con atención personalizada en el corazón de San Telmo.            │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                        │ │
│ │ 📍 Dirección: Defensa 1234, San Telmo, CABA                          │ │
│ │ 📱 Teléfono: +54 9 11 1234-5678                                       │ │
│ │ 🌐 Sitio web: www.barberia-carlos.com.ar                             │ │
│ │ 📧 Email: info@barberia-carlos.com.ar                                 │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Horarios de Atención ────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Lunes    [09:00] a [18:00]  ☑ Abierto                                │ │
│ │ Martes   [09:00] a [18:00]  ☑ Abierto                                │ │
│ │ Miércoles[09:00] a [18:00]  ☑ Abierto                                │ │
│ │ Jueves   [09:00] a [19:00]  ☑ Abierto                                │ │
│ │ Viernes  [09:00] a [19:00]  ☑ Abierto                                │ │
│ │ Sábado   [08:00] a [20:00]  ☑ Abierto                                │ │
│ │ Domingo  [10:00] a [16:00]  ☐ Cerrado                                │ │
│ │                                                                        │ │
│ │ ⚡ Configuración rápida:                                               │ │
│ │ [Lun-Vie 9-18] [Sáb 8-20] [Dom cerrado] [Feriados especiales]       │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ Políticas y Términos ─────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Política de cancelación:                                               │ │
│ │ ○ 2 horas antes    ○ 12 horas antes    ● 24 horas antes               │ │
│ │                                                                        │ │
│ │ Depósito requerido: ☑ Sí  ☐ No                                       │ │
│ │ Monto del depósito: $500 (20% del servicio)                          │ │
│ │                                                                        │ │
│ │ ☑ Permitir reservas sin depósito para clientes VIP                   │ │
│ │ ☑ Enviar recordatorios automáticos 24h antes                         │ │
│ │ ☑ Solicitar reseñas después del servicio                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ [💾 Guardar Cambios]  [👁️ Vista Previa Pública]  [🔄 Restaurar]         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Mobile Optimization

### Mobile Provider Dashboard (375px)
```
┌─────────────────────────────────────┐
│ [☰] BarberPro        [🔔4] [👤]     │
├─────────────────────────────────────┤
│ ¡Hola Carlos! 👋                   │
│ ── Resumen del día ──               │
│                                     │
│ ┌─ 8 citas hoy ──────────────────┐  │
│ │ 💰 $18.200   ⭐ 4.8   📈 +12%  │  │
│ └─────────────────────────────────┘  │
│                                     │
│ ── Próxima cita ──                  │
│ 🕙 10:00 Juan Pérez                │
│ Corte + Barba • $2.500             │
│ [👁️ Ver] [📞 Llamar] [💬 Chat]    │
│                                     │
│ ── Acciones rápidas ──              │
│ [+ Servicio] [⏰ Horarios]         │
│ [📊 Análisis] [👥 Clientes]        │
│                                     │
│ ── Notificaciones ──                │
│ 🟦 Nueva reserva (2min)             │
│ 🟨 Recordatorio horarios            │
│                                     │
│ ── Ganancias del mes ──             │
│ $387.500 📈 +23%                   │
│ [Ver detalles]                      │
└─────────────────────────────────────┘
```

---

## 9. Implementation Guidelines

### Component Architecture
```css
/* Provider Dashboard Layout */
.provider-dashboard {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-6 p-6;
}

.dashboard-header {
  @apply lg:col-span-4 flex flex-col lg:flex-row justify-between;
  @apply items-start lg:items-center mb-8;
}

.stats-grid {
  @apply lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
}

.main-content {
  @apply lg:col-span-3 space-y-8;
}

.sidebar-actions {
  @apply lg:col-span-1 space-y-6;
}

/* Calendar Integration */
.calendar-view {
  @apply bg-white rounded-lg border border-neutral-200 overflow-hidden;
}

.calendar-header {
  @apply flex items-center justify-between p-4 border-b;
  @apply bg-neutral-50 font-semibold text-neutral-800;
}

.calendar-grid {
  @apply grid grid-cols-7 gap-0;
}

.calendar-slot {
  @apply p-2 border-r border-b border-neutral-100;
  @apply hover:bg-neutral-50 cursor-pointer transition-colors;
  min-height: 60px;
}

.appointment-card {
  @apply bg-primary-100 border border-primary-200 rounded p-1;
  @apply text-xs text-primary-800 cursor-pointer;
}
```

### Argentina Market Customizations
- ARS currency formatting with proper thousand separators
- AFIP tax integration placeholders
- MercadoPago payment status indicators
- Argentina timezone handling (ART/ARST)
- Spanish date/time formatting

### Accessibility Compliance
- Screen reader navigation for calendar
- Keyboard shortcuts for common actions
- High contrast mode support
- Touch target optimization (44px minimum)
- Voice control compatibility

---

## Implementation Checklist

### Phase 1: Dashboard Core (Week 1)
- [ ] Dashboard overview layout
- [ ] Stats cards and KPI display
- [ ] Today's appointments list
- [ ] Quick actions sidebar
- [ ] Notification center

### Phase 2: Calendar & Bookings (Week 2)
- [ ] Weekly calendar view
- [ ] Appointment detail modals
- [ ] Drag-drop rescheduling
- [ ] Booking confirmation flow
- [ ] Real-time updates

### Phase 3: Business Management (Week 3)
- [ ] Service creation/editing
- [ ] Client management database
- [ ] Communication center
- [ ] Settings and profile
- [ ] Mobile optimization

### Phase 4: Analytics & Enhancement (Week 4)
- [ ] Revenue analytics dashboard
- [ ] Performance metrics
- [ ] Argentina tax integration
- [ ] Advanced reporting
- [ ] User testing and refinement

---

**Design Quality:** Premium provider experience optimized for Argentina market  
**Status:** Ready for frontend implementation  
**Next Phase:** Client booking flow and service discovery interfaces