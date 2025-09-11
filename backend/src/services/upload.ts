import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface UploadResult {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  generateThumbnail?: boolean;
}

export class UploadService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'services'),
      path.join(this.uploadDir, 'thumbnails'),
      path.join(this.uploadDir, 'temp')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}${ext}`;
  }

  private validateFile(file: MultipartFile, options: UploadOptions): void {
    // Check file size
    if (options.maxFileSize && file.file.readableLength > options.maxFileSize) {
      throw new Error(`Archivo demasiado grande. Tamaño máximo: ${Math.round(options.maxFileSize / 1024 / 1024)}MB`);
    }

    // Check MIME type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${options.allowedMimeTypes.join(', ')}`);
    }

    // Security check for file extension
    const ext = path.extname(file.filename).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Extensión de archivo no permitida: ${ext}`);
    }
  }

  async uploadProfileImage(file: MultipartFile): Promise<UploadResult> {
    const options: UploadOptions = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 400,
        height: 400,
        quality: 85
      },
      generateThumbnail: true
    };

    return this.processImageUpload(file, 'avatars', options);
  }

  async uploadServiceImage(file: MultipartFile): Promise<UploadResult> {
    const options: UploadOptions = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 1200,
        height: 800,
        quality: 90
      },
      generateThumbnail: true
    };

    return this.processImageUpload(file, 'services', options);
  }

  private async processImageUpload(
    file: MultipartFile,
    subDirectory: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file, options);

    // Generate filename
    const filename = this.generateFilename(file.filename);
    const filePath = path.join(this.uploadDir, subDirectory, filename);

    // Read file buffer
    const buffer = await file.toBuffer();

    // Process image with Sharp
    let processedImage = sharp(buffer);

    // Get original metadata
    const metadata = await processedImage.metadata();

    // Apply resize if specified
    if (options.resize) {
      processedImage = processedImage.resize(
        options.resize.width,
        options.resize.height,
        {
          fit: 'cover',
          position: 'center'
        }
      );

      if (options.resize.quality) {
        processedImage = processedImage.jpeg({ quality: options.resize.quality });
      }
    }

    // Save processed image
    await processedImage.toFile(filePath);

    // Generate thumbnail if requested
    if (options.generateThumbnail) {
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(this.uploadDir, 'thumbnails', thumbnailFilename);
      
      await sharp(buffer)
        .resize(150, 150, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    }

    // Get final image metadata
    const finalMetadata = await sharp(filePath).metadata();

    return {
      filename,
      originalName: file.filename,
      url: `${this.baseUrl}/uploads/${subDirectory}/${filename}`,
      size: finalMetadata.size || 0,
      mimeType: file.mimetype,
      width: finalMetadata.width,
      height: finalMetadata.height
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);

      // Also delete thumbnail if exists
      const filename = path.basename(filePath);
      const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `thumb_${filename}`);
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('No se pudo eliminar el archivo');
    }
  }

  async uploadMultipleImages(files: MultipartFile[], type: 'profile' | 'service'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      try {
        let result: UploadResult;
        if (type === 'profile') {
          result = await this.uploadProfileImage(file);
        } else {
          result = await this.uploadServiceImage(file);
        }
        results.push(result);
      } catch (error) {
        // Log error but continue with other files
        console.error(`Error uploading file ${file.filename}:`, error);
      }
    }

    return results;
  }

  getThumbnailUrl(filename: string): string {
    const thumbnailFilename = `thumb_${filename}`;
    return `${this.baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
  }

  validateImageDimensions(width: number, height: number, maxWidth: number, maxHeight: number): boolean {
    return width <= maxWidth && height <= maxHeight;
  }

  async getImageMetadata(filePath: string): Promise<{ width: number; height: number; size: number }> {
    const fullPath = path.join(this.uploadDir, filePath);
    const metadata = await sharp(fullPath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: metadata.size || 0
    };
  }
}

// Export singleton instance
export const uploadService = new UploadService();