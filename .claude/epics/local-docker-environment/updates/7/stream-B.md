---
issue: 7
stream: Makefile Integration
agent: general-purpose
started: 2025-10-12T03:31:36Z
completed: 2025-10-12T03:45:00Z
status: completed
---

# Stream B: Makefile Integration

## Scope
Add mock service management commands to Makefile (mocks, mocks-down, mocks-logs, mocks-reset)

## Files
- `Makefile` (add mocks commands section)

## Progress
- ✓ Updated existing `mocks` command to use proper docker-compose path
- ✓ Added `mocks-down` command to stop all mock services
- ✓ Added `mocks-logs` command to view logs from all mock services
- ✓ Added `mocks-reset` command to reset mocks (down -v, then up -d)
- ✓ Included color-coded output using CYAN and GREEN variables
- ✓ Display service URLs after starting (MercadoPago, AFIP, WhatsApp, SMS, Email)
- ✓ Added help text for each command (## comments)
- ✓ Updated .PHONY declarations to include new commands
- ✓ Updated help section to list new mock commands

## Implementation Details
All commands reference `docker/docker-compose.mocks.yml` as specified.

Service URLs displayed:
- MercadoPago: http://localhost:3001/dashboard
- AFIP: http://localhost:3002/docs
- WhatsApp: http://localhost:3003/dashboard
- SMS: http://localhost:3004/dashboard
- Email: http://localhost:8025

## Testing
Commands can be tested once docker-compose.mocks.yml is ready (Stream A).
