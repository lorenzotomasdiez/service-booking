# Manual Testing: User Registration and Login

## Test Environment Setup
- **Base URL**: http://localhost:3000
- **Database**: Clean test database
- **Date**: December 10, 2024
- **Tester**: QA Engineer
- **Browser**: Chrome 120.0.0.0 (also test on Firefox, Safari, Edge)

## Test Scenarios

### 1. User Registration - Client (Carlos Scenario)

**Objective**: Test client registration with Argentina-specific validations

**Test Data**:
- Email: carlos.test@gmail.com
- Password: Carlos123!
- Name: Carlos Rodríguez
- Phone: +5491123456789
- Role: CLIENT

**Steps**:
1. Navigate to `POST /api/auth/register`
2. Send registration payload with test data
3. Verify response contains user data and JWT token
4. Verify password is not returned in response
5. Verify user is created in database
6. Verify email validation works for Argentina domains (.com.ar)

**Expected Results**:
- Status Code: 201 Created
- Response includes: user object, JWT token
- User object contains: id, email, name, phone, role, createdAt
- Password field is excluded from response
- Phone number is validated as Argentina format

**Acceptance Criteria**:
- ✅ Registration successful with valid Argentina phone
- ✅ JWT token generated and valid
- ✅ Password properly hashed in database
- ✅ User role set to CLIENT
- ✅ Email validation accepts Argentina domains

### 2. Provider Registration (Martín Scenario)

**Objective**: Test provider registration with DNI validation

**Test Data**:
- Email: martin.barbero@outlook.com
- Password: MartinBarber456!
- Name: Martín García
- Phone: +5491187654321
- Role: PROVIDER
- DNI: 27987654321
- Business Name: Martín Barbero Profesional

**Steps**:
1. Send POST request to `/api/auth/register`
2. Include DNI and business name in payload
3. Verify DNI format validation (11 digits)
4. Verify business name is required for providers
5. Check response includes provider-specific fields

**Expected Results**:
- Status Code: 201 Created
- Response includes DNI and business name
- DNI validates Argentina format (11 digits)
- Business name is stored correctly

**Acceptance Criteria**:
- ✅ Provider registration requires DNI
- ✅ DNI validation follows Argentina format
- ✅ Business name is mandatory for providers
- ✅ Provider-specific fields are returned

### 3. Login Validation (Diego Scenario)

**Objective**: Test login functionality and JWT generation

**Test Data**:
- Email: diego.familia@hotmail.com
- Password: DiegoFamilia456!

**Pre-requisites**: User must be registered first

**Steps**:
1. Register user with above credentials
2. Send POST request to `/api/auth/login`
3. Verify login with correct credentials
4. Test login with incorrect password
5. Test login with non-existent email
6. Verify JWT token validity and expiration

**Expected Results**:
- Successful login returns status 200
- Response includes user object and JWT token
- Failed login returns status 401
- JWT token is valid for 24 hours

**Acceptance Criteria**:
- ✅ Valid credentials return successful login
- ✅ Invalid credentials return 401 Unauthorized
- ✅ JWT token is properly formatted
- ✅ Token includes user ID and role

### 4. Argentina Phone Number Validation

**Objective**: Verify Argentina phone number formats are properly validated

**Test Cases**:

| Phone Number | Expected Result | Reason |
|-------------|-----------------|---------|
| +5491123456789 | ✅ Valid | Buenos Aires mobile |
| +5491187654321 | ✅ Valid | Buenos Aires mobile |
| +542114567890 | ✅ Valid | Buenos Aires landline |
| +543514567890 | ✅ Valid | Córdoba landline |
| +1234567890 | ❌ Invalid | Non-Argentina format |
| 01123456789 | ❌ Invalid | Missing country code |
| +549112345678 | ❌ Invalid | Too few digits |
| +5491123456789012 | ❌ Invalid | Too many digits |

**Steps**:
1. Test each phone number in registration
2. Verify validation error messages
3. Ensure valid numbers are accepted
4. Check error responses for invalid formats

### 5. DNI Validation for Providers

**Objective**: Test Argentina DNI/CUIT validation

**Test Cases**:

| DNI Number | Expected Result | Reason |
|-----------|-----------------|---------|
| 20123456789 | ✅ Valid | Valid CUIT format |
| 27987654321 | ✅ Valid | Valid CUIT format |
| 12345678 | ❌ Invalid | Too short |
| 123456789012 | ❌ Invalid | Too long |
| AB123456789 | ❌ Invalid | Contains letters |
| 00000000000 | ❌ Invalid | All zeros |

**Steps**:
1. Test each DNI in provider registration
2. Verify validation messages are clear
3. Ensure only valid Argentina DNI formats accepted

### 6. Password Security Requirements

**Objective**: Verify password strength requirements

**Test Cases**:

| Password | Expected Result | Reason |
|----------|-----------------|---------|
| Carlos123! | ✅ Valid | Meets all requirements |
| password | ❌ Invalid | No uppercase/numbers/symbols |
| PASSWORD | ❌ Invalid | No lowercase/numbers/symbols |
| 12345678 | ❌ Invalid | No letters/symbols |
| Pass123 | ❌ Invalid | Too short |

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 7. JWT Token Validation

**Objective**: Test JWT token generation and validation

**Steps**:
1. Login with valid credentials
2. Extract JWT token from response
3. Decode token and verify claims
4. Test API endpoints with valid token
5. Test API endpoints with invalid token
6. Test API endpoints with expired token

**Expected JWT Claims**:
```json
{
  "userId": "user-uuid",
  "role": "CLIENT|PROVIDER",
  "iat": 1702195200,
  "exp": 1702281600
}
```

### 8. Error Handling

**Objective**: Verify proper error responses

**Test Scenarios**:

1. **Duplicate Email Registration**
   - Register user with email
   - Attempt to register again with same email
   - Expected: 409 Conflict with clear message

2. **Missing Required Fields**
   - Send registration without email
   - Send registration without password
   - Expected: 400 Bad Request with validation errors

3. **Invalid JSON**
   - Send malformed JSON payload
   - Expected: 400 Bad Request

4. **Too Large Payload**
   - Send payload exceeding size limit
   - Expected: 413 Payload Too Large

### 9. Argentina Locale Testing

**Objective**: Test Argentina-specific features

**Test Cases**:
1. **Spanish Characters**
   - Name: "José María Fernández"
   - Business: "Peluquería Señoría"
   - Expected: Characters preserved correctly

2. **Argentina Email Domains**
   - test@gmail.com.ar
   - usuario@empresa.com.ar
   - Expected: Valid email addresses

3. **Argentina Address Format**
   - "Av. Corrientes 1234, CABA"
   - Expected: Address format accepted

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Backend server running on port 3000
- [ ] Database connection established
- [ ] Test environment variables configured
- [ ] API documentation accessible
- [ ] Postman/curl/testing tool ready

### Testing Process
- [ ] Execute each test scenario
- [ ] Document actual results
- [ ] Capture screenshots for failures
- [ ] Record response times
- [ ] Note any unexpected behavior

### Post-Testing
- [ ] Clean test data from database
- [ ] Document all bugs found
- [ ] Categorize bugs by severity
- [ ] Create bug reports with reproduction steps
- [ ] Update test results in tracking system

## Test Results Template

```
Test Scenario: [Name]
Date: [Date]
Tester: [Name]
Browser: [Browser Version]

Steps Executed:
1. [Step 1]
2. [Step 2]
...

Actual Results:
- [Result 1]
- [Result 2]
...

Status: PASS/FAIL
Issues Found: [List any issues]
Notes: [Additional observations]
```

## Common Issues to Watch For

1. **Phone Number Issues**
   - Argentina format not recognized
   - Validation error messages unclear
   - International format handling

2. **DNI Validation Issues**
   - Invalid format accepted
   - Error messages not in Spanish
   - CUIT vs DNI confusion

3. **JWT Token Issues**
   - Token expiration not handled
   - Invalid token format
   - Security vulnerabilities

4. **Character Encoding**
   - Spanish characters corrupted
   - Emoji handling in names
   - Special characters in passwords

5. **Error Response Issues**
   - Inconsistent error format
   - Missing error details
   - Status codes incorrect