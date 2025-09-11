# 📚 BOOKING API DOCUMENTATION - COMPREHENSIVE ENDPOINT REFERENCE

**BarberPro Booking Management & Provider Schedule APIs**  
**Version**: 1.0  
**Date**: September 11, 2025  
**Implementation**: Ticket B4-001  

## 🎯 API Overview

This documentation covers the comprehensive booking management and provider schedule APIs implemented for BarberPro's Argentina market launch. All endpoints support Spanish language responses and Argentina timezone handling.

### Base URL
```
http://localhost:3000 (Development)
https://api.barberpro.com.ar (Production)
```

### Authentication
All endpoints require JWT authentication:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Content Type
```http
Content-Type: application/json
```

---

## 📋 BOOKING MANAGEMENT ENDPOINTS

### POST /api/v1/bookings/search
**Advanced booking search with filters and pagination**

#### Request Body:
```json
{
  "providerId": "string (optional)",
  "clientId": "string (optional)", 
  "status": ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
  "serviceId": "string (optional)",
  "dateRange": {
    "from": "2025-09-11T03:00:00.000Z",
    "to": "2025-09-18T03:00:00.000Z"
  },
  "searchTerm": "string (optional)",
  "sortBy": "startTime|createdAt|totalAmount|clientName",
  "sortOrder": "asc|desc",
  "page": 1,
  "limit": 20
}
```

#### Response:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_id",
      "startTime": "2025-09-12T15:00:00.000Z",
      "endTime": "2025-09-12T16:00:00.000Z",
      "status": "CONFIRMED",
      "totalAmount": 2500.00,
      "notes": "Corte y barba",
      "client": {
        "id": "client_id",
        "name": "Juan Pérez",
        "email": "juan@email.com",
        "phone": "+54-11-1234-5678"
      },
      "provider": {
        "id": "provider_id",
        "businessName": "Barbería Central",
        "user": { "name": "Carlos Rodríguez" }
      },
      "service": {
        "id": "service_id",
        "name": "Corte Clásico",
        "duration": 60,
        "price": 2500.00
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### PUT /api/v1/bookings/bulk-update
**Bulk update multiple bookings**

#### Request Body:
```json
{
  "bookingIds": ["booking_id_1", "booking_id_2", "booking_id_3"],
  "action": "confirm|cancel|complete|reschedule",
  "reason": "Motivo de la operación masiva",
  "newDateTime": "2025-09-15T15:00:00.000Z",
  "sendNotification": true
}
```

#### Response:
```json
{
  "success": true,
  "action": "confirm",
  "results": {
    "successful": ["booking_id_1", "booking_id_2"],
    "failed": [
      {
        "bookingId": "booking_id_3",
        "error": "Reserva ya confirmada anteriormente"
      }
    ]
  },
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "message": "Operación completada: 2 exitosas, 1 fallidas"
}
```

### POST /api/v1/bookings/:bookingId/modification-request
**Client requests modification to existing booking**

#### Request Body:
```json
{
  "modificationType": "reschedule|service_change|cancellation",
  "newDateTime": "2025-09-12T15:00:00.000Z",
  "newServiceId": "service_id_new",
  "reason": "Cambio de horario por compromiso laboral",
  "urgent": false
}
```

#### Response:
```json
{
  "success": true,
  "modificationRequestId": "mod_req_12345",
  "booking": {
    "id": "booking_id",
    "startTime": "2025-09-12T14:00:00.000Z",
    "service": "Corte Clásico"
  },
  "request": {
    "modificationType": "reschedule",
    "newDateTime": "2025-09-12T15:00:00.000Z",
    "reason": "Cambio de horario por compromiso laboral",
    "urgent": false,
    "status": "PENDING"
  },
  "message": "Solicitud de modificación enviada al proveedor"
}
```

### POST /api/v1/bookings/:bookingId/modification-request/:requestId/respond
**Provider responds to modification request**

#### Request Body:
```json
{
  "response": "approve|reject|counter_offer",
  "reason": "Horario disponible confirmado",
  "counterOffer": {
    "newDateTime": "2025-09-12T16:00:00.000Z",
    "newServiceId": "service_id",
    "message": "¿Te parece bien a las 16:00?"
  }
}
```

#### Response:
```json
{
  "success": true,
  "requestId": "mod_req_12345",
  "response": "approve",
  "booking": {
    "id": "booking_id",
    "startTime": "2025-09-12T15:00:00.000Z",
    "status": "CONFIRMED"
  },
  "message": "Solicitud de modificación aprobada"
}
```

### GET /api/v1/bookings/:bookingId/timeline
**Get complete booking timeline and history**

#### Response:
```json
{
  "success": true,
  "booking": {
    "id": "booking_id",
    "status": "CONFIRMED",
    "startTime": "2025-09-12T15:00:00.000Z",
    "endTime": "2025-09-12T16:00:00.000Z"
  },
  "timeline": [
    {
      "event": "booking_created",
      "timestamp": "2025-09-10T10:00:00.000Z",
      "actor": "client",
      "actorName": "Juan Pérez",
      "description": "Reserva creada",
      "details": {
        "service": "Corte Clásico",
        "amount": 2500.00
      }
    },
    {
      "event": "booking_confirmed",
      "timestamp": "2025-09-10T10:30:00.000Z",
      "actor": "provider",
      "actorName": "Carlos Rodríguez",
      "description": "Reserva confirmada"
    }
  ],
  "timelineCount": 2
}
```

### POST /api/v1/bookings/:bookingId/automatic-expiration
**Set automatic expiration for pending bookings**

#### Request Body:
```json
{
  "expirationHours": 24,
  "notifyBeforeExpiration": true,
  "notificationHours": 2
}
```

#### Response:
```json
{
  "success": true,
  "bookingId": "booking_id",
  "automaticExpiration": {
    "enabled": true,
    "expirationTime": "2025-09-12T10:00:00.000Z",
    "notificationTime": "2025-09-12T08:00:00.000Z",
    "expirationHours": 24,
    "notificationHours": 2
  },
  "message": "Expiración automática configurada exitosamente"
}
```

---

## 📋 PROVIDER SCHEDULE MANAGEMENT ENDPOINTS

### GET /api/v1/providers/schedule/:providerId
**Get provider's current schedule configuration**

#### Response:
```json
{
  "success": true,
  "providerId": "provider_id",
  "providerName": "Carlos Rodríguez",
  "workingHours": {
    "monday": {
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00",
      "breaks": [
        {
          "start": "13:00",
          "end": "14:00"
        }
      ]
    },
    "tuesday": {
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00"
    },
    "sunday": {
      "isOpen": false
    }
  },
  "timezone": "America/Argentina/Buenos_Aires",
  "lastUpdated": "2025-09-11T06:00:00.000Z"
}
```

### PUT /api/v1/providers/schedule/:providerId
**Update provider's working hours and schedule**

#### Request Body:
```json
{
  "workingHours": {
    "monday": {
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00",
      "breaks": [
        {
          "start": "13:00",
          "end": "14:00"
        }
      ]
    },
    "tuesday": {
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00"
    },
    "wednesday": {
      "isOpen": false
    }
  }
}
```

#### Response:
```json
{
  "success": true,
  "providerId": "provider_id",
  "workingHours": {
    "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "18:00" }
  },
  "message": "Horario actualizado exitosamente",
  "lastUpdated": "2025-09-11T06:30:00.000Z"
}
```

### POST /api/v1/providers/schedule/:providerId/templates
**Create reusable schedule template**

#### Request Body:
```json
{
  "name": "Horario Estándar",
  "description": "Lunes a viernes 9-18, sábados 9-15",
  "workingHours": {
    "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"},
    "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"},
    "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"},
    "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"},
    "friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"},
    "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "15:00"},
    "sunday": {"isOpen": false}
  }
}
```

#### Response:
```json
{
  "success": true,
  "templateId": "template_12345",
  "template": {
    "name": "Horario Estándar",
    "description": "Lunes a viernes 9-18, sábados 9-15",
    "workingHours": { /* working hours object */ }
  },
  "message": "Plantilla de horario creada exitosamente"
}
```

### POST /api/v1/providers/schedule/:providerId/exceptions
**Add special date exceptions (holidays, special hours)**

#### Request Body:
```json
{
  "date": "2025-12-25",
  "type": "closed|special_hours",
  "specialHours": {
    "openTime": "09:00",
    "closeTime": "14:00",
    "breaks": []
  },
  "reason": "Navidad",
  "recurring": true
}
```

#### Response:
```json
{
  "success": true,
  "exceptionId": "exception_12345",
  "exception": {
    "date": "2025-12-25",
    "type": "closed",
    "reason": "Navidad",
    "recurring": true,
    "createdAt": "2025-09-11T06:00:00.000Z"
  },
  "affectedBookingsCount": 0,
  "message": "Excepción de horario agregada exitosamente"
}
```

### PUT /api/v1/providers/schedule/:providerId/bulk-update
**Bulk update working hours for multiple days**

#### Request Body:
```json
{
  "operation": "apply_template|set_hours|add_breaks",
  "templateId": "template_12345",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "workingHours": {
    "openTime": "08:00",
    "closeTime": "17:00",
    "breaks": [
      {
        "start": "12:00",
        "end": "13:00"
      }
    ]
  }
}
```

#### Response:
```json
{
  "success": true,
  "providerId": "provider_id",
  "operation": "apply_template",
  "affectedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "workingHours": { /* updated working hours */ },
  "message": "Horarios actualizados para 5 días"
}
```

### POST /api/v1/providers/schedule/:providerId/conflicts/validate
**Validate proposed schedule changes against existing bookings**

#### Request Body:
```json
{
  "proposedSchedule": {
    "monday": {
      "isOpen": true,
      "openTime": "10:00",
      "closeTime": "16:00"
    }
  },
  "dateRange": {
    "from": "2025-09-11",
    "to": "2025-09-18"
  }
}
```

#### Response:
```json
{
  "success": true,
  "hasConflicts": true,
  "conflictsCount": 2,
  "conflicts": [
    {
      "type": "outside_hours",
      "bookingId": "booking_123",
      "clientName": "Juan Pérez",
      "serviceName": "Corte Clásico",
      "startTime": "2025-09-12T09:00:00.000Z",
      "endTime": "2025-09-12T10:00:00.000Z",
      "proposedHours": "10:00 - 16:00",
      "message": "Reserva de Juan Pérez está fuera del horario propuesto"
    }
  ],
  "totalBookingsChecked": 25,
  "dateRange": {
    "from": "2025-09-11",
    "to": "2025-09-18"
  },
  "canApplyChanges": false
}
```

---

## 📋 ADVANCED BOOKING ENDPOINTS (Tech Lead Foundation)

### POST /api/v1/bookings/advanced/availability/check
**Real-time availability checking with conflict detection**

#### Request Body:
```json
{
  "providerId": "provider_id",
  "serviceId": "service_id",
  "startTime": "2025-09-12T15:00:00.000Z",
  "excludeBookingId": "booking_id_optional"
}
```

#### Response:
```json
{
  "available": true,
  "conflicts": [],
  "suggestedSlots": [],
  "timeSlot": {
    "start": "2025-09-12T15:00:00.000Z",
    "end": "2025-09-12T16:00:00.000Z"
  }
}
```

### GET /api/v1/bookings/advanced/availability/:providerId/:date
**Get all available slots for a provider on a specific date**

#### Query Parameters:
- `serviceId` (required): Service ID for duration calculation

#### Response:
```json
{
  "success": true,
  "providerId": "provider_id",
  "serviceId": "service_id",
  "date": "2025-09-12T00:00:00.000Z",
  "availableSlots": [
    {
      "start": "2025-09-12T09:00:00.000Z",
      "end": "2025-09-12T10:00:00.000Z"
    },
    {
      "start": "2025-09-12T10:15:00.000Z",
      "end": "2025-09-12T11:15:00.000Z"
    }
  ],
  "count": 12
}
```

### POST /api/v1/bookings/advanced/create-with-lock
**Create booking with advanced double-booking prevention**

#### Request Body:
```json
{
  "providerId": "provider_id",
  "serviceId": "service_id",
  "startTime": "2025-09-12T15:00:00.000Z",
  "notes": "Reserva con prevención de conflictos"
}
```

#### Response:
```json
{
  "success": true,
  "booking": {
    "id": "booking_id",
    "clientId": "client_id",
    "providerId": "provider_id",
    "serviceId": "service_id",
    "startTime": "2025-09-12T15:00:00.000Z",
    "endTime": "2025-09-12T16:00:00.000Z",
    "status": "PENDING",
    "totalAmount": 2500.00
  },
  "message": "Reserva creada exitosamente"
}
```

### POST /api/v1/bookings/advanced/recurring
**Create recurring appointments**

#### Request Body:
```json
{
  "providerId": "provider_id",
  "serviceId": "service_id", 
  "startTime": "2025-09-12T15:00:00.000Z",
  "recurringPattern": {
    "frequency": "daily|weekly|biweekly|monthly",
    "occurrences": 4,
    "endDate": "2025-10-12T15:00:00.000Z"
  },
  "notes": "Citas semanales de mantenimiento"
}
```

#### Response:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_1",
      "startTime": "2025-09-12T15:00:00.000Z"
    },
    {
      "id": "booking_2", 
      "startTime": "2025-09-19T15:00:00.000Z"
    }
  ],
  "failed": [],
  "message": "2 reservas creadas exitosamente"
}
```

### POST /api/v1/bookings/advanced/group
**Create group session bookings**

#### Request Body:
```json
{
  "providerId": "provider_id",
  "serviceId": "service_id",
  "startTime": "2025-09-12T15:00:00.000Z",
  "clientIds": ["client_id_1", "client_id_2", "client_id_3"],
  "maxParticipants": 5,
  "notes": "Sesión grupal de capacitación"
}
```

#### Response:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_1",
      "clientId": "client_id_1"
    },
    {
      "id": "booking_2",
      "clientId": "client_id_2"
    }
  ],
  "message": "Sesión grupal creada con 2 participantes"
}
```

---

## 🔄 REAL-TIME SOCKET.IO EVENTS

### Client → Server Events

#### Subscribe to Booking Updates
```javascript
socket.emit('booking:subscribe', { bookingId: 'booking_id' });
```

#### Subscribe to Provider Schedule Updates
```javascript
socket.emit('provider:schedule:subscribe', { providerId: 'provider_id' });
```

#### Subscribe to Availability Updates
```javascript
socket.emit('availability:subscribe', { providerId: 'provider_id' });
```

### Server → Client Events

#### Booking Updated
```javascript
socket.on('booking:updated', (data) => {
  // data.bookingId, data.action, data.booking, data.timestamp
});
```

#### Schedule Updated
```javascript
socket.on('schedule:updated', (data) => {
  // data.providerId, data.workingHours, data.timestamp
});
```

#### Availability Updated
```javascript
socket.on('availability:updated', (data) => {
  // data.providerId, data.date, data.availability, data.timestamp
});
```

#### Notifications
```javascript
socket.on('notification', (data) => {
  // data.type, data.message, data.timestamp
});
```

---

## ❌ ERROR RESPONSES

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Token de acceso requerido",
  "statusCode": 401
}
```

### Authorization Errors
```json
{
  "error": "Forbidden", 
  "message": "No tiene permisos para realizar esta acción",
  "statusCode": 403
}
```

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Datos de entrada inválidos",
  "details": [
    "openTime es requerido",
    "Formato de hora inválido"
  ],
  "statusCode": 400
}
```

### Business Rule Violations
```json
{
  "error": "Business Rule Violation",
  "message": "Las cancelaciones deben realizarse con al menos 24 horas de anticipación",
  "statusCode": 400
}
```

### Conflict Errors
```json
{
  "error": "Booking Conflict",
  "message": "El horario solicitado no está disponible",
  "conflicts": [
    {
      "type": "OVERLAP",
      "message": "Conflicto directo con reserva existente"
    }
  ],
  "suggestedSlots": [
    {
      "start": "2025-09-12T16:00:00.000Z",
      "end": "2025-09-12T17:00:00.000Z"
    }
  ],
  "statusCode": 409
}
```

### Not Found Errors
```json
{
  "error": "Not Found",
  "message": "Recurso no encontrado",
  "statusCode": 404
}
```

---

## 🌍 ARGENTINA MARKET FEATURES

### Timezone Support
- All times handled in `America/Argentina/Buenos_Aires`
- Automatic DST handling
- Consistent timezone in responses

### Language Support
- All user-facing messages in Argentine Spanish
- Error messages localized
- Business terms adapted for Argentina

### Business Rules
- 24-hour cancellation policy
- Siesta time support (13:00-14:00 breaks)
- Argentina holiday integration ready
- DNI validation ready for user verification

### Phone Number Format
- Argentine phone format: `+54-11-1234-5678`
- Mobile format: `+54-9-11-1234-5678`

---

## 🔒 SECURITY CONSIDERATIONS

### Authentication Required
All endpoints require valid JWT token in Authorization header

### Permission Levels
- **CLIENT**: Can only access own bookings and request modifications
- **PROVIDER**: Can manage own schedule and bookings
- **ADMIN**: Full access to all operations

### Input Validation
- All inputs validated with JSON schemas
- SQL injection prevention with Prisma ORM
- XSS prevention with input sanitization

### Rate Limiting
- Standard rate limits applied per endpoint
- Bulk operations have specific limits (max 50 items)

---

## 📊 PERFORMANCE SPECIFICATIONS

### Response Time Targets
- **Search Operations**: <500ms
- **Bulk Operations**: <2 seconds for 50 items
- **Schedule Updates**: <200ms
- **Real-time Events**: <100ms latency

### Pagination
- Default limit: 20 items
- Maximum limit: 100 items
- Cursor-based pagination for large datasets

---

**API Documentation Complete**  
*Total Endpoints*: 12 new booking/schedule management endpoints  
*Real-time Events*: 8 Socket.io event types  
*Argentina Market*: Fully localized with timezone support  
*Security*: JWT authentication with role-based permissions  

This comprehensive API provides all the functionality needed for BarberPro's Argentina market launch with advanced booking management and provider schedule control.