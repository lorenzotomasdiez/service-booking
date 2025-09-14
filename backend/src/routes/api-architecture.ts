import { FastifyInstance } from 'fastify';
import { APIArchitecturePlatform } from '../services/api-architecture-platform';

/**
 * Advanced API Architecture & Strategic Integration Platform Routes
 * Enterprise-grade API management, security, documentation, and partnerships
 */

export default async function apiArchitectureRoutes(fastify: FastifyInstance) {
  const apiPlatform = new APIArchitecturePlatform(
    fastify,
    fastify.prisma,
    fastify.redis
  );

  // API versioning strategy endpoint
  fastify.get('/api-management/versioning', {
    schema: {
      description: 'Get API versioning strategy and backward compatibility management',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            currentVersion: { type: 'string' },
            supportedVersions: {
              type: 'array',
              items: { type: 'string' }
            },
            deprecationSchedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  version: { type: 'string' },
                  deprecationDate: { type: 'string' },
                  removalDate: { type: 'string' },
                  migrationGuide: { type: 'string' }
                }
              }
            },
            backwardCompatibility: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                supportedVersions: {
                  type: 'array',
                  items: { type: 'string' }
                },
                autoUpgrade: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const versioning = await apiPlatform.getAPIVersioningStrategy();
        reply.send(versioning);
      } catch (error) {
        fastify.log.error('Error getting API versioning strategy:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API versioning strategy'
        });
      }
    }
  });

  // API security framework endpoint
  fastify.get('/api-management/security', {
    schema: {
      description: 'Get comprehensive API security framework and threat detection',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            threatDetection: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                suspiciousPatterns: { type: 'number' },
                blockedRequests: { type: 'number' },
                securityAlerts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      severity: {
                        type: 'string',
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                      },
                      timestamp: { type: 'string' },
                      details: { type: 'string' },
                      resolved: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            authentication: {
              type: 'object',
              properties: {
                methods: {
                  type: 'array',
                  items: { type: 'string' }
                },
                mfaEnabled: { type: 'boolean' },
                tokenExpirationTime: { type: 'number' },
                refreshTokenRotation: { type: 'boolean' }
              }
            },
            rateLimit: {
              type: 'object',
              properties: {
                globalLimit: { type: 'number' },
                userLimit: { type: 'number' },
                premiumUserLimit: { type: 'number' },
                burstLimit: { type: 'number' },
                windowSize: { type: 'number' }
              }
            },
            dataProtection: {
              type: 'object',
              properties: {
                encryptionAtRest: { type: 'boolean' },
                encryptionInTransit: { type: 'boolean' },
                dataClassification: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      level: {
                        type: 'string',
                        enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
                      },
                      fields: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      accessControls: {
                        type: 'array',
                        items: { type: 'string' }
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
    handler: async (request, reply) => {
      try {
        const security = await apiPlatform.getAPISecurityFramework();
        reply.send(security);
      } catch (error) {
        fastify.log.error('Error getting API security framework:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API security framework'
        });
      }
    }
  });

  // API documentation system endpoint
  fastify.get('/api-management/documentation', {
    schema: {
      description: 'Get API documentation system with real-time updates and developer experience',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            documentation: {
              type: 'object',
              properties: {
                coverage: { type: 'number', minimum: 0, maximum: 100 },
                lastUpdated: { type: 'string' },
                autoGenerated: { type: 'boolean' },
                interactive: { type: 'boolean' }
              }
            },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  method: { type: 'string' },
                  version: { type: 'string' },
                  description: { type: 'string' },
                  documented: { type: 'boolean' },
                  examples: { type: 'boolean' },
                  testCases: { type: 'boolean' },
                  usage: { type: 'number' }
                }
              }
            },
            sdks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  version: { type: 'string' },
                  downloadCount: { type: 'number' },
                  lastUpdated: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'DEPRECATED', 'DISCONTINUED']
                  }
                }
              }
            },
            developerExperience: {
              type: 'object',
              properties: {
                gettingStartedTime: { type: 'number' },
                errorRate: { type: 'number' },
                supportTickets: { type: 'number' },
                communityContributions: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const documentation = await apiPlatform.getAPIDocumentationSystem();
        reply.send(documentation);
      } catch (error) {
        fastify.log.error('Error getting API documentation system:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API documentation system'
        });
      }
    }
  });

  // API partnership framework endpoint
  fastify.get('/api-management/partnerships', {
    schema: {
      description: 'Get API partnership framework for third-party integrations and ecosystem expansion',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            partnerships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  partnerId: { type: 'string' },
                  partnerName: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['INTEGRATION', 'RESELLER', 'TECHNOLOGY', 'DATA']
                  },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED']
                  },
                  apiAccess: {
                    type: 'object',
                    properties: {
                      tier: {
                        type: 'string',
                        enum: ['BASIC', 'PREMIUM', 'ENTERPRISE', 'CUSTOM']
                      },
                      endpoints: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      rateLimit: { type: 'number' },
                      usage: { type: 'number' },
                      revenue: { type: 'number' }
                    }
                  },
                  integrationHealth: {
                    type: 'object',
                    properties: {
                      uptime: { type: 'number' },
                      errorRate: { type: 'number' },
                      responseTime: { type: 'number' },
                      lastHealthCheck: { type: 'string' }
                    }
                  },
                  contractDetails: {
                    type: 'object',
                    properties: {
                      startDate: { type: 'string' },
                      endDate: { type: 'string' },
                      renewalDate: { type: 'string' },
                      revenue: { type: 'number' },
                      commissionRate: { type: 'number' }
                    }
                  }
                }
              }
            },
            ecosystem: {
              type: 'object',
              properties: {
                totalPartners: { type: 'number' },
                activeIntegrations: { type: 'number' },
                partnerRevenue: { type: 'number' },
                growthRate: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const partnerships = await apiPlatform.getAPIPartnershipFramework();
        reply.send(partnerships);
      } catch (error) {
        fastify.log.error('Error getting API partnership framework:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API partnership framework'
        });
      }
    }
  });

  // API analytics insights endpoint
  fastify.get('/api-management/analytics', {
    schema: {
      description: 'Get comprehensive API analytics and usage insights with optimization recommendations',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            usage: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                uniqueUsers: { type: 'number' },
                averageResponseTime: { type: 'number' },
                errorRate: { type: 'number' },
                uptime: { type: 'number' }
              }
            },
            performance: {
              type: 'object',
              properties: {
                p95ResponseTime: { type: 'number' },
                p99ResponseTime: { type: 'number' },
                throughput: { type: 'number' },
                concurrentUsers: { type: 'number' },
                peakLoad: { type: 'number' }
              }
            },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  method: { type: 'string' },
                  requests: { type: 'number' },
                  errorRate: { type: 'number' },
                  averageResponseTime: { type: 'number' },
                  popularity: { type: 'number' }
                }
              }
            },
            geographical: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  country: { type: 'string' },
                  requests: { type: 'number' },
                  responseTime: { type: 'number' },
                  errorRate: { type: 'number' }
                }
              }
            },
            trends: {
              type: 'object',
              properties: {
                requestGrowth: { type: 'number' },
                userGrowth: { type: 'number' },
                performanceImprovement: { type: 'number' },
                errorReduction: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const analytics = await apiPlatform.getAPIAnalyticsInsights();
        reply.send(analytics);
      } catch (error) {
        fastify.log.error('Error getting API analytics insights:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API analytics insights'
        });
      }
    }
  });

  // API quality assurance endpoint
  fastify.get('/api-management/quality-assurance', {
    schema: {
      description: 'Get API quality assurance metrics with automated testing and performance validation',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            testing: {
              type: 'object',
              properties: {
                automatedTestCoverage: { type: 'number', minimum: 0, maximum: 100 },
                integrationTestsPass: { type: 'number', minimum: 0, maximum: 100 },
                performanceTestsPass: { type: 'number', minimum: 0, maximum: 100 },
                securityTestsPass: { type: 'number', minimum: 0, maximum: 100 },
                lastTestRun: { type: 'string' }
              }
            },
            monitoring: {
              type: 'object',
              properties: {
                healthChecks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      service: { type: 'string' },
                      status: {
                        type: 'string',
                        enum: ['HEALTHY', 'DEGRADED', 'UNHEALTHY']
                      },
                      responseTime: { type: 'number' },
                      lastCheck: { type: 'string' },
                      uptime: { type: 'number' }
                    }
                  }
                },
                alerts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      severity: {
                        type: 'string',
                        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
                      },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                      resolved: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            reliability: {
              type: 'object',
              properties: {
                slaCompliance: { type: 'number', minimum: 0, maximum: 100 },
                mttr: { type: 'number' },
                mtbf: { type: 'number' },
                errorBudget: { type: 'number' },
                incidentCount: { type: 'number' }
              }
            },
            performanceOptimization: {
              type: 'object',
              properties: {
                cachingStrategy: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean' },
                    hitRate: { type: 'number' },
                    strategies: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                databaseOptimization: {
                  type: 'object',
                  properties: {
                    queryOptimization: { type: 'boolean' },
                    indexingScore: { type: 'number' },
                    connectionPooling: { type: 'boolean' }
                  }
                },
                scalingMetrics: {
                  type: 'object',
                  properties: {
                    autoScaling: { type: 'boolean' },
                    maxCapacity: { type: 'number' },
                    currentUtilization: { type: 'number' },
                    costOptimization: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const qualityAssurance = await apiPlatform.getAPIQualityAssurance();
        reply.send(qualityAssurance);
      } catch (error) {
        fastify.log.error('Error getting API quality assurance:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API quality assurance'
        });
      }
    }
  });

  // API health report endpoint
  fastify.get('/api-management/health-report', {
    schema: {
      description: 'Generate comprehensive API health report with actionable recommendations',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            overallHealth: { type: 'number', minimum: 0, maximum: 100 },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  score: { type: 'number', minimum: 0, maximum: 100 },
                  status: {
                    type: 'string',
                    enum: ['EXCELLENT', 'GOOD', 'NEEDS_ATTENTION', 'CRITICAL']
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            },
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: {
                    type: 'string',
                    enum: ['HIGH', 'MEDIUM', 'LOW']
                  },
                  category: { type: 'string' },
                  action: { type: 'string' },
                  impact: { type: 'string' },
                  effort: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH']
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const healthReport = await apiPlatform.generateAPIHealthReport();
        reply.send(healthReport);
      } catch (error) {
        fastify.log.error('Error generating API health report:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to generate API health report'
        });
      }
    }
  });

  // API metrics dashboard endpoint
  fastify.get('/api-management/dashboard', {
    schema: {
      description: 'Get API management dashboard with key metrics and real-time status',
      tags: ['API Architecture'],
      response: {
        200: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalEndpoints: { type: 'number' },
                activePartners: { type: 'number' },
                dailyRequests: { type: 'number' },
                overallHealth: { type: 'number' },
                uptime: { type: 'number' },
                errorRate: { type: 'number' }
              }
            },
            realTimeMetrics: {
              type: 'object',
              properties: {
                currentRPS: { type: 'number' },
                activeUsers: { type: 'number' },
                responseTime: { type: 'number' },
                cacheHitRate: { type: 'number' }
              }
            },
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            },
            topEndpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  requests: { type: 'number' },
                  responseTime: { type: 'number' },
                  errorRate: { type: 'number' }
                }
              }
            },
            securityStatus: {
              type: 'object',
              properties: {
                threatsBlocked: { type: 'number' },
                suspiciousActivity: { type: 'number' },
                securityScore: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const [analytics, security, qa, partnerships] = await Promise.all([
          apiPlatform.getAPIAnalyticsInsights(),
          apiPlatform.getAPISecurityFramework(),
          apiPlatform.getAPIQualityAssurance(),
          apiPlatform.getAPIPartnershipFramework()
        ]);

        const dashboard = {
          summary: {
            totalEndpoints: analytics.endpoints.length,
            activePartners: partnerships.ecosystem.activeIntegrations,
            dailyRequests: analytics.usage.totalRequests / 30, // Approximate daily
            overallHealth: 95, // Would calculate from all metrics
            uptime: analytics.usage.uptime,
            errorRate: analytics.usage.errorRate
          },
          realTimeMetrics: {
            currentRPS: analytics.performance.throughput,
            activeUsers: analytics.performance.concurrentUsers,
            responseTime: analytics.usage.averageResponseTime,
            cacheHitRate: qa.performanceOptimization.cachingStrategy.hitRate
          },
          alerts: [
            ...security.threatDetection.securityAlerts.slice(0, 5),
            ...qa.monitoring.alerts.slice(0, 3)
          ],
          topEndpoints: analytics.endpoints
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 5),
          securityStatus: {
            threatsBlocked: security.threatDetection.blockedRequests,
            suspiciousActivity: security.threatDetection.suspiciousPatterns,
            securityScore: 92 // Would calculate from security metrics
          }
        };

        reply.send(dashboard);
      } catch (error) {
        fastify.log.error('Error getting API management dashboard:', error);
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get API management dashboard'
        });
      }
    }
  });
}