---
created: 2025-10-10T03:05:12Z
last_updated: 2025-10-10T03:05:12Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Coding Standards

### General Principles
- **TypeScript Everywhere**: Use TypeScript for all frontend and backend code
- **Type Safety**: Avoid `any` types; use strict TypeScript settings
- **Functional Over Imperative**: Prefer pure functions and immutability
- **DRY Principle**: Don't Repeat Yourself - extract reusable logic
- **KISS Principle**: Keep It Simple, Stupid - avoid over-engineering

### Code Quality Tools
- **ESLint**: Enforce code style and catch errors
- **Prettier**: Automatic code formatting (backend)
- **TypeScript Compiler**: Strict type checking
- **svelte-check**: Svelte component type checking

## Naming Conventions

### Files & Directories

**Frontend (SvelteKit)**:
- **Components**: PascalCase for Svelte files
  ```
  SmartSchedulingAssistant.svelte
  BookingCalendar.svelte
  UserProfileCard.svelte
  ```
- **Routes**: Lowercase with hyphens (kebab-case)
  ```
  +page.svelte
  +layout.svelte
  +server.ts
  /booking/[id]/+page.svelte
  ```
- **Stores**: Lowercase with hyphens
  ```
  auth.ts
  booking.ts
  performance.ts
  ```
- **Services**: Lowercase with hyphens
  ```
  socket.ts
  performance-optimization.ts
  customer-success.ts
  ```
- **Utils**: Lowercase with hyphens
  ```
  debounce.ts
  analytics-test.ts
  ```

**Backend (Fastify)**:
- **Services**: Descriptive names or `{domain}.service.ts`
  ```
  booking.service.ts
  payment.service.ts
  analytics.service.ts
  ```
- **Routes**: `{domain}.routes.ts`
  ```
  booking.routes.ts
  auth.routes.ts
  payment.routes.ts
  ```
- **Schemas**: `{domain}.schema.ts`
  ```
  booking.schema.ts
  user.schema.ts
  payment.schema.ts
  ```
- **Middleware**: Descriptive names
  ```
  auth.middleware.ts
  rate-limit.middleware.ts
  ```
- **Types**: `{domain}.types.ts`
  ```
  booking.types.ts
  payment.types.ts
  ```

**Tests**:
```
{filename}.test.ts
{filename}.spec.ts
__tests__/{filename}.test.ts
```

### Variables & Functions

**Variables**:
- **camelCase** for variables and function parameters
  ```typescript
  const userName = 'John';
  const bookingDate = new Date();
  let isAvailable = false;
  ```

**Constants**:
- **SCREAMING_SNAKE_CASE** for true constants
  ```typescript
  const MAX_BOOKING_DURATION = 180;
  const API_BASE_URL = 'https://api.barberpro.com';
  const DEFAULT_TIMEOUT = 5000;
  ```

**Functions**:
- **camelCase** for functions
- **Descriptive verb + noun** pattern
  ```typescript
  function getBookingById(id: string) { }
  function createNewAppointment(data: BookingData) { }
  function validateUserInput(input: string) { }
  async function fetchAvailableSlots(date: Date) { }
  ```

**Classes & Interfaces**:
- **PascalCase** for classes and interfaces
  ```typescript
  class BookingService { }
  interface UserProfile { }
  type PaymentStatus = 'pending' | 'completed' | 'failed';
  ```

**Private Members**:
- **Prefix with underscore** for private class members (optional)
  ```typescript
  class BookingService {
    private _cache: Map<string, Booking>;
    private _validateBooking(booking: Booking) { }
  }
  ```

**Boolean Variables**:
- **Prefix with is/has/can/should**
  ```typescript
  const isAvailable = true;
  const hasPermission = false;
  const canEdit = true;
  const shouldNotify = false;
  ```

### API & Routes

**RESTful API Endpoints**:
- **Lowercase with hyphens**
- **Plural for collections**
  ```
  GET    /api/bookings
  POST   /api/bookings
  GET    /api/bookings/:id
  PUT    /api/bookings/:id
  DELETE /api/bookings/:id

  GET    /api/users/:userId/bookings
  POST   /api/payments/process
  GET    /api/providers/:id/availability
  ```

**Event Names (Socket.io)**:
- **Lowercase with dots**
- **Pattern**: `{domain}.{action}.{status}`
  ```typescript
  'booking.created'
  'booking.updated'
  'booking.cancelled'
  'payment.pending'
  'payment.completed'
  'notification.sent'
  ```

## File Structure Patterns

### Component Organization

**Svelte Components**:
```svelte
<script lang="ts">
  // 1. Imports
  import { onMount } from 'svelte';
  import Button from './Button.svelte';

  // 2. Props
  export let title: string;
  export let isActive = false;

  // 3. State
  let count = 0;
  let items: Item[] = [];

  // 4. Derived state
  $: doubled = count * 2;

  // 5. Functions
  function handleClick() {
    count += 1;
  }

  // 6. Lifecycle
  onMount(() => {
    // Initialization
  });
</script>

<!-- 7. Template -->
<div class="container">
  <h1>{title}</h1>
  <Button on:click={handleClick}>
    Count: {count}
  </Button>
</div>

<!-- 8. Styles (scoped) -->
<style>
  .container {
    padding: 1rem;
  }
</style>
```

### Service Layer Pattern

**Backend Services**:
```typescript
// 1. Imports
import { PrismaClient } from '@prisma/client';
import { Redis } from 'redis';

// 2. Types
interface BookingCreateData {
  userId: string;
  serviceId: string;
  date: Date;
}

// 3. Service class/functions
export class BookingService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  // 4. Public methods
  async createBooking(data: BookingCreateData) {
    // Implementation
  }

  async getBookingById(id: string) {
    // Implementation
  }

  // 5. Private methods
  private async validateBooking(data: BookingCreateData) {
    // Implementation
  }
}
```

**Frontend Services**:
```typescript
// 1. Imports
import { writable } from 'svelte/store';

// 2. Types
interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
}

// 3. Store/state
const analytics = writable<AnalyticsEvent[]>([]);

// 4. Service functions
export function trackEvent(event: AnalyticsEvent) {
  // Implementation
}

export function getAnalytics() {
  // Implementation
}

// 5. Exports
export { analytics };
```

## Comment Style

### File Headers
```typescript
/**
 * BookingService - Handles all booking-related business logic
 *
 * Features:
 * - Create/update/cancel bookings
 * - Availability checking
 * - No-show management
 *
 * @module services/booking
 */
```

### Function Comments
```typescript
/**
 * Create a new booking appointment
 *
 * @param data - Booking creation data
 * @returns Created booking with ID
 * @throws {BookingConflictError} If time slot is unavailable
 */
async function createBooking(data: BookingCreateData): Promise<Booking> {
  // Implementation
}
```

### Inline Comments
```typescript
// Good: Explain WHY, not WHAT
// Cache invalidation required because provider availability changed
await redis.del(`availability:${providerId}`);

// Bad: Redundant comment
// Delete the cache key
await redis.del(`availability:${providerId}`);
```

### TODO Comments
```typescript
// TODO: Add support for recurring bookings
// FIXME: Race condition when multiple users book same slot
// HACK: Temporary workaround until Prisma supports this query
// NOTE: This must run before payment processing
```

## Code Organization

### Import Order
```typescript
// 1. External libraries
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

// 2. Internal modules (absolute imports)
import { BookingService } from '@/services/booking';
import { PaymentService } from '@/services/payment';

// 3. Relative imports
import { validateBooking } from './validators';
import type { Booking } from './types';

// 4. Styles (frontend only)
import './styles.css';
```

### Module Exports
```typescript
// Named exports (preferred)
export function createBooking() { }
export function getBooking() { }

// Default export (only for components and main entry points)
export default BookingService;
```

## Argentina-Specific Conventions

### Localization
```typescript
// Phone formatting
const PHONE_PATTERN = /^\+54 9 \d{2} \d{4}-\d{4}$/;
// Example: +54 9 11 1234-5678

// DNI formatting
const DNI_PATTERN = /^\d{2}\.\d{3}\.\d{3}$/;
// Example: 12.345.678

// Currency formatting
const formatCurrency = (amount: number) =>
  `ARS ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
// Example: ARS 1.234,56
```

### Date & Time
```typescript
// Always use Argentina timezone
const TIMEZONE = 'America/Argentina/Buenos_Aires';

// Date formatting
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatted = format(date, 'dd/MM/yyyy', { locale: es });
// Example: 10/10/2025
```

### Language & Tone
```spanish
// Informal, friendly Spanish (es-AR)
✅ "¡Hola! ¿Cómo estás?"
✅ "Tu turno está confirmado"
✅ "Reservá tu próximo turno"

// Avoid formal or Spain Spanish
❌ "Hola. ¿Cómo está usted?"
❌ "Su cita está confirmada"
❌ "Reserve su próxima cita"
```

## Error Handling

### Error Types
```typescript
// Custom error classes
class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

class PaymentFailedError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentFailedError';
  }
}
```

### Error Handling Pattern
```typescript
// Backend
async function createBooking(data: BookingCreateData) {
  try {
    // Attempt booking creation
    const booking = await prisma.booking.create({ data });
    return { success: true, booking };
  } catch (error) {
    // Log error
    logger.error('Booking creation failed', { error, data });

    // Throw appropriate error
    if (error.code === 'P2002') {
      throw new BookingConflictError('Time slot already booked');
    }
    throw error;
  }
}

// Frontend
async function handleBooking() {
  try {
    const result = await bookingService.create(data);
    showSuccessMessage('Booking created!');
  } catch (error) {
    if (error instanceof BookingConflictError) {
      showError('That time is no longer available');
    } else {
      showError('Something went wrong. Please try again.');
    }
    logError(error);
  }
}
```

## Testing Conventions

### Test Structure
```typescript
describe('BookingService', () => {
  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      // Arrange
      const data = createMockBookingData();

      // Act
      const result = await bookingService.createBooking(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should throw error if time slot is unavailable', async () => {
      // Arrange
      const data = createConflictingBookingData();

      // Act & Assert
      await expect(bookingService.createBooking(data))
        .rejects
        .toThrow(BookingConflictError);
    });
  });
});
```

### Test Naming
- **describe**: Class or function name
- **it**: Should + behavior description
- **Use clear, descriptive names**

## Git Commit Conventions

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples**:
```
feat(booking): add recurring appointment support

Implement weekly/monthly recurring booking creation
with automatic scheduling and notifications.

Closes #123
```

```
fix(payment): resolve MercadoPago webhook timeout

Increase webhook timeout to 30 seconds to handle
slow AFIP validation during peak hours.

Fixes #456
```

## Best Practices

### Type Safety
```typescript
// ✅ Good: Explicit types
function createBooking(data: BookingCreateData): Promise<Booking> {
  // ...
}

// ❌ Bad: Implicit any
function createBooking(data): Promise<any> {
  // ...
}
```

### Immutability
```typescript
// ✅ Good: Immutable updates
const updatedBooking = { ...booking, status: 'confirmed' };

// ❌ Bad: Mutation
booking.status = 'confirmed';
```

### Async/Await
```typescript
// ✅ Good: Async/await with error handling
try {
  const booking = await bookingService.create(data);
  const payment = await paymentService.process(booking.id);
} catch (error) {
  handleError(error);
}

// ❌ Bad: Promise chains
bookingService.create(data)
  .then(booking => paymentService.process(booking.id))
  .catch(error => handleError(error));
```

### Environment Variables
```typescript
// ✅ Good: Typed environment config
const config = {
  databaseUrl: process.env.DATABASE_URL as string,
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET as string,
};

// ❌ Bad: Direct process.env access
const url = process.env.DATABASE_URL;
const port = process.env.PORT;
```
