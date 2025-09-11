# Complete Booking Flow Design
*BarberPro - Premium Argentina Barber Booking Platform*

## Design Overview
**Component:** End-to-End Booking Experience  
**Priority:** Critical Path - Primary conversion flow  
**Persona Focus:** All user types - optimized for 3-minute completion  
**Device Priority:** Mobile-first with progressive enhancement  

---

## 1. Service Selection & Details Page

### **Service Details Header**
```scss
.service-details {
  background: white;
  
  .service-hero {
    position: relative;
    height: 250px;
    overflow: hidden;
    
    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .hero-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 2rem 1rem 1rem;
      color: white;
      
      .service-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 0.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .provider-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .provider-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        .provider-details {
          .provider-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }
          
          .provider-stats {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 14px;
            
            .rating {
              display: flex;
              align-items: center;
              gap: 0.25rem;
              
              .stars {
                color: #fbbf24;
              }
            }
            
            .distance {
              &::before {
                content: "📍";
                margin-right: 0.25rem;
              }
            }
          }
        }
      }
    }
    
    .back-button {
      position: absolute;
      top: 1rem;
      left: 1rem;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(10px);
      
      .back-icon {
        width: 20px;
        height: 20px;
        color: #374151;
      }
    }
    
    .favorite-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(10px);
      
      .heart-icon {
        width: 20px;
        height: 20px;
        color: #ef4444;
        
        &.filled {
          fill: currentColor;
        }
      }
    }
  }
}
```

### **Service Information Section**
```scss
.service-info {
  padding: 1.5rem 1rem;
  
  .price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    
    .price-info {
      .current-price {
        font-size: 28px;
        font-weight: 700;
        color: #059669;
        
        .currency {
          font-size: 18px;
          color: #6b7280;
        }
      }
      
      .original-price {
        font-size: 16px;
        color: #9ca3af;
        text-decoration: line-through;
        margin-left: 0.5rem;
      }
      
      .price-note {
        font-size: 14px;
        color: #6b7280;
        margin-top: 0.25rem;
      }
    }
    
    .duration-badge {
      background: #eff6ff;
      color: #2563eb;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      
      .clock-icon {
        width: 16px;
        height: 16px;
        margin-right: 0.25rem;
      }
    }
  }
  
  .description {
    margin-bottom: 1.5rem;
    
    .description-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    
    .description-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }
  }
  
  .service-features {
    margin-bottom: 1.5rem;
    
    .features-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    
    .features-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .feature-tag {
        background: #f1f5f9;
        color: #475569;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        
        &.premium {
          background: #fef3c7;
          color: #92400e;
          
          &::before {
            content: "👑";
            margin-right: 0.25rem;
          }
        }
      }
    }
  }
}
```

### **Provider Profile Section**
```scss
.provider-profile {
  background: #f8fafc;
  padding: 1.5rem 1rem;
  margin-bottom: 1rem;
  
  .profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .provider-avatar-large {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .provider-info {
      flex: 1;
      
      .provider-name {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }
      
      .provider-experience {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }
      
      .provider-badges {
        display: flex;
        gap: 0.5rem;
        
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          
          &.verified {
            background: #dcfce7;
            color: #166534;
          }
          
          &.premium {
            background: #fef3c7;
            color: #92400e;
          }
        }
      }
    }
    
    .view-profile-btn {
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      
      &:hover {
        background: #f9fafb;
      }
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }
}
```

---

## 2. Time Slot Picker with Availability

### **Calendar Date Selector**
```scss
.booking-calendar {
  background: white;
  padding: 1rem;
  
  .calendar-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 1rem;
    
    .current-month {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .nav-buttons {
      display: flex;
      gap: 0.5rem;
      
      .nav-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        &:hover {
          background: #f9fafb;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .week-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
    margin-bottom: 0.5rem;
    
    .week-day {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      padding: 0.5rem 0;
    }
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
    
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      
      &.other-month {
        color: #d1d5db;
      }
      
      &.today {
        background: #eff6ff;
        color: #2563eb;
        font-weight: 600;
      }
      
      &.selected {
        background: #2563eb;
        color: white;
        font-weight: 600;
      }
      
      &.available {
        background: #f0fdf4;
        color: #166534;
        
        &:hover {
          background: #dcfce7;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #22c55e;
          border-radius: 50%;
        }
      }
      
      &.limited {
        background: #fef3c7;
        color: #92400e;
        
        &::after {
          background: #f59e0b;
        }
      }
      
      &.unavailable {
        color: #d1d5db;
        cursor: not-allowed;
        
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 1px;
          background: #d1d5db;
          transform: translateY(-50%);
        }
      }
    }
  }
  
  .availability-legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    font-size: 12px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        
        &.available { background: #22c55e; }
        &.limited { background: #f59e0b; }
        &.unavailable { background: #d1d5db; }
      }
    }
  }
}
```

### **Time Slot Grid**
```scss
.time-slots {
  background: white;
  padding: 1rem;
  
  .slots-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .selected-date {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .slots-available {
      font-size: 14px;
      color: #059669;
      background: #ecfdf5;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }
  }
  
  .time-periods {
    .time-period {
      margin-bottom: 1.5rem;
      
      .period-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.75rem;
        padding-left: 0.5rem;
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 16px;
          background: #2563eb;
          border-radius: 2px;
        }
      }
      
      .slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 0.75rem;
        
        .time-slot {
          padding: 0.75rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          
          .slot-time {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
          }
          
          .slot-price {
            font-size: 12px;
            color: #059669;
            font-weight: 500;
          }
          
          &:hover {
            border-color: #2563eb;
            background: #f8fafc;
          }
          
          &.selected {
            border-color: #2563eb;
            background: #2563eb;
            
            .slot-time,
            .slot-price {
              color: white;
            }
          }
          
          &.unavailable {
            border-color: #f1f5f9;
            background: #f8fafc;
            cursor: not-allowed;
            
            .slot-time {
              color: #d1d5db;
              text-decoration: line-through;
            }
            
            .slot-price {
              display: none;
            }
          }
          
          &.popular {
            position: relative;
            
            &::after {
              content: '🔥';
              position: absolute;
              top: -8px;
              right: -8px;
              font-size: 16px;
            }
          }
        }
      }
    }
  }
  
  .quick-booking {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    
    .quick-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
      
      &::before {
        content: '⚡';
        margin-right: 0.5rem;
      }
    }
    
    .quick-slots {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      
      .quick-slot {
        min-width: 120px;
        padding: 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        text-align: center;
        cursor: pointer;
        
        .quick-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        
        .quick-time {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        &:hover {
          border-color: #2563eb;
        }
      }
    }
  }
}
```

---

## 3. Booking Confirmation & Summary

### **Booking Summary Card**
```scss
.booking-summary {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 1rem;
  
  .summary-header {
    background: #f8fafc;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    
    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    
    .booking-id {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }
  }
  
  .summary-content {
    padding: 1rem;
    
    .service-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      .service-image {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
      }
      
      .service-details {
        flex: 1;
        
        .service-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        
        .provider-name {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        
        .service-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          
          .feature {
            font-size: 11px;
            background: #f1f5f9;
            color: #475569;
            padding: 0.125rem 0.5rem;
            border-radius: 8px;
          }
        }
      }
    }
    
    .booking-details {
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;
        
        &:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .detail-icon {
            width: 16px;
            height: 16px;
            color: #9ca3af;
          }
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-align: right;
        }
        
        &.price-row {
          .detail-value {
            font-size: 18px;
            font-weight: 700;
            color: #059669;
          }
        }
        
        &.total-row {
          border-top: 2px solid #e2e8f0;
          padding-top: 1rem;
          margin-top: 0.5rem;
          
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          
          .detail-value {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
          }
        }
      }
    }
  }
}
```

### **Client Information Form**
```scss
.client-form {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .form-header {
    margin-bottom: 1.5rem;
    
    .form-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    
    .form-subtitle {
      font-size: 14px;
      color: #6b7280;
    }
  }
  
  .form-fields {
    .field-group {
      margin-bottom: 1rem;
      
      .field-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
        
        .required {
          color: #ef4444;
          margin-left: 0.25rem;
        }
      }
      
      .field-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 16px; // Prevent iOS zoom
        transition: border-color 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        &.error {
          border-color: #ef4444;
          
          &:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
        }
        
        &::placeholder {
          color: #9ca3af;
        }
      }
      
      .field-error {
        font-size: 12px;
        color: #ef4444;
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        
        .error-icon {
          width: 14px;
          height: 14px;
        }
      }
      
      .field-help {
        font-size: 12px;
        color: #6b7280;
        margin-top: 0.25rem;
      }
    }
    
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
    
    .phone-input {
      display: flex;
      
      .country-code {
        width: 80px;
        border-right: none;
        border-radius: 6px 0 0 6px;
        background: #f9fafb;
        text-align: center;
        font-weight: 500;
      }
      
      .phone-number {
        flex: 1;
        border-left: none;
        border-radius: 0 6px 6px 0;
      }
    }
  }
  
  .special-requests {
    .textarea {
      min-height: 80px;
      resize: vertical;
      font-family: inherit;
    }
    
    .char-counter {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
      margin-top: 0.25rem;
    }
  }
}
```

---

## 4. Payment Integration Screens

### **Payment Method Selection**
```scss
.payment-methods {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .payment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    .payment-icon {
      width: 20px;
      height: 20px;
      color: #059669;
    }
    
    .payment-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .secure-badge {
      margin-left: auto;
      font-size: 11px;
      background: #ecfdf5;
      color: #059669;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 500;
      
      &::before {
        content: '🔒';
        margin-right: 0.25rem;
      }
    }
  }
  
  .payment-options {
    .payment-option {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #2563eb;
        background: #f8fafc;
      }
      
      &.selected {
        border-color: #2563eb;
        background: #eff6ff;
        
        .option-radio {
          background: #2563eb;
          border-color: #2563eb;
          
          &::after {
            opacity: 1;
          }
        }
      }
      
      .option-radio {
        width: 20px;
        height: 20px;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        margin-right: 1rem;
        position: relative;
        transition: all 0.2s ease;
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
      }
      
      .option-icon {
        width: 32px;
        height: 32px;
        margin-right: 1rem;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
      
      .option-details {
        flex: 1;
        
        .option-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        
        .option-description {
          font-size: 12px;
          color: #6b7280;
        }
      }
      
      .option-badge {
        font-size: 11px;
        background: #fef3c7;
        color: #92400e;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 500;
      }
    }
  }
}
```

**Argentina Payment Options:**
1. **MercadoPago** - "Tarjetas, efectivo y más"
2. **Transferencia Bancaria** - "CBU o Alias"
3. **Efectivo** - "Pago en el local"
4. **Tarjeta de Crédito** - "Visa, Mastercard, AMEX"

### **MercadoPago Integration Screen**
```scss
.mercadopago-payment {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  
  .mp-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    
    .mp-logo {
      width: 40px;
      height: 40px;
    }
    
    .mp-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .mp-secure {
      margin-left: auto;
      color: #059669;
      font-size: 12px;
      font-weight: 500;
    }
  }
  
  .payment-amount {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
    
    .amount-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }
    
    .amount-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
  }
  
  .mp-form {
    .card-inputs {
      .card-number {
        .input-with-icon {
          position: relative;
          
          .card-icon {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 20px;
          }
        }
      }
      
      .card-row {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 1rem;
        
        .expiry-input {
          &::placeholder {
            font-size: 14px;
          }
        }
        
        .cvv-input {
          position: relative;
          
          .cvv-help {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            color: #9ca3af;
            cursor: help;
          }
        }
      }
    }
    
    .installments {
      margin-top: 1rem;
      
      .installment-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 14px;
        
        option {
          padding: 0.5rem;
        }
      }
    }
  }
  
  .mp-disclaimer {
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    margin-top: 1rem;
    line-height: 1.4;
    
    a {
      color: #2563eb;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
```

---

## 5. Booking Success & Receipt

### **Success Animation & Confirmation**
```scss
.booking-success {
  text-align: center;
  padding: 2rem 1rem;
  background: white;
  
  .success-animation {
    width: 120px;
    height: 120px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, #059669 0%, #34d399 100%);
    border-radius: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    animation: success-bounce 0.6s ease-out;
    
    .checkmark {
      width: 48px;
      height: 48px;
      color: white;
      animation: checkmark-draw 0.3s ease-out 0.3s both;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border: 2px solid #059669;
      border-radius: 70px;
      opacity: 0.3;
      animation: ring-expand 0.6s ease-out 0.6s both;
    }
  }
  
  .success-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.75rem;
  }
  
  .success-message {
    font-size: 16px;
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.5;
  }
  
  .booking-confirmation {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: left;
    
    .confirmation-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .confirmation-details {
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;
        
        &:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-align: right;
        }
      }
    }
    
    .booking-code {
      background: white;
      border: 1px dashed #d1d5db;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      margin-top: 1rem;
      
      .code-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .code-value {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        font-family: monospace;
        letter-spacing: 2px;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    .primary-button {
      padding: 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: #1d4ed8;
      }
    }
    
    .secondary-button {
      padding: 1rem;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
    }
  }
}

@keyframes success-bounce {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes checkmark-draw {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes ring-expand {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.3; }
}
```

---

## 6. Booking Modification & Cancellation

### **Modification Interface**
```scss
.booking-modification {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  
  .modification-header {
    background: #fef3c7;
    border-bottom: 1px solid #fbbf24;
    padding: 1rem;
    
    .warning-icon {
      width: 20px;
      height: 20px;
      color: #92400e;
      margin-bottom: 0.5rem;
    }
    
    .modification-title {
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.25rem;
    }
    
    .modification-notice {
      font-size: 14px;
      color: #92400e;
    }
  }
  
  .current-booking {
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    
    .current-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
    }
    
    .booking-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      
      .info-item {
        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
      }
    }
  }
  
  .modification-options {
    padding: 1rem;
    
    .option-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }
    
    .modification-tabs {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.25rem;
      margin-bottom: 1rem;
      
      .tab-button {
        flex: 1;
        padding: 0.75rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &.active {
          background: white;
          color: #374151;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
  
  .policy-notice {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem;
    
    .policy-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    
    .policy-text {
      font-size: 13px;
      color: #1e40af;
      line-height: 1.4;
    }
  }
}
```

### **Cancellation Flow**
```scss
.cancellation-flow {
  .cancellation-reasons {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .reasons-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }
    
    .reason-option {
      display: flex;
      align-items: flex-start;
      padding: 0.75rem;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #e2e8f0;
        background: #f9fafb;
      }
      
      &.selected {
        border-color: #2563eb;
        background: #eff6ff;
      }
      
      .reason-radio {
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        margin-right: 0.75rem;
        margin-top: 0.125rem;
        position: relative;
        
        &.selected {
          border-color: #2563eb;
          background: #2563eb;
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          }
        }
      }
      
      .reason-text {
        flex: 1;
        font-size: 14px;
        color: #374151;
        line-height: 1.4;
      }
    }
    
    .other-reason {
      margin-top: 1rem;
      
      .reason-textarea {
        width: 100%;
        min-height: 80px;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        
        &:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
    }
  }
  
  .refund-policy {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .policy-icon {
      width: 20px;
      height: 20px;
      color: #dc2626;
      margin-bottom: 0.5rem;
    }
    
    .policy-title {
      font-size: 14px;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 0.5rem;
    }
    
    .policy-details {
      font-size: 13px;
      color: #991b1b;
      line-height: 1.4;
      
      .refund-amount {
        font-weight: 600;
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        margin: 0.5rem 0;
        display: inline-block;
      }
    }
  }
  
  .final-confirmation {
    background: white;
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    
    .confirmation-icon {
      width: 48px;
      height: 48px;
      color: #ef4444;
      margin: 0 auto 1rem;
    }
    
    .confirmation-title {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 0.5rem;
    }
    
    .confirmation-message {
      font-size: 14px;
      color: #991b1b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    
    .confirmation-buttons {
      display: flex;
      gap: 1rem;
      
      .cancel-booking-btn {
        flex: 1;
        padding: 0.75rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        
        &:hover {
          background: #dc2626;
        }
      }
      
      .keep-booking-btn {
        flex: 1;
        padding: 0.75rem;
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        
        &:hover {
          background: #f9fafb;
        }
      }
    }
  }
}
```

---

## Mobile Optimizations

### **Touch Interactions**
- Minimum 44px touch targets
- Swipe gestures for time slot navigation
- Pull-to-refresh on booking confirmations
- Haptic feedback on iOS for confirmations

### **Performance Enhancements**
- Lazy loading for calendar months
- Image optimization for service photos
- Progressive form validation
- Optimistic UI updates

### **Accessibility Features**
- Voice-over support for all interactions
- High contrast mode compatibility
- Keyboard navigation support
- Screen reader announcements for booking steps

This comprehensive booking flow ensures a premium, conversion-optimized experience that aligns with BarberPro's positioning in the Argentina market.