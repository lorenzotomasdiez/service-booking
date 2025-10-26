import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { prisma } from './database';
import { UserRole } from '@prisma/client';
import { validateDNI, validatePhone, validateCUIT, formatPhone, formatDNI, formatCUIT } from '../schemas/argentina';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  dni?: string;
  cuit?: string;
  birthDate?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UpdateProfileData {
  name?: string;
  phone?: string;
  dni?: string;
  cuit?: string;
  birthDate?: string;
  timezone?: string;
  locale?: string;
}

export class AuthService {
  private fastify: FastifyInstance;
  private saltRounds: number;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userId: string, role: UserRole, rememberMe: boolean = false) {
    const expiresIn = rememberMe ? '30d' : '7d';
    const refreshExpiresIn = rememberMe ? '90d' : '30d';

    const accessToken = this.fastify.jwt.sign(
      { userId, role },
      { expiresIn }
    );

    const refreshToken = this.fastify.jwt.sign(
      { userId, type: 'refresh' },
      { expiresIn: refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // milliseconds
    };
  }

  async validateRegistrationData(data: RegisterData): Promise<string[]> {
    const errors: string[] = [];

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      errors.push('El email ya está registrado');
    }

    // Validate phone if provided
    if (data.phone && !validatePhone(data.phone)) {
      errors.push('Formato de teléfono inválido. Use formato argentino (+54-11-xxxx-xxxx)');
    }

    // Check if phone is already registered
    if (data.phone) {
      const formattedPhone = formatPhone(data.phone);
      const existingPhone = await prisma.user.findUnique({
        where: { phone: formattedPhone }
      });
      if (existingPhone) {
        errors.push('El teléfono ya está registrado');
      }
    }

    // Validate DNI if provided
    if (data.dni && !validateDNI(data.dni)) {
      errors.push('Formato de DNI inválido. Use 8 dígitos (ej: 12345678)');
    }

    // Check if DNI is already registered
    if (data.dni) {
      const formattedDNI = formatDNI(data.dni);
      const existingDNI = await prisma.user.findUnique({
        where: { dni: formattedDNI }
      });
      if (existingDNI) {
        errors.push('El DNI ya está registrado');
      }
    }

    // Validate CUIT if provided
    if (data.cuit && !validateCUIT(data.cuit)) {
      errors.push('Formato de CUIT inválido. Use formato XX-XXXXXXXX-X');
    }

    // Check if CUIT is already registered
    if (data.cuit) {
      const formattedCUIT = formatCUIT(data.cuit);
      const existingCUIT = await prisma.user.findUnique({
        where: { cuit: formattedCUIT }
      });
      if (existingCUIT) {
        errors.push('El CUIT ya está registrado');
      }
    }

    // Validate birth date
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.push('Debe tener al menos 13 años para registrarse');
      }
      
      if (age > 120) {
        errors.push('Fecha de nacimiento inválida');
      }
    }

    return errors;
  }

  async register(data: RegisterData) {
    // Validate registration data
    const validationErrors = await this.validateRegistrationData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Format Argentina-specific fields
    const userData = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: data.phone ? formatPhone(data.phone) : null,
      role: data.role || UserRole.CLIENT,
      dni: data.dni ? formatDNI(data.dni) : null,
      cuit: data.cuit ? formatCUIT(data.cuit) : null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      timezone: 'America/Argentina/Buenos_Aires',
      locale: 'es-AR'
    };

    // Create user (isVerified defaults to false per schema)
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        authMethod: true,
        emailVerifiedAt: true,
        dni: true,
        cuit: true,
        timezone: true,
        locale: true,
        avatar: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn)
      }
    });

    return {
      user,
      ...tokens
    };
  }

  async login(data: LoginData) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { 
        email: data.email.toLowerCase().trim() 
      }
    });

    if (!user) {
      throw new Error('Email o contraseña incorrectos');
    }

    if (!user.isActive) {
      throw new Error('Cuenta desactivada. Contacte al soporte');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role, data.rememberMe);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn)
      }
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      dni: user.dni,
      cuit: user.cuit,
      timezone: user.timezone,
      locale: user.locale,
      avatar: user.avatar,
      birthDate: user.birthDate?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };

    return {
      user: userResponse,
      ...tokens
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.fastify.jwt.verify(refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      // Check if refresh token exists and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new Error('Token de actualización inválido o expirado');
      }

      if (!storedToken.user.isActive) {
        throw new Error('Cuenta desactivada');
      }

      // Generate new tokens
      const tokens = this.generateTokens(storedToken.user.id, storedToken.user.role);

      // Revoke old refresh token and create new one
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { isRevoked: true }
        }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.user.id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + tokens.expiresIn)
          }
        })
      ]);

      return tokens;
    } catch (error) {
      throw new Error('Token de actualización inválido');
    }
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const errors: string[] = [];

    // Validate phone if provided
    if (data.phone && !validatePhone(data.phone)) {
      errors.push('Formato de teléfono inválido');
    }

    // Validate DNI if provided
    if (data.dni && !validateDNI(data.dni)) {
      errors.push('Formato de DNI inválido');
    }

    // Validate CUIT if provided
    if (data.cuit && !validateCUIT(data.cuit)) {
      errors.push('Formato de CUIT inválido');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    // Check for unique constraints
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name.trim();
    if (data.phone) updateData.phone = formatPhone(data.phone);
    if (data.dni) updateData.dni = formatDNI(data.dni);
    if (data.cuit) updateData.cuit = formatCUIT(data.cuit);
    if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
    if (data.timezone) updateData.timezone = data.timezone;
    if (data.locale) updateData.locale = data.locale;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        dni: true,
        cuit: true,
        timezone: true,
        locale: true,
        avatar: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      ...user,
      birthDate: user.birthDate?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  async logout(refreshToken: string) {
    try {
      await prisma.refreshToken.updateMany({
        where: { 
          token: refreshToken,
          isRevoked: false 
        },
        data: { isRevoked: true }
      });
    } catch (error) {
      // Silently fail - token might already be revoked or invalid
    }
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { 
        userId,
        isRevoked: false 
      },
      data: { isRevoked: true }
    });
  }
}