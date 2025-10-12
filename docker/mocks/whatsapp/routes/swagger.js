const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsApp Business API Mock Server',
    version: '1.0.0',
    description: 'Mock implementation of WhatsApp Business API for local development and testing',
    contact: {
      name: 'BarberPro Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:3003',
      description: 'Local development server'
    }
  ],
  tags: [
    {
      name: 'Messages',
      description: 'Message sending and status endpoints'
    },
    {
      name: 'Media',
      description: 'Media upload and management'
    },
    {
      name: 'Webhooks',
      description: 'Webhook configuration and history'
    },
    {
      name: 'Health',
      description: 'Health check and service info'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the service is running',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    service: { type: 'string', example: 'whatsapp-mock-server' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 12345 }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Send a message',
        description: 'Send a text, template, or media message via WhatsApp',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'type'],
                properties: {
                  to: {
                    type: 'string',
                    description: 'Recipient phone number (with country code)',
                    example: '+5491112345678'
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'template', 'image', 'document', 'audio', 'video'],
                    description: 'Message type'
                  },
                  text: {
                    type: 'object',
                    properties: {
                      body: { type: 'string', example: 'Hello from WhatsApp!' },
                      preview_url: { type: 'boolean', example: false }
                    }
                  },
                  template: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'booking_confirmation' },
                      language: { type: 'object', properties: { code: { type: 'string', example: 'es' } } },
                      components: { type: 'array', items: { type: 'object' } }
                    }
                  },
                  image: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      link: { type: 'string' },
                      caption: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Message sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messaging_product: { type: 'string', example: 'whatsapp' },
                    contacts: { type: 'array', items: { type: 'object' } },
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'wamid.abc123' },
                          message_status: { type: 'string', example: 'accepted' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request'
          }
        }
      },
      get: {
        tags: ['Messages'],
        summary: 'Get all messages',
        description: 'Retrieve all sent messages (for debugging)',
        responses: {
          '200': {
            description: 'List of messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: { type: 'array', items: { type: 'object' } },
                    total: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/messages/{id}': {
      get: {
        tags: ['Messages'],
        summary: 'Get message status',
        description: 'Retrieve the status of a specific message',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID'
          }
        ],
        responses: {
          '200': {
            description: 'Message status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    status: { type: 'string', enum: ['sent', 'delivered', 'read', 'failed'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    delivered_at: { type: 'string', format: 'date-time' },
                    read_at: { type: 'string', format: 'date-time' },
                    to: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Message not found'
          }
        }
      }
    },
    '/v1/templates': {
      get: {
        tags: ['Messages'],
        summary: 'Get available templates',
        description: 'List all available message templates',
        responses: {
          '200': {
            description: 'List of templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    templates: { type: 'array', items: { type: 'object' } },
                    total: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/v1/media': {
      post: {
        tags: ['Media'],
        summary: 'Upload media',
        description: 'Upload an image, document, audio, or video file',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: ['image', 'document', 'audio', 'video'],
                    description: 'Media type'
                  },
                  file: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      size: { type: 'number' }
                    }
                  },
                  filename: { type: 'string' },
                  mimetype: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Media uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'media.abc123' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request'
          }
        }
      },
      get: {
        tags: ['Media'],
        summary: 'Get all media',
        description: 'Retrieve all uploaded media (for debugging)',
        responses: {
          '200': {
            description: 'List of media files'
          }
        }
      }
    },
    '/v1/media/{id}': {
      get: {
        tags: ['Media'],
        summary: 'Get media by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Media details' },
          '404': { description: 'Media not found' }
        }
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete media',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Media deleted' },
          '404': { description: 'Media not found' }
        }
      }
    },
    '/v1/webhooks/config': {
      post: {
        tags: ['Webhooks'],
        summary: 'Configure webhook URL',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', example: 'http://backend:3000/api/webhooks/whatsapp' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Webhook configured' }
        }
      },
      get: {
        tags: ['Webhooks'],
        summary: 'Get webhook configuration',
        responses: {
          '200': { description: 'Current webhook URL' }
        }
      }
    },
    '/v1/webhooks/history': {
      get: {
        tags: ['Webhooks'],
        summary: 'Get webhook history',
        description: 'Retrieve the history of webhook deliveries',
        responses: {
          '200': { description: 'Webhook history' }
        }
      }
    }
  }
};

const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions
};
