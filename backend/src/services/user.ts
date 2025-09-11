import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { database } from './database';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = database.prisma;
  }

  // Create new user
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    dni?: string;
    cuit?: string;
    timezone?: string;
    locale?: string;
    avatar?: string;
    birthDate?: Date;
  }): Promise<Omit<User, 'password'>> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        timezone: data.timezone || 'America/Argentina/Buenos_Aires',
        locale: data.locale || 'es-AR',
        role: data.role || UserRole.CLIENT
      }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by ID
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            services: true
          }
        },
        clientBookings: {
          include: {
            service: true,
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 10 // Last 10 bookings
        }
      }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  // Get user by phone
  async getUserByPhone(phone: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by DNI
  async getUserByDNI(dni: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { dni }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user
  async updateUser(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    dni: string;
    cuit: string;
    timezone: string;
    locale: string;
    avatar: string;
    birthDate: Date;
    isActive: boolean;
    isVerified: boolean;
  }>): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.update({
      where: { id },
      data
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user password
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword }
    });

    return true;
  }

  // List users with pagination and filters
  async listUsers(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    isVerified?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
        updatedAt: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            isVerified: true
          }
        }
      }
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Soft delete user (deactivate)
  async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Reactivate user
  async reactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true }
    });
  }

  // Hard delete user (admin only - be careful!)
  async deleteUser(id: string): Promise<void> {
    // This will cascade delete related data due to foreign key constraints
    await this.prisma.user.delete({
      where: { id }
    });
  }

  // Verify user email
  async verifyUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isVerified: true }
    });
  }

  // Get user statistics (admin only)
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    verified: number;
    active: number;
    registeredThisMonth: number;
    registeredToday: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      total,
      clients,
      providers,
      admins,
      verified,
      active,
      registeredThisMonth,
      registeredToday
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CLIENT } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay
          }
        }
      })
    ]);

    return {
      total,
      byRole: {
        [UserRole.CLIENT]: clients,
        [UserRole.PROVIDER]: providers,
        [UserRole.ADMIN]: admins
      },
      verified,
      active,
      registeredThisMonth,
      registeredToday
    };
  }

  // Check if email is available
  async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email };
    
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    const existingUser = await this.prisma.user.findFirst({ where });
    return !existingUser;
  }

  // Check if phone is available
  async isPhoneAvailable(phone: string, excludeUserId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { phone };
    
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    const existingUser = await this.prisma.user.findFirst({ where });
    return !existingUser;
  }

  // Check if DNI is available
  async isDNIAvailable(dni: string, excludeUserId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { dni };
    
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    const existingUser = await this.prisma.user.findFirst({ where });
    return !existingUser;
  }

  // Update user preferences
  async updateUserPreferences(id: string, preferences: {
    timezone?: string;
    locale?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      bookingReminders?: boolean;
      promotions?: boolean;
    };
    privacy?: {
      showProfile?: boolean;
      showReviews?: boolean;
      allowDirectMessages?: boolean;
    };
  }): Promise<Omit<User, 'password'>> {
    // For now, we'll store preferences in a JSON field or separate table
    // Since the current schema doesn't have a preferences table, 
    // we'll update the user's timezone and locale directly
    const updateData: any = {};
    
    if (preferences.timezone) updateData.timezone = preferences.timezone;
    if (preferences.locale) updateData.locale = preferences.locale;
    
    // TODO: Add preferences table to store detailed preferences
    // For now, we'll just update what we can in the user table
    
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user role
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { role }
    });
  }

  // Advanced user search
  async searchUsers(options: {
    q?: string;
    role?: UserRole;
    city?: string;
    province?: string;
    isActive?: boolean;
    isVerified?: boolean;
    hasProvider?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      q,
      role,
      city,
      province,
      isActive,
      isVerified,
      hasProvider,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    
    if (hasProvider !== undefined) {
      if (hasProvider) {
        where.provider = { isNot: null };
      } else {
        where.provider = null;
      }
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { dni: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Location filters (for providers)
    if (city || province) {
      const providerFilter: any = {};
      if (city) providerFilter.city = { contains: city, mode: 'insensitive' };
      if (province) providerFilter.province = { contains: province, mode: 'insensitive' };
      
      if (where.provider) {
        where.provider = { ...where.provider, ...providerFilter };
      } else {
        where.provider = providerFilter;
      }
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true,
            isVerified: true,
            isActive: true
          }
        }
      }
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get user activity log
  async getUserActivity(userId: string, options: {
    page?: number;
    limit?: number;
    action?: string;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      action,
      fromDate,
      toDate
    } = options;

    // For now, we'll return booking history as activity
    // In a real application, you'd have an activity/audit log table
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { clientId: userId },
        { providerId: userId }
      ]
    };

    if (fromDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(fromDate)
      };
    }

    if (toDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(toDate)
      };
    }

    const total = await this.prisma.booking.count({ where });

    const bookings = await this.prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
            price: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        provider: {
          select: {
            businessName: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Transform bookings into activity format
    const activities = bookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      action: `Booking ${booking.status.toLowerCase()}`,
      description: `${booking.service.name} - ${booking.status}`,
      timestamp: booking.createdAt,
      metadata: {
        serviceId: booking.serviceId,
        serviceName: booking.service.name,
        status: booking.status,
        totalAmount: booking.totalAmount,
        startTime: booking.startTime
      }
    }));

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

// Export singleton instance
export const userService = new UserService();