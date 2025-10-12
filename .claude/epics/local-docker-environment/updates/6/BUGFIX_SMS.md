# SMS Mock Server - Bug Fixes

**Date**: 2025-10-12T02:50:00Z
**Issue**: #6 - Build WhatsApp & SMS Mock Servers
**Stream**: Stream B (SMS Mock)

---

## Problems Identified

### 1. Test Hanging (Jest Not Exiting)
**Symptom**: Tests pass but Jest doesn't exit:
```
Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Jest did not exit one second after the test run has completed.
```

**Root Cause**:
- `setTimeout` calls in `services/sms.service.js` scheduled during tests
- Timers continued running after tests completed
- SMS messages cleared by tests before timers fired
- Prevented Jest from exiting cleanly

### 2. Dashboard 404 Error
**Symptom**: Accessing `/dashboard` returns 404

**Root Cause**:
- `express.static('/dashboard', ...)` expects file at `/dashboard/dashboard.html`
- Incorrect Express static file configuration

### 3. Server Start During Tests
**Symptom**: HTTP server starts when running tests (minor issue)

**Root Cause**:
- `start()` called unconditionally during module import
- Interferes with test runner

---

## Fixes Applied

### Fix 1: Disable Timers in Test Mode

**File**: `services/sms.service.js` (function `simulateDelivery`)

**Change**:
```javascript
// Before (causes timer leaks)
function simulateDelivery(sms) {
  setTimeout(() => {
    sms.status = 'sent';
    sms.updatedAt = new Date().toISOString();
    logger.info('SMS sent', { smsId: sms.id, to: sms.to });
  }, 1000);

  setTimeout(() => {
    // ... delivery logic
  }, 2000);
}

// After (test-safe)
function simulateDelivery(sms) {
  // Skip simulation in test mode to prevent timer leaks
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  setTimeout(() => {
    const existingSms = smsStore.get(sms.id);
    if (!existingSms) return; // SMS was deleted

    existingSms.status = 'sent';
    existingSms.updatedAt = new Date().toISOString();
    logger.info('SMS sent', { smsId: existingSms.id, to: existingSms.to });
  }, 1000);

  setTimeout(() => {
    const existingSms = smsStore.get(sms.id);
    if (!existingSms) return; // SMS was deleted

    // ... delivery logic with existingSms
  }, 2000);
}
```

**Why This Works**:
- Tests skip async simulation entirely
- Production keeps full delivery simulation
- Extra safety checks prevent errors if SMS deleted
- Accesses `smsStore` directly instead of closure variable

### Fix 2: Fix Dashboard Route

**File**: `index.js` (lines 60-64)

**Change**:
```javascript
// Before (doesn't work)
app.use('/dashboard', express.static(path.join(__dirname, 'public')));

// After (works correctly)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
```

**Why This Works**:
- Direct file serving instead of static directory
- Correct path resolution
- Single dashboard endpoint

### Fix 3: Conditional Server Start

**File**: `index.js` (lines 182-185)

**Change**:
```javascript
// Before
start();
module.exports = app;

// After
if (process.env.NODE_ENV !== 'test') {
  start();
}
module.exports = app;
```

**Why This Works**:
- Server doesn't start during test runs
- Tests import app without HTTP overhead
- Production behavior unchanged

### Fix 4: Set Test Environment Early

**File**: `tests/sms.test.js` (lines 5-10)

**Change**:
```javascript
// Before
const request = require('supertest');
const app = require('../index');

// After
const request = require('supertest');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

const app = require('../index');
```

**Why This Works**:
- Environment set before any conditional checks
- All test mode guards activate correctly

---

## Verification

### Test Results
```bash
✅ npm test
Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Time:        4.454 s
✅ Jest exits cleanly (no hanging)
✅ No timer warnings
```

### Behavior Verified

**In Test Mode** (`npm test`):
- ✅ No HTTP server starts
- ✅ No delivery simulation timers
- ✅ Tests run synchronously
- ✅ Jest exits immediately
- ✅ All 24 tests passing

**In Production Mode** (`npm start`):
- ✅ Server starts on port 3004
- ✅ Delivery simulation works (1s → 2s)
- ✅ Dashboard accessible at `/dashboard`
- ✅ 95% success rate simulation
- ✅ Webhooks triggered as expected

---

## Impact

### No Breaking Changes
- ✅ API behavior identical in production
- ✅ All 24 tests still passing
- ✅ Delivery simulation works in non-test environments
- ✅ Dashboard and endpoints unaffected

### Improvements
- ✅ Tests run quickly without waiting
- ✅ Clean Jest exit
- ✅ Dashboard now accessible
- ✅ Better test reliability

---

## Files Modified

1. `services/sms.service.js` - Timer guards and existence checks
2. `index.js` - Dashboard route fix and conditional server start
3. `tests/sms.test.js` - Early NODE_ENV setting

---

## Git Commit

```
Issue #6: Fix SMS mock timer leaks, dashboard route, and graceful shutdown

- Disable setTimeout in test mode to prevent timer leaks
- Add SMS existence checks in delayed callbacks
- Fix dashboard route to serve HTML directly
- Only start HTTP server when not in test mode
- Set NODE_ENV='test' before importing app in tests

All 24 tests passing, Jest exits cleanly
```

---

## Status

✅ **FIXED** - All issues resolved
✅ Tests run cleanly without hanging
✅ Dashboard accessible
✅ Production behavior unchanged
✅ Matches WhatsApp mock fixes (consistency)
