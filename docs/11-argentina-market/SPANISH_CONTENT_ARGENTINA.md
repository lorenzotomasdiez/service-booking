# BarberPro - Contenido en Español para Argentina

**Versión**: 1.0  
**Fecha**: 10 de Septiembre, 2025  
**Product Owner**: Claude  
**Idioma**: Español (es-AR)  
**Mercado**: Argentina

## Navegación Principal

### Menú Principal
```json
{
  "navigation": {
    "home": "Inicio",
    "services": "Servicios",
    "book": "Reservar",
    "dashboard": "Panel",
    "profile": "Perfil",
    "help": "Ayuda",
    "logout": "Cerrar Sesión"
  }
}
```

### Navegación Secundaria
```json
{
  "secondary_nav": {
    "my_bookings": "Mis Citas",
    "my_services": "Mis Servicios",
    "calendar": "Calendario",
    "earnings": "Ganancias",
    "reviews": "Reseñas",
    "settings": "Configuración"
  }
}
```

## Formularios de Registro

### Registro de Cliente
```json
{
  "client_registration": {
    "title": "Crear Cuenta de Cliente",
    "subtitle": "Únete a BarberPro y encuentra el mejor servicio",
    "form": {
      "full_name": "Nombre Completo",
      "full_name_placeholder": "Ingresa tu nombre completo",
      "email": "Correo Electrónico",
      "email_placeholder": "tu@email.com",
      "password": "Contraseña",
      "password_placeholder": "Mínimo 8 caracteres",
      "confirm_password": "Confirmar Contraseña",
      "confirm_password_placeholder": "Repite tu contraseña",
      "phone": "Teléfono (Opcional)",
      "phone_placeholder": "+54-11-1234-5678",
      "dni": "DNI (Opcional)",
      "dni_placeholder": "12.345.678",
      "birth_date": "Fecha de Nacimiento (Opcional)",
      "terms": "Acepto los términos y condiciones",
      "privacy": "Acepto la política de privacidad",
      "submit": "Crear Cuenta",
      "loading": "Creando cuenta...",
      "have_account": "¿Ya tienes cuenta?",
      "login_link": "Inicia sesión aquí"
    }
  }
}
```

### Registro de Profesional
```json
{
  "provider_registration": {
    "title": "Registro de Profesional",
    "subtitle": "Únete como barbero profesional",
    "form": {
      "business_name": "Nombre del Negocio",
      "business_name_placeholder": "Ej: Barbería El Corte Perfecto",
      "professional_name": "Nombre del Profesional",
      "professional_name_placeholder": "Tu nombre completo",
      "email": "Correo Electrónico",
      "password": "Contraseña",
      "phone": "Teléfono",
      "phone_placeholder": "+54-11-1234-5678",
      "dni": "DNI",
      "dni_placeholder": "12.345.678",
      "cuit": "CUIT",
      "cuit_placeholder": "20-12345678-9",
      "address": "Dirección del Negocio",
      "address_placeholder": "Av. Corrientes 1234, CABA",
      "specialty": "Especialidad",
      "specialty_placeholder": "Ej: Barbero Tradicional",
      "experience": "Años de Experiencia",
      "experience_placeholder": "Ej: 5 años",
      "license": "Matrícula Profesional",
      "license_upload": "Subir Documento",
      "business_permit": "Habilitación Comercial",
      "business_permit_upload": "Subir Documento",
      "afip_certificate": "Certificado AFIP",
      "afip_upload": "Subir Documento",
      "submit": "Registrar como Profesional",
      "loading": "Procesando registro...",
      "approval_notice": "Tu cuenta será revisada en 24-48 horas"
    }
  }
}
```

## Formulario de Inicio de Sesión

```json
{
  "login": {
    "title": "Iniciar Sesión",
    "subtitle": "Accede a tu cuenta BarberPro",
    "form": {
      "email": "Correo Electrónico",
      "email_placeholder": "tu@email.com",
      "password": "Contraseña",
      "password_placeholder": "Tu contraseña",
      "remember_me": "Recordarme",
      "forgot_password": "¿Olvidaste tu contraseña?",
      "submit": "Iniciar Sesión",
      "loading": "Iniciando sesión...",
      "no_account": "¿No tienes cuenta?",
      "register_client": "Registrarse como Cliente",
      "register_provider": "Registrarse como Profesional"
    }
  }
}
```

## Mensajes de Validación

### Errores de Validación
```json
{
  "validation_errors": {
    "required": "Este campo es obligatorio",
    "email_invalid": "El formato del correo electrónico no es válido",
    "email_exists": "Este correo electrónico ya está registrado",
    "password_too_short": "La contraseña debe tener al menos 8 caracteres",
    "password_mismatch": "Las contraseñas no coinciden",
    "dni_invalid": "El formato del DNI no es válido. Use XX.XXX.XXX",
    "cuit_invalid": "El formato del CUIT no es válido. Use XX-XXXXXXXX-X",
    "phone_invalid": "El número de teléfono debe comenzar con +54",
    "terms_required": "Debes aceptar los términos y condiciones",
    "privacy_required": "Debes aceptar la política de privacidad",
    "file_too_large": "El archivo es demasiado grande (máximo 5MB)",
    "file_invalid_type": "Tipo de archivo no válido"
  }
}
```

### Mensajes de Éxito
```json
{
  "success_messages": {
    "account_created": "Cuenta creada exitosamente",
    "login_successful": "Sesión iniciada correctamente",
    "profile_updated": "Perfil actualizado correctamente",
    "booking_confirmed": "Cita reservada con éxito",
    "payment_successful": "Pago procesado correctamente",
    "service_created": "Servicio creado exitosamente",
    "availability_updated": "Disponibilidad actualizada",
    "password_changed": "Contraseña cambiada exitosamente",
    "email_verified": "Correo electrónico verificado",
    "document_uploaded": "Documento subido correctamente"
  }
}
```

## Dashboard de Cliente

```json
{
  "client_dashboard": {
    "welcome": "Bienvenido, {{name}}",
    "upcoming_bookings": "Próximas Citas",
    "booking_history": "Historial de Citas",
    "favorite_barbers": "Barberos Favoritos",
    "quick_actions": "Acciones Rápidas",
    "book_service": "Reservar Servicio",
    "view_profile": "Ver Perfil",
    "no_bookings": "No tienes citas programadas",
    "book_now": "Reservar Ahora",
    "stats": {
      "total_bookings": "Total de Citas",
      "favorite_barbers": "Barberos Favoritos",
      "money_saved": "Dinero Ahorrado",
      "reviews_given": "Reseñas Dadas"
    }
  }
}
```

## Dashboard de Profesional

```json
{
  "provider_dashboard": {
    "welcome": "Bienvenido, {{name}}",
    "today_schedule": "Agenda de Hoy",
    "pending_requests": "Solicitudes Pendientes",
    "earnings_summary": "Resumen de Ganancias",
    "recent_reviews": "Reseñas Recientes",
    "quick_actions": "Acciones Rápidas",
    "add_service": "Agregar Servicio",
    "set_availability": "Configurar Disponibilidad",
    "view_calendar": "Ver Calendario",
    "no_appointments": "No tienes citas para hoy",
    "stats": {
      "today_earnings": "Ganancias Hoy",
      "total_clients": "Clientes Totales",
      "avg_rating": "Calificación Promedio",
      "completed_services": "Servicios Completados"
    }
  }
}
```

## Servicios de Barbería

```json
{
  "barber_services": {
    "categories": {
      "haircut": "Corte de Cabello",
      "beard": "Arreglo de Barba",
      "shave": "Afeitado",
      "styling": "Peinado",
      "treatment": "Tratamientos",
      "combo": "Combos"
    },
    "common_services": {
      "classic_cut": {
        "name": "Corte Clásico",
        "description": "Corte tradicional con tijera y máquina",
        "duration": "30 minutos",
        "price_range": "$800 - $1,200"
      },
      "modern_cut": {
        "name": "Corte Moderno",
        "description": "Cortes actualizados y con estilo",
        "duration": "45 minutos",
        "price_range": "$1,000 - $1,500"
      },
      "beard_trim": {
        "name": "Arreglo de Barba",
        "description": "Recorte y perfilado de barba",
        "duration": "20 minutos",
        "price_range": "$500 - $800"
      },
      "classic_shave": {
        "name": "Afeitado Clásico",
        "description": "Afeitado tradicional con navaja",
        "duration": "25 minutos",
        "price_range": "$600 - $900"
      },
      "full_combo": {
        "name": "Combo Completo",
        "description": "Corte + barba + afeitado",
        "duration": "60 minutos",
        "price_range": "$1,200 - $2,000"
      }
    }
  }
}
```

## Proceso de Reserva

```json
{
  "booking_process": {
    "step1": {
      "title": "Seleccionar Servicio",
      "subtitle": "Elige el servicio que necesitas",
      "select_service": "Seleccionar Servicio",
      "service_details": "Detalles del Servicio",
      "duration": "Duración",
      "price": "Precio",
      "continue": "Continuar"
    },
    "step2": {
      "title": "Elegir Profesional",
      "subtitle": "Selecciona tu barbero preferido",
      "available_barbers": "Barberos Disponibles",
      "rating": "Calificación",
      "reviews": "reseñas",
      "experience": "Experiencia",
      "select_barber": "Seleccionar",
      "view_profile": "Ver Perfil"
    },
    "step3": {
      "title": "Fecha y Hora",
      "subtitle": "Elige cuándo quieres tu cita",
      "select_date": "Seleccionar Fecha",
      "available_times": "Horarios Disponibles",
      "morning": "Mañana",
      "afternoon": "Tarde",
      "no_availability": "No hay horarios disponibles para esta fecha"
    },
    "step4": {
      "title": "Confirmar Reserva",
      "subtitle": "Revisa los detalles de tu cita",
      "booking_summary": "Resumen de la Reserva",
      "service": "Servicio",
      "barber": "Barbero",
      "date": "Fecha",
      "time": "Hora",
      "duration": "Duración",
      "price": "Precio",
      "payment_method": "Método de Pago",
      "confirm_booking": "Confirmar Reserva",
      "processing": "Procesando reserva..."
    }
  }
}
```

## Métodos de Pago

```json
{
  "payment": {
    "methods": {
      "credit_card": "Tarjeta de Crédito",
      "debit_card": "Tarjeta de Débito",
      "mercadopago": "Mercado Pago",
      "bank_transfer": "Transferencia Bancaria",
      "cash": "Efectivo en el local"
    },
    "form": {
      "card_number": "Número de Tarjeta",
      "card_holder": "Titular de la Tarjeta",
      "expiry_date": "Fecha de Vencimiento",
      "cvv": "CVV",
      "payment_total": "Total a Pagar",
      "currency": "ARS",
      "process_payment": "Procesar Pago",
      "secure_payment": "Pago Seguro",
      "encryption_notice": "Tus datos están protegidos con encriptación SSL"
    },
    "confirmation": {
      "payment_successful": "¡Pago Exitoso!",
      "booking_confirmed": "Tu cita ha sido confirmada",
      "receipt_sent": "El comprobante fue enviado a tu email",
      "booking_details": "Detalles de la Reserva",
      "add_to_calendar": "Agregar al Calendario",
      "go_to_dashboard": "Ir al Panel"
    }
  }
}
```

## Perfil de Usuario

```json
{
  "user_profile": {
    "personal_info": {
      "title": "Información Personal",
      "full_name": "Nombre Completo",
      "email": "Correo Electrónico",
      "phone": "Teléfono",
      "dni": "DNI",
      "birth_date": "Fecha de Nacimiento",
      "profile_photo": "Foto de Perfil",
      "change_photo": "Cambiar Foto",
      "upload_photo": "Subir Nueva Foto"
    },
    "preferences": {
      "title": "Preferencias",
      "language": "Idioma",
      "timezone": "Zona Horaria",
      "notifications": "Notificaciones",
      "email_notifications": "Notificaciones por Email",
      "sms_notifications": "Notificaciones por SMS",
      "whatsapp_notifications": "Notificaciones por WhatsApp"
    },
    "security": {
      "title": "Seguridad",
      "change_password": "Cambiar Contraseña",
      "current_password": "Contraseña Actual",
      "new_password": "Nueva Contraseña",
      "confirm_new_password": "Confirmar Nueva Contraseña",
      "two_factor": "Autenticación de Dos Factores",
      "enable_2fa": "Habilitar 2FA",
      "logout_all": "Cerrar Sesión en Todos los Dispositivos"
    }
  }
}
```

## Sistema de Calificaciones

```json
{
  "rating_system": {
    "leave_review": "Dejar Reseña",
    "rate_service": "Calificar Servicio",
    "rate_barber": "Calificar Barbero",
    "overall_rating": "Calificación General",
    "service_quality": "Calidad del Servicio",
    "punctuality": "Puntualidad",
    "cleanliness": "Limpieza",
    "professionalism": "Profesionalismo",
    "value_for_money": "Relación Precio-Calidad",
    "write_review": "Escribir Reseña",
    "review_placeholder": "Comparte tu experiencia...",
    "submit_review": "Enviar Reseña",
    "thank_you": "¡Gracias por tu reseña!",
    "reviews": "Reseñas",
    "average_rating": "Calificación Promedio",
    "total_reviews": "Total de Reseñas"
  }
}
```

## Notificaciones

```json
{
  "notifications": {
    "booking_confirmed": "Tu cita ha sido confirmada para el {{date}} a las {{time}}",
    "booking_reminder": "Recordatorio: Tienes una cita mañana a las {{time}}",
    "booking_cancelled": "Tu cita del {{date}} ha sido cancelada",
    "payment_successful": "Pago de ${{amount}} procesado exitosamente",
    "review_reminder": "¿Cómo fue tu experiencia? Deja una reseña",
    "new_booking": "Nueva reserva: {{client}} para {{service}}",
    "booking_updated": "La cita del {{date}} ha sido modificada",
    "payment_received": "Pago recibido: ${{amount}} por {{service}}",
    "profile_approved": "¡Tu perfil profesional ha sido aprobado!",
    "document_required": "Se requiere documentación adicional"
  }
}
```

## Ayuda y Soporte

```json
{
  "help_support": {
    "faq": {
      "title": "Preguntas Frecuentes",
      "client_section": "Para Clientes",
      "provider_section": "Para Profesionales",
      "questions": {
        "how_to_book": {
          "q": "¿Cómo reservo una cita?",
          "a": "Selecciona un servicio, elige tu barbero preferido, escoge fecha y hora, y confirma tu reserva con el pago."
        },
        "cancel_booking": {
          "q": "¿Puedo cancelar o modificar mi reserva?",
          "a": "Sí, puedes cancelar hasta 24 horas antes de tu cita sin costo. Para modificaciones, contacta directamente al barbero."
        },
        "payment_methods": {
          "q": "¿Qué métodos de pago aceptan?",
          "a": "Aceptamos tarjetas de crédito, débito, Mercado Pago, transferencias bancarias y efectivo en el local."
        },
        "how_to_register": {
          "q": "¿Cómo me registro como profesional?",
          "a": "Completa el formulario de registro, sube la documentación requerida y espera la aprobación en 24-48 horas."
        },
        "set_availability": {
          "q": "¿Cómo configuro mi disponibilidad?",
          "a": "Ve a tu panel de control, sección 'Disponibilidad', y configura tus horarios de trabajo y días libres."
        }
      }
    },
    "contact": {
      "title": "Contacto",
      "email": "soporte@barberpro.com.ar",
      "whatsapp": "+54-11-1234-5678",
      "hours": "Lunes a Viernes: 9:00 - 18:00",
      "emergency": "Para emergencias: soporte-urgente@barberpro.com.ar"
    }
  }
}
```

## Términos y Condiciones (Resumen)

```json
{
  "terms_summary": {
    "title": "Términos y Condiciones",
    "sections": {
      "service_definition": "Definición del Servicio",
      "user_responsibilities": "Responsabilidades del Usuario",
      "booking_policies": "Políticas de Reserva",
      "payment_terms": "Términos de Pago",
      "cancellation_policy": "Política de Cancelación",
      "liability": "Limitación de Responsabilidad",
      "privacy": "Protección de Datos Personales",
      "dispute_resolution": "Resolución de Disputas",
      "applicable_law": "Ley Aplicable"
    },
    "acceptance": "Al usar BarberPro, aceptas estos términos y condiciones.",
    "updates": "Nos reservamos el derecho de actualizar estos términos.",
    "contact": "Para consultas: legal@barberpro.com.ar"
  }
}
```

## Estados y Mensajes del Sistema

```json
{
  "system_states": {
    "loading": "Cargando...",
    "saving": "Guardando...",
    "processing": "Procesando...",
    "uploading": "Subiendo...",
    "sending": "Enviando...",
    "connecting": "Conectando...",
    "updating": "Actualizando...",
    "deleting": "Eliminando...",
    "confirming": "Confirmando...",
    "verifying": "Verificando...",
    "searching": "Buscando...",
    "filtering": "Filtrando...",
    "sorting": "Ordenando...",
    "syncing": "Sincronizando...",
    "refreshing": "Actualizando..."
  }
}
```

## Mensajes de Error Específicos

```json
{
  "specific_errors": {
    "network_error": "Error de conexión. Verifica tu internet.",
    "server_error": "Error del servidor. Intenta nuevamente.",
    "payment_error": "Error en el pago. Verifica tus datos.",
    "booking_conflict": "El horario ya no está disponible.",
    "file_upload_error": "Error al subir archivo. Intenta nuevamente.",
    "login_failed": "Credenciales incorrectas.",
    "session_expired": "Tu sesión ha expirado. Inicia sesión nuevamente.",
    "unauthorized": "No tienes permisos para esta acción.",
    "not_found": "El recurso solicitado no fue encontrado.",
    "validation_failed": "Los datos ingresados no son válidos.",
    "service_unavailable": "El servicio no está disponible temporalmente.",
    "rate_limited": "Demasiadas solicitudes. Intenta más tarde."
  }
}
```

---

**Notas de Implementación:**
- Todos los textos deben usar el formato argentino (es-AR)
- Las fechas deben mostrarse en formato DD/MM/AAAA
- Los horarios en formato 24 horas
- Los precios siempre en pesos argentinos (ARS)
- Usar "vos" en contextos informales cuando sea apropiado
- Incluir términos locales argentinos cuando corresponda