// Profile Management API functions
import { z } from 'zod';
import { apiClient, type ApiResponse } from './client';
import type { User, UserProfile } from './auth';

// Validation schemas for Argentina-specific requirements
export const updateProfileSchema = z.object({
	firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
	lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
	phone: z.string().regex(/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/, 'Formato de teléfono inválido (+54 9 XX XXXX-XXXX)'),
	bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
	dni: z.string().regex(/^\d{2}\.\d{3}\.\d{3}$/, 'Formato de DNI inválido (XX.XXX.XXX)').optional(),
	birthDate: z.string().optional(),
	gender: z.enum(['masculino', 'femenino', 'otro', 'prefiero_no_decir']).optional(),
	location: z.object({
		address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
		city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
		state: z.string().min(2, 'La provincia debe tener al menos 2 caracteres'),
		postalCode: z.string().regex(/^\d{4}$/, 'Código postal inválido (4 dígitos)'),
		neighborhood: z.string().optional(),
		latitude: z.number().optional(),
		longitude: z.number().optional()
	}).optional(),
	socialMedia: z.object({
		instagram: z.string().regex(/^@?[a-zA-Z0-9._]{1,30}$/, 'Usuario de Instagram inválido').optional().or(z.literal('')),
		facebook: z.string().url('URL de Facebook inválida').optional().or(z.literal('')),
		whatsapp: z.string().regex(/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/, 'Número de WhatsApp inválido').optional().or(z.literal(''))
	}).optional(),
	preferences: z.object({
		language: z.enum(['es-AR']).default('es-AR'),
		currency: z.enum(['ARS']).default('ARS'),
		timezone: z.enum(['America/Argentina/Buenos_Aires']).default('America/Argentina/Buenos_Aires'),
		emailNotifications: z.boolean().default(true),
		smsNotifications: z.boolean().default(true),
		pushNotifications: z.boolean().default(true),
		marketingEmails: z.boolean().default(false)
	}).optional()
});

export const providerProfileSchema = updateProfileSchema.extend({
	businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres').optional(),
	businessType: z.enum(['individual', 'salon', 'spa', 'clinic']).optional(),
	cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'Formato de CUIT inválido (XX-XXXXXXXX-X)').optional(),
	workingHours: z.object({
		monday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		tuesday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		wednesday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		thursday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		friday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		saturday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional(),
		sunday: z.object({
			isOpen: z.boolean(),
			openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
			breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional()
		}).optional()
	}).optional(),
	services: z.array(z.string()).optional(),
	specialties: z.array(z.string()).optional(),
	experience: z.number().min(0).max(50).optional(),
	certifications: z.array(z.string()).optional(),
	portfolio: z.array(z.string()).optional()
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
	newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
	confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmPassword']
});

// Types
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ProviderProfileData = z.infer<typeof providerProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export interface ProfileStats {
	completionPercentage: number;
	missingFields: string[];
	lastUpdated: string;
}

export interface ArgentinaLocation {
	provinces: { code: string; name: string; }[];
	cities: { [provinceCode: string]: string[]; };
}

// API functions
export const profileApi = {
	async getProfile(): Promise<ApiResponse<User>> {
		return apiClient.get<ApiResponse<User>>('/users/profile');
	},

	async updateProfile(data: UpdateProfileData | ProviderProfileData): Promise<ApiResponse<User>> {
		return apiClient.patch<ApiResponse<User>>('/users/profile', data);
	},

	async changePassword(data: ChangePasswordData): Promise<ApiResponse<null>> {
		return apiClient.patch<ApiResponse<null>>('/users/password', data);
	},

	async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
		return apiClient.upload<ApiResponse<{ avatarUrl: string }>>('/users/avatar', file);
	},

	async removeAvatar(): Promise<ApiResponse<null>> {
		return apiClient.delete<ApiResponse<null>>('/users/avatar');
	},

	async uploadPortfolioImage(file: File): Promise<ApiResponse<{ imageUrl: string }>> {
		return apiClient.upload<ApiResponse<{ imageUrl: string }>>('/users/portfolio', file);
	},

	async removePortfolioImage(imageUrl: string): Promise<ApiResponse<null>> {
		return apiClient.delete<ApiResponse<null>>(`/users/portfolio?url=${encodeURIComponent(imageUrl)}`);
	},

	async getProfileStats(): Promise<ApiResponse<ProfileStats>> {
		return apiClient.get<ApiResponse<ProfileStats>>('/users/profile/stats');
	},

	async deleteAccount(): Promise<ApiResponse<null>> {
		return apiClient.delete<ApiResponse<null>>('/users/account');
	},

	async verifyPhone(code: string): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/users/verify-phone', { code });
	},

	async sendPhoneVerification(): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/users/send-phone-verification');
	},

	// Argentina-specific data
	async getArgentinaLocations(): Promise<ApiResponse<ArgentinaLocation>> {
		return apiClient.get<ApiResponse<ArgentinaLocation>>('/data/argentina-locations');
	},

	async validateDNI(dni: string): Promise<ApiResponse<{ valid: boolean; info?: any }>> {
		return apiClient.post<ApiResponse<{ valid: boolean; info?: any }>>('/users/validate-dni', { dni });
	},

	async validateCUIT(cuit: string): Promise<ApiResponse<{ valid: boolean; info?: any }>> {
		return apiClient.post<ApiResponse<{ valid: boolean; info?: any }>>('/users/validate-cuit', { cuit });
	}
};