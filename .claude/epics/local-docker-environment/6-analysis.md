---
issue: 6
epic: local-docker-environment
analyzed: 2025-10-12T15:30:00Z
parallel_streams: 2
estimated_hours: 10-12
---

# Work Stream Analysis: Issue #6

**Task**: Build WhatsApp & SMS Mock Servers

## Parallelization Strategy

This task can be split into **2 independent parallel streams** that can work simultaneously without conflicts.

### Stream A: WhatsApp Mock Server
**Agent**: general-purpose
**Estimated Time**: 5-6 hours
**Can Start**: Immediately
**Dependencies**: None

**Scope**:
- Create `docker/mocks/whatsapp/` directory structure
- Implement WhatsApp Business API mock endpoints
- Build message webhook simulation
- Create web dashboard UI
- Add health checks and logging
- Write unit tests
- Create Dockerfile

**Files to Create/Modify**:
- `docker/mocks/whatsapp/package.json`
- `docker/mocks/whatsapp/index.js`
- `docker/mocks/whatsapp/routes/messages.js`
- `docker/mocks/whatsapp/routes/webhooks.js`
- `docker/mocks/whatsapp/services/message.service.js`
- `docker/mocks/whatsapp/services/webhook.service.js`
- `docker/mocks/whatsapp/public/dashboard.html`
- `docker/mocks/whatsapp/tests/message.test.js`
- `docker/mocks/whatsapp/Dockerfile`
- `docker/mocks/whatsapp/README.md`
- `docker/mocks/whatsapp/.env.example`

**Key Requirements**:
- POST `/v1/messages` - Send message endpoint
- POST `/v1/messages/template` - Template messages
- POST `/v1/media` - Media upload
- GET `/v1/messages/:id` - Message status
- Webhook callbacks (delivered, read, failed)
- Dashboard at `/dashboard`
- Health check at `/health`
- Swagger docs at `/docs`
- Port 3003

---

### Stream B: SMS Mock Server
**Agent**: general-purpose
**Estimated Time**: 4-5 hours
**Can Start**: Immediately
**Dependencies**: None

**Scope**:
- Create `docker/mocks/sms/` directory structure
- Implement SMS gateway (Twilio-style) mock endpoints
- Add Argentina phone validation
- Build delivery simulation
- Create web dashboard UI
- Add health checks and logging
- Write unit tests
- Create Dockerfile

**Files to Create/Modify**:
- `docker/mocks/sms/package.json`
- `docker/mocks/sms/index.js`
- `docker/mocks/sms/routes/sms.js`
- `docker/mocks/sms/services/sms.service.js`
- `docker/mocks/sms/services/validation.service.js`
- `docker/mocks/sms/public/dashboard.html`
- `docker/mocks/sms/tests/sms.test.js`
- `docker/mocks/sms/Dockerfile`
- `docker/mocks/sms/README.md`
- `docker/mocks/sms/.env.example`

**Key Requirements**:
- POST `/v1/sms` - Send SMS endpoint
- GET `/v1/sms/:id` - SMS status
- POST `/v1/sms/bulk` - Bulk SMS
- Argentina phone validation (+54 format)
- Delivery status simulation
- Cost calculation
- Webhook callbacks
- Dashboard at `/dashboard`
- Health check at `/health`
- Swagger docs at `/docs`
- Port 3004

---

## Shared Components

Both streams may benefit from shared utilities. Consider creating these after both streams are underway:

**Optional Shared Directory**: `docker/mocks/shared/`
- Logger configuration
- Health check helper
- Webhook delivery helper
- ID generation utility

**Note**: This can be added later if code duplication becomes significant.

---

## Integration Tasks (Sequential, After Both Streams Complete)

### Stream C: Docker Compose Integration
**Agent**: general-purpose
**Estimated Time**: 1 hour
**Can Start**: After Streams A & B complete
**Dependencies**: Streams A and B

**Scope**:
- Add both services to `docker-compose.mocks.yml`
- Configure networking between services
- Add volume mounts if needed
- Update documentation

**Files to Modify**:
- `docker/docker-compose.mocks.yml`
- Root `README.md` or relevant docs

---

## Coordination Notes

### No Conflicts
- Stream A and Stream B work in completely separate directories
- No shared files between streams
- Both can proceed in parallel without coordination

### Testing Strategy
- Each stream should include unit tests
- Integration testing happens after both complete
- Final validation: Test with main BarberPro backend

### Success Criteria
- WhatsApp mock runs on port 3003 with all endpoints functional
- SMS mock runs on port 3004 with all endpoints functional
- Both have working dashboards
- Both have health checks passing
- Both integrated into docker-compose
- Unit tests passing (>60% coverage each)
- Documentation complete

---

## Recommended Execution Plan

1. **Start Both Streams Immediately** (Parallel)
   - Launch Stream A (WhatsApp) in one agent
   - Launch Stream B (SMS) in another agent
   - No waiting required

2. **Monitor Progress**
   - Each agent updates their progress file
   - Check for completion independently

3. **Integration Phase**
   - After both complete, run Stream C
   - Add to docker-compose
   - Test integration

4. **Final Validation**
   - Start both mocks via docker-compose
   - Test all endpoints
   - Verify dashboards
   - Run unit tests
   - Test with BarberPro backend

---

## Risk Assessment

**Low Risk**:
- Clear separation of concerns
- No shared code dependencies
- Well-defined API contracts
- Similar to existing AFIP mock (proven pattern)

**Potential Issues**:
- Port conflicts (ensure 3003/3004 are free)
- Webhook callback timing in tests
- Dashboard refresh logic

**Mitigation**:
- Use environment variables for ports
- Mock timers in tests
- Keep dashboard simple (polling is fine)
