const swaggerUi = require('swagger-ui-express');

/**
 * OpenAPI 3.0 Specification for AFIP Mock Server
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AFIP Mock Server API',
    version: '1.0.0',
    description: `
Mock server for AFIP (Administración Federal de Ingresos Públicos) WebServices.
This server simulates AFIP's electronic invoicing and validation services for local development and testing.

**IMPORTANT**: This is a mock server for development purposes only. Do NOT use in production.

## Supported Services

- **WSAA**: Web Services Authentication and Authorization
- **WSFEv1**: Web Service Facturación Electrónica (Electronic Invoicing)
- **WS SR Padrón A5**: Taxpayer registry and CUIT/CUIL validation

## Mock Behavior

- All endpoints return realistic mock data
- CAE codes are generated with proper format (14 digits)
- CUIT validation includes checksum verification
- Invoice data is persisted in SQLite database
- Response delays can be configured
    `,
    contact: {
      name: 'BarberPro Team',
      url: 'https://github.com/barberpro'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Local development server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'WSAA authentication endpoints'
    },
    {
      name: 'Invoicing',
      description: 'Electronic invoicing operations (WSFEv1)'
    },
    {
      name: 'Validation',
      description: 'CUIT/CUIL validation and taxpayer information'
    },
    {
      name: 'System',
      description: 'Health checks and server information'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        description: 'Check if the server is running and database is connected',
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    service: { type: 'string', example: 'afip-mock-server' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 12345.67 },
                    database: { type: 'string', example: 'connected' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/wsaa/auth': {
      post: {
        tags: ['Authentication'],
        summary: 'WSAA authentication',
        description: 'Mock AFIP WSAA authentication endpoint. Returns a mock token for use with other services.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cuit'],
                properties: {
                  cuit: {
                    type: 'string',
                    description: 'CUIT of the taxpayer (11 digits, with or without dashes)',
                    example: '20-12345678-9'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'mock-token-20123456789-1633024950000' },
                    expiration: { type: 'string', format: 'date-time', example: '2025-10-13T01:42:30Z' },
                    sign: { type: 'string', example: 'mocked-signature-1633024950000' },
                    generated_at: { type: 'string', format: 'date-time' },
                    service: { type: 'string', example: 'wsfe' },
                    cuit: { type: 'string', example: '20123456789' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid CUIT',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/wsaa/status': {
      get: {
        tags: ['Authentication'],
        summary: 'WSAA service status',
        description: 'Check WSAA service availability',
        responses: {
          200: {
            description: 'Service status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    service: { type: 'string', example: 'WSAA Mock' },
                    status: { type: 'string', example: 'operational' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/wsfev1/FECAESolicitar': {
      post: {
        tags: ['Invoicing'],
        summary: 'Request CAE for invoice',
        description: 'Submit invoice data to AFIP and receive a CAE (Código de Autorización Electrónico)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['FeCAEReq'],
                properties: {
                  FeCAEReq: {
                    type: 'object',
                    properties: {
                      FeCabReq: {
                        type: 'object',
                        properties: {
                          CantReg: { type: 'integer', example: 1 },
                          PtoVta: { type: 'integer', example: 1 },
                          CbteTipo: { type: 'integer', example: 6, description: '1=A, 6=B, 11=C' }
                        }
                      },
                      FeDetReq: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            Concepto: { type: 'integer', example: 1 },
                            DocTipo: { type: 'integer', example: 80 },
                            DocNro: { type: 'integer', example: 20123456789 },
                            CbteDesde: { type: 'integer', example: 1 },
                            CbteHasta: { type: 'integer', example: 1 },
                            CbteFch: { type: 'string', example: '20251012' },
                            ImpTotal: { type: 'number', example: 1210.00 },
                            ImpTotConc: { type: 'number', example: 0 },
                            ImpNeto: { type: 'number', example: 1000.00 },
                            ImpOpEx: { type: 'number', example: 0 },
                            ImpIVA: { type: 'number', example: 210.00 },
                            ImpTrib: { type: 'number', example: 0 },
                            MonId: { type: 'string', example: 'PES' },
                            MonCotiz: { type: 'number', example: 1 }
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
        responses: {
          200: {
            description: 'CAE request processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    FECAESolicitarResult: {
                      type: 'object',
                      properties: {
                        FeCabResp: {
                          type: 'object',
                          properties: {
                            Cuit: { type: 'integer' },
                            PtoVta: { type: 'integer' },
                            CbteTipo: { type: 'integer' },
                            FchProceso: { type: 'string' },
                            CantReg: { type: 'integer' },
                            Resultado: { type: 'string', enum: ['A', 'P', 'R'] }
                          }
                        },
                        FeDetResp: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              CbteDesde: { type: 'integer' },
                              CbteHasta: { type: 'integer' },
                              CAE: { type: 'string', example: '25101012345678' },
                              CAEFchVto: { type: 'string', example: '20251022' },
                              Resultado: { type: 'string', enum: ['A', 'R'] },
                              Observaciones: { type: 'array', items: { type: 'object' } }
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
      }
    },
    '/wsfev1/FECompUltimoAutorizado': {
      get: {
        tags: ['Invoicing'],
        summary: 'Get last authorized invoice number',
        description: 'Retrieve the last authorized invoice number for a specific POS',
        parameters: [
          {
            name: 'pos',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
            description: 'Point of sale number'
          },
          {
            name: 'tipo_cbte',
            in: 'query',
            schema: { type: 'integer', default: 6 },
            description: 'Invoice type'
          }
        ],
        responses: {
          200: {
            description: 'Last invoice number retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    FECompUltimoAutorizadoResult: {
                      type: 'object',
                      properties: {
                        PtoVta: { type: 'integer' },
                        CbteTipo: { type: 'integer' },
                        CbteNro: { type: 'integer', example: 123 }
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
    '/wsfev1/FEParamGetPtosVenta': {
      post: {
        tags: ['Invoicing'],
        summary: 'Get list of POS',
        description: 'Retrieve all configured points of sale',
        responses: {
          200: {
            description: 'POS list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    FEParamGetPtosVentaResult: {
                      type: 'object',
                      properties: {
                        ResultGet: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              Nro: { type: 'integer' },
                              EmisionTipo: { type: 'string' },
                              Bloqueado: { type: 'string' },
                              FchBaja: { type: 'string', nullable: true }
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
      }
    },
    '/wsfev1/FECompConsultar': {
      get: {
        tags: ['Invoicing'],
        summary: 'Query an invoice',
        description: 'Retrieve invoice details by CAE or invoice number',
        parameters: [
          {
            name: 'cae',
            in: 'query',
            schema: { type: 'string' },
            description: 'CAE code'
          },
          {
            name: 'pos',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Point of sale'
          },
          {
            name: 'invoice_number',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Invoice number'
          }
        ],
        responses: {
          200: {
            description: 'Invoice found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    FECompConsultarResult: {
                      type: 'object',
                      properties: {
                        ResultGet: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Invoice not found'
          }
        }
      }
    },
    '/ws_sr_padron_a5/getPersona': {
      post: {
        tags: ['Validation'],
        summary: 'Get taxpayer information',
        description: 'Validate CUIT/CUIL and retrieve taxpayer data from AFIP registry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cuit'],
                properties: {
                  cuit: {
                    type: 'string',
                    example: '20-12345678-9',
                    description: 'CUIT/CUIL (11 digits, with or without dashes)'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Taxpayer information retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    persona: {
                      type: 'object',
                      properties: {
                        cuit: { type: 'string' },
                        tipoPersona: { type: 'string', enum: ['FISICA', 'JURIDICA'] },
                        tipoCuit: { type: 'string' },
                        numeroDocumento: { type: 'integer' },
                        razonSocial: { type: 'string', nullable: true },
                        nombre: { type: 'string', nullable: true },
                        apellido: { type: 'string', nullable: true },
                        domicilioFiscal: { type: 'object' },
                        categoriaAutonomo: { type: 'string', nullable: true },
                        estadoCuit: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Invalid CUIT/CUIL',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/validate/cuit': {
      post: {
        tags: ['Validation'],
        summary: 'Validate CUIT/CUIL checksum',
        description: 'Simple CUIT/CUIL validation (checksum verification only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cuit'],
                properties: {
                  cuit: { type: 'string', example: '20-12345678-9' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Validation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                    cuit: { type: 'string', example: '20123456789' },
                    formatted: { type: 'string', example: '20-12345678-9' },
                    type: { type: 'string', example: 'CUIT' },
                    error: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/validate/cuit/{cuit}': {
      get: {
        tags: ['Validation'],
        summary: 'Validate CUIT/CUIL via URL',
        description: 'Validate CUIT/CUIL using URL parameter',
        parameters: [
          {
            name: 'cuit',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: '20123456789'
          }
        ],
        responses: {
          200: {
            description: 'Validation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                    cuit: { type: 'string' },
                    formatted: { type: 'string' },
                    type: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/config': {
      get: {
        tags: ['System'],
        summary: 'Get server configuration',
        description: 'Retrieve current server configuration (tax categories, invoice types, etc.)',
        responses: {
          200: {
            description: 'Configuration data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    taxCategories: { type: 'object' },
                    invoiceTypes: { type: 'object' },
                    validationRules: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error code'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      }
    }
  }
};

/**
 * Swagger UI options
 */
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions
};
