# Requerimientos de Datos de Prueba - BarberPro
## Especificaciones para Testing Completo del MVP

**Versión:** 1.0  
**Fecha:** Día 2 del Sprint  
**Scope:** MVP Testing Argentina  
**Responsable:** Product Owner  

---

## 📋 RESUMEN EJECUTIVO

Este documento especifica todos los datos de prueba necesarios para validar completamente el MVP de BarberPro. Los datos están diseñados para reflejar el mercado argentino real y cubrir todos los escenarios de uso críticos, casos edge y flujos de error.

### Cobertura de Testing:
- **User Personas**: 6 personas completas con datos realistas
- **Geographic Coverage**: CABA, GBA, Córdoba, Rosario, Mendoza
- **Service Types**: 15+ servicios variados con precios argentinos
- **Payment Methods**: Todos los métodos soportados en Argentina
- **Edge Cases**: 20+ escenarios de fallo y recuperación

---

## 👥 USUARIOS DE PRUEBA - PERSONAS COMPLETAS

### **PROVEEDORES DE SERVICIOS**

#### **Carlos - Barbería Tradicional (Buenos Aires)**
```json
{
  "personal_info": {
    "id": "provider_001",
    "full_name": "Carlos Alberto Rodríguez",
    "dni": "35123456",
    "cuit": "20-35123456-8",
    "email": "carlos.test@barberpro.ar",
    "phone": "+54-11-4567-8901",
    "birth_date": "1978-05-15",
    "profile_photo": "/test-assets/carlos-profile.jpg"
  },
  "business_info": {
    "business_name": "Barbería Don Carlos",
    "description": "Barbería tradicional con más de 15 años en el barrio. Especialistas en cortes clásicos y afeitado con navaja.",
    "business_type": "Barbería Tradicional",
    "address": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "postal_code": "C1043",
    "neighborhood": "San Nicolás",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "business_phone": "+54-11-4567-8901",
    "business_email": "info@barberiadoncarlos.com.ar",
    "website": "www.barberiadoncarlos.com.ar"
  },
  "working_hours": {
    "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "19:00", "breaks": [{"start": "13:00", "end": "14:00"}] },
    "tuesday": { "isOpen": true, "openTime": "09:00", "closeTime": "19:00", "breaks": [{"start": "13:00", "end": "14:00"}] },
    "wednesday": { "isOpen": true, "openTime": "09:00", "closeTime": "19:00", "breaks": [{"start": "13:00", "end": "14:00"}] },
    "thursday": { "isOpen": true, "openTime": "09:00", "closeTime": "19:00", "breaks": [{"start": "13:00", "end": "14:00"}] },
    "friday": { "isOpen": true, "openTime": "09:00", "closeTime": "19:00", "breaks": [{"start": "13:00", "end": "14:00"}] },
    "saturday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00", "breaks": [] },
    "sunday": { "isOpen": false }
  },
  "verification": {
    "is_verified": true,
    "dni_verified": true,
    "business_verified": true,
    "verification_date": "2025-09-01"
  },
  "settings": {
    "auto_confirm": true,
    "buffer_time_minutes": 15,
    "advance_booking_days": 30,
    "same_day_booking": true
  }
}
```

#### **Martín - Barbero Independiente (Palermo)**
```json
{
  "personal_info": {
    "id": "provider_002", 
    "full_name": "Martín Facundo González",
    "dni": "32987654",
    "cuil": "20-32987654-1",
    "email": "martin.test@barberpro.ar",
    "phone": "+54-11-6543-2109",
    "birth_date": "1985-11-22",
    "profile_photo": "/test-assets/martin-profile.jpg"
  },
  "business_info": {
    "business_name": "Martín Barber - Cortes Modernos",
    "description": "Barbero especialista en cortes modernos y fade. 8 años de experiencia. Atención personalizada con productos premium.",
    "business_type": "Barbero Independiente",
    "address": "Av. Córdoba 5600 (Local 12)",
    "city": "Buenos Aires", 
    "province": "Buenos Aires",
    "postal_code": "C1414",
    "neighborhood": "Palermo",
    "latitude": -34.5899,
    "longitude": -58.3974,
    "business_phone": "+54-11-6543-2109",
    "mobile_service": true,
    "service_radius_km": 5
  },
  "working_hours": {
    "monday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "tuesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "wednesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "thursday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "friday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "saturday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
    "sunday": { "isOpen": true, "openTime": "10:00", "closeTime": "18:00" }
  },
  "specialties": ["Fade", "Undercut", "Diseños", "Cortes modernos"],
  "verification": {
    "is_verified": true,
    "dni_verified": true,
    "business_verified": false, 
    "verification_date": "2025-09-02"
  }
}
```

#### **Alejandro - Cadena Premium (Multi-local)**
```json
{
  "personal_info": {
    "id": "provider_003",
    "full_name": "Alejandro Premium Chain",
    "dni": "41555999", 
    "cuit": "30-41555999-2",
    "email": "alejandro.test@barberpro.ar",
    "phone": "+54-11-5555-0001",
    "birth_date": "1970-03-10"
  },
  "business_info": {
    "business_name": "Premium Barber Club",
    "business_type": "Cadena Premium",
    "chain_locations": [
      {
        "id": "pbc_recoleta",
        "name": "Premium Barber Club - Recoleta", 
        "address": "Av. Santa Fe 1500",
        "neighborhood": "Recoleta",
        "staff_count": 3
      },
      {
        "id": "pbc_belgrano",
        "name": "Premium Barber Club - Belgrano",
        "address": "Av. Cabildo 2800", 
        "neighborhood": "Belgrano",
        "staff_count": 4
      },
      {
        "id": "pbc_palermo", 
        "name": "Premium Barber Club - Palermo",
        "address": "Av. Córdoba 5600",
        "neighborhood": "Palermo Hollywood",
        "staff_count": 5
      }
    ]
  },
  "verification": {
    "is_verified": true,
    "premium_provider": true,
    "business_verified": true
  }
}
```

### **CLIENTES**

#### **Sofía - Profesional Joven (Microcentro)**
```json
{
  "personal_info": {
    "id": "client_001",
    "full_name": "Sofía Valentina López",
    "email": "sofia.test@barberpro.ar", 
    "phone": "+54-11-3456-7890",
    "dni": "38456789",
    "birth_date": "1990-07-12",
    "profile_photo": "/test-assets/sofia-profile.jpg"
  },
  "preferences": {
    "preferred_location": "Microcentro",
    "max_travel_distance": 1000, // meters
    "preferred_time_slots": ["12:00-14:00", "18:00-20:00"],
    "price_range": {"min": 800, "max": 1500},
    "preferred_services": ["Corte de cabello", "Corte moderno"],
    "notification_preferences": {
      "email": true,
      "sms": true, 
      "whatsapp": true,
      "push": true
    }
  },
  "work_info": {
    "office_location": "Av. Corrientes 800, Microcentro",
    "work_schedule": "09:00-18:00"
  }
}
```

#### **Diego - Padre de Familia (Villa Crespo)**
```json
{
  "personal_info": {
    "id": "client_002",
    "full_name": "Diego Ramón Fernández",
    "email": "diego.test@barberpro.ar",
    "phone": "+54-11-2345-6789", 
    "dni": "35789123",
    "birth_date": "1982-12-05"
  },
  "family_info": {
    "spouse": "María Fernández",
    "children": [
      {
        "name": "Tomás Fernández",
        "age": 12,
        "dni": "55123456"
      },
      {
        "name": "Valentina Fernández", 
        "age": 8,
        "dni": "55654321"
      }
    ]
  },
  "preferences": {
    "preferred_location": "Villa Crespo",
    "family_friendly_required": true,
    "preferred_time_slots": ["Saturday 10:00-16:00", "Sunday 10:00-16:00"],
    "price_range": {"min": 500, "max": 1200},
    "bulk_booking": true
  }
}
```

#### **Rodrigo - Cliente Premium (Puerto Madero)**
```json
{
  "personal_info": {
    "id": "client_003",
    "full_name": "Rodrigo Alberto Mendoza",
    "email": "rodrigo.test@barberpro.ar",
    "phone": "+54-11-1111-2222",
    "dni": "33111555",
    "birth_date": "1975-01-20"
  },
  "premium_profile": {
    "subscription": "BarberPro Premium",
    "subscription_price": 4999, // ARS monthly
    "preferred_providers": ["premium", "verified_only"],
    "concierge_service": true,
    "price_range": {"min": 2000, "max": 5000},
    "exclusive_access": true
  },
  "work_info": {
    "position": "Executive",
    "company": "Empresa Premium SA",
    "flexible_schedule": true
  }
}
```

---

## ✂️ SERVICIOS DE PRUEBA

### **Barbería Don Carlos**
```json
[
  {
    "id": "service_001",
    "provider_id": "provider_001",
    "name": "Corte de Cabello",
    "description": "Corte personalizado según tu estilo y preferencias",
    "duration_minutes": 30,
    "price_ars": 800,
    "category": "Corte",
    "buffer_before": 5,
    "buffer_after": 10,
    "is_active": true,
    "images": ["/test-assets/corte-clasico-1.jpg", "/test-assets/corte-clasico-2.jpg"]
  },
  {
    "id": "service_002", 
    "provider_id": "provider_001",
    "name": "Corte + Barba",
    "description": "Servicio completo: corte personalizado + arreglo de barba",
    "duration_minutes": 45,
    "price_ars": 1200,
    "category": "Combo",
    "is_popular": true,
    "discount_percent": 20 // vs servicios separados
  },
  {
    "id": "service_003",
    "provider_id": "provider_001", 
    "name": "Afeitado Clásico",
    "description": "Afeitado tradicional con navaja y toallas calientes",
    "duration_minutes": 25,
    "price_ars": 600,
    "category": "Afeitado",
    "requires_consultation": false,
    "specialty_service": true
  }
]
```

### **Martín Barber - Cortes Modernos** 
```json
[
  {
    "id": "service_004",
    "provider_id": "provider_002",
    "name": "Corte Fade",
    "description": "Especialidad en fade profesional, todos los estilos",
    "duration_minutes": 35,
    "price_ars": 700,
    "category": "Corte Moderno",
    "specialty_tags": ["fade", "moderno", "trending"]
  },
  {
    "id": "service_005",
    "provider_id": "provider_002",
    "name": "Corte + Diseño",
    "description": "Corte personalizado con diseños en cabello",
    "duration_minutes": 50, 
    "price_ars": 1000,
    "category": "Diseño",
    "requires_consultation": true
  },
  {
    "id": "service_006",
    "provider_id": "provider_002",
    "name": "Servicio a Domicilio",
    "description": "Te visitamos en tu casa/oficina (Radio 5km)",
    "duration_minutes": 60,
    "price_ars": 1200,
    "category": "Móvil",
    "travel_fee": 200,
    "mobile_service": true
  }
]
```

### **Premium Barber Club**
```json
[
  {
    "id": "service_007",
    "provider_id": "provider_003",
    "name": "Experiencia Premium Completa",
    "description": "Corte + barba + tratamiento capilar + masaje facial",
    "duration_minutes": 90,
    "price_ars": 3500,
    "category": "Premium Experience",
    "includes": ["corte", "barba", "tratamiento", "masaje", "productos_premium"]
  },
  {
    "id": "service_008", 
    "provider_id": "provider_003",
    "name": "Corte Ejecutivo",
    "description": "Corte profesional para ejecutivos, horarios exclusivos",
    "duration_minutes": 45,
    "price_ars": 1500,
    "category": "Ejecutivo",
    "exclusive_hours": true
  }
]
```

---

## 📅 RESERVAS DE PRUEBA EXISTENTES

### **Reservas Confirmadas - Próximos 7 días**
```json
[
  {
    "id": "booking_001",
    "client_id": "client_001",
    "provider_id": "provider_001", 
    "service_id": "service_001",
    "start_time": "2025-09-11T10:00:00-03:00", // Mañana 10:00 AM
    "end_time": "2025-09-11T10:30:00-03:00",
    "status": "CONFIRMED",
    "total_amount": 800,
    "payment_status": "PAID",
    "payment_method": "mercadopago_card",
    "notes": "Corte no muy corto, tengo reunión importante",
    "created_at": "2025-09-10T14:30:00-03:00"
  },
  {
    "id": "booking_002",
    "client_id": "client_002",
    "provider_id": "provider_001",
    "service_id": "service_002", 
    "start_time": "2025-09-12T14:30:00-03:00", // Pasado mañana 2:30 PM
    "end_time": "2025-09-12T15:15:00-03:00",
    "status": "PENDING",
    "total_amount": 1080, // Con descuento familiar 10%
    "payment_status": "PENDING",
    "payment_method": "cash_on_location",
    "family_booking": true,
    "additional_people": [
      {
        "name": "Tomás Fernández",
        "service": "Corte Infantil", 
        "price": 600
      }
    ]
  },
  {
    "id": "booking_003",
    "client_id": "client_003",
    "provider_id": "provider_003",
    "service_id": "service_007",
    "start_time": "2025-09-11T07:30:00-03:00", // Mañana 7:30 AM (VIP hour)
    "end_time": "2025-09-11T09:00:00-03:00", 
    "status": "CONFIRMED",
    "total_amount": 3150, // Con descuento premium 10%
    "payment_status": "PAID",
    "payment_method": "mercadopago_premium",
    "vip_service": true,
    "concierge_notes": "Cliente prefiere ambiente relajante, música clásica"
  }
]
```

### **Reservas Históricas - Últimos 30 días**
```json
[
  {
    "id": "booking_hist_001",
    "client_id": "client_001",
    "provider_id": "provider_001",
    "service_id": "service_001",
    "start_time": "2025-08-15T16:00:00-03:00",
    "status": "COMPLETED",
    "total_amount": 800,
    "client_rating": 5,
    "client_feedback": "Excelente servicio, muy profesional y puntual",
    "provider_rating": 5
  },
  {
    "id": "booking_hist_002", 
    "client_id": "client_002",
    "provider_id": "provider_002",
    "service_id": "service_004",
    "start_time": "2025-08-20T11:00:00-03:00",
    "status": "COMPLETED", 
    "total_amount": 700,
    "client_rating": 4,
    "client_feedback": "Muy bueno el fade, llegó 10 min tarde pero compensó con la calidad"
  },
  {
    "id": "booking_hist_003",
    "client_id": "client_001",
    "provider_id": "provider_002", 
    "service_id": "service_005",
    "start_time": "2025-08-25T18:30:00-03:00",
    "status": "CANCELLED",
    "cancel_reason": "Cliente canceló por lluvia",
    "cancelled_by": "client_001",
    "cancelled_at": "2025-08-25T17:00:00-03:00"
  }
]
```

---

## 🏢 DATOS GEOGRÁFICOS ARGENTINOS

### **Ubicaciones de Testing**
```json
{
  "buenos_aires_locations": [
    {
      "neighborhood": "Microcentro",
      "lat": -34.6037,
      "lng": -58.3816,
      "test_addresses": [
        "Av. Corrientes 800", 
        "Florida 123",
        "Av. 9 de Julio 500"
      ]
    },
    {
      "neighborhood": "Palermo",
      "lat": -34.5899,
      "lng": -58.3974,
      "test_addresses": [
        "Av. Córdoba 5600",
        "Gurruchaga 1800", 
        "Av. Santa Fe 4200"
      ]
    },
    {
      "neighborhood": "Villa Crespo", 
      "lat": -34.5994,
      "lng": -58.4372,
      "test_addresses": [
        "Av. Corrientes 4800",
        "Murillo 800",
        "Scalabrini Ortiz 1200"
      ]
    },
    {
      "neighborhood": "Recoleta",
      "lat": -34.5875,
      "lng": -58.3974,
      "test_addresses": [
        "Av. Santa Fe 1500",
        "Av. Callao 1200",
        "Junín 1900"
      ]
    }
  ],
  "other_cities": [
    {
      "city": "Córdoba",
      "province": "Córdoba",
      "lat": -31.4201,
      "lng": -64.1888,
      "test_addresses": ["Av. Colón 1234", "27 de Abril 800"]
    },
    {
      "city": "Rosario", 
      "province": "Santa Fe",
      "lat": -32.9442,
      "lng": -60.6505,
      "test_addresses": ["Av. Pellegrini 1500", "Córdoba 2000"]
    }
  ]
}
```

### **Códigos Postales Testing**
```json
{
  "caba_postal_codes": ["C1043", "C1414", "C1425", "C1018", "C1126"],
  "gba_postal_codes": ["B1636", "B1832", "B1704", "B1878"],
  "provinces": {
    "cordoba": ["5000", "5001", "5002"],
    "santa_fe": ["2000", "2001", "3000"],
    "mendoza": ["5500", "5501", "5502"]
  }
}
```

---

## 💳 DATOS DE PAGO - TESTING

### **Tarjetas de Prueba MercadoPago**
```json
{
  "visa_success": {
    "number": "4509953566233704",
    "expiry": "11/25", 
    "cvc": "123",
    "name": "APRO",
    "description": "Tarjeta aprobada"
  },
  "visa_insufficient_funds": {
    "number": "4509953566233704",
    "expiry": "11/25",
    "cvc": "123", 
    "name": "CONT",
    "description": "Fondos insuficientes"
  },
  "mastercard_success": {
    "number": "5031433215406351",
    "expiry": "11/25",
    "cvc": "123",
    "name": "APRO", 
    "description": "Mastercard aprobada"
  },
  "amex_declined": {
    "number": "375365153556885",
    "expiry": "11/25",
    "cvc": "1234",
    "name": "CALL",
    "description": "American Express rechazada"
  }
}
```

### **Cuentas Bancarias Argentinas Testing**
```json
{
  "bank_accounts": [
    {
      "bank": "Banco Nación",
      "cbu": "01100000000000000001",
      "alias": "barberpro.carlos.mp"
    },
    {
      "bank": "Banco Provincia", 
      "cbu": "01400000000000000002",
      "alias": "martin.barber.ar"
    },
    {
      "bank": "BBVA Argentina",
      "cbu": "01700000000000000003", 
      "alias": "premium.club.arg"
    }
  ]
}
```

### **Métodos de Pago Testing**
```json
{
  "payment_methods": [
    {
      "type": "mercadopago_card",
      "subtype": "visa",
      "test_amounts": [800, 1200, 3500, 5000],
      "expected_commission": 0.035 // 3.5%
    },
    {
      "type": "mercadopago_account", 
      "subtype": "saldo_mp",
      "test_amounts": [500, 1000, 2000],
      "expected_commission": 0.035
    },
    {
      "type": "cash_on_location",
      "subtype": "efectivo",
      "test_amounts": [600, 800, 1200], 
      "expected_commission": 0.035
    },
    {
      "type": "bank_transfer",
      "subtype": "transferencia",
      "test_amounts": [1500, 2500, 4000],
      "expected_commission": 0.035
    }
  ]
}
```

---

## 📱 DATOS DE TESTING MÓVIL

### **Dispositivos Testing Argentina**
```json
{
  "android_devices": [
    {
      "model": "Samsung Galaxy A54", 
      "android_version": "13",
      "screen_size": "6.4 inch",
      "market_share_argentina": "25%",
      "test_scenarios": ["booking_flow", "payment", "search"]
    },
    {
      "model": "Motorola Moto G32",
      "android_version": "12", 
      "screen_size": "6.5 inch",
      "market_share_argentina": "20%",
      "test_scenarios": ["registration", "dashboard", "notifications"]
    }
  ],
  "ios_devices": [
    {
      "model": "iPhone 12",
      "ios_version": "16.6",
      "screen_size": "6.1 inch", 
      "market_share_argentina": "15%",
      "test_scenarios": ["full_flow", "payments", "pwa"]
    }
  ],
  "network_conditions": [
    {
      "type": "4G LTE Argentina",
      "speed_mbps": 25,
      "latency_ms": 45,
      "reliability": "stable"
    },
    {
      "type": "3G Argentina",
      "speed_mbps": 2, 
      "latency_ms": 200,
      "reliability": "intermittent"
    },
    {
      "type": "WiFi Argentina",
      "speed_mbps": 50,
      "latency_ms": 25,
      "reliability": "variable"
    }
  ]
}
```

---

## 🚨 CASOS EDGE Y ESCENARIOS DE ERROR

### **Conflictos de Reservas**
```json
{
  "double_booking_attempt": {
    "scenario": "Dos clientes intentan reservar mismo horario",
    "client_1": "client_001",
    "client_2": "client_002", 
    "provider": "provider_001",
    "service": "service_001",
    "time": "2025-09-13T15:00:00-03:00",
    "expected_behavior": "Primero en confirmar pago obtiene reserva"
  },
  "buffer_time_violation": {
    "scenario": "Nueva reserva viola buffer time",
    "existing_booking": {
      "time": "14:00-14:30",
      "buffer_after": 15 // hasta 14:45
    },
    "new_booking_attempt": {
      "time": "14:30-15:00" // Viola buffer
    },
    "expected_behavior": "Rechazar con sugerencias alternativas"
  },
  "outside_working_hours": {
    "scenario": "Intento de reserva fuera de horario",
    "provider_hours": "09:00-19:00",
    "booking_attempt": "20:00-20:30",
    "expected_behavior": "Error claro + horarios disponibles"
  }
}
```

### **Fallos de Pago**
```json
{
  "payment_failures": [
    {
      "type": "insufficient_funds",
      "card": "visa_insufficient_funds",
      "amount": 1200,
      "expected_behavior": "Mantener reserva 15 min + ofrecer alternativas"
    },
    {
      "type": "expired_card",
      "card_expiry": "01/20",
      "expected_behavior": "Error claro + solicitar nueva tarjeta"
    },
    {
      "type": "connection_timeout",
      "scenario": "Timeout durante procesamiento",
      "expected_behavior": "Verificar estado + no duplicar cobro"
    },
    {
      "type": "webhook_failure", 
      "scenario": "MercadoPago webhook no llega",
      "expected_behavior": "Polling status + manual verification"
    }
  ]
}
```

### **Problemas de Conectividad**
```json
{
  "connectivity_issues": [
    {
      "type": "offline_booking_attempt",
      "scenario": "Usuario sin internet intenta reservar",
      "expected_behavior": "Cache form data + retry cuando vuelva conexión"
    },
    {
      "type": "slow_network", 
      "network_speed": "2G",
      "expected_behavior": "Loading states + timeout handling"
    },
    {
      "type": "intermittent_connection",
      "scenario": "Conexión se corta durante booking flow",
      "expected_behavior": "Resume from last successful step"
    }
  ]
}
```

---

## 🔐 DATOS DE SEGURIDAD Y VALIDACIÓN

### **Tests de Validación DNI**
```json
{
  "valid_dnis": [
    "12345678", "35123456", "41999888", "38456789", 
    "12.345.678", "35.123.456", "41.999.888"
  ],
  "invalid_dnis": [
    "123456", // muy corto
    "123456789", // muy largo  
    "1234567a", // contiene letras
    "00000000", // todos ceros
    "99999999" // fuera de rango
  ]
}
```

### **Tests de Validación Teléfono**
```json
{
  "valid_phones": [
    "+54 11 4567 8901", // Buenos Aires fijo
    "+54 9 11 6543 2109", // Buenos Aires móvil
    "+54 351 123 4567", // Córdoba
    "011 4567 8901", // Formato nacional
    "15 6543 2109" // Móvil sin código
  ],
  "invalid_phones": [
    "+54 123 45", // muy corto
    "+1 555 123 4567", // código país incorrecto
    "+54 999 999 9999", // código área inválido
    "abc def ghij" // no numérico
  ]
}
```

### **Tests de Validación Email**
```json
{
  "valid_emails": [
    "usuario@gmail.com",
    "test.user@empresa.com.ar", 
    "nombre+tag@hotmail.com",
    "user123@yahoo.com.ar"
  ],
  "invalid_emails": [
    "usuario@", // incompleto
    "@gmail.com", // sin usuario
    "usuario.gmail.com", // sin @
    "usuario@.com" // dominio inválido
  ]
}
```

---

## 📊 DATOS PARA REPORTES Y ANALYTICS

### **Métricas de Performance**
```json
{
  "performance_benchmarks": {
    "page_load_time_ms": {
      "target": 3000,
      "test_conditions": ["4G Argentina", "WiFi Buenos Aires", "3G Interior"]
    },
    "api_response_time_ms": {
      "search": 500,
      "booking_create": 1000, 
      "payment_process": 2000,
      "availability_check": 300
    },
    "database_query_time_ms": {
      "user_lookup": 50,
      "booking_conflicts": 100,
      "availability_calculation": 200
    }
  }
}
```

### **Datos para Load Testing**
```json
{
  "load_test_scenarios": [
    {
      "name": "concurrent_bookings",
      "concurrent_users": 100,
      "duration_minutes": 10,
      "actions": ["search", "view_profile", "book_service"],
      "expected_response_time": "<2s"
    },
    {
      "name": "payment_processing",
      "concurrent_payments": 20,
      "duration_minutes": 5, 
      "payment_amounts": [800, 1200, 1500],
      "expected_success_rate": ">98%"
    },
    {
      "name": "search_load",
      "search_queries_per_second": 50,
      "duration_minutes": 15,
      "search_terms": ["barbero palermo", "corte fade", "cerca de mí"],
      "expected_response_time": "<1s"
    }
  ]
}
```

---

## 🎯 ESCENARIOS DE TESTING POR FUNCIONALIDAD

### **User Registration Testing**
```json
{
  "registration_tests": [
    {
      "test_name": "cliente_registration_success",
      "user_data": {
        "name": "María Test Cliente",
        "email": "maria.test@barberpro.ar",
        "phone": "+54 11 9999 1111",
        "password": "TestPass123!",
        "role": "CLIENT"
      },
      "expected_result": "success",
      "validations": ["email_sent", "account_created", "profile_accessible"]
    },
    {
      "test_name": "provider_registration_with_verification", 
      "user_data": {
        "name": "Pedro Test Barbero",
        "email": "pedro.test@barberpro.ar",
        "dni": "30123456",
        "business_name": "Barbería Test Pedro"
      },
      "expected_result": "pending_verification",
      "validations": ["verification_email_sent", "manual_review_triggered"]
    }
  ]
}
```

### **Booking Flow Testing**
```json
{
  "booking_tests": [
    {
      "test_name": "complete_booking_flow",
      "steps": [
        {"action": "search", "location": "Palermo", "service": "Corte"},
        {"action": "select_provider", "provider": "provider_002"},
        {"action": "select_service", "service": "service_004"},
        {"action": "select_datetime", "date": "2025-09-15", "time": "15:00"},
        {"action": "add_notes", "notes": "Primera vez aquí"},
        {"action": "payment", "method": "mercadopago_card", "card": "visa_success"}
      ],
      "expected_result": "booking_confirmed",
      "validations": ["payment_processed", "confirmation_sent", "calendar_updated"]
    }
  ]
}
```

### **Search and Discovery Testing**
```json
{
  "search_tests": [
    {
      "test_name": "geolocation_search",
      "user_location": {"lat": -34.6037, "lng": -58.3816}, // Microcentro
      "search_radius": 2000, // 2km
      "expected_providers": ["provider_001"], // Don Carlos
      "not_expected": ["provider_002"] // Martín (Palermo, >2km)
    },
    {
      "test_name": "price_filter",
      "price_range": {"min": 500, "max": 1000},
      "expected_services": ["service_001", "service_004", "service_005"], 
      "not_expected": ["service_007"] // Premium >$1000
    }
  ]
}
```

---

## 📋 CHECKLIST DE SETUP DE DATOS

### **Base de Datos Testing**
```bash
# Script para popular base de datos de testing
npm run db:seed:test

# Validar que todos los datos están presentes
npm run db:validate:test-data

# Reset complete de datos de testing
npm run db:reset:test
```

### **Archivos de Assets**
```
/test-assets/
├── profiles/
│   ├── carlos-profile.jpg
│   ├── martin-profile.jpg
│   ├── sofia-profile.jpg
│   └── diego-profile.jpg
├── services/
│   ├── corte-clasico-1.jpg
│   ├── corte-moderno-1.jpg
│   ├── fade-before-after.jpg
│   └── premium-experience.jpg
├── locations/
│   ├── barberia-don-carlos.jpg
│   ├── martin-workspace.jpg
│   └── premium-club-interior.jpg
└── documents/
    ├── dni-sample.jpg
    ├── cuit-certificate.pdf
    └── business-license.pdf
```

### **Environment Variables Testing**
```bash
# .env.testing
DATABASE_URL="postgresql://test:test@localhost:5432/barberpro_test"
MERCADOPAGO_ACCESS_TOKEN="TEST-123456789-sandbox"
MERCADOPAGO_PUBLIC_KEY="TEST-abcdef12-3456-7890-sandbox"
SMS_API_KEY="test-sms-key"
EMAIL_API_KEY="test-email-key"
WHATSAPP_API_KEY="test-whatsapp-key"
```

---

## 🎉 CRITERIOS DE ÉXITO

### **Cobertura de Testing**
- ✅ 100% de user personas cubiertas
- ✅ 100% de servicios MVP testeados
- ✅ 100% de métodos de pago validados
- ✅ 95%+ de casos edge identificados y testeados
- ✅ Datos representativos del mercado argentino

### **Calidad de Datos**
- ✅ Datos realistas y culturalmente apropiados
- ✅ Cobertura geográfica representativa de Argentina
- ✅ Escenarios de error comprehensive
- ✅ Performance benchmarks alcanzables
- ✅ Security testing thorough

### **Mantenimiento**
- ✅ Scripts automatizados para setup/reset
- ✅ Documentación clara para todo el equipo
- ✅ Versionado de datos de testing
- ✅ Backup/restore procedures
- ✅ Updates basados en findings de testing

---

*Documento Versión 1.0 - Test Data Requirements para BarberPro MVP*  
*Última actualización: Día 2 del Sprint*  
*Próxima revisión: Post UAT execution*  
*Responsable: Product Owner - BarberPro Team*