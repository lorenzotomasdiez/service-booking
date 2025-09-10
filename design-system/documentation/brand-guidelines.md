# BarberPro Brand Guidelines
*Argentina Premium Service Booking Platform*

## Brand Personality

### Core Values
- **Premium**: Sophisticated, high-quality service experience
- **Professional**: Trustworthy, reliable, expert-driven
- **Trustworthy**: Secure, transparent, dependable
- **Argentine**: Locally relevant, culturally sensitive

### Brand Attributes
- Modern yet approachable
- Sophisticated without being intimidating
- Trustworthy and secure
- Mobile-first and accessible
- Culturally sensitive to Argentine market

---

## Color System

### Primary Brand Color
**Deep Blue (#2563eb)** - Primary-600
- Represents trust, professionalism, and reliability
- Inspired by Argentine flag colors and financial security
- Perfect for premium positioning in service marketplace
- Excellent contrast for accessibility

### Secondary Brand Color
**Argentine Gold (#eab308)** - Secondary-500
- Represents premium quality and success
- Culturally resonates with Argentine preferences for gold/yellow accents
- Used for highlights, call-to-action elements, and success states

### Supporting Colors
- **Success Green (#059669)**: Confirmations, completed bookings, verified badges
- **Warning Orange (#d97706)**: Alerts, pending states, important notices
- **Error Red (#dc2626)**: Errors, cancellations, critical alerts
- **Neutral Grays**: Text hierarchy, backgrounds, borders

### Color Usage Guidelines
- Primary blue: Main navigation, primary buttons, links, brand elements
- Secondary gold: Success indicators, premium features, highlights
- Never use colors alone to convey information (accessibility)
- Maintain 4.5:1 contrast ratio minimum for text
- Use lighter tints for backgrounds, darker shades for text

---

## Typography System

### Font Stack
**Primary**: Inter, Roboto, system-ui, sans-serif
- Modern, clean, highly readable
- Excellent for Spanish text with proper accent handling
- Works well across all device types
- Great web font performance

**Headings**: Poppins, Inter, system-ui, sans-serif
- Distinctive for headings and brand elements
- Professional yet approachable feel
- Good weight variety available

### Typography Scale
- **Display (5xl-6xl)**: Hero sections, major headings
- **Headings (2xl-4xl)**: Page titles, section headers
- **Body (base-lg)**: Main content, descriptions
- **Small (sm-xs)**: Captions, metadata, fine print

### Line Heights
- **Body text**: 1.6 (optimized for Spanish readability)
- **Headings**: 1.1-1.2 (tight for impact)
- **UI elements**: 1.25-1.5 (balanced)

---

## Spacing System

### Base Unit: 8px
All spacing follows 8px increments for consistent rhythm

### Spacing Scale
- **Component spacing**: 4px, 8px, 12px, 16px
- **Layout spacing**: 20px, 24px, 32px, 40px, 48px
- **Section spacing**: 64px, 80px, 96px

### Usage Guidelines
- Use consistent spacing within components
- Larger spacing for section separation
- Responsive spacing adjustments for mobile

---

## Responsive Breakpoints

### Mobile First Approach
- **Mobile**: 375px - 767px (primary focus)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1279px
- **Wide**: 1280px+

### Design Priorities
1. **Mobile (80% of Argentina traffic)**: Full functionality, optimized UX
2. **Desktop**: Enhanced features, larger data display
3. **Tablet**: Hybrid experience, touch-optimized

---

## Cultural Considerations for Argentina

### Visual Preferences
- Trust indicators are crucial (security badges, verification marks)
- Social proof highly valued (reviews, ratings, testimonials)
- Clear pricing and transparency expected
- Professional imagery with authentic Argentine representation

### UX Patterns
- Familiar e-commerce patterns (similar to MercadoLibre)
- WhatsApp integration expected for communication
- MercadoPago payment flow familiarity
- Clear navigation with breadcrumbs

### Content Approach
- Direct, clear communication
- Professional but warm tone
- Proper Spanish grammar and Argentina-specific terms
- Emphasis on security and professionalism

---

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Color contrast minimum 4.5:1 for normal text
- Color contrast minimum 3:1 for large text and UI elements
- Focus indicators clearly visible
- Semantic HTML structure
- Screen reader compatible
- Keyboard navigation support

### Argentina-Specific Accessibility
- Support for Spanish screen readers
- Proper accent character handling
- Mobile accessibility (Android focus)
- Offline capability indicators

---

## Icon Style Guidelines

### Icon Library: Heroicons/Lucide
- Consistent stroke width (1.5px-2px)
- 24px standard size (16px for small, 32px for large)
- Outline style for interface elements
- Filled style for active/selected states

### Service-Specific Icons
- Scissors, comb, razor for barber services
- Calendar, clock for scheduling
- Star, heart for favorites/ratings
- Shield, check for verification/security

---

## Image Guidelines

### Photography Style
- Authentic Argentine professionals and clients
- High-quality, professional photography
- Diverse representation across age, gender, style
- Clean, modern barber shop environments
- Natural lighting preferred

### Aspect Ratios
- **Profile photos**: 1:1 (square)
- **Service portfolio**: 4:3 (landscape)
- **Hero images**: 16:9 (wide landscape)
- **Before/after**: Side-by-side 2:1

### Technical Requirements
- WebP format for web optimization
- Progressive JPEG fallbacks
- Responsive image sizing
- Alt text in Spanish for accessibility

---

## Component States

### Interactive States
- **Default**: Base appearance
- **Hover**: Subtle color shift, slight elevation
- **Active/Pressed**: Darker color, pressed appearance
- **Focus**: Clear focus ring for keyboard navigation
- **Disabled**: Reduced opacity (60%), no interaction
- **Loading**: Animation or skeleton state

### Feedback States
- **Success**: Green accent, checkmark icon
- **Error**: Red accent, warning icon
- **Warning**: Orange accent, alert icon
- **Info**: Blue accent, info icon

---

## Template Scalability

### Adaptable Elements
- Color scheme (primary color changes per vertical)
- Service-specific icons and imagery
- Terminology and content
- Booking flow customization

### Consistent Elements
- Typography system
- Spacing scale
- Component structure
- Responsive behavior
- Accessibility standards

---

## Implementation Notes

### CSS Custom Properties
```css
:root {
  --color-primary-600: #2563eb;
  --color-secondary-500: #eab308;
  --font-family-sans: 'Inter', 'Roboto', system-ui, sans-serif;
  --font-family-heading: 'Poppins', 'Inter', system-ui, sans-serif;
  --space-4: 1rem;
  --border-radius-lg: 0.5rem;
}
```

### TailwindCSS Integration
- Custom color palette in tailwind.config.js
- Typography plugin configuration
- Spacing scale customization
- Component class utility creation

---

*This brand guideline serves as the foundation for BarberPro's visual identity and ensures consistent, premium user experience across all touchpoints while respecting Argentine cultural preferences and accessibility standards.*