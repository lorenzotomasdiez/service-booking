import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../services/database';
import { socketService } from '../services/socket';

// Type for authenticated user data
interface UserData {
  userId: string;
  userRole: string;
  providerId?: string;
}

// Schedule management interfaces
interface WorkingHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string; // "09:00"
    closeTime: string; // "18:00"
    breaks?: Array<{
      start: string;
      end: string;
    }>;
  };
}

interface ScheduleTemplate {
  name: string;
  workingHours: WorkingHours;
  description?: string;
}

export default async function providerScheduleRoutes(fastify: FastifyInstance) {
  // Prehandler for authentication
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * GET /schedule/:providerId
   * Get provider's current schedule configuration
   */
  fastify.get('/schedule/:providerId', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Get provider schedule configuration',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para ver este horario',
          statusCode: 403
        });
      }

      const provider = await fastify.prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Proveedor no encontrado',
          statusCode: 404
        });
      }

      return {
        success: true,
        providerId,
        providerName: provider.user.name,
        workingHours: provider.workingHours || {},
        timezone: 'America/Argentina/Buenos_Aires',
        lastUpdated: provider.updatedAt
      };

    } catch (error) {
      fastify.log.error('Error getting provider schedule:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * PUT /schedule/:providerId
   * Update provider's working hours and schedule
   */
  fastify.put('/schedule/:providerId', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Update provider working hours and schedule',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['workingHours'],
        properties: {
          workingHours: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                isOpen: { type: 'boolean' },
                openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                breaks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                      end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { workingHours } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para modificar este horario',
          statusCode: 403
        });
      }

      // Validate working hours format
      const validationErrors = validateWorkingHours(workingHours);
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Formato de horario inválido',
          details: validationErrors,
          statusCode: 400
        });
      }

      const updatedProvider = await fastify.prisma.provider.update({
        where: { id: providerId },
        data: {
          workingHours: workingHours,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      // Broadcast schedule update to real-time clients
      await socketService.broadcastScheduleUpdate(providerId, workingHours);

      return {
        success: true,
        providerId,
        workingHours: updatedProvider.workingHours,
        message: 'Horario actualizado exitosamente',
        lastUpdated: updatedProvider.updatedAt
      };

    } catch (error) {
      fastify.log.error('Error updating provider schedule:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /schedule/:providerId/templates
   * Create a reusable schedule template
   */
  fastify.post('/schedule/:providerId/templates', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Create reusable schedule template',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'workingHours'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          workingHours: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                isOpen: { type: 'boolean' },
                openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                breaks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                      end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { name, description, workingHours } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para crear plantillas',
          statusCode: 403
        });
      }

      // Validate working hours format
      const validationErrors = validateWorkingHours(workingHours);
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Formato de horario inválido',
          details: validationErrors,
          statusCode: 400
        });
      }

      // Store template in provider's metadata (this could be extended to a separate ScheduleTemplate model)
      const provider = await fastify.prisma.provider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Proveedor no encontrado',
          statusCode: 404
        });
      }

      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const template: ScheduleTemplate = {
        name,
        description,
        workingHours
      };

      // For now, store templates in a simple structure
      // In production, you might want a separate ScheduleTemplate model
      const templates = (provider.workingHours as any)?.templates || {};
      templates[templateId] = template;

      await fastify.prisma.provider.update({
        where: { id: providerId },
        data: {
          workingHours: {
            ...(provider.workingHours as any),
            templates
          }
        }
      });

      return {
        success: true,
        templateId,
        template,
        message: 'Plantilla de horario creada exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error creating schedule template:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /schedule/:providerId/exceptions
   * Add special date exceptions (holidays, special hours)
   */
  fastify.post('/schedule/:providerId/exceptions', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Add schedule exceptions for holidays or special dates',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['date', 'type'],
        properties: {
          date: { type: 'string', format: 'date' },
          type: { type: 'string', enum: ['closed', 'special_hours'] },
          specialHours: {
            type: 'object',
            properties: {
              openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              breaks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                    end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                  }
                }
              }
            }
          },
          reason: { type: 'string', maxLength: 200 },
          recurring: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { date, type, specialHours, reason, recurring } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para modificar excepciones',
          statusCode: 403
        });
      }

      const provider = await fastify.prisma.provider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Proveedor no encontrado',
          statusCode: 404
        });
      }

      const exceptionId = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const exception = {
        date,
        type,
        specialHours: type === 'special_hours' ? specialHours : undefined,
        reason,
        recurring: recurring || false,
        createdAt: new Date()
      };

      // Store exception in provider's metadata
      const exceptions = (provider.workingHours as any)?.exceptions || {};
      exceptions[exceptionId] = exception;

      await fastify.prisma.provider.update({
        where: { id: providerId },
        data: {
          workingHours: {
            ...(provider.workingHours as any),
            exceptions
          }
        }
      });

      // Cancel affected bookings if the day is now closed
      if (type === 'closed') {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const affectedBookings = await fastify.prisma.booking.findMany({
          where: {
            providerId,
            startTime: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        });

        // Cancel affected bookings
        for (const booking of affectedBookings) {
          await fastify.prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancelReason: `Proveedor cerrado por ${reason || 'motivos especiales'}`
            }
          });
        }

        // Broadcast cancellations
        for (const booking of affectedBookings) {
          await socketService.broadcastBookingUpdate({
            bookingId: booking.id,
            action: 'cancelled',
            booking,
            timestamp: new Date()
          });
        }
      }

      // Broadcast schedule exception update
      await socketService.broadcastScheduleUpdate(providerId, {
        ...(provider.workingHours as any),
        exceptions
      });

      return {
        success: true,
        exceptionId,
        exception,
        affectedBookingsCount: type === 'closed' ? (await fastify.prisma.booking.count({
          where: {
            providerId,
            startTime: {
              gte: new Date(date + 'T00:00:00'),
              lte: new Date(date + 'T23:59:59')
            },
            status: 'CANCELLED'
          }
        })) : 0,
        message: 'Excepción de horario agregada exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error adding schedule exception:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * PUT /schedule/:providerId/bulk-update
   * Bulk update working hours for multiple days/weeks
   */
  fastify.put('/schedule/:providerId/bulk-update', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Bulk update working hours for multiple days',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['operation'],
        properties: {
          operation: { type: 'string', enum: ['apply_template', 'set_hours', 'add_breaks'] },
          templateId: { type: 'string' },
          days: {
            type: 'array',
            items: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
          },
          workingHours: {
            type: 'object',
            properties: {
              openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              breaks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                    end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { operation, templateId, days, workingHours } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para modificar horarios',
          statusCode: 403
        });
      }

      const provider = await fastify.prisma.provider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Proveedor no encontrado',
          statusCode: 404
        });
      }

      let currentWorkingHours = (provider.workingHours as WorkingHours) || {};
      let updateSource: any = {};

      switch (operation) {
        case 'apply_template':
          if (!templateId) {
            return reply.code(400).send({
              error: 'Bad Request',
              message: 'templateId es requerido para apply_template',
              statusCode: 400
            });
          }
          
          const templates = (provider.workingHours as any)?.templates || {};
          const template = templates[templateId];
          
          if (!template) {
            return reply.code(404).send({
              error: 'Not Found',
              message: 'Plantilla no encontrada',
              statusCode: 404
            });
          }
          
          updateSource = template.workingHours;
          break;

        case 'set_hours':
        case 'add_breaks':
          if (!workingHours) {
            return reply.code(400).send({
              error: 'Bad Request',
              message: 'workingHours es requerido',
              statusCode: 400
            });
          }
          updateSource = workingHours;
          break;
      }

      // Apply changes to specified days
      const targetDays = days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of targetDays) {
        if (operation === 'add_breaks' && currentWorkingHours[day]) {
          // Add breaks to existing schedule
          currentWorkingHours[day] = {
            ...currentWorkingHours[day],
            breaks: [
              ...(currentWorkingHours[day].breaks || []),
              ...(updateSource.breaks || [])
            ]
          };
        } else {
          // Replace or set hours
          currentWorkingHours[day] = {
            ...currentWorkingHours[day],
            ...updateSource,
            isOpen: updateSource.openTime ? true : (currentWorkingHours[day]?.isOpen || false)
          };
        }
      }

      const updatedProvider = await fastify.prisma.provider.update({
        where: { id: providerId },
        data: {
          workingHours: currentWorkingHours,
          updatedAt: new Date()
        }
      });

      // Broadcast bulk schedule update
      await socketService.broadcastScheduleUpdate(providerId, currentWorkingHours);

      return {
        success: true,
        providerId,
        operation,
        affectedDays: targetDays,
        workingHours: updatedProvider.workingHours,
        message: `Horarios actualizados para ${targetDays.length} días`
      };

    } catch (error) {
      fastify.log.error('Error bulk updating schedule:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /schedule/:providerId/conflicts/validate
   * Validate schedule changes against existing bookings
   */
  fastify.post('/schedule/:providerId/conflicts/validate', {
    schema: {
      tags: ['Provider Schedule'],
      description: 'Validate proposed schedule changes against existing bookings',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['proposedSchedule'],
        properties: {
          proposedSchedule: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                isOpen: { type: 'boolean' },
                openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                breaks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                      end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                    }
                  }
                }
              }
            }
          },
          dateRange: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date' },
              to: { type: 'string', format: 'date' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { proposedSchedule, dateRange } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para validar horarios',
          statusCode: 403
        });
      }

      const fromDate = dateRange?.from ? new Date(dateRange.from) : new Date();
      const toDate = dateRange?.to ? new Date(dateRange.to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Get all existing bookings in the date range
      const existingBookings = await fastify.prisma.booking.findMany({
        where: {
          providerId,
          startTime: {
            gte: fromDate,
            lte: toDate
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          client: {
            select: { name: true, email: true }
          },
          service: {
            select: { name: true }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      const conflicts: any[] = [];

      // Check each booking against the proposed schedule
      for (const booking of existingBookings) {
        const bookingDate = new Date(booking.startTime);
        const dayKey = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const proposedDaySchedule = proposedSchedule[dayKey];

        if (!proposedDaySchedule || !proposedDaySchedule.isOpen) {
          // Day is closed in proposed schedule
          conflicts.push({
            type: 'day_closed',
            bookingId: booking.id,
            clientName: booking.client.name,
            serviceName: booking.service.name,
            startTime: booking.startTime,
            endTime: booking.endTime,
            message: `Cliente ${booking.client.name} tiene reserva cuando el día estará cerrado`
          });
          continue;
        }

        // Check if booking is within proposed working hours
        const bookingStart = bookingDate.toTimeString().substr(0, 5);
        const bookingEnd = new Date(booking.endTime).toTimeString().substr(0, 5);
        
        if (bookingStart < proposedDaySchedule.openTime || bookingEnd > proposedDaySchedule.closeTime) {
          conflicts.push({
            type: 'outside_hours',
            bookingId: booking.id,
            clientName: booking.client.name,
            serviceName: booking.service.name,
            startTime: booking.startTime,
            endTime: booking.endTime,
            proposedHours: `${proposedDaySchedule.openTime} - ${proposedDaySchedule.closeTime}`,
            message: `Reserva de ${booking.client.name} está fuera del horario propuesto`
          });
        }

        // Check if booking conflicts with proposed breaks
        if (proposedDaySchedule.breaks) {
          for (const breakTime of proposedDaySchedule.breaks) {
            if (bookingStart < breakTime.end && bookingEnd > breakTime.start) {
              conflicts.push({
                type: 'break_conflict',
                bookingId: booking.id,
                clientName: booking.client.name,
                serviceName: booking.service.name,
                startTime: booking.startTime,
                endTime: booking.endTime,
                breakTime: `${breakTime.start} - ${breakTime.end}`,
                message: `Reserva de ${booking.client.name} se superpone con descanso propuesto`
              });
            }
          }
        }
      }

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflictsCount: conflicts.length,
        conflicts,
        totalBookingsChecked: existingBookings.length,
        dateRange: {
          from: fromDate,
          to: toDate
        },
        canApplyChanges: conflicts.length === 0
      };

    } catch (error) {
      fastify.log.error('Error validating schedule conflicts:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });
}

/**
 * Utility function to validate working hours format
 */
function validateWorkingHours(workingHours: WorkingHours): string[] {
  const errors: string[] = [];
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const [day, schedule] of Object.entries(workingHours)) {
    if (!validDays.includes(day)) {
      errors.push(`Día inválido: ${day}`);
      continue;
    }

    if (schedule.isOpen) {
      if (!schedule.openTime || !schedule.closeTime) {
        errors.push(`${day}: horarios de apertura y cierre son requeridos`);
        continue;
      }

      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(schedule.openTime)) {
        errors.push(`${day}: formato de hora de apertura inválido`);
      }
      if (!timeRegex.test(schedule.closeTime)) {
        errors.push(`${day}: formato de hora de cierre inválido`);
      }

      // Validate that close time is after open time
      if (schedule.openTime >= schedule.closeTime) {
        errors.push(`${day}: hora de cierre debe ser posterior a la de apertura`);
      }

      // Validate breaks
      if (schedule.breaks) {
        for (const [index, breakTime] of schedule.breaks.entries()) {
          if (!timeRegex.test(breakTime.start) || !timeRegex.test(breakTime.end)) {
            errors.push(`${day}: formato de tiempo de descanso ${index + 1} inválido`);
          }
          if (breakTime.start >= breakTime.end) {
            errors.push(`${day}: fin de descanso ${index + 1} debe ser posterior al inicio`);
          }
          if (breakTime.start < schedule.openTime || breakTime.end > schedule.closeTime) {
            errors.push(`${day}: descanso ${index + 1} debe estar dentro del horario de trabajo`);
          }
        }
      }
    }
  }

  return errors;
}