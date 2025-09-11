// Authentication API functions
import { z } from 'zod';
import { apiClient, type ApiResponse } from './client';

// Validation schemas
export const loginSchema = z.object({
	email: z.string().email('Ingresa un email válido'),
	password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
	rememberMe: z.boolean().optional()
});

export const registerSchema = z.object({
	email: z.string().email('Ingresa un email válido'),
	password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
	confirmPassword: z.string(),
	firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
	lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
	phone: z.string().min(10, 'Ingresa un número de teléfono válido'),
	role: z.enum(['client', 'provider'], { required_error: 'Selecciona un tipo de cuenta' }),
	acceptTerms: z.boolean().refine((val) => val === true, 'Debes aceptar los términos y condiciones')
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
	email: z.string().email('Ingresa un email válido')
});

export const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmPassword']
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	role: 'client' | 'provider';
	avatar?: string;
	isEmailVerified: boolean;
	isPhoneVerified: boolean;
	isProfileComplete: boolean;
	createdAt: string;
	updatedAt: string;
	profile?: UserProfile;
}

export interface UserProfile {
	bio?: string;
	location?: {
		address: string;
		city: string;
		state: string;
		postalCode: string;
		latitude?: number;
		longitude?: number;
	};
	socialMedia?: {
		instagram?: string;
		facebook?: string;
		whatsapp?: string;
	};
	workingHours?: {
		[key: string]: {
			isOpen: boolean;
			openTime: string;
			closeTime: string;
			breakStart?: string;
			breakEnd?: string;
		};
	};
	services?: string[];
	specialties?: string[];
	experience?: number;
	portfolio?: string[];
}

export interface AuthResponse {
	user: User;
	token: string;
	refreshToken: string;
	expiresIn: number;
}

// API functions
export const authApi = {
	async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
		return apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
	},

	async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
		return apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
	},

	async logout(): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/auth/logout');
	},

	async refreshToken(): Promise<ApiResponse<AuthResponse>> {
		return apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
	},

	async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/auth/forgot-password', data);
	},

	async resetPassword(data: ResetPasswordData): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/auth/reset-password', data);
	},

	async verifyEmail(token: string): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/auth/verify-email', { token });
	},

	async resendEmailVerification(): Promise<ApiResponse<null>> {
		return apiClient.post<ApiResponse<null>>('/auth/resend-verification');
	},

	async me(): Promise<ApiResponse<User>> {
		return apiClient.get<ApiResponse<User>>('/auth/me');
	},

	async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<User>> {
		return apiClient.patch<ApiResponse<User>>('/auth/profile', data);
	},

	async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
		return apiClient.patch<ApiResponse<null>>('/auth/password', data);
	},

	async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
		return apiClient.upload<ApiResponse<{ avatarUrl: string }>>('/auth/avatar', file);
	},

	async deleteAccount(): Promise<ApiResponse<null>> {
		return apiClient.delete<ApiResponse<null>>('/auth/account');
	}
};