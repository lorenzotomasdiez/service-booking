import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface FrontendAnalyticsEvent {
  type: 'click' | 'form' | 'search' | 'booking' | 'error' | 'navigation' | 'interaction';
  target?: string;
  value?: string;
  timestamp: string;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

interface FrontendAnalyticsPayload {
  events: FrontendAnalyticsEvent[];
  timestamp: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  referrer?: string;
  environment?: 'development' | 'production';
}

export default async function frontendAnalyticsRoutes(server: FastifyInstance) {
  /**
   * Receive frontend analytics events
   * POST /api/analytics/frontend-events
   */
  server.post<{
    Body: FrontendAnalyticsPayload
  }>('/frontend-events', {
    schema: {
      tags: ['Frontend Analytics'],
      description: 'Receive analytics events from the frontend application',
      body: {
        type: 'object',
        required: ['events', 'timestamp'],
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'timestamp'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['click', 'form', 'search', 'booking', 'error', 'navigation', 'interaction']
                },
                target: { type: 'string' },
                value: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                duration: { type: 'number' },
                success: { type: 'boolean' },
                metadata: { type: 'object', additionalProperties: true }
              }
            }
          },
          timestamp: { type: 'string', format: 'date-time' },
          sessionId: { type: 'string' },
          userAgent: { type: 'string' },
          url: { type: 'string' },
          referrer: { type: 'string' },
          environment: { type: 'string', enum: ['development', 'production'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            processed: { type: 'number' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: FrontendAnalyticsPayload }>, reply: FastifyReply) => {
    try {
      const { events, timestamp, sessionId, userAgent, url, referrer, environment } = request.body;

      // Validate events array
      if (!Array.isArray(events) || events.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Events array is required and cannot be empty'
        });
      }

      // Log analytics events for now (in production, you'd store in database)
      server.log.info({
        component: 'FrontendAnalytics',
        sessionId,
        userAgent,
        url,
        referrer,
        environment,
        eventCount: events.length,
        timestamp
      }, 'Received frontend analytics events');

      // Process each event
      const processedEvents = [];
      for (const event of events) {
        try {
          // Validate event structure
          if (!event.type || !event.timestamp) {
            server.log.warn('Invalid event structure', event);
            continue;
          }

          // Process different event types
          const processedEvent = {
            ...event,
            sessionId,
            userAgent,
            url,
            referrer,
            environment,
            receivedAt: new Date().toISOString(),
            processed: true
          };

          // Log specific event types for debugging
          switch (event.type) {
            case 'error':
              server.log.error({
                component: 'FrontendAnalytics',
                eventType: 'error',
                target: event.target,
                metadata: event.metadata,
                sessionId,
                url
              }, 'Frontend error event received');
              break;

            case 'booking':
              server.log.info({
                component: 'FrontendAnalytics',
                eventType: 'booking',
                target: event.target,
                success: event.success,
                sessionId,
                url
              }, 'Frontend booking event received');
              break;

            case 'form':
              server.log.info({
                component: 'FrontendAnalytics',
                eventType: 'form',
                target: event.target,
                success: event.success,
                sessionId
              }, 'Frontend form event received');
              break;

            default:
              // Log other events at debug level
              server.log.debug({
                component: 'FrontendAnalytics',
                eventType: event.type,
                target: event.target,
                sessionId
              }, 'Frontend analytics event received');
          }

          processedEvents.push(processedEvent);

          // TODO: In production, store events in database
          // await server.prisma.frontendAnalyticsEvent.create({
          //   data: processedEvent
          // });

        } catch (eventError) {
          server.log.error({
            error: eventError,
            event,
            sessionId
          }, 'Error processing individual analytics event');
        }
      }

      return reply.send({
        success: true,
        message: `Processed ${processedEvents.length} analytics events`,
        processed: processedEvents.length
      });

    } catch (error: any) {
      server.log.error({
        error: error.message,
        stack: error.stack,
        body: request.body
      }, 'Error processing frontend analytics events');

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error processing analytics events'
      });
    }
  });

  /**
   * Get frontend analytics summary (for debugging/monitoring)
   * GET /api/analytics/frontend-summary
   */
  server.get('/frontend-summary', {
    schema: {
      tags: ['Frontend Analytics'],
      description: 'Get summary of frontend analytics events (for monitoring)',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        data: {
          message: 'Frontend analytics endpoint is operational',
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      server.log.error(error, 'Error getting frontend analytics summary');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error getting analytics summary'
      });
    }
  });
}