# Manual Testing: Service Creation and Management

## Test Environment Setup
- **Base URL**: http://localhost:3000
- **Database**: Clean test database with test providers
- **Date**: December 10, 2024
- **Tester**: QA Engineer
- **Prerequisites**: Valid provider accounts registered

## Test Data Setup

### Test Providers
1. **Carlos - Traditional Barbershop**
   - Email: carlos.provider@test.com
   - Business: Barbería Don Carlos
   - Location: CABA

2. **Martín - Independent Barber**
   - Email: martin.provider@test.com
   - Business: Martín Barbero Profesional
   - Location: San Telmo

## Test Scenarios

### 1. Service Creation - Basic Service (Carlos Scenario)

**Objective**: Test basic service creation with Argentina pricing

**Test Data**:
```json
{
  "name": "Corte Clásico",
  "description": "Corte de cabello tradicional masculino con máquina y tijera",
  "duration": 30,
  "price": 1200,
  "category": "HAIRCUT",
  "isActive": true
}
```

**Steps**:
1. Login as provider (Carlos)
2. Send POST request to `/api/services`
3. Include JWT token in Authorization header
4. Verify service is created with provider ID
5. Check service appears in provider's service list

**Expected Results**:
- Status Code: 201 Created
- Service ID generated
- Provider ID automatically assigned
- Price in Argentina pesos (ARS)
- Service active by default

**Acceptance Criteria**:
- ✅ Service created successfully
- ✅ Spanish characters preserved in name/description
- ✅ Argentina peso pricing accepted
- ✅ Duration in minutes properly stored
- ✅ Category validation works

### 2. Premium Service Creation (Martín Scenario)

**Objective**: Test premium service with higher pricing and longer duration

**Test Data**:
```json
{
  "name": "Servicio Premium Completo",
  "description": "Corte + barba + lavado + mascarilla facial + toalla caliente",
  "duration": 90,
  "price": 3500,
  "category": "PREMIUM",
  "isActive": true,
  "features": [
    "Corte personalizado",
    "Arreglo de barba",
    "Lavado con shampoo premium",
    "Mascarilla facial",
    "Toalla caliente",
    "Productos importados"
  ]
}
```

**Steps**:
1. Login as provider (Martín)
2. Create premium service
3. Verify higher pricing is accepted
4. Check extended duration (90 minutes)
5. Validate premium features are stored

**Expected Results**:
- Premium category accepted
- Higher price point validated
- Extended duration allowed
- Features array properly stored

### 3. Service Retrieval and Search

**Objective**: Test service listing and search functionality

**Test Scenarios**:

#### 3.1 Get Provider Services
**Endpoint**: `GET /api/services/provider/{providerId}`

**Steps**:
1. Create multiple services for provider
2. Retrieve all services for provider
3. Verify only provider's services returned
4. Check pagination if applicable

#### 3.2 Search Services by Category
**Endpoint**: `GET /api/services/search?category=HAIRCUT`

**Steps**:
1. Create services in different categories
2. Search by specific category
3. Verify filtered results
4. Test with invalid category

#### 3.3 Search Services by Price Range
**Endpoint**: `GET /api/services/search?minPrice=1000&maxPrice=2000`

**Steps**:
1. Create services with various prices
2. Search within price range
3. Verify results within specified range
4. Test edge cases (exact min/max values)

### 4. Service Updates

**Objective**: Test service modification functionality

**Test Data for Update**:
```json
{
  "name": "Corte Clásico Premium",
  "description": "Corte de cabello tradicional con productos premium",
  "price": 1500,
  "duration": 45
}
```

**Steps**:
1. Create initial service
2. Send PUT request to `/api/services/{serviceId}`
3. Verify updated fields are changed
4. Ensure unchanged fields remain same
5. Test unauthorized update attempt

**Authorization Tests**:
- ✅ Provider can update own services
- ❌ Provider cannot update other's services  
- ❌ Client cannot update any services

### 5. Service Deactivation/Deletion

**Objective**: Test service lifecycle management

**Test Scenarios**:

#### 5.1 Soft Delete (Deactivation)
**Steps**:
1. Create active service
2. Send DELETE request to `/api/services/{serviceId}`
3. Verify service is soft deleted (isActive = false)
4. Confirm service not visible in public listings
5. Verify service still accessible to provider

#### 5.2 Delete with Active Bookings
**Steps**:
1. Create service with confirmed booking
2. Attempt to delete service
3. Verify deletion is prevented
4. Check appropriate error message

**Expected Result**: 409 Conflict - Cannot delete service with active bookings

### 6. Argentina-Specific Service Features

**Objective**: Test Argentina market-specific functionality

#### 6.1 Spanish Service Names and Descriptions
**Test Data**:
```json
{
  "name": "Peluquería para Niños",
  "description": "Especialistas en cortes para niños de 3 a 12 años. Atención personalizada con paciencia y cariño.",
  "duration": 25,
  "price": 1000,
  "category": "CHILD"
}
```

**Steps**:
1. Create service with Spanish text
2. Verify special characters (ñ, á, é, í, ó, ú) preserved
3. Check accented characters in search results

#### 6.2 Argentina Peso Pricing
**Test Price Ranges**:
- Budget: $500 - $1,000 ARS
- Standard: $1,000 - $2,000 ARS  
- Premium: $2,000 - $4,000 ARS
- Luxury: $4,000+ ARS

**Steps**:
1. Test services in each price tier
2. Verify price validation (no negative values)
3. Check price formatting in responses
4. Test large price values (luxury services)

#### 6.3 Business Hours Integration
**Test Data**:
```json
{
  "availableHours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    "wednesday": { "start": "09:00", "end": "18:00" },
    "thursday": { "start": "09:00", "end": "18:00" },
    "friday": { "start": "09:00", "end": "18:00" },
    "saturday": { "start": "09:00", "end": "14:00" },
    "sunday": { "closed": true }
  }
}
```

**Steps**:
1. Create service with specific hours
2. Verify Argentina business patterns (Saturday half-day)
3. Test with siesta hours (14:00-16:00 closed)
4. Validate time format (24-hour)

### 7. Service Categories Validation

**Objective**: Test all supported service categories

**Categories to Test**:
- HAIRCUT (Corte)
- BEARD (Barba)
- SHAVE (Afeitado)
- STYLING (Peinado)
- PREMIUM (Premium)
- CHILD (Infantil)
- WASH (Lavado)

**Steps**:
1. Create service in each category
2. Verify category validation
3. Test invalid category rejection
4. Check category filtering in search

### 8. Service Validation Rules

**Objective**: Test input validation and business rules

#### 8.1 Required Fields Validation
**Test Missing Fields**:
- name (required)
- duration (required)
- price (required)
- category (required)

**Expected**: 400 Bad Request with specific field errors

#### 8.2 Data Type Validation
**Test Invalid Data Types**:
- price: negative numbers, non-numeric
- duration: zero, negative, non-numeric
- name: empty string, too long
- description: exceeds character limit

#### 8.3 Business Logic Validation
**Rules to Test**:
- Duration must be between 5 and 240 minutes
- Price must be positive number
- Name must be unique per provider
- Category must be from allowed list

### 9. Service Performance Testing

**Objective**: Test service operations under load

**Scenarios**:
1. Create multiple services rapidly
2. Search with large result sets
3. Update multiple services concurrently
4. Test with large descriptions/feature lists

**Performance Expectations**:
- Service creation: < 500ms
- Service search: < 200ms
- Service update: < 300ms

### 10. Error Handling

**Objective**: Verify proper error responses

**Error Scenarios**:

#### 10.1 Authentication Errors
- No JWT token: 401 Unauthorized
- Invalid JWT token: 401 Unauthorized
- Expired JWT token: 401 Unauthorized

#### 10.2 Authorization Errors
- Client trying to create service: 403 Forbidden
- Provider updating other's service: 403 Forbidden

#### 10.3 Validation Errors
- Invalid price format: 400 Bad Request
- Missing required fields: 400 Bad Request
- Invalid category: 400 Bad Request

#### 10.4 Not Found Errors
- Non-existent service ID: 404 Not Found
- Non-existent provider ID: 404 Not Found

## Test Execution Results Template

```
Service Management Testing Results
Date: [Date]
Tester: [Name]
Environment: [Environment]

Test Summary:
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Blocked: [Number]

Critical Issues Found:
1. [Issue 1]
2. [Issue 2]

Service Creation Tests:
✅ Basic service creation
✅ Premium service creation
❌ Price validation (Issue: Negative prices accepted)
✅ Spanish character handling

Service Retrieval Tests:
✅ Provider service listing
✅ Category filtering
⚠️ Price range search (Performance issue)
✅ Service details retrieval

Service Update Tests:
✅ Authorized updates
✅ Unauthorized update prevention
❌ Concurrent update handling (Issue: Race condition)

Service Deletion Tests:
✅ Soft delete functionality
✅ Active booking prevention
✅ Authorization checks

Argentina-Specific Tests:
✅ Spanish language support
✅ Peso pricing
✅ Business hours integration
⚠️ Siesta time handling (Needs clarification)

Performance Results:
- Service creation: 245ms (✅ < 500ms)
- Service search: 156ms (✅ < 200ms)
- Service update: 198ms (✅ < 300ms)
```

## Common Issues to Monitor

1. **Character Encoding Issues**
   - Spanish characters not preserved
   - Emoji in service names/descriptions
   - Special symbols in pricing

2. **Pricing Validation**
   - Negative prices accepted
   - Price precision issues
   - Currency formatting

3. **Authorization Vulnerabilities**
   - Cross-provider service access
   - Role-based access control
   - JWT token validation

4. **Search Performance**
   - Slow response times
   - Missing search indexes
   - Large result set handling

5. **Business Logic Errors**
   - Invalid duration ranges
   - Category validation bypass
   - Availability hour conflicts