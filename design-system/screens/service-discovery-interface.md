# Service Discovery Interface Design
*BarberPro - Premium Argentina Barber Booking Platform*

## Design Overview
**Component:** Service Discovery & Search Interface  
**Priority:** Critical Path - Primary user entry point  
**Persona Focus:** Sofía (Young Professional), Diego (Family Man), Rodrigo (Premium Client)  
**Device Priority:** Mobile-first (80% traffic), responsive scaling  

---

## 1. Search & Filter Interface

### **Primary Search Bar**
```scss
// Mobile Layout (375px+)
.search-container {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  z-index: 50;
}

.search-bar {
  width: 100%;
  height: 48px; // Accessibility minimum touch target
  padding: 0 3rem 0 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px; // Prevents zoom on iOS
  background: #ffffff;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #2563eb; // Brand primary
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    outline: none;
  }
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  width: 20px;
  height: 20px;
}
```

**Search Behavior:**
- Auto-complete after 2 characters
- Debounced search (300ms)
- Recent searches (local storage)
- Voice search icon for mobile
- Clear search with 'X' button

### **Filter System**

#### **Quick Filters (Horizontal Scroll)**
```scss
.quick-filters {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  scrollbar-width: none; // Hide scrollbar
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }
  
  &:hover {
    background: #e2e8f0;
  }
}
```

**Quick Filter Options:**
- "Cerca de mí" (Near me) - with location icon
- "Disponible ahora" (Available now) - with clock icon
- "Mejor valorado" (Top rated) - with star icon
- "Precio bajo" (Low price) - with peso icon
- "Premium" - with crown icon

#### **Advanced Filters Modal**
```scss
.filter-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 100;
  
  // Slide up animation
  transform: translateY(100%);
  transition: transform 0.3s ease;
  
  &.open {
    transform: translateY(0);
  }
}

.filter-section {
  margin-bottom: 2rem;
  
  .filter-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
}

// Price Range Slider
.price-range {
  .range-input {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    -webkit-appearance: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: #2563eb;
      border-radius: 50%;
      cursor: pointer;
    }
  }
  
  .price-values {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 14px;
    color: #64748b;
  }
}
```

**Advanced Filter Categories:**
1. **Ubicación (Location)**
   - Distance slider (1-50km)
   - Neighborhood selection
   - "Solo domicilio" toggle

2. **Precio (Price)**
   - Price range slider ($500-$5000 ARS)
   - Payment method preferences

3. **Disponibilidad (Availability)**
   - Today, Tomorrow, This week
   - Specific date picker
   - Time range selector

4. **Servicios (Services)**
   - Multi-select checkboxes
   - Service duration
   - "Para eventos" toggle

5. **Calificación (Rating)**
   - Minimum star rating
   - "Solo verificados" toggle

---

## 2. Service Card Layouts

### **List View (Default Mobile)**
```scss
.service-card {
  display: flex;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  }
  
  &:active {
    transform: translateY(1px);
  }
}

.service-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 1rem;
  background: #f1f5f9;
}

.service-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.service-header {
  .service-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }
  
  .provider-name {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
}

.service-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  
  .rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    .star-icon {
      width: 14px;
      height: 14px;
      color: #fbbf24;
    }
    
    .rating-text {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
    
    .review-count {
      font-size: 14px;
      color: #6b7280;
    }
  }
  
  .distance {
    font-size: 14px;
    color: #6b7280;
    
    &::before {
      content: "📍";
      margin-right: 0.25rem;
    }
  }
}

.service-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .price {
    font-size: 18px;
    font-weight: 700;
    color: #059669; // Trust green
    
    .currency {
      font-size: 14px;
      font-weight: 500;
    }
  }
  
  .availability {
    font-size: 12px;
    color: #059669;
    background: #ecfdf5;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 500;
  }
}
```

**Argentina-Specific Elements:**
- Price display: "desde $1.500 ARS"
- Distance in kilometers: "2.3 km"
- Availability: "Disponible hoy" / "Próximo turno: Mañana 14:00"

### **Grid View (Tablet/Desktop)**
```scss
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.service-card-grid {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .service-image-grid {
    width: 100%;
    height: 160px;
    object-fit: cover;
    background: #f1f5f9;
  }
  
  .card-content {
    padding: 1rem;
    
    .service-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1e293b;
    }
    
    .provider-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      
      .provider-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #e2e8f0;
      }
      
      .provider-name {
        font-size: 14px;
        color: #64748b;
      }
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      
      .price-large {
        font-size: 20px;
        font-weight: 700;
        color: #059669;
      }
      
      .book-button {
        padding: 0.5rem 1rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
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
```

---

## 3. Map Integration

### **Map View Toggle**
```scss
.view-toggle {
  position: fixed;
  top: 120px; // Below search bar
  right: 1rem;
  z-index: 40;
  
  .toggle-button {
    padding: 0.75rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    
    .icon {
      width: 20px;
      height: 20px;
      color: #64748b;
    }
    
    &.active {
      background: #2563eb;
      border-color: #2563eb;
      
      .icon {
        color: white;
      }
    }
  }
}
```

### **Map Layout**
```scss
.map-container {
  position: relative;
  height: calc(100vh - 140px); // Account for search bar
  width: 100%;
  
  .map-canvas {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  // Floating service list
  .map-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 16px 16px 0 0;
    max-height: 40%;
    overflow-y: auto;
    z-index: 30;
    
    .overlay-handle {
      width: 40px;
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      margin: 0.5rem auto;
    }
    
    .overlay-content {
      padding: 0 1rem 1rem;
    }
  }
}

// Map markers
.map-marker {
  background: #2563eb;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  position: relative;
  min-width: 60px;
  text-align: center;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #2563eb;
  }
  
  &.premium {
    background: #059669;
    
    &::after {
      border-top-color: #059669;
    }
  }
}
```

**Map Features:**
- Google Maps integration
- Custom styled markers with price
- Cluster markers for dense areas
- Current location indicator
- Walking/driving distance display

---

## 4. Service Category Browsing

### **Category Grid**
```scss
.category-section {
  padding: 1.5rem 1rem;
  background: #f8fafc;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .see-all {
      font-size: 14px;
      color: #2563eb;
      font-weight: 500;
      text-decoration: none;
    }
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  }
  
  .category-icon {
    width: 40px;
    height: 40px;
    margin: 0 auto 0.5rem;
    background: #f1f5f9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  
  .category-name {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  .category-count {
    font-size: 12px;
    color: #6b7280;
    margin-top: 0.25rem;
  }
}
```

**Category Icons & Names:**
- ✂️ "Corte de cabello" (125 servicios)
- 🧔 "Barba y bigote" (89 servicios)
- 💆 "Tratamientos" (67 servicios)
- 👨‍👦 "Padre e hijo" (34 servicios)
- 🎭 "Para eventos" (45 servicios)
- ⭐ "Premium" (23 servicios)

---

## 5. Search Results & Sorting

### **Results Header**
```scss
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  
  .results-count {
    font-size: 14px;
    color: #64748b;
    
    .count-number {
      font-weight: 600;
      color: #374151;
    }
  }
  
  .sort-selector {
    position: relative;
    
    .sort-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      
      .sort-icon {
        width: 16px;
        height: 16px;
        color: #64748b;
      }
    }
    
    .sort-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 50;
      min-width: 180px;
      
      .sort-option {
        padding: 0.75rem 1rem;
        font-size: 14px;
        color: #374151;
        cursor: pointer;
        border-bottom: 1px solid #f1f5f9;
        
        &:hover {
          background: #f8fafc;
        }
        
        &.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 500;
        }
        
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}
```

**Sort Options:**
- "Relevancia" (Relevance - default)
- "Menor precio" (Lowest price)
- "Mayor calificación" (Highest rating)
- "Más cercano" (Nearest)
- "Disponible antes" (Earliest availability)

---

## 6. Empty States & Loading

### **Empty Search Results**
```scss
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1rem;
    background: #f1f5f9;
    border-radius: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #94a3b8;
  }
  
  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .empty-message {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .empty-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 200px;
    margin: 0 auto;
    
    .action-button {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
      text-align: center;
      transition: all 0.2s ease;
      
      &.primary {
        background: #2563eb;
        color: white;
        
        &:hover {
          background: #1d4ed8;
        }
      }
      
      &.secondary {
        background: white;
        color: #2563eb;
        border: 1px solid #2563eb;
        
        &:hover {
          background: #eff6ff;
        }
      }
    }
  }
}
```

**Empty State Messages:**
- No results: "No encontramos servicios que coincidan con tu búsqueda"
- No location: "Permitenos acceder a tu ubicación para encontrar servicios cercanos"
- Network error: "No pudimos conectar. Revisa tu conexión y vuelve a intentar"

### **Loading Animations**
```scss
.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .skeleton-item {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
    
    &.image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    &.title {
      height: 20px;
      width: 60%;
      margin-bottom: 0.5rem;
    }
    
    &.subtitle {
      height: 16px;
      width: 40%;
      margin-bottom: 1rem;
    }
    
    &.price {
      height: 18px;
      width: 80px;
    }
  }
}

@keyframes skeleton-loading {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## Accessibility Features

### **Screen Reader Support**
```html
<!-- Search with proper labels -->
<div role="search" aria-label="Buscar servicios de barbería">
  <input 
    type="search" 
    aria-label="Buscar por nombre, servicio o ubicación"
    placeholder="Buscar barbería o servicio..."
  />
</div>

<!-- Service cards with semantic structure -->
<article role="button" aria-label="Barbería Los Amigos - Corte clásico desde $1.500 - Calificación 4.8 estrellas">
  <img alt="Foto de Barbería Los Amigos mostrando el local" />
  <h3>Corte clásico</h3>
  <p>Barbería Los Amigos</p>
  <div aria-label="Calificación 4.8 de 5 estrellas, 127 reseñas">4.8 ⭐ (127)</div>
</article>

<!-- Filters with proper announcements -->
<button 
  aria-pressed="false" 
  aria-describedby="filter-cerca-desc"
  onclick="toggleFilter(this)"
>
  Cerca de mí
</button>
<div id="filter-cerca-desc" class="sr-only">
  Filtrar servicios a menos de 5km de tu ubicación
</div>
```

### **Keyboard Navigation**
- Tab order: Search → Filters → Results → Map toggle
- Arrow keys for filter chips navigation
- Enter/Space for selections
- Escape to close modals

### **High Contrast Mode**
```scss
@media (prefers-contrast: high) {
  .service-card {
    border: 2px solid #000000;
    
    &:focus {
      outline: 3px solid #000000;
      outline-offset: 2px;
    }
  }
  
  .filter-chip.active {
    background: #000000;
    color: #ffffff;
  }
}
```

---

## Mobile Interactions

### **Touch Gestures**
- Pull-to-refresh on results list
- Swipe left on service cards for quick actions
- Pinch to zoom on map
- Long press on map for location details

### **Performance Optimizations**
- Image lazy loading
- Virtual scrolling for long lists
- Debounced search input
- Cached filter preferences
- Progressive image loading

---

## Integration Points

### **Backend API Calls**
```typescript
// Search services
GET /api/services/search?q={query}&lat={lat}&lng={lng}&filters={filters}

// Get categories
GET /api/services/categories

// Get service details
GET /api/services/{serviceId}

// Apply filters
POST /api/services/filter
{
  "priceRange": [500, 3000],
  "location": { "lat": -34.6037, "lng": -58.3816, "radius": 10 },
  "availability": "today",
  "rating": 4.0
}
```

### **Analytics Events**
```typescript
// Track user behavior
track('service_search', {
  query: string,
  location: string,
  filters_applied: string[],
  results_count: number
});

track('service_card_click', {
  service_id: string,
  position: number,
  search_query: string
});

track('filter_applied', {
  filter_type: string,
  filter_value: string
});
```

This service discovery interface provides a comprehensive, mobile-first experience optimized for the Argentina market, with premium positioning while maintaining accessibility and performance standards.