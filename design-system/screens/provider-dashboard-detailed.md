# Provider Dashboard Detailed Design
*BarberPro - Premium Argentina Barber Booking Platform*

## Design Overview
**Component:** Complete Provider Management Interface  
**Priority:** Critical Path - Provider retention and productivity  
**Persona Focus:** Carlos (Shop Owner), Martín (Independent), Alejandro (Chain Owner)  
**Device Priority:** Desktop-first with mobile optimization  

---

## 1. Dashboard Overview & Navigation

### **Top Navigation Bar**
```scss
.provider-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
  
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .brand-logo {
      width: 32px;
      height: 32px;
    }
    
    .brand-text {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      
      .brand-suffix {
        color: #2563eb;
        font-weight: 400;
      }
    }
  }
  
  .nav-center {
    display: flex;
    align-items: center;
    gap: 2rem;
    
    @media (max-width: 768px) {
      display: none;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
      
      .nav-icon {
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        background: #f1f5f9;
        color: #374151;
      }
      
      &.active {
        background: #eff6ff;
        color: #2563eb;
      }
    }
  }
  
  .nav-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .notification-bell {
      position: relative;
      width: 40px;
      height: 40px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f1f5f9;
        border-color: #d1d5db;
      }
      
      .bell-icon {
        width: 18px;
        height: 18px;
        color: #64748b;
      }
      
      .notification-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        font-size: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }
    }
    
    .provider-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: #f8fafc;
      }
      
      .profile-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e2e8f0;
      }
      
      .profile-info {
        @media (max-width: 640px) {
          display: none;
        }
        
        .profile-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.125rem;
        }
        
        .profile-role {
          font-size: 12px;
          color: #64748b;
        }
      }
      
      .profile-chevron {
        width: 16px;
        height: 16px;
        color: #9ca3af;
        
        @media (max-width: 480px) {
          display: none;
        }
      }
    }
  }
  
  .mobile-menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .menu-icon {
      width: 20px;
      height: 20px;
    }
  }
}
```

### **Sidebar Navigation (Desktop)**
```scss
.provider-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  height: calc(100vh - 64px);
  position: fixed;
  left: 0;
  top: 64px;
  overflow-y: auto;
  z-index: 40;
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateX(0);
    }
  }
  
  .sidebar-content {
    padding: 1.5rem 0;
    
    .nav-section {
      margin-bottom: 2rem;
      
      .section-title {
        padding: 0 1.5rem;
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 1rem;
      }
      
      .nav-links {
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          
          .link-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          
          .link-text {
            flex: 1;
          }
          
          .link-badge {
            background: #ef4444;
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 0.125rem 0.375rem;
            border-radius: 10px;
            min-width: 16px;
            text-align: center;
          }
          
          &:hover {
            background: #f8fafc;
            color: #374151;
          }
          
          &.active {
            background: #eff6ff;
            color: #2563eb;
            
            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: #2563eb;
            }
          }
        }
      }
    }
  }
  
  .sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: white;
    
    .upgrade-card {
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      color: white;
      
      .upgrade-icon {
        width: 24px;
        height: 24px;
        margin: 0 auto 0.5rem;
      }
      
      .upgrade-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      
      .upgrade-text {
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 0.75rem;
      }
      
      .upgrade-btn {
        width: 100%;
        padding: 0.5rem;
        background: white;
        color: #2563eb;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
    }
  }
}
```

---

## 2. Calendar View with Bookings

### **Calendar Header & Controls**
```scss
.calendar-view {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    
    .calendar-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .title-text {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }
      
      .current-date {
        font-size: 16px;
        color: #64748b;
        font-weight: 500;
      }
    }
    
    .calendar-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      .view-toggle {
        display: flex;
        background: #f1f5f9;
        border-radius: 6px;
        padding: 0.25rem;
        
        .toggle-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &.active {
            background: white;
            color: #374151;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      }
      
      .date-navigation {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .nav-btn {
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
          
          .nav-icon {
            width: 16px;
            height: 16px;
            color: #64748b;
          }
        }
        
        .today-btn {
          padding: 0.5rem 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          
          &:hover {
            background: #1d4ed8;
          }
        }
      }
    }
  }
  
  .calendar-filters {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .filter-label {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }
      
      .filter-select {
        padding: 0.375rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        font-size: 14px;
        color: #374151;
        
        &:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
    }
    
    .booking-stats {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      
      .stat-item {
        text-align: center;
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.125rem;
        }
        
        .stat-label {
          font-size: 12px;
          color: #64748b;
        }
      }
    }
  }
}
```

### **Weekly Calendar Grid**
```scss
.calendar-grid {
  .time-grid {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
    
    .time-labels {
      border-right: 1px solid #f1f5f9;
      
      .time-slot {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #64748b;
        border-bottom: 1px solid #f1f5f9;
        
        &.hour-mark {
          font-weight: 600;
          color: #374151;
        }
      }
    }
    
    .day-column {
      border-right: 1px solid #f1f5f9;
      position: relative;
      
      &:last-child {
        border-right: none;
      }
      
      .day-header {
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        
        .day-name {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 0.125rem;
        }
        
        .day-number {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          
          &.today {
            background: #2563eb;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          }
        }
        
        .day-count {
          font-size: 10px;
          color: #059669;
          font-weight: 600;
          margin-top: 0.125rem;
        }
      }
      
      .time-slots {
        .time-slot {
          height: 60px;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
          
          &.current-hour {
            background: #fef3c7;
            
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: #f59e0b;
            }
          }
        }
      }
      
      .booking-event {
        position: absolute;
        left: 4px;
        right: 4px;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-size: 11px;
        cursor: pointer;
        z-index: 10;
        border-left: 3px solid;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .event-time {
          font-weight: 600;
          margin-bottom: 0.125rem;
        }
        
        .event-client {
          color: rgba(0, 0, 0, 0.8);
          margin-bottom: 0.125rem;
        }
        
        .event-service {
          font-size: 10px;
          opacity: 0.9;
        }
        
        &.confirmed {
          background: #dcfce7;
          border-left-color: #16a34a;
          color: #166534;
        }
        
        &.pending {
          background: #fef3c7;
          border-left-color: #d97706;
          color: #92400e;
        }
        
        &.cancelled {
          background: #fee2e2;
          border-left-color: #dc2626;
          color: #991b1b;
          text-decoration: line-through;
        }
        
        &.blocked {
          background: #f1f5f9;
          border-left-color: #64748b;
          color: #475569;
          
          &::before {
            content: '🚫';
            margin-right: 0.25rem;
          }
        }
      }
    }
  }
}
```

### **Daily View (Mobile Optimized)**
```scss
.daily-view {
  @media (max-width: 768px) {
    .day-header {
      padding: 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      
      .date-info {
        text-align: center;
        
        .day-name {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        
        .day-date {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }
      }
      
      .day-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 1rem;
        
        .stat {
          text-align: center;
          
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #059669;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
          }
        }
      }
    }
    
    .appointments-list {
      .appointment-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
        
        .appointment-time {
          width: 60px;
          text-align: center;
          
          .time-text {
            font-size: 14px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 0.125rem;
          }
          
          .duration {
            font-size: 11px;
            color: #64748b;
          }
        }
        
        .appointment-info {
          flex: 1;
          margin-left: 1rem;
          
          .client-name {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }
          
          .service-name {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 0.25rem;
          }
          
          .appointment-tags {
            display: flex;
            gap: 0.5rem;
            
            .tag {
              font-size: 11px;
              padding: 0.125rem 0.5rem;
              border-radius: 12px;
              font-weight: 500;
              
              &.new-client {
                background: #eff6ff;
                color: #2563eb;
              }
              
              &.vip {
                background: #fef3c7;
                color: #92400e;
              }
            }
          }
        }
        
        .appointment-actions {
          display: flex;
          gap: 0.5rem;
          
          .action-btn {
            width: 36px;
            height: 36px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            
            .action-icon {
              width: 16px;
              height: 16px;
              color: #64748b;
            }
            
            &.primary {
              background: #2563eb;
              border-color: #2563eb;
              
              .action-icon {
                color: white;
              }
            }
          }
        }
        
        .status-indicator {
          width: 4px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          
          &.confirmed { background: #16a34a; }
          &.pending { background: #d97706; }
          &.cancelled { background: #dc2626; }
        }
      }
    }
  }
}
```

---

## 3. Service Management Interface

### **Services Overview Grid**
```scss
.services-management {
  .services-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      
      .add-service-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
        
        &:hover {
          background: #1d4ed8;
        }
        
        .plus-icon {
          width: 18px;
          height: 18px;
        }
      }
      
      .import-btn {
        padding: 0.75rem 1.5rem;
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        
        &:hover {
          background: #f9fafb;
        }
      }
    }
  }
  
  .services-filters {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    .filters-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      
      @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-input {
        flex: 1;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        
        &::placeholder {
          color: #9ca3af;
        }
        
        &:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
      
      .filter-select {
        min-width: 140px;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 14px;
      }
      
      .view-toggle {
        display: flex;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
        
        .toggle-btn {
          padding: 0.5rem;
          background: white;
          border: none;
          cursor: pointer;
          
          &.active {
            background: #2563eb;
            color: white;
          }
          
          .toggle-icon {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
  
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
    
    .service-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #2563eb;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
      }
      
      .card-header {
        position: relative;
        height: 120px;
        background: #f1f5f9;
        
        .service-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .card-actions {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: flex;
          gap: 0.5rem;
          
          .action-btn {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(10px);
            
            .action-icon {
              width: 16px;
              height: 16px;
              color: #64748b;
            }
            
            &:hover {
              background: white;
            }
          }
        }
        
        .status-badge {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          
          &.active {
            background: #dcfce7;
            color: #166534;
          }
          
          &.inactive {
            background: #fee2e2;
            color: #991b1b;
          }
          
          &.draft {
            background: #fef3c7;
            color: #92400e;
          }
        }
      }
      
      .card-content {
        padding: 1rem;
        
        .service-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        
        .service-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .service-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          
          .price-info {
            .current-price {
              font-size: 18px;
              font-weight: 700;
              color: #059669;
              
              .currency {
                font-size: 14px;
                color: #6b7280;
              }
            }
            
            .price-note {
              font-size: 12px;
              color: #6b7280;
            }
          }
          
          .duration-badge {
            background: #eff6ff;
            color: #2563eb;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            
            .clock-icon {
              width: 12px;
              height: 12px;
              margin-right: 0.25rem;
            }
          }
        }
        
        .service-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
          
          .stat-item {
            text-align: center;
            
            .stat-value {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 0.125rem;
            }
            
            .stat-label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }
        
        .card-footer {
          display: flex;
          gap: 0.75rem;
          
          .edit-btn {
            flex: 1;
            padding: 0.5rem;
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            
            &:hover {
              background: #f9fafb;
            }
          }
          
          .toggle-btn {
            flex: 1;
            padding: 0.5rem;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            
            &.activate {
              background: #059669;
              color: white;
              
              &:hover {
                background: #047857;
              }
            }
            
            &.deactivate {
              background: #ef4444;
              color: white;
              
              &:hover {
                background: #dc2626;
              }
            }
          }
        }
      }
    }
  }
}
```

### **Service Creation/Edit Modal**
```scss
.service-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  
  .modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      
      .modal-title {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }
      
      .close-btn {
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        border-radius: 6px;
        
        &:hover {
          background: #f1f5f9;
        }
        
        .close-icon {
          width: 20px;
          height: 20px;
        }
      }
    }
    
    .modal-body {
      padding: 1.5rem;
      
      .form-section {
        margin-bottom: 2rem;
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          
          @media (max-width: 640px) {
            grid-template-columns: 1fr;
          }
        }
      }
      
      .image-upload {
        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #2563eb;
            background: #f8fafc;
          }
          
          &.has-image {
            border-style: solid;
            border-color: #e2e8f0;
            padding: 0;
            
            .uploaded-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              border-radius: 6px;
            }
          }
          
          .upload-icon {
            width: 48px;
            height: 48px;
            color: #9ca3af;
            margin: 0 auto 1rem;
          }
          
          .upload-text {
            font-size: 16px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          
          .upload-hint {
            font-size: 14px;
            color: #6b7280;
          }
        }
        
        .image-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          
          .image-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            
            &:hover {
              background: #f9fafb;
            }
          }
        }
      }
      
      .pricing-section {
        .price-types {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          
          .price-type {
            flex: 1;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
              border-color: #2563eb;
            }
            
            &.selected {
              border-color: #2563eb;
              background: #eff6ff;
            }
            
            .type-title {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 0.25rem;
            }
            
            .type-description {
              font-size: 12px;
              color: #6b7280;
            }
          }
        }
        
        .price-inputs {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 1rem;
          align-items: end;
          
          .currency-select {
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
          }
        }
        
        .discount-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
          
          .discount-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            
            .toggle-switch {
              width: 44px;
              height: 24px;
              background: #d1d5db;
              border-radius: 12px;
              position: relative;
              cursor: pointer;
              transition: background 0.2s ease;
              
              &.active {
                background: #2563eb;
                
                .toggle-slider {
                  transform: translateX(20px);
                }
              }
              
              .toggle-slider {
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 2px;
                left: 2px;
                transition: transform 0.2s ease;
              }
            }
            
            .toggle-label {
              font-size: 14px;
              font-weight: 500;
              color: #374151;
            }
          }
        }
      }
      
      .availability-section {
        .time-blocks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          
          .time-block {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            
            .block-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 1rem;
              
              .block-title {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
              }
              
              .block-toggle {
                width: 36px;
                height: 20px;
                background: #d1d5db;
                border-radius: 10px;
                position: relative;
                cursor: pointer;
                
                &.active {
                  background: #2563eb;
                  
                  .slider {
                    transform: translateX(16px);
                  }
                }
                
                .slider {
                  width: 16px;
                  height: 16px;
                  background: white;
                  border-radius: 50%;
                  position: absolute;
                  top: 2px;
                  left: 2px;
                  transition: transform 0.2s ease;
                }
              }
            }
            
            .time-inputs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
              
              .time-input {
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
    
    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      
      .footer-left {
        .delete-btn {
          padding: 0.75rem 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          
          &:hover {
            background: #dc2626;
          }
        }
      }
      
      .footer-right {
        display: flex;
        gap: 1rem;
        
        .cancel-btn {
          padding: 0.75rem 1.5rem;
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
        
        .save-btn {
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          
          &:hover {
            background: #1d4ed8;
          }
          
          &:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}
```

---

## 4. Earnings & Analytics Dashboard

### **Revenue Overview Cards**
```scss
.analytics-dashboard {
  .revenue-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    
    .revenue-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #2563eb, #3b82f6);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        
        .card-icon {
          width: 48px;
          height: 48px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .icon {
            width: 24px;
            height: 24px;
            color: #2563eb;
          }
        }
        
        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          
          &.up {
            background: #dcfce7;
            color: #166534;
            
            .trend-icon {
              transform: rotate(-45deg);
            }
          }
          
          &.down {
            background: #fee2e2;
            color: #991b1b;
            
            .trend-icon {
              transform: rotate(45deg);
            }
          }
          
          &.neutral {
            background: #f1f5f9;
            color: #64748b;
          }
          
          .trend-icon {
            width: 12px;
            height: 12px;
          }
        }
      }
      
      .card-content {
        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
          
          .currency {
            font-size: 18px;
            color: #64748b;
            font-weight: 500;
          }
        }
        
        .metric-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 1rem;
        }
        
        .metric-comparison {
          font-size: 12px;
          color: #6b7280;
          
          .comparison-value {
            font-weight: 600;
            
            &.positive { color: #059669; }
            &.negative { color: #dc2626; }
          }
        }
      }
      
      .mini-chart {
        height: 40px;
        margin-top: 1rem;
        
        .chart-bar {
          display: inline-block;
          width: 4px;
          background: #e2e8f0;
          margin-right: 2px;
          border-radius: 2px;
          transition: all 0.3s ease;
          
          &.active {
            background: #2563eb;
          }
        }
      }
    }
  }
  
  .revenue-chart {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      .chart-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }
      
      .chart-filters {
        display: flex;
        gap: 0.5rem;
        
        .filter-btn {
          padding: 0.5rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: #f1f5f9;
          }
          
          &.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
          }
        }
      }
    }
    
    .chart-container {
      height: 300px;
      position: relative;
      
      .chart-canvas {
        width: 100%;
        height: 100%;
      }
      
      .chart-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 10;
        
        .tooltip-date {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .tooltip-value {
          color: #22c55e;
        }
      }
    }
  }
}
```

### **Performance Metrics Section**
```scss
.performance-metrics {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  .bookings-analytics {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    
    .analytics-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }
      
      .period-selector {
        display: flex;
        background: #f1f5f9;
        border-radius: 6px;
        padding: 0.25rem;
        
        .period-btn {
          padding: 0.375rem 0.75rem;
          background: transparent;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          
          &.active {
            background: white;
            color: #374151;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      .metric-item {
        text-align: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        
        .metric-icon {
          width: 32px;
          height: 32px;
          margin: 0 auto 0.5rem;
          background: #eff6ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .icon {
            width: 18px;
            height: 18px;
            color: #2563eb;
          }
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        
        .metric-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }
    
    .bookings-chart {
      height: 200px;
      position: relative;
      
      .chart-bars {
        display: flex;
        align-items: end;
        height: 100%;
        gap: 4px;
        
        .chart-bar {
          flex: 1;
          background: #e2e8f0;
          border-radius: 2px 2px 0 0;
          min-height: 8px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: #2563eb;
          }
          
          &.highlight {
            background: #2563eb;
          }
          
          .bar-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }
          
          &:hover .bar-tooltip {
            opacity: 1;
          }
        }
      }
      
      .chart-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        
        .label {
          font-size: 11px;
          color: #6b7280;
        }
      }
    }
  }
  
  .top-services {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    
    .services-header {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 1rem;
    }
    
    .services-list {
      .service-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;
        
        &:last-child {
          border-bottom: none;
        }
        
        .service-rank {
          width: 24px;
          height: 24px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-right: 0.75rem;
          
          &.top {
            background: #fef3c7;
            color: #92400e;
          }
        }
        
        .service-info {
          flex: 1;
          
          .service-name {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.125rem;
          }
          
          .service-stats {
            font-size: 12px;
            color: #6b7280;
          }
        }
        
        .service-revenue {
          text-align: right;
          
          .revenue-value {
            font-size: 14px;
            font-weight: 700;
            color: #059669;
            margin-bottom: 0.125rem;
          }
          
          .revenue-change {
            font-size: 11px;
            color: #6b7280;
          }
        }
      }
    }
  }
}
```

---

## 5. Client Management Interface

### **Client List & Search**
```scss
.client-management {
  .clients-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      
      .add-client-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        
        .plus-icon {
          width: 18px;
          height: 18px;
        }
      }
      
      .export-btn {
        padding: 0.75rem 1.5rem;
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
      }
    }
  }
  
  .clients-filters {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    .filters-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      
      .search-input {
        flex: 1;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        
        &::placeholder {
          color: #9ca3af;
        }
      }
      
      .filter-select {
        min-width: 140px;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
      }
      
      .date-range {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        
        .date-input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
      }
    }
  }
  
  .clients-table {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    
    .table-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      
      .header-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
        padding: 1rem;
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        
        .header-cell {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          
          &.sortable {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            
            .sort-icon {
              width: 14px;
              height: 14px;
              color: #9ca3af;
            }
            
            &:hover {
              color: #2563eb;
              
              .sort-icon {
                color: #2563eb;
              }
            }
          }
        }
      }
    }
    
    .table-body {
      .client-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.2s ease;
        
        &:hover {
          background: #f8fafc;
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
        }
        
        .client-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          
          .client-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: #64748b;
          }
          
          .client-details {
            .client-name {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 0.125rem;
            }
            
            .client-contact {
              font-size: 12px;
              color: #6b7280;
            }
          }
          
          .client-tags {
            display: flex;
            gap: 0.25rem;
            margin-left: auto;
            
            .tag {
              font-size: 10px;
              padding: 0.125rem 0.375rem;
              border-radius: 8px;
              font-weight: 500;
              
              &.vip {
                background: #fef3c7;
                color: #92400e;
              }
              
              &.new {
                background: #eff6ff;
                color: #2563eb;
              }
              
              &.frequent {
                background: #ecfdf5;
                color: #166534;
              }
            }
          }
        }
        
        .client-bookings {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          
          @media (max-width: 768px) {
            display: flex;
            justify-content: space-between;
            
            &::before {
              content: 'Reservas: ';
              color: #6b7280;
              font-weight: 500;
            }
          }
        }
        
        .client-revenue {
          font-size: 14px;
          font-weight: 700;
          color: #059669;
          
          @media (max-width: 768px) {
            display: flex;
            justify-content: space-between;
            
            &::before {
              content: 'Facturación: ';
              color: #6b7280;
              font-weight: 500;
            }
          }
        }
        
        .client-last-visit {
          font-size: 14px;
          color: #6b7280;
          
          @media (max-width: 768px) {
            display: flex;
            justify-content: space-between;
            
            &::before {
              content: 'Última visita: ';
              font-weight: 500;
            }
          }
        }
        
        .client-rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          
          .stars {
            color: #fbbf24;
            font-size: 12px;
          }
          
          .rating-value {
            font-size: 12px;
            color: #6b7280;
          }
          
          @media (max-width: 768px) {
            justify-content: space-between;
            
            &::before {
              content: 'Valoración: ';
              color: #6b7280;
              font-weight: 500;
            }
          }
        }
        
        .client-actions {
          display: flex;
          gap: 0.5rem;
          
          .action-btn {
            width: 32px;
            height: 32px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            
            .action-icon {
              width: 16px;
              height: 16px;
              color: #64748b;
            }
            
            &:hover {
              background: #f9fafb;
              border-color: #9ca3af;
            }
          }
        }
      }
    }
  }
}
```

---

## 6. Notification Center

### **Notification Panel**
```scss
.notification-center {
  .notifications-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      
      .mark-all-read {
        font-size: 14px;
        color: #2563eb;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .notification-settings {
        width: 36px;
        height: 36px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        .settings-icon {
          width: 18px;
          height: 18px;
          color: #64748b;
        }
      }
    }
  }
  
  .notification-filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    
    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f1f5f9;
      }
      
      &.active {
        background: #2563eb;
        color: white;
        border-color: #2563eb;
      }
      
      .chip-icon {
        width: 14px;
        height: 14px;
      }
      
      .chip-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.125rem 0.375rem;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        min-width: 16px;
        text-align: center;
      }
    }
  }
  
  .notifications-list {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    
    .notification-item {
      display: flex;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: #f8fafc;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      &.unread {
        background: #eff6ff;
        border-left: 3px solid #2563eb;
        
        &::before {
          content: '';
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
        }
      }
      
      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        flex-shrink: 0;
        
        .icon {
          width: 20px;
          height: 20px;
        }
        
        &.booking {
          background: #dcfce7;
          color: #166534;
        }
        
        &.payment {
          background: #fef3c7;
          color: #92400e;
        }
        
        &.review {
          background: #eff6ff;
          color: #2563eb;
        }
        
        &.system {
          background: #f1f5f9;
          color: #64748b;
        }
        
        &.urgent {
          background: #fee2e2;
          color: #991b1b;
        }
      }
      
      .notification-content {
        flex: 1;
        
        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        
        .notification-message {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }
        
        .notification-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .notification-time {
            font-size: 12px;
            color: #9ca3af;
          }
          
          .notification-actions {
            display: flex;
            gap: 0.5rem;
            
            .action-btn {
              padding: 0.25rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              background: white;
              font-size: 12px;
              cursor: pointer;
              
              &.primary {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
              }
              
              &.secondary {
                color: #374151;
                
                &:hover {
                  background: #f9fafb;
                }
              }
            }
          }
        }
      }
    }
    
    .empty-notifications {
      text-align: center;
      padding: 3rem 1rem;
      
      .empty-icon {
        width: 64px;
        height: 64px;
        background: #f1f5f9;
        border-radius: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        
        .icon {
          width: 32px;
          height: 32px;
          color: #9ca3af;
        }
      }
      
      .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }
      
      .empty-message {
        font-size: 14px;
        color: #6b7280;
      }
    }
  }
}
```

This comprehensive provider dashboard design provides a professional, efficient interface that caters to all provider personas while maintaining BarberPro's premium positioning and ensuring optimal user experience across all devices.