# MercadoPago Dashboard Bugfix

**Date:** 2025-10-12T03:50:00Z
**Issue:** MercadoPago `/dashboard` endpoint returning JSON instead of HTML
**Status:** ✅ FIXED

---

## Problem Description

After completing Issue #7, the MercadoPago mock server at `http://localhost:3001/dashboard` was returning JSON data instead of the HTML dashboard:

```json
{
  "statistics": {
    "total_payments": 0,
    "approved": 0,
    "pending": 0,
    "rejected": 0,
    "refunded": 0,
    "total_amount": 0,
    "total_refunded": 0
  },
  "recent_payments": []
}
```

**Expected:** HTML dashboard similar to WhatsApp and SMS mocks
**Actual:** JSON response

---

## Root Cause

The MercadoPago mock `index.js` had an explicit route handler for `/dashboard` (lines 68-76) that was returning JSON:

```javascript
// Dashboard endpoint (legacy)
app.get('/dashboard', (req, res) => {
  const stats = paymentService.getStatistics();
  const payments = paymentService.getAllPayments();

  res.json({
    statistics: stats,
    recent_payments: payments.slice(0, 10)
  });
});
```

This route was defined **after** the static file serving middleware, which meant the explicit route took precedence over the static `dashboard.html` file in the `public/` directory.

---

## Solution

Changed the `/dashboard` route to serve the HTML file directly using `res.sendFile()`, matching the pattern used in WhatsApp and SMS mocks:

**Before:**
```javascript
// Dashboard endpoint (legacy)
app.get('/dashboard', (req, res) => {
  const stats = paymentService.getStatistics();
  const payments = paymentService.getAllPayments();

  res.json({
    statistics: stats,
    recent_payments: payments.slice(0, 10)
  });
});
```

**After:**
```javascript
// Dashboard endpoint - serve HTML file directly
const path = require('path');
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Dashboard API endpoint (for dashboard.js to fetch data)
app.get('/api/dashboard/stats', (req, res) => {
  const stats = paymentService.getStatistics();
  const payments = paymentService.getAllPayments();

  res.json({
    statistics: stats,
    recent_payments: payments.slice(0, 10)
  });
});
```

---

## Changes Made

**File Modified:** `docker/mocks/mercadopago/index.js`

1. ✅ Changed `/dashboard` route to serve HTML file with `res.sendFile()`
2. ✅ Moved JSON data endpoint to `/api/dashboard/stats` for `dashboard.js` to fetch
3. ✅ Added `const path = require('path')` import
4. ✅ Maintained backward compatibility with dashboard.js

---

## Testing

### Before Fix
```bash
curl http://localhost:3001/dashboard
# Output: {"statistics":{...},"recent_payments":[]}
```

### After Fix
```bash
curl http://localhost:3001/dashboard | head -5
# Output:
# <!DOCTYPE html>
# <html lang="es-AR">
# <head>
#   <meta charset="UTF-8">
#   <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## Verification Steps

1. **Rebuild container:**
   ```bash
   docker-compose -f docker/docker-compose.mocks.yml up -d --build mercadopago-mock
   ```

2. **Check status:**
   ```bash
   docker-compose -f docker/docker-compose.mocks.yml ps mercadopago-mock
   # STATUS: Up X seconds (healthy)
   ```

3. **Test dashboard:**
   ```bash
   curl http://localhost:3001/dashboard
   # Should return HTML, not JSON
   ```

4. **Access in browser:**
   - Open: http://localhost:3001/dashboard
   - Should see: HTML dashboard with scenario control and payment stats

---

## Commit

**Commit:** fb5b144
**Message:** "Issue #7: Fix MercadoPago dashboard to serve HTML instead of JSON"

**Files Changed:**
- `docker/mocks/mercadopago/index.js`

---

## Pattern Consistency

This fix ensures all mock servers follow the same pattern:

| Service | Dashboard Route | Returns |
|---------|----------------|---------|
| MercadoPago | `/dashboard` | ✅ HTML |
| AFIP | `/docs` | ✅ HTML (Swagger) |
| WhatsApp | `/dashboard` | ✅ HTML |
| SMS | `/dashboard` | ✅ HTML |
| MailHog | Web UI at `:8025` | ✅ HTML |

---

## Status

✅ **FIXED** - MercadoPago dashboard now serves HTML correctly
✅ **TESTED** - Verified with curl and browser
✅ **DOCUMENTED** - This file documents the fix
✅ **COMMITTED** - Changes committed to git

All mock services now have consistent dashboard behavior.
