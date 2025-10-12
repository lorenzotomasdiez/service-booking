/**
 * Swagger/OpenAPI Documentation
 */

const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SMS Mock Server API',
    version: '1.0.0',
    description: 'Mock SMS Gateway (Twilio-style) API for local development and testing',
    contact: {
      name: 'BarberPro Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:3004',
      description: 'Local development server'
    }
  ],
  tags: [
    {
      name: 'SMS',
      description: 'SMS operations'
    },
    {
      name: 'Health',
      description: 'Health check endpoints'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    service: { type: 'string', example: 'sms-mock-server' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 123.456 }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/sms': {
      post: {
        tags: ['SMS'],
        summary: 'Send a single SMS',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'body'],
                properties: {
                  to: {
                    type: 'string',
                    description: 'Recipient phone number (Argentina +54 format)',
                    example: '+54 9 11 1234-5678'
                  },
                  body: {
                    type: 'string',
                    description: 'Message content',
                    example: 'Your appointment is confirmed for tomorrow at 3 PM'
                  },
                  from: {
                    type: 'string',
                    description: 'Sender phone number (optional)',
                    example: '+54 11 0000-0000'
                  },
                  webhookUrl: {
                    type: 'string',
                    description: 'Webhook URL for delivery notifications (optional)',
                    example: 'http://backend:3000/api/webhooks/sms'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'SMS created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'SM1699999999abc123' },
                        to: { type: 'string', example: '+5491112345678' },
                        body: { type: 'string', example: 'Your appointment is confirmed' },
                        from: { type: 'string', example: '+541100000000' },
                        status: { type: 'string', example: 'queued' },
                        segments: { type: 'number', example: 1 },
                        cost: { type: 'string', example: '0.05' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - validation error'
          }
        }
      },
      get: {
        tags: ['SMS'],
        summary: 'Get all SMS messages',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: {
              type: 'string',
              enum: ['queued', 'sent', 'delivered', 'failed']
            }
          },
          {
            name: 'to',
            in: 'query',
            description: 'Filter by recipient phone number',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limit number of results',
            schema: {
              type: 'number'
            }
          }
        ],
        responses: {
          200: {
            description: 'List of SMS messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 5 },
                        messages: {
                          type: 'array',
                          items: {
                            type: 'object'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['SMS'],
        summary: 'Clear all SMS messages (testing only)',
        responses: {
          200: {
            description: 'SMS messages cleared'
          }
        }
      }
    },
    '/v1/sms/{id}': {
      get: {
        tags: ['SMS'],
        summary: 'Get SMS by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'SMS ID',
            schema: {
              type: 'string',
              example: 'SM1699999999abc123'
            }
          }
        ],
        responses: {
          200: {
            description: 'SMS details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        to: { type: 'string' },
                        body: { type: 'string' },
                        from: { type: 'string' },
                        status: { type: 'string' },
                        segments: { type: 'number' },
                        cost: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        deliveredAt: { type: 'string', format: 'date-time', nullable: true },
                        errorMessage: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'SMS not found'
          }
        }
      }
    },
    '/v1/sms/bulk': {
      post: {
        tags: ['SMS'],
        summary: 'Send bulk SMS',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    description: 'Array of SMS messages (max 100)',
                    items: {
                      type: 'object',
                      required: ['to', 'body'],
                      properties: {
                        to: { type: 'string', example: '+54 9 11 1234-5678' },
                        body: { type: 'string', example: 'Your appointment is confirmed' },
                        from: { type: 'string', example: '+54 11 0000-0000' },
                        webhookUrl: { type: 'string', example: 'http://backend:3000/webhook' }
                      }
                    }
                  },
                  webhookUrl: {
                    type: 'string',
                    description: 'Default webhook URL for all messages (can be overridden per message)'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Bulk SMS processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 10 },
                        successful: { type: 'number', example: 9 },
                        failed: { type: 'number', example: 1 },
                        totalCost: { type: 'string', example: '0.45' },
                        totalSegments: { type: 'number', example: 9 },
                        results: { type: 'array', items: { type: 'object' } },
                        errors: { type: 'array', items: { type: 'object' } }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - validation error'
          }
        }
      }
    },
    '/v1/stats': {
      get: {
        tags: ['SMS'],
        summary: 'Get SMS statistics',
        responses: {
          200: {
            description: 'SMS statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 100 },
                        queued: { type: 'number', example: 5 },
                        sent: { type: 'number', example: 10 },
                        delivered: { type: 'number', example: 80 },
                        failed: { type: 'number', example: 5 },
                        totalCost: { type: 'string', example: '5.00' },
                        totalSegments: { type: 'number', example: 100 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SMS Mock Server API'
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions
};
