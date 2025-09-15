# Escenarios de Pruebas de Aceptación de Usuario (UAT) - BarberPro
## Plataforma Premium de Reservas para Barberos en Argentina

**Versión:** 1.0  
**Fecha:** Día 2 del Sprint  
**Mercado Objetivo:** Argentina  
**Idioma:** Español (Argentina)  

---

## 📋 Resumen Ejecutivo

Este documento define los escenarios de pruebas de aceptación de usuario (UAT) para BarberPro, abarcando todas las funcionalidades MVP críticas. Los escenarios están diseñados específicamente para el mercado argentino e incluyen validaciones culturales, métodos de pago locales (MercadoPago), y flujos de trabajo adaptados a las necesidades de barberos y clientes argentinos.

### Cobertura de Personas de Usuario:
- **Proveedores de Servicios**: Carlos, Martín, Alejandro  
- **Clientes**: Sofía, Diego, Rodrigo  

### Alcance de Funcionalidades:
- Registro y autenticación de usuarios
- Gestión de perfiles y servicios
- Sistema de reservas y conflictos
- Procesamiento de pagos (MercadoPago)
- Notificaciones y comunicación
- Evaluaciones y reseñas

---

## 🏪 ESCENARIOS DE PROVEEDORES DE SERVICIOS

### PERSONA: Carlos - Dueño de Barbería (30-50 años)
*Características: Dueño de 1-2 locales en Buenos Aires/Córdoba, necesita presencia online profesional*

#### **Escenario UAT-P001: Registro Inicial de Barbería**

**Objetivo:** Verificar que Carlos puede registrar su barbería completamente y establecer su presencia online profesional.

**Precondiciones:**
- Carlos tiene DNI argentino válido
- Posee CUIT para su barbería
- Tiene acceso a email y teléfono móvil
- Cuenta con fotos de su barbería

**Datos de Prueba:**
```
Nombre: Carlos Alberto Rodríguez
Email: carlos.barber@gmail.com
Teléfono: +54-11-4567-8901
DNI: 35.123.456
CUIT: 20-35123456-8
Nombre de Negocio: "Barbería Don Carlos"
Dirección: Av. Corrientes 1234, Buenos Aires, CABA
Provincia: Buenos Aires
Código Postal: C1043
Tipo de Negocio: Barbería Tradicional
```

**Pasos de Ejecución:**
1. **Acceso Inicial**
   - Abrir BarberPro.com.ar
   - Hacer clic en "Registrate como Barbero"
   - Verificar que la página está en español argentino

2. **Registro Personal**
   - Completar datos personales (nombre, email, teléfono, DNI)
   - Subir foto de DNI para verificación
   - Crear contraseña segura
   - Aceptar términos y condiciones (Argentina)

3. **Registro del Negocio**
   - Completar nombre de la barbería
   - Agregar descripción: "Barbería tradicional con más de 15 años en el barrio"
   - Cargar dirección con autocompletado de Buenos Aires
   - Subir CUIT y documentos habilitantes
   - Cargar logo y fotos del local (mínimo 3)

4. **Configuración de Servicios**
   - Crear servicios básicos:
     * Corte de cabello - $800 ARS - 30 minutos
     * Corte + Barba - $1200 ARS - 45 minutos
     * Afeitado clásico - $600 ARS - 25 minutos
   - Configurar horarios de atención:
     * Lunes a Viernes: 9:00 - 19:00
     * Sábados: 9:00 - 17:00
     * Domingos: Cerrado
   - Definir descansos: 13:00 - 14:00 todos los días

5. **Configuración de Pagos**
   - Vincular cuenta de MercadoPago
   - Configurar métodos de pago aceptados
   - Establecer política de anticipos (30%)

**Resultados Esperados:**
- ✅ Registro completado exitosamente
- ✅ Email de confirmación recibido
- ✅ Perfil de barbería visible en búsquedas
- ✅ Badge "Verificado" después de validación de DNI
- ✅ Servicios activos y reservables
- ✅ Integración con MercadoPago funcional
- ✅ Dashboard del proveedor accesible

**Criterios de Aceptación:**
- Proceso de registro toma menos de 15 minutos
- Todos los campos obligatorios están claramente marcados
- Validación de DNI funciona correctamente
- Integración con MercadoPago es inmediata
- Interface en español argentino sin errores
- Fotos se cargan y muestran correctamente

---

#### **Escenario UAT-P002: Gestión Diaria de Reservas**

**Objetivo:** Carlos puede gestionar eficientemente las reservas del día, ver su calendario y manejar cambios de último momento.

**Precondiciones:**
- Carlos está registrado y verificado
- Tiene servicios configurados
- Existen reservas previas en el sistema

**Datos de Prueba:**
```
Fecha de Prueba: Martes 12 de Septiembre, 2025
Reservas Existentes:
- 10:00 - Corte (Juan Pérez) - $800
- 14:30 - Corte + Barba (Miguel Santos) - $1200
- 16:00 - Afeitado (Roberto López) - $600
```

**Pasos de Ejecución:**
1. **Acceso al Dashboard**
   - Iniciar sesión con credenciales de Carlos
   - Verificar dashboard carga en menos de 3 segundos
   - Visualizar resumen del día actual

2. **Visualización del Calendario**
   - Ver todas las reservas del día en vista calendario
   - Verificar información completa de cada reserva:
     * Hora y duración
     * Nombre del cliente
     * Servicio solicitado
     * Monto total
     * Estado de pago
     * Notas especiales

3. **Gestión de Reservas**
   - Confirmar reserva pendiente de Juan Pérez
   - Reprogramar reserva de Miguel Santos a las 15:00
   - Marcar como completada la reserva de las 16:00
   - Agregar notas internas: "Cliente prefiere corte bien corto"

4. **Verificación de Notificaciones**
   - Confirmar que clientes reciben notificaciones de cambios
   - Verificar notificaciones por WhatsApp y email
   - Comprobar que cambios se reflejan en tiempo real

5. **Reporte de Ingresos**
   - Ver resumen de ingresos del día
   - Verificar comisiones de BarberPro (3.5%)
   - Confirmar estado de pagos y transferencias

**Resultados Esperados:**
- ✅ Dashboard carga rápidamente con información actual
- ✅ Calendario muestra todas las reservas correctamente
- ✅ Cambios en reservas se procesan instantáneamente
- ✅ Notificaciones a clientes funcionan correctamente
- ✅ Cálculos de ingresos y comisiones son precisos
- ✅ Interface responde bien en móvil y desktop

**Criterios de Aceptación:**
- Tiempo de carga del dashboard < 3 segundos
- Todas las acciones tienen confirmación visual
- Notificaciones se envían en menos de 30 segundos
- Cálculos financieros son 100% precisos
- Interface es intuitiva y fácil de usar

---

### PERSONA: Martín - Barbero Independiente (25-40 años)
*Características: Trabaja en silla alquilada, busca adquirir clientes y sistema de reservas profesional*

#### **Escenario UAT-P003: Configuración de Perfil Independiente**

**Objetivo:** Martín puede configurar su perfil independiente, destacar sus especialidades y atraer nuevos clientes.

**Precondiciones:**
- Martín tiene DNI y CUIL válidos
- Cuenta con fotos de trabajos anteriores
- Tiene referencias de clientes

**Datos de Prueba:**
```
Nombre: Martín Facundo González
Email: martin.barber.ar@gmail.com
Teléfono: +54-11-6543-2109
DNI: 32.987.654
CUIL: 20-32987654-1
Especialidades: Fade, Cortes modernos, Diseño en cabello
Ubicación: Palermo, Buenos Aires
Movilidad: Se traslada a domicilio (radio 5km)
```

**Pasos de Ejecución:**
1. **Registro Perfil Personal**
   - Completar registro como barbero independiente
   - Subir foto profesional de alta calidad
   - Escribir descripción atractiva: "Barbero especialista en cortes modernos y fade. 8 años de experiencia. Atención personalizada y productos premium."

2. **Portfolio y Especialidades**
   - Subir galería de trabajos (mínimo 10 fotos)
   - Marcar especialidades: Fade, Undercut, Diseños, Cortes clásicos
   - Agregar videos cortos de trabajos (opcional)
   - Configurar hashtags: #FadeExpert #CorteModerno #PalermoBarber

3. **Configuración de Servicios Móviles**
   - Crear servicios con precios competitivos:
     * Corte Fade - $700 ARS - 35 minutos
     * Corte + Diseño - $1000 ARS - 50 minutos
     * Servicio a Domicilio - $1200 ARS + viático
   - Configurar horarios flexibles:
     * Lunes a Sábado: 8:00 - 20:00
     * Domingo: 10:00 - 18:00
   - Establecer radio de atención a domicilio: 5km desde Palermo

4. **Promociones y Referidos**
   - Crear promoción de lanzamiento: "50% OFF primer corte"
   - Configurar programa de referidos: "Traé un amigo y los dos obtienen 20% de descuento"
   - Establecer descuentos por frecuencia: "Cada 5to corte gratis"

5. **Integración Social**
   - Conectar perfil de Instagram: @martin_barber_ar
   - Sincronizar con WhatsApp Business
   - Configurar auto-respuestas para consultas

**Resultados Esperados:**
- ✅ Perfil profesional y atractivo creado
- ✅ Portfolio muestra trabajos de calidad
- ✅ Servicios móviles configurados correctamente
- ✅ Promociones activas y visibles
- ✅ Integración con redes sociales funcional
- ✅ Aparece en búsquedas de "barberos Palermo"

**Criterios de Aceptación:**
- Perfil pasa revisión de calidad automática
- Fotos se cargan en resolución correcta
- Promociones se aplican automáticamente
- Radio de servicio se calcula correctamente
- Integración social funciona sin errores

---

### PERSONA: Alejandro - Dueño de Cadena Premium (35-55 años)
*Características: 3+ locales, necesita gestión multi-local y coordinación de staff*

#### **Escenario UAT-P004: Gestión Multi-Local**

**Objetivo:** Alejandro puede gestionar múltiples locales desde un panel unificado, coordinar staff y mantener estándares de calidad.

**Precondiciones:**
- Alejandro está registrado como dueño de cadena
- Tiene 3 locales registrados
- Staff configurado en cada local

**Datos de Prueba:**
```
Cadena: "Premium Barber Club"
Locales:
1. Recoleta - Av. Santa Fe 1500 (3 barberos)
2. Belgrano - Av. Cabildo 2800 (4 barberos)  
3. Palermo - Av. Córdoba 5600 (5 barberos)

Staff Principal:
- Roberto Silva (Encargado Recoleta)
- Lucas Martínez (Encargado Belgrano)
- Franco Rossi (Encargado Palermo)
```

**Pasos de Ejecución:**
1. **Dashboard Multi-Local**
   - Acceder al panel de administración de cadena
   - Ver resumen consolidado de los 3 locales
   - Verificar métricas clave:
     * Reservas del día: 24 (8 por local promedio)
     * Ingresos estimados: $28,800 ARS
     * Ocupación promedio: 75%
     * Calificación promedio: 4.7/5

2. **Gestión de Personal**
   - Ver estado de cada barbero en tiempo real
   - Asignar reservas específicas a barberos por especialidad
   - Configurar turnos rotativos
   - Manejar ausencias y reemplazos:
     * Roberto Silva ausente → reasignar reservas a otro barbero
     * Aprobar cambio de turno solicitado por Lucas

3. **Control de Calidad**
   - Revisar reseñas y calificaciones de todos los locales
   - Responder a comentarios negativos
   - Implementar mejoras basadas en feedback
   - Enviar notificación grupal al staff sobre nuevo protocolo

4. **Análisis de Performance**
   - Comparar performance entre locales
   - Identificar local con mejor rendimiento (Palermo)
   - Analizar causas de menor performance en Belgrano
   - Generar reporte semanal consolidado

5. **Coordinación de Promociones**
   - Lanzar promoción simultánea en los 3 locales
   - Configurar descuentos por múltiples servicios
   - Coordinar eventos especiales (Día del Padre)
   - Monitorear efectividad de promociones

**Resultados Esperados:**
- ✅ Vista consolidada de todos los locales funciona
- ✅ Gestión de personal es eficiente y clara
- ✅ Métricas y reportes son precisos
- ✅ Promociones se aplican correctamente en todos los locales
- ✅ Comunicación con staff es efectiva
- ✅ Control de calidad permite mantener estándares

**Criterios de Aceptación:**
- Dashboard carga todos los locales en menos de 5 segundos
- Cambios se sincronizan en tiempo real entre locales
- Reportes generan datos precisos y actualizados
- Gestión de personal previene conflictos de horarios
- Promociones se activan simultáneamente

---

## 👤 ESCENARIOS DE CLIENTES

### PERSONA: Sofía - Profesional Joven (25-35 años)
*Características: Trabaja en Buenos Aires, valora conveniencia, usuaria intensiva de smartphone*

#### **Escenario UAT-C001: Primer Uso y Reserva Express**

**Objetivo:** Sofía puede registrarse rápidamente y hacer su primera reserva sin complicaciones desde su móvil.

**Precondiciones:**
- Sofía tiene smartphone con internet
- Está en área de Buenos Aires
- Busca barbero cerca de su oficina

**Datos de Prueba:**
```
Nombre: Sofía Valentina López
Email: sofia.lopez@empresa.com.ar
Teléfono: +54-11-3456-7890
DNI: 38.456.789
Ubicación: Microcentro, Buenos Aires
Presupuesto: $800-1200 ARS
Preferencia: Corte moderno, barbero con buenas reviews
```

**Pasos de Ejecución:**
1. **Descubrimiento y Registro**
   - Buscar en Google: "barbero cerca microcentro buenos aires"
   - Hacer clic en resultado de BarberPro
   - Registro rápido con email/Google/Facebook
   - Verificar número de teléfono con SMS

2. **Búsqueda de Servicios**
   - Usar geolocalización para barberos cercanos
   - Filtrar por:
     * Distancia: Menos de 1km
     * Precio: $800-1200
     * Calificación: Mínimo 4.5 estrellas
     * Disponibilidad: Hoy o mañana
   - Ver resultados ordenados por proximidad

3. **Selección de Barbero**
   - Revisar perfil de "Barbería Don Carlos" (4.8 estrellas)
   - Ver fotos de trabajos anteriores
   - Leer reseñas de otros clientes
   - Verificar que tiene badge "Verificado"
   - Confirmar ubicación: 3 cuadras de la oficina

4. **Proceso de Reserva**
   - Seleccionar servicio: "Corte de cabello - $800"
   - Elegir fecha: Mañana 
   - Ver horarios disponibles: 10:00, 14:30, 16:00
   - Seleccionar: 14:30 (horario de almuerzo)
   - Agregar nota: "Corte moderno, no muy corto"

5. **Pago y Confirmación**
   - Elegir método de pago: Tarjeta de débito
   - Procesar pago con MercadoPago
   - Recibir confirmación inmediata
   - Guardar en calendario del teléfono
   - Recibir WhatsApp de confirmación

**Resultados Esperados:**
- ✅ Registro completado en menos de 2 minutos
- ✅ Búsqueda muestra opciones relevantes y cercanas
- ✅ Información de barberos es completa y confiable
- ✅ Proceso de reserva es intuitivo en móvil
- ✅ Pago se procesa sin inconvenientes
- ✅ Confirmaciones llegan por múltiples canales

**Criterios de Aceptación:**
- App carga en menos de 3 segundos en 4G
- Geolocalización es precisa (margen 100m)
- Filtros funcionan correctamente
- Proceso de pago toma menos de 1 minuto
- Notificaciones llegan en menos de 30 segundos

---

#### **Escenario UAT-C002: Gestión de Reserva y Modificaciones**

**Objetivo:** Sofía puede modificar su reserva, comunicarse con el barbero y manejar imprevistos.

**Precondiciones:**
- Sofía tiene reserva confirmada para mañana 14:30
- Surgió reunión de trabajo a esa hora
- Necesita reprogramar o cancelar

**Pasos de Ejecución:**
1. **Acceso a Reserva Existente**
   - Abrir app de BarberPro
   - Ver "Mis Reservas" en página principal
   - Tocar reserva de mañana 14:30
   - Ver detalles completos de la reserva

2. **Solicitud de Cambio**
   - Tocar "Modificar Reserva"
   - Ver opciones disponibles:
     * Cambiar horario
     * Cambiar fecha
     * Cancelar reserva
   - Seleccionar "Cambiar horario"

3. **Reprogramación**
   - Ver horarios disponibles para mañana:
     * 10:00 (disponible)
     * 16:00 (disponible)
     * 17:30 (disponible)
   - Seleccionar 16:00
   - Confirmar cambio sin costo adicional

4. **Comunicación con Barbero**
   - Usar chat integrado para explicar cambio
   - Escribir: "Hola Carlos, tuve que cambiar por una reunión. ¿16:00 está bien?"
   - Recibir respuesta: "Perfecto Sofía, te espero a las 16:00. ¡Saludos!"
   - Ver que barbero confirma el cambio

5. **Confirmación y Recordatorios**
   - Recibir notificación de cambio exitoso
   - Verificar que calendario se actualizó
   - Recibir recordatorio 2 horas antes: "Tu reserva con Carlos es a las 16:00"
   - Recibir ubicación exacta y instrucciones de llegada

**Resultados Esperados:**
- ✅ Modificación de reserva es simple y rápida
- ✅ Comunicación con barbero funciona perfectamente
- ✅ Cambios se reflejan inmediatamente en el sistema
- ✅ Recordatorios llegan en horarios apropiados
- ✅ No hay costos adicionales por cambio con anticipación

**Criterios de Aceptación:**
- Cambios se procesan en menos de 30 segundos
- Chat entrega mensajes instantáneamente
- Recordatorios son puntuales y útiles
- Interface de modificación es intuitiva
- Políticas de cambio son claras y justas

---

### PERSONA: Diego - Padre de Familia (30-50 años)
*Características: Busca valor, necesita reservas familiares, prefiere interfaces simples*

#### **Escenario UAT-C003: Reserva Familiar y Gestión de Múltiples Servicios**

**Objetivo:** Diego puede reservar servicios para él y su hijo, coordinar horarios y obtener descuentos familiares.

**Precondiciones:**
- Diego está registrado en BarberPro
- Necesita corte para él y su hijo de 12 años
- Busca barbero que atienda bien a niños

**Datos de Prueba:**
```
Cliente Principal: Diego Ramón Fernández
Hijo: Tomás Fernández (12 años)
Servicios Necesarios:
- Diego: Corte + Barba ($1200)
- Tomás: Corte infantil ($600)
Preferencias: Mismo día, horarios seguidos, barbero familiar
Presupuesto objetivo: Menos de $1800 total
```

**Pasos de Ejecución:**
1. **Búsqueda de Barbero Familiar**
   - Buscar barberos con tag "Apto niños"
   - Filtrar por calificaciones de "Trato con niños"
   - Encontrar "Barbería Familiar Los Hermanos" (4.9 estrellas)
   - Ver reseñas mencionando buena atención a niños
   - Confirmar que ofrecen descuentos familiares

2. **Configuración de Reserva Múltiple**
   - Seleccionar "Reserva Familiar"
   - Agregar datos del hijo: Nombre, edad
   - Elegir servicios:
     * Diego: Corte + Barba - $1200
     * Tomás: Corte Infantil - $600
   - Ver precio total: $1800 (sin descuento aún)

3. **Coordinación de Horarios**
   - Buscar disponibilidad para sábado
   - Ver opciones de horarios seguidos:
     * 10:00-11:00 (Diego) + 11:00-11:30 (Tomás)
     * 14:00-15:00 (Diego) + 15:00-15:30 (Tomás)
   - Seleccionar horarios de mañana
   - Solicitar el mismo barbero para ambos

4. **Aplicación de Descuentos**
   - Sistema detecta reserva familiar automáticamente
   - Aplica descuento del 10%: Total $1620
   - Mostrar desglose claro:
     * Subtotal: $1800
     * Descuento familiar (10%): -$180
     * Total a pagar: $1620

5. **Confirmación y Preparación**
   - Pagar con tarjeta de débito familiar
   - Recibir confirmación con detalles de ambas reservas
   - Obtener recomendaciones: "Llegá 10 minutos antes con Tomás"
   - Recibir recordatorio el viernes: "Mañana tienen turnos a las 10:00"

**Resultados Esperados:**
- ✅ Búsqueda identifica barberos apropiados para niños
- ✅ Reserva múltiple es fácil de configurar
- ✅ Horarios se coordinan automáticamente
- ✅ Descuentos familiares se aplican correctamente
- ✅ Experiencia es optimizada para familias

**Criterios de Aceptación:**
- Filtro "Apto niños" funciona correctamente
- Descuentos se calculan y muestran claramente
- Horarios seguidos se pueden reservar fácilmente
- Confirmaciones incluyen instrucciones específicas
- Precio final es transparente y competitivo

---

### PERSONA: Rodrigo - Cliente Premium (35-60 años)
*Características: Alto poder adquisitivo, busca servicio exclusivo y de máxima calidad*

#### **Escenario UAT-C004: Experiencia Premium y Servicios Exclusivos**

**Objetivo:** Rodrigo puede acceder a servicios premium, barberos top-rated y beneficios exclusivos.

**Precondiciones:**
- Rodrigo está dispuesto a pagar precios premium
- Busca los mejores barberos disponibles
- Valora atención personalizada y exclusividad

**Datos de Prueba:**
```
Cliente: Rodrigo Alberto Mendoza
Perfil: Ejecutivo senior, 45 años
Presupuesto: Sin límite específico ($2000+ ARS)
Preferencias: Barberos certificados, productos premium, atención VIP
Servicios de Interés: Corte + Barba + Tratamientos + Masajes
```

**Pasos de Ejecución:**
1. **Suscripción Premium**
   - Registrarse con plan "BarberPro Premium" ($4999/mes)
   - Activar beneficios premium:
     * Acceso a barberos exclusivos
     * Reservas prioritarias
     * Descuentos en servicios premium
     * Concierge personalizado

2. **Búsqueda de Servicios Exclusivos**
   - Usar filtro "Solo Proveedores Premium"
   - Ver barberos con certificaciones especiales
   - Encontrar "Master Barber Alejandro - Palermo Hollywood"
   - Verificar credenciales: 15 años experiencia, certificado internacional
   - Ver portfolio de clientes ejecutivos

3. **Reserva de Experiencia Completa**
   - Seleccionar "Experiencia Premium Completa":
     * Corte personalizado - $1500
     * Barba tradicional con navaja - $1200  
     * Tratamiento capilar - $800
     * Masaje facial relajante - $600
     * Total: $4100 (con descuento premium: $3690)

4. **Personalización VIP**
   - Completar cuestionario de preferencias:
     * Estilo preferido: Clásico ejecutivo
     * Productos: Solo orgánicos/premium
     * Ambiente: Música relajante, aromas
   - Solicitar barbero específico que ya conoce su estilo
   - Reservar horario exclusivo fuera del horario normal (7:30 AM)

5. **Servicios Concierge**
   - Recibir llamada de confirmación personalizada
   - Coordinar transporte: "¿Necesita que coordinemos un remis?"
   - Recibir recordatorio con recomendaciones pre-servicio
   - Obtener acceso a sala de espera VIP con café premium

**Resultados Esperados:**
- ✅ Acceso exclusivo a barberos premium funciona
- ✅ Servicios de alto valor se ofrecen correctamente
- ✅ Personalización VIP cumple expectativas
- ✅ Descuentos premium se aplican apropiadamente
- ✅ Servicio concierge agrega valor real
- ✅ Experiencia justifica el precio premium

**Criterios de Aceptación:**
- Solo barberos certificados aparecen en búsqueda premium
- Descuentos premium se calculan correctamente
- Personalización se guarda y aplica automáticamente
- Servicios concierge responden en menos de 2 horas
- Calidad de servicio excede expectativas premium

---

## 🔧 ESCENARIOS DE CASOS EXTREMOS Y MANEJO DE ERRORES

### **Escenario UAT-E001: Conflicto de Reservas en Tiempo Real**

**Objetivo:** El sistema maneja correctamente cuando dos clientes intentan reservar el mismo horario simultáneamente.

**Configuración:**
- Dos usuarios (Ana y Pedro) acceden simultáneamente
- Ambos quieren reservar con Carlos el sábado a las 15:00
- Solo queda un horario disponible

**Pasos de Ejecución:**
1. Ana y Pedro abren la app al mismo tiempo
2. Ambos ven el horario 15:00 como disponible
3. Ana inicia proceso de reserva a las 14:30:15
4. Pedro inicia proceso de reserva a las 14:30:17
5. Ana completa pago a las 14:30:45
6. Pedro intenta completar pago a las 14:30:50

**Resultado Esperado:**
- ✅ Ana obtiene la reserva exitosamente
- ✅ Pedro recibe mensaje: "Este horario ya fue reservado"
- ✅ Sistema ofrece horarios alternativos a Pedro automáticamente
- ✅ No se procesan dos pagos para el mismo horario
- ✅ Carlos solo ve una reserva en su calendario

---

### **Escenario UAT-E002: Manejo de Fallos de Pago**

**Objetivo:** El sistema maneja correctamente fallos en el procesamiento de pagos y ofrece alternativas.

**Configuración:**
- Cliente intenta pagar con tarjeta sin fondos
- MercadoPago rechaza el pago
- Cliente necesita alternativas

**Pasos de Ejecución:**
1. Cliente completa reserva y llega al pago
2. Ingresa datos de tarjeta sin fondos suficientes
3. MercadoPago retorna error de fondos insuficientes
4. Sistema detecta fallo y preserva reserva temporalmente (15 minutos)
5. Se ofrecen métodos alternativos de pago

**Resultado Esperado:**
- ✅ Reserva se mantiene temporalmente sin pago
- ✅ Error se comunica claramente en español
- ✅ Se ofrecen alternativas: otra tarjeta, efectivo en local, transferencia
- ✅ Cliente puede reintentar pago fácilmente
- ✅ Si no paga en 15 minutos, horario se libera automáticamente

---

### **Escenario UAT-E003: Caída de Conectividad Durante Reserva**

**Objetivo:** El sistema mantiene consistencia cuando hay problemas de conectividad.

**Configuración:**
- Cliente está en proceso de reserva
- Se pierde conectividad a internet temporalmente
- Conexión se restaura después de 2 minutos

**Pasos de Ejecución:**
1. Cliente está en paso 3 de 4 del proceso de reserva
2. Se pierde conectividad (simular modo avión)
3. Cliente intenta continuar y ve mensaje de error
4. Se restaura conectividad después de 2 minutos
5. Cliente reintenta completar reserva

**Resultado Esperado:**
- ✅ Sistema guarda progreso del cliente localmente
- ✅ Al restaurar conexión, cliente puede continuar donde quedó
- ✅ No pierde datos ingresados (servicio, horario, etc.)
- ✅ Mensaje de error es claro y útil
- ✅ Reserva temporal se mantiene durante desconexión

---

## 📊 ESCENARIOS DE VALIDACIÓN DE BUSINESS LOGIC

### **Escenario UAT-B001: Validación de Horarios Argentinos**

**Objetivo:** El sistema maneja correctamente la zona horaria de Argentina y cambios de horario.

**Configuración:**
- Cliente en Buenos Aires reserva para mañana 10:00
- Barbero en Mendoza (misma zona horaria)
- Sistema debe manejar zona horaria Argentina/Buenos_Aires

**Validaciones:**
- ✅ Horarios se muestran en zona horaria local argentina
- ✅ Reservas respetan horarios de verano/invierno
- ✅ Notificaciones llegan en horarios locales correctos
- ✅ Reportes de barberos usan zona horaria argentina

---

### **Escenario UAT-B002: Validación de Precios en Pesos Argentinos**

**Objetivo:** Todos los cálculos financieros manejan correctamente la moneda argentina.

**Configuración:**
- Servicio cuesta $1200 ARS
- Comisión BarberPro: 3.5%
- Cliente tiene descuento de 10%

**Validaciones:**
- ✅ Precio final cliente: $1080 ARS
- ✅ Comisión BarberPro: $37.80 (3.5% de $1080)
- ✅ Barbero recibe: $1042.20
- ✅ Todos los cálculos en pesos argentinos
- ✅ Redondeo correcto a centavos

---

## 📋 DATOS DE PRUEBA REQUERIDOS

### **Base de Datos de Prueba**

#### **Usuarios de Prueba - Proveedores**
```
1. Carlos Alberto Rodríguez
   Email: carlos.test@barberpro.ar
   DNI: 35.123.456
   Barbería: "Don Carlos - Corrientes"
   
2. Martín Facundo González  
   Email: martin.test@barberpro.ar
   DNI: 32.987.654
   Tipo: Barbero independiente
   
3. Alejandro Premium Chain
   Email: alejandro.test@barberpro.ar
   DNI: 41.555.999
   Cadena: 3 locales
```

#### **Usuarios de Prueba - Clientes**
```
1. Sofía Valentina López
   Email: sofia.test@barberpro.ar
   DNI: 38.456.789
   Perfil: Profesional joven
   
2. Diego Ramón Fernández
   Email: diego.test@barberpro.ar  
   DNI: 35.789.123
   Familia: Esposa + 2 hijos
   
3. Rodrigo Alberto Mendoza
   Email: rodrigo.test@barberpro.ar
   DNI: 33.111.555
   Perfil: Cliente premium
```

#### **Servicios de Prueba**
```
Barbería Don Carlos:
- Corte de cabello: $800, 30min
- Corte + Barba: $1200, 45min  
- Afeitado clásico: $600, 25min

Martín Independiente:
- Corte Fade: $700, 35min
- Corte + Diseño: $1000, 50min
- Servicio a domicilio: $1200, 60min

Alejandro Premium:
- Experiencia Premium: $3500, 90min
- Corte Ejecutivo: $1500, 45min
- Tratamiento completo: $2200, 75min
```

#### **Horarios de Operación**
```
Lunes a Viernes: 9:00 - 19:00
Sábados: 9:00 - 17:00  
Domingos: Cerrado
Descanso: 13:00 - 14:00 (todos los días)
```

---

## ✅ CRITERIOS DE ACEPTACIÓN GENERALES

### **Performance**
- ✅ Carga inicial de app < 3 segundos en 4G
- ✅ Búsqueda de barberos < 2 segundos
- ✅ Proceso de reserva completo < 5 minutos
- ✅ Sincronización en tiempo real < 30 segundos

### **Usabilidad**
- ✅ Interface en español argentino correcto
- ✅ Navegación intuitiva en móvil y desktop
- ✅ Mensajes de error claros y útiles
- ✅ Confirmaciones visuales para todas las acciones

### **Confiabilidad**
- ✅ 99.9% de disponibilidad durante horarios comerciales
- ✅ Cero pérdida de reservas confirmadas
- ✅ Pagos procesados correctamente en 99.9% de casos
- ✅ Notificaciones entregadas en 99% de casos

### **Seguridad**
- ✅ Datos personales encriptados (DNI, tarjetas)
- ✅ Sesiones seguras con timeout apropiado
- ✅ Validación de datos en todos los formularios
- ✅ Cumplimiento con regulaciones argentinas

### **Compatibilidad Argentina**
- ✅ Integración completa con MercadoPago
- ✅ Validación de DNI argentino funcional
- ✅ Números de teléfono en formato +54
- ✅ Direcciones con provincias argentinas
- ✅ Zona horaria America/Argentina/Buenos_Aires

---

## 📞 ESCALACIÓN Y CONTACTOS

### **Equipo de Pruebas**
- **Product Owner**: Responsable de UAT
- **QA Lead**: Coordinación de ejecución  
- **Tech Lead**: Resolución de issues técnicos

### **Criterios de Escalación**
- **Crítico**: Fallo que impide registro o reservas
- **Alto**: Funcionalidad core no funciona correctamente  
- **Medio**: Problemas de usabilidad o performance
- **Bajo**: Mejoras cosméticas o texto

### **Reporte de Issues**
- Usar formato: [UAT-XXX] Descripción clara
- Incluir: Pasos para reproducir, resultado esperado vs actual
- Adjuntar: Screenshots, logs, datos de prueba utilizados

---

*Documento Version 1.0 - Creado para BarberPro MVP Sprint Día 2*  
*Próxima revisión: Post-ejecución UAT Día 3*