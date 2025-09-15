# API Requirements Specification - BarberPro MVP

**Product Owner:** Claude Code  
**Date:** September 10, 2025  
**Version:** 1.0 - MVP Specification  
**Target Audience:** Backend Developer, Tech Lead, Frontend Developer  

---

## API Architecture Overview

### Base Configuration
- **Base URL:** `https://api.barberpro.com.ar/v1`
- **Authentication:** JWT Bearer tokens
- **Content Type:** `application/json`
- **Rate Limiting:** 100 requests/minute per user, 1000/minute per IP
- **Error Format:** RFC 7807 Problem Details
- **Pagination:** Cursor-based for large datasets
- **Versioning:** URL path versioning (/v1/, /v2/)

### Response Standards
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-09-10T10:30:00Z",
    "requestId": "req_12345",
    "version": "1.0"
  },
  "errors": []
}
```

---

## 1. AUTHENTICATION & USER MANAGEMENT

### POST /auth/register
**Purpose:** Register new users (clients and providers)  
**Priority:** P0 - Critical Path  
**Implementation:** Day 2-3  

```json
{
  "request": {
    "email": "carlos@barbershop.com.ar",
    "password": "SecurePass123!",
    "name": "Carlos Martinez",
    "phone": "+54 11 4444-5555",
    "role": "PROVIDER",
    "businessName": "Barbería Carlos",
    "acceptedTerms": true,
    "marketingConsent": false
  },
  "response": {
    "success": true,
    "data": {
      "user": {
        "id": "usr_abc123",
        "email": "carlos@barbershop.com.ar",
        "name": "Carlos Martinez",
        "role": "PROVIDER",
        "verified": false,
        "createdAt": "2025-09-10T10:30:00Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "rt_def456",
      "expiresIn": 3600
    }
  },
  "errors": [
    {
      "code": "EMAIL_EXISTS",
      "message": "Este email ya está registrado",
      "field": "email"
    },
    {
      "code": "WEAK_PASSWORD",
      "message": "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número",
      "field": "password"
    },
    {
      "code": "INVALID_PHONE",
      "message": "Formato de teléfono inválido para Argentina",
      "field": "phone"
    }
  ]
}
```

**Validation Rules:**
- Email: Valid format, unique, max 255 chars
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Phone: Argentina format (+54 XX XXXX-XXXX)
- BusinessName: Required if role=PROVIDER, max 100 chars
- Terms acceptance: Required

### POST /auth/login
**Purpose:** Authenticate existing users  
**Priority:** P0 - Critical Path  
**Implementation:** Day 2-3  

```json
{
  "request": {
    "email": "carlos@barbershop.com.ar",
    "password": "SecurePass123!",
    "rememberMe": true
  },
  "response": {
    "success": true,
    "data": {
      "user": {
        "id": "usr_abc123",
        "email": "carlos@barbershop.com.ar",
        "name": "Carlos Martinez",
        "role": "PROVIDER",
        "verified": true,
        "profileComplete": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "rt_def456",
      "expiresIn": 3600
    }
  },
  "errors": [
    {
      "code": "INVALID_CREDENTIALS",
      "message": "Email o contraseña incorrectos"
    },
    {
      "code": "EMAIL_NOT_VERIFIED",
      "message": "Debes verificar tu email antes de iniciar sesión"
    },
    {
      "code": "ACCOUNT_SUSPENDED",
      "message": "Tu cuenta ha sido suspendida. Contacta soporte."
    }
  ]
}
```

### POST /auth/verify-email
**Purpose:** Verify user email address  
**Priority:** P0 - Critical Path  
**Implementation:** Day 3  

```json
{
  "request": {
    "token": "email_verification_token_here"
  },
  "response": {
    "success": true,
    "data": {
      "verified": true,
      "message": "Email verificado exitosamente"
    }
  }
}
```

### POST /auth/refresh-token
**Purpose:** Refresh expired JWT tokens  
**Priority:** P0 - Critical Path  
**Implementation:** Day 3  

### POST /auth/forgot-password
**Purpose:** Initiate password reset flow  
**Priority:** P1 - Should Have  
**Implementation:** Day 8-10  

### GET /users/me
**Purpose:** Get current user profile  
**Priority:** P0 - Critical Path  
**Implementation:** Day 3  

```json
{
  "response": {
    "success": true,
    "data": {
      "user": {
        "id": "usr_abc123",
        "email": "carlos@barbershop.com.ar",
        "name": "Carlos Martinez",
        "phone": "+54 11 4444-5555",
        "role": "PROVIDER",
        "verified": true,
        "profileImage": "https://cdn.barberpro.com.ar/profiles/usr_abc123.jpg",
        "createdAt": "2025-09-10T10:30:00Z",
        "lastLoginAt": "2025-09-10T15:45:00Z"
      }
    }
  }
}
```

### PUT /users/me
**Purpose:** Update current user profile  
**Priority:** P0 - Critical Path  
**Implementation:** Day 4  

---

## 2. PROVIDER MANAGEMENT

### GET /providers/profile
**Purpose:** Get provider business profile  
**Priority:** P0 - Critical Path  
**Implementation:** Day 4  

```json
{
  "response": {
    "success": true,
    "data": {
      "provider": {
        "id": "prov_xyz789",
        "userId": "usr_abc123",
        "businessName": "Barbería Carlos",
        "description": "Barbería tradicional con más de 10 años de experiencia...",
        "address": {
          "street": "Av. Corrientes 1234",
          "neighborhood": "San Telmo",
          "city": "Buenos Aires",
          "province": "Buenos Aires",
          "postalCode": "C1043AAZ",
          "coordinates": {
            "lat": -34.6037,
            "lng": -58.3816
          }
        },
        "contact": {
          "phone": "+54 11 4444-5555",
          "whatsapp": "+54 11 4444-5555",
          "instagram": "@barberiacarlos"
        },
        "specializations": ["Corte clásico", "Arreglo de barba", "Peinado"],
        "workingHours": {
          "monday": {"open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
          "tuesday": {"open": "09:00", "close": "18:00", "breaks": []},
          "wednesday": {"open": "09:00", "close": "18:00", "breaks": []},
          "thursday": {"open": "09:00", "close": "18:00", "breaks": []},
          "friday": {"open": "09:00", "close": "19:00", "breaks": []},
          "saturday": {"open": "08:00", "close": "17:00", "breaks": []},
          "sunday": {"closed": true}
        },
        "images": {
          "profile": "https://cdn.barberpro.com.ar/providers/prov_xyz789/profile.jpg",
          "gallery": [
            "https://cdn.barberpro.com.ar/providers/prov_xyz789/gallery1.jpg",
            "https://cdn.barberpro.com.ar/providers/prov_xyz789/gallery2.jpg"
          ]
        },
        "verification": {
          "verified": true,
          "dniVerified": true,
          "businessVerified": false,
          "verifiedAt": "2025-09-10T12:00:00Z"
        },
        "rating": {
          "average": 4.7,
          "count": 156,
          "distribution": {
            "5": 120,
            "4": 25,
            "3": 8,
            "2": 2,
            "1": 1
          }
        },
        "stats": {
          "totalBookings": 342,
          "completedBookings": 325,
          "responseTime": "2 hours",
          "joinedAt": "2025-01-15T00:00:00Z"
        }
      }
    }
  }
}
```

### PUT /providers/profile
**Purpose:** Update provider business profile  
**Priority:** P0 - Critical Path  
**Implementation:** Day 4-5  

```json
{
  "request": {
    "businessName": "Barbería Carlos Premium",
    "description": "Updated description...",
    "address": {
      "street": "Av. Corrientes 1234",
      "neighborhood": "San Telmo",
      "city": "Buenos Aires",
      "province": "Buenos Aires",
      "postalCode": "C1043AAZ"
    },
    "specializations": ["Corte clásico", "Arreglo de barba", "Peinado", "Tratamientos capilares"],
    "workingHours": {
      "monday": {"open": "09:00", "close": "18:00", "breaks": []}
    }
  }
}
```

### POST /providers/images
**Purpose:** Upload provider images (profile and gallery)  
**Priority:** P1 - Should Have  
**Implementation:** Day 6-7  

```json
{
  "request": {
    "type": "PROFILE | GALLERY",
    "image": "multipart/form-data"
  },
  "response": {
    "success": true,
    "data": {
      "imageUrl": "https://cdn.barberpro.com.ar/providers/prov_xyz789/image.jpg",
      "thumbnailUrl": "https://cdn.barberpro.com.ar/providers/prov_xyz789/thumb_image.jpg"
    }
  }
}
```

### POST /providers/verification/dni
**Purpose:** Submit DNI for verification  
**Priority:** P1 - Should Have  
**Implementation:** Day 7-8  

---

## 3. SERVICE MANAGEMENT

### GET /providers/services
**Purpose:** Get provider's service catalog  
**Priority:** P0 - Critical Path  
**Implementation:** Day 5  

```json
{
  "response": {
    "success": true,
    "data": {
      "services": [
        {
          "id": "svc_123",
          "name": "Corte Clásico",
          "description": "Corte de pelo tradicional con tijera y máquina",
          "duration": 30,
          "price": 2500.00,
          "category": "Corte de pelo",
          "active": true,
          "images": ["https://cdn.barberpro.com.ar/services/svc_123.jpg"],
          "tags": ["popular", "hombres"],
          "createdAt": "2025-09-01T00:00:00Z",
          "updatedAt": "2025-09-10T10:00:00Z"
        },
        {
          "id": "svc_124",
          "name": "Arreglo de Barba",
          "description": "Recorte, perfilado y aceites para barba",
          "duration": 20,
          "price": 1800.00,
          "category": "Barba",
          "active": true,
          "images": [],
          "tags": ["barba", "hombres"],
          "createdAt": "2025-09-01T00:00:00Z",
          "updatedAt": "2025-09-05T14:30:00Z"
        }
      ]
    }
  }
}
```

### POST /providers/services
**Purpose:** Create new service  
**Priority:** P0 - Critical Path  
**Implementation:** Day 5  

```json
{
  "request": {
    "name": "Corte Premium",
    "description": "Corte personalizado con lavado y peinado",
    "duration": 45,
    "price": 3500.00,
    "category": "Corte de pelo",
    "tags": ["premium", "completo"]
  },
  "response": {
    "success": true,
    "data": {
      "service": {
        "id": "svc_125",
        "name": "Corte Premium",
        "description": "Corte personalizado con lavado y peinado",
        "duration": 45,
        "price": 3500.00,
        "category": "Corte de pelo",
        "active": true,
        "createdAt": "2025-09-10T10:30:00Z"
      }
    }
  },
  "errors": [
    {
      "code": "DUPLICATE_SERVICE_NAME",
      "message": "Ya tienes un servicio con este nombre"
    },
    {
      "code": "INVALID_DURATION",
      "message": "La duración debe ser entre 15 y 180 minutos"
    },
    {
      "code": "INVALID_PRICE",
      "message": "El precio debe ser mayor a $500 ARS"
    }
  ]
}
```

### PUT /providers/services/{serviceId}
**Purpose:** Update existing service  
**Priority:** P0 - Critical Path  
**Implementation:** Day 5  

### DELETE /providers/services/{serviceId}
**Purpose:** Deactivate service (soft delete)  
**Priority:** P1 - Should Have  
**Implementation:** Day 6  

---

## 4. AVAILABILITY & SCHEDULING

### GET /providers/{providerId}/availability
**Purpose:** Get provider availability for booking  
**Priority:** P0 - Critical Path  
**Implementation:** Day 6  

```json
{
  "query": {
    "date": "2025-09-15",
    "serviceId": "svc_123",
    "duration": 30
  },
  "response": {
    "success": true,
    "data": {
      "date": "2025-09-15",
      "provider": {
        "id": "prov_xyz789",
        "businessName": "Barbería Carlos",
        "bufferTime": 10
      },
      "service": {
        "id": "svc_123",
        "name": "Corte Clásico",
        "duration": 30
      },
      "workingHours": {
        "open": "09:00",
        "close": "18:00",
        "breaks": [{"start": "13:00", "end": "14:00"}]
      },
      "availableSlots": [
        {
          "time": "09:00",
          "available": true,
          "endTime": "09:30"
        },
        {
          "time": "09:40",
          "available": true,
          "endTime": "10:10"
        },
        {
          "time": "10:20",
          "available": false,
          "reason": "BOOKED",
          "endTime": "10:50"
        },
        {
          "time": "14:00",
          "available": true,
          "endTime": "14:30"
        }
      ],
      "bookedSlots": [
        {
          "start": "10:20",
          "end": "10:50",
          "serviceId": "svc_124"
        }
      ],
      "blockedSlots": [
        {
          "start": "13:00",
          "end": "14:00",
          "reason": "BREAK"
        }
      ]
    }
  }
}
```

### PUT /providers/availability
**Purpose:** Update provider availability/working hours  
**Priority:** P0 - Critical Path  
**Implementation:** Day 6  

### POST /providers/availability/block
**Purpose:** Block specific time slots (holidays, personal time)  
**Priority:** P1 - Should Have  
**Implementation:** Day 7  

---

## 5. BOOKING MANAGEMENT

### POST /bookings
**Purpose:** Create new booking  
**Priority:** P0 - Critical Path  
**Implementation:** Day 7-8  

```json
{
  "request": {
    "providerId": "prov_xyz789",
    "serviceId": "svc_123",
    "startTime": "2025-09-15T14:00:00Z",
    "notes": "Primera vez, corte no muy corto por favor",
    "clientContact": {
      "phone": "+54 11 5555-6666",
      "preferredContactMethod": "whatsapp"
    }
  },
  "response": {
    "success": true,
    "data": {
      "booking": {
        "id": "book_456",
        "status": "CONFIRMED",
        "client": {
          "id": "usr_def456",
          "name": "Sofia Rodriguez",
          "phone": "+54 11 5555-6666"
        },
        "provider": {
          "id": "prov_xyz789",
          "businessName": "Barbería Carlos",
          "address": "Av. Corrientes 1234, San Telmo"
        },
        "service": {
          "id": "svc_123",
          "name": "Corte Clásico",
          "duration": 30,
          "price": 2500.00
        },
        "schedule": {
          "startTime": "2025-09-15T14:00:00Z",
          "endTime": "2025-09-15T14:30:00Z",
          "timezone": "America/Argentina/Buenos_Aires"
        },
        "payment": {
          "status": "PENDING",
          "total": 2500.00,
          "currency": "ARS",
          "method": null
        },
        "notes": "Primera vez, corte no muy corto por favor",
        "createdAt": "2025-09-10T10:30:00Z",
        "confirmationCode": "BC-456789"
      }
    }
  },
  "errors": [
    {
      "code": "SLOT_NOT_AVAILABLE",
      "message": "Este horario ya no está disponible",
      "suggestedTimes": ["14:40", "15:00", "15:20"]
    },
    {
      "code": "PROVIDER_NOT_AVAILABLE",
      "message": "El proveedor no está disponible en esta fecha"
    },
    {
      "code": "SERVICE_NOT_ACTIVE",
      "message": "Este servicio no está disponible actualmente"
    }
  ]
}
```

### GET /bookings
**Purpose:** Get user's bookings (client or provider view)  
**Priority:** P0 - Critical Path  
**Implementation:** Day 8  

```json
{
  "query": {
    "status": "CONFIRMED,PENDING",
    "from": "2025-09-10",
    "to": "2025-09-30",
    "limit": 20,
    "cursor": "book_456"
  },
  "response": {
    "success": true,
    "data": {
      "bookings": [
        {
          "id": "book_456",
          "status": "CONFIRMED",
          "client": {
            "name": "Sofia Rodriguez",
            "phone": "+54 11 5555-6666"
          },
          "service": {
            "name": "Corte Clásico",
            "duration": 30
          },
          "startTime": "2025-09-15T14:00:00Z",
          "endTime": "2025-09-15T14:30:00Z",
          "payment": {
            "status": "PAID",
            "total": 2500.00
          },
          "canCancel": true,
          "canModify": true
        }
      ],
      "pagination": {
        "hasMore": true,
        "nextCursor": "book_457",
        "total": 45
      }
    }
  }
}
```

### GET /bookings/{bookingId}
**Purpose:** Get specific booking details  
**Priority:** P0 - Critical Path  
**Implementation:** Day 8  

### PUT /bookings/{bookingId}/status
**Purpose:** Update booking status (confirm, cancel, complete)  
**Priority:** P1 - Should Have  
**Implementation:** Day 9  

---

## 6. SEARCH & DISCOVERY

### GET /search/providers
**Purpose:** Search providers with filters  
**Priority:** P0 - Critical Path  
**Implementation:** Day 9  

```json
{
  "query": {
    "location": "San Telmo, Buenos Aires",
    "service": "Corte de pelo",
    "date": "2025-09-15",
    "time": "14:00",
    "maxDistance": 5,
    "minRating": 4.0,
    "verified": true,
    "sortBy": "distance",
    "limit": 20,
    "offset": 0
  },
  "response": {
    "success": true,
    "data": {
      "providers": [
        {
          "id": "prov_xyz789",
          "businessName": "Barbería Carlos",
          "rating": 4.7,
          "reviewCount": 156,
          "verified": true,
          "distance": 1.2,
          "profileImage": "https://cdn.barberpro.com.ar/providers/prov_xyz789/profile.jpg",
          "address": {
            "neighborhood": "San Telmo",
            "city": "Buenos Aires"
          },
          "specializations": ["Corte clásico", "Arreglo de barba"],
          "priceRange": {
            "min": 1800,
            "max": 4500
          },
          "nextAvailable": "2025-09-15T14:00:00Z",
          "responseTime": "2 hours",
          "featured": false
        }
      ],
      "filters": {
        "appliedFilters": {
          "location": "San Telmo, Buenos Aires",
          "maxDistance": 5,
          "verified": true
        },
        "availableFilters": {
          "priceRanges": [
            {"label": "$1,000 - $2,500", "min": 1000, "max": 2500, "count": 12},
            {"label": "$2,500 - $4,000", "min": 2500, "max": 4000, "count": 8}
          ],
          "specializations": [
            {"name": "Corte clásico", "count": 45},
            {"name": "Arreglo de barba", "count": 32}
          ]
        }
      },
      "pagination": {
        "total": 45,
        "limit": 20,
        "offset": 0,
        "hasMore": true
      }
    }
  }
}
```

### GET /providers/{providerId}
**Purpose:** Get specific provider public profile  
**Priority:** P0 - Critical Path  
**Implementation:** Day 9  

---

## 7. PAYMENT PROCESSING

### POST /payments/create-preference
**Purpose:** Create MercadoPago payment preference  
**Priority:** P0 - Critical Path  
**Implementation:** Day 10-11  

```json
{
  "request": {
    "bookingId": "book_456",
    "items": [
      {
        "title": "Corte Clásico - Barbería Carlos",
        "description": "Servicio de corte de pelo",
        "quantity": 1,
        "unit_price": 2500.00,
        "currency_id": "ARS"
      }
    ],
    "payer": {
      "name": "Sofia",
      "surname": "Rodriguez",
      "email": "sofia@email.com",
      "phone": {
        "area_code": "11",
        "number": "5555-6666"
      }
    },
    "back_urls": {
      "success": "https://barberpro.com.ar/payment/success",
      "failure": "https://barberpro.com.ar/payment/failure",
      "pending": "https://barberpro.com.ar/payment/pending"
    },
    "notification_url": "https://api.barberpro.com.ar/v1/payments/webhook"
  },
  "response": {
    "success": true,
    "data": {
      "preferenceId": "123456789-abc123-def456",
      "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc123-def456",
      "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc123-def456",
      "expiresAt": "2025-09-10T11:30:00Z"
    }
  }
}
```

### POST /payments/webhook
**Purpose:** Handle MercadoPago payment notifications  
**Priority:** P0 - Critical Path  
**Implementation:** Day 11  

```json
{
  "request": {
    "action": "payment.created",
    "api_version": "v1",
    "data": {
      "id": "12345678901"
    },
    "date_created": "2025-09-10T10:30:00.000-04:00",
    "id": 12345,
    "live_mode": true,
    "type": "payment",
    "user_id": "USER_ID"
  },
  "response": {
    "status": 200,
    "body": "OK"
  }
}
```

### GET /payments/{paymentId}
**Purpose:** Get payment details  
**Priority:** P0 - Critical Path  
**Implementation:** Day 11  

---

## 8. REVIEW SYSTEM

### POST /reviews
**Purpose:** Create review after booking completion  
**Priority:** P0 - Critical Path  
**Implementation:** Day 12  

```json
{
  "request": {
    "bookingId": "book_456",
    "rating": 5,
    "comment": "Excelente servicio, muy profesional y puntual. Recomendado!",
    "categories": {
      "quality": 5,
      "timeliness": 5,
      "cleanliness": 5,
      "value": 4,
      "communication": 5
    },
    "anonymous": false
  },
  "response": {
    "success": true,
    "data": {
      "review": {
        "id": "rev_789",
        "booking": {
          "id": "book_456",
          "service": "Corte Clásico"
        },
        "client": {
          "name": "Sofia R.",
          "verified": true
        },
        "rating": 5,
        "comment": "Excelente servicio, muy profesional y puntual. Recomendado!",
        "categories": {
          "quality": 5,
          "timeliness": 5,
          "cleanliness": 5,
          "value": 4,
          "communication": 5
        },
        "createdAt": "2025-09-16T10:30:00Z",
        "helpful": 0,
        "reported": false
      }
    }
  }
}
```

### GET /providers/{providerId}/reviews
**Purpose:** Get provider reviews with pagination  
**Priority:** P0 - Critical Path  
**Implementation:** Day 12  

---

## 9. NOTIFICATIONS

### POST /notifications/send
**Purpose:** Send notification to user  
**Priority:** P1 - Should Have  
**Implementation:** Day 13  

### GET /notifications
**Purpose:** Get user notifications  
**Priority:** P1 - Should Have  
**Implementation:** Day 13  

---

## API Implementation Priority & Timeline

### **Phase 1: Core Foundation (Days 2-5)**
1. Authentication endpoints (register, login, verify, refresh)
2. User profile management
3. Provider profile creation and updates
4. Service catalog management

### **Phase 2: Booking System (Days 6-9)**
1. Availability calculation and display
2. Booking creation and management
3. Provider search and discovery
4. Booking status updates

### **Phase 3: Payments & Reviews (Days 10-13)**
1. MercadoPago integration (preference creation, webhooks)
2. Payment status tracking
3. Review system (creation, display)
4. Notification system

### **Phase 4: Polish & Testing (Days 14)**
1. Error handling improvements
2. Performance optimization
3. API documentation completion
4. Integration testing

---

## Error Handling Standards

### HTTP Status Codes
- **200 OK:** Successful request
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Invalid or missing authentication
- **403 Forbidden:** Valid auth but insufficient permissions
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Business logic conflict (e.g., time slot taken)
- **422 Unprocessable Entity:** Validation errors
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error

### Error Response Format
```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Los datos proporcionados no son válidos",
      "field": "email",
      "details": {
        "received": "invalid-email",
        "expected": "valid email format"
      }
    }
  ],
  "meta": {
    "timestamp": "2025-09-10T10:30:00Z",
    "requestId": "req_12345"
  }
}
```

---

## Security Requirements

### Authentication & Authorization
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Role-based access control (CLIENT, PROVIDER, ADMIN)
- Rate limiting per user and IP
- Input validation and sanitization

### Data Protection
- HTTPS only (TLS 1.2+)
- Encrypted sensitive data at rest
- No sensitive data in logs
- CORS properly configured
- API versioning for breaking changes

### Argentina Compliance
- PDPA compliance for personal data
- AFIP integration for tax reporting
- Data residency requirements
- Customer data portability

---

**Document Status:** COMPLETE  
**Implementation Owner:** Backend Developer  
**Review Required:** Tech Lead, Frontend Developer  
**Testing Owner:** QA Engineer  

*This specification serves as the definitive API contract for BarberPro MVP development. All endpoints must be implemented according to these specifications to ensure frontend-backend compatibility and successful MVP delivery.*