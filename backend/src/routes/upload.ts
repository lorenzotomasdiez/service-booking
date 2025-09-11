import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { UserRole } from '@prisma/client';
import { uploadService } from '../services/upload';
import { userService } from '../services/user';

const uploadRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

  // Upload profile image
  fastify.post('/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Upload'],
      summary: 'Upload profile image',
      description: 'Upload and process user profile image',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                url: { type: 'string' },
                thumbnailUrl: { type: 'string' },
                size: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      
      // Get uploaded file
      const data = await request.file();
      if (!data) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'No se encontró ningún archivo',
          statusCode: 400
        });
        return;
      }

      // Upload and process image
      const result = await uploadService.uploadProfileImage(data);

      // Update user avatar in database
      await userService.updateUser(currentUser.id, {
        avatar: result.url
      });

      reply.send({
        success: true,
        data: {
          filename: result.filename,
          url: result.url,
          thumbnailUrl: uploadService.getThumbnailUrl(result.filename),
          size: result.size,
          width: result.width,
          height: result.height
        }
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof Error && error.message.includes('Archivo')) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }

      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Upload service images
  fastify.post('/service/:serviceId', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Upload'],
      summary: 'Upload service images',
      description: 'Upload images for a service (provider or admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          serviceId: { type: 'string' }
        },
        required: ['serviceId']
      },
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                uploaded: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      url: { type: 'string' },
                      thumbnailUrl: { type: 'string' },
                      size: { type: 'number' },
                      width: { type: 'number' },
                      height: { type: 'number' }
                    }
                  }
                },
                serviceId: { type: 'string' },
                totalImages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { serviceId: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { serviceId } = request.params;

      // Check if user can upload images for this service
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo proveedores y administradores pueden subir imágenes de servicios',
          statusCode: 403
        });
        return;
      }

      // Get uploaded files
      const files = request.files();
      const uploadedFiles: MultipartFile[] = [];

      for await (const file of files) {
        uploadedFiles.push(file);
      }

      if (uploadedFiles.length === 0) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'No se encontraron archivos para subir',
          statusCode: 400
        });
        return;
      }

      // Limit number of files
      if (uploadedFiles.length > 10) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Máximo 10 imágenes permitidas por vez',
          statusCode: 400
        });
        return;
      }

      // Upload all images
      const results = await uploadService.uploadMultipleImages(uploadedFiles, 'service');

      // TODO: Update service images in database
      // This would require implementing the service update logic

      const responseData = results.map(result => ({
        filename: result.filename,
        url: result.url,
        thumbnailUrl: uploadService.getThumbnailUrl(result.filename),
        size: result.size,
        width: result.width,
        height: result.height
      }));

      reply.send({
        success: true,
        data: {
          uploaded: responseData,
          serviceId,
          totalImages: results.length
        }
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof Error && error.message.includes('Archivo')) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }

      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Delete uploaded file
  fastify.delete('/:type/:filename', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Upload'],
      summary: 'Delete uploaded file',
      description: 'Delete an uploaded file (owner or admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['avatars', 'services'] },
          filename: { type: 'string' }
        },
        required: ['type', 'filename']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { type: string; filename: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { type, filename } = request.params;

      // TODO: Add ownership verification
      // For now, only admins can delete files
      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden eliminar archivos',
          statusCode: 403
        });
        return;
      }

      const filePath = `${type}/${filename}`;
      await uploadService.deleteFile(filePath);

      reply.send({
        success: true,
        data: {
          message: 'Archivo eliminado correctamente'
        }
      });

    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get image metadata
  fastify.get('/metadata/:type/:filename', {
    schema: {
      tags: ['Upload'],
      summary: 'Get image metadata',
      description: 'Get metadata for an uploaded image',
      params: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['avatars', 'services', 'thumbnails'] },
          filename: { type: 'string' }
        },
        required: ['type', 'filename']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                width: { type: 'number' },
                height: { type: 'number' },
                size: { type: 'number' },
                url: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { type: string; filename: string } }>, reply: FastifyReply) => {
    try {
      const { type, filename } = request.params;
      const filePath = `${type}/${filename}`;
      
      const metadata = await uploadService.getImageMetadata(filePath);
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

      reply.send({
        success: true,
        data: {
          filename,
          width: metadata.width,
          height: metadata.height,
          size: metadata.size,
          url: `${baseUrl}/uploads/${filePath}`
        }
      });

    } catch (error) {
      fastify.log.error(error);
      reply.code(404).send({
        error: 'Not Found',
        message: 'Archivo no encontrado',
        statusCode: 404
      });
    }
  });
};

export default uploadRoutes;