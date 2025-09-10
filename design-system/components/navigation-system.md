# Navigation System

## Mobile Navigation

### Bottom Tab Navigation
**Usage**: Primary navigation for mobile app experience
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #e2e8f0; /* neutral-200 */
  padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  min-width: 64px;
  position: relative;
}

.bottom-nav-item:hover {
  background: #f8fafc; /* neutral-50 */
}

.bottom-nav-item.active {
  color: #2563eb; /* primary-600 */
}

.bottom-nav-item.active .nav-icon {
  color: #2563eb; /* primary-600 */
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #64748b; /* neutral-500 */
  margin-bottom: 4px;
}

.nav-label {
  font-size: 11px;
  color: #64748b; /* neutral-500 */
  font-weight: 500;
  text-align: center;
}

.bottom-nav-item.active .nav-label {
  color: #2563eb; /* primary-600 */
}

/* Badge for notifications */
.nav-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  background: #dc2626; /* error-600 */
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
```

### Hamburger Menu
**Usage**: Secondary navigation, menu overflow
```css
.hamburger-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  position: relative;
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background: #334155; /* neutral-700 */
  border-radius: 1px;
  transition: all 0.3s ease-in-out;
  margin: 2px 0;
}

.hamburger-button.open .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger-button.open .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-button.open .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile Menu Overlay */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease-in-out;
}

.mobile-menu.open {
  opacity: 1;
  visibility: visible;
}

.mobile-menu-content {
  background: #ffffff;
  width: 280px;
  height: 100%;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}

.mobile-menu.open .mobile-menu-content {
  transform: translateX(0);
}

.mobile-menu-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-menu-items {
  flex: 1;
  padding: 20px 0;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  text-decoration: none;
  color: #1e293b; /* neutral-800 */
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.mobile-menu-item:hover {
  background: #f8fafc; /* neutral-50 */
  color: #2563eb; /* primary-600 */
}

.mobile-menu-item.active {
  background: #eff6ff; /* primary-50 */
  color: #2563eb; /* primary-600 */
  border-right: 3px solid #2563eb;
}
```

## Desktop Navigation

### Header Navigation
**Usage**: Primary desktop navigation, brand display
```css
.header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0; /* neutral-200 */
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo-image {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #2563eb; /* primary-600 */
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 32px;
}

.header-nav-item {
  color: #64748b; /* neutral-500 */
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}

.header-nav-item:hover {
  color: #2563eb; /* primary-600 */
  background: #f8fafc; /* neutral-50 */
}

.header-nav-item.active {
  color: #2563eb; /* primary-600 */
  background: #eff6ff; /* primary-50 */
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* User Profile Dropdown */
.user-dropdown {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.user-button:hover {
  background: #f8fafc; /* neutral-50 */
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: #1e293b; /* neutral-800 */
}

.dropdown-chevron {
  width: 16px;
  height: 16px;
  color: #64748b; /* neutral-500 */
  transition: transform 0.2s ease-in-out;
}

.user-dropdown.open .dropdown-chevron {
  transform: rotate(180deg);
}
```

### Dropdown Menu
```css
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0; /* neutral-200 */
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  min-width: 200px;
  padding: 8px 0;
  margin-top: 8px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease-in-out;
  z-index: 50;
}

.dropdown-menu.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  text-decoration: none;
  color: #1e293b; /* neutral-800 */
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.dropdown-item:hover {
  background: #f8fafc; /* neutral-50 */
  color: #2563eb; /* primary-600 */
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  color: #64748b; /* neutral-500 */
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0; /* neutral-200 */
  margin: 8px 0;
}
```

## Breadcrumb Navigation

### Breadcrumb Component
**Usage**: Page hierarchy, location context
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 14px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: #64748b; /* neutral-500 */
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.breadcrumb-link:hover {
  color: #2563eb; /* primary-600 */
}

.breadcrumb-current {
  color: #1e293b; /* neutral-800 */
  font-weight: 500;
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
  color: #cbd5e1; /* neutral-300 */
}

/* Mobile breadcrumb - simplified */
@media (max-width: 640px) {
  .breadcrumb {
    padding: 12px 0;
  }
  
  .breadcrumb-item:not(:last-child):not(:nth-last-child(2)) {
    display: none;
  }
  
  .breadcrumb-item:nth-last-child(2)::before {
    content: "...";
    margin-right: 8px;
    color: #64748b;
  }
}
```

## Tab Navigation

### Horizontal Tabs
**Usage**: Content sections, dashboard views
```css
.tabs {
  border-bottom: 1px solid #e2e8f0; /* neutral-200 */
}

.tabs-list {
  display: flex;
  gap: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tabs-list::-webkit-scrollbar {
  display: none;
}

.tab-button {
  background: none;
  border: none;
  padding: 16px 24px;
  color: #64748b; /* neutral-500 */
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  position: relative;
}

.tab-button:hover {
  color: #2563eb; /* primary-600 */
  background: #f8fafc; /* neutral-50 */
}

.tab-button.active {
  color: #2563eb; /* primary-600 */
  border-bottom-color: #2563eb; /* primary-600 */
}

.tab-button:focus {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

/* Tab badge for notifications */
.tab-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #dc2626; /* error-600 */
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}
```

### Vertical Tabs (Sidebar)
```css
.sidebar-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  min-width: 240px;
}

.sidebar-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: #64748b; /* neutral-500 */
}

.sidebar-tab:hover {
  background: #f8fafc; /* neutral-50 */
  color: #2563eb; /* primary-600 */
}

.sidebar-tab.active {
  background: #eff6ff; /* primary-50 */
  color: #2563eb; /* primary-600 */
}

.sidebar-tab-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-tab-text {
  font-weight: 500;
  font-size: 14px;
}
```

## Search Navigation

### Search Bar
**Usage**: Content discovery, provider search
```css
.search-bar {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.search-input {
  width: 100%;
  padding: 12px 48px 12px 48px;
  border: 2px solid #e2e8f0; /* neutral-200 */
  border-radius: 24px;
  font-size: 16px;
  background: #ffffff;
  transition: all 0.2s ease-in-out;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb; /* primary-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #64748b; /* neutral-500 */
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b; /* neutral-500 */
  padding: 4px;
  border-radius: 4px;
}

.search-clear:hover {
  color: #1e293b; /* neutral-800 */
  background: #f1f5f9; /* neutral-100 */
}
```

### Search Filters
```css
.search-filters {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-chip {
  background: #ffffff;
  border: 1px solid #e2e8f0; /* neutral-200 */
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b; /* neutral-500 */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: #2563eb; /* primary-600 */
  color: #2563eb;
}

.filter-chip.active {
  background: #2563eb; /* primary-600 */
  border-color: #2563eb;
  color: #ffffff;
}

.filter-chip-count {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}
```

## Back Navigation

### Back Button
**Usage**: Page navigation, modal headers
```css
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 0;
  color: #2563eb; /* primary-600 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.back-button:hover {
  color: #1d4ed8; /* primary-700 */
}

.back-icon {
  width: 20px;
  height: 20px;
}

/* Mobile back button in header */
.mobile-back {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease-in-out;
}

.mobile-back:hover {
  background: #f8fafc; /* neutral-50 */
}
```

## Responsive Navigation

### Mobile-First Approach
```css
/* Hide desktop navigation on mobile */
@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
  
  .mobile-nav-toggle {
    display: block;
  }
  
  .bottom-nav {
    display: flex;
  }
}

/* Show desktop navigation on larger screens */
@media (min-width: 769px) {
  .header-nav {
    display: flex;
  }
  
  .mobile-nav-toggle {
    display: none;
  }
  
  .bottom-nav {
    display: none;
  }
}
```

## Accessibility Features

### Screen Reader Support
- Skip links for main content
- ARIA labels for navigation landmarks
- Proper heading hierarchy
- Focus management for dropdowns

### Keyboard Navigation
- Tab order management
- Enter/Space activation
- Arrow key navigation for menus
- Escape key for closing menus

### Focus Management
```css
.nav-item:focus {
  outline: 2px solid #2563eb; /* primary-600 */
  outline-offset: 2px;
  border-radius: 4px;
}

.nav-item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

## Implementation Notes

### SvelteKit Navigation Component
```typescript
// Navigation.svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  export let items: NavItem[];
  
  $: currentPath = $page.url.pathname;
</script>

<nav class="bottom-nav">
  {#each items as item}
    <a 
      href={item.href}
      class="bottom-nav-item"
      class:active={currentPath === item.href}
    >
      <Icon name={item.icon} />
      <span class="nav-label">{item.label}</span>
    </a>
  {/each}
</nav>
```

### Usage Guidelines
- Consistent navigation across all pages
- Clear visual hierarchy and active states
- Mobile-first responsive behavior
- Proper focus management and accessibility
- Smooth transitions and interactions
- Context-aware navigation (breadcrumbs)
- Search functionality easily accessible
- User profile and actions prominently displayed