// API Client for BarberPro
// Handles all HTTP communication with the backend
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import Cookies from 'js-cookie';

export interface ApiError {
	message: string;
	code: string;
	status: number;
	errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

class ApiClient {
	private baseUrl: string;

	constructor() {
		this.baseUrl = env.PUBLIC_API_URL || 'http://localhost:3000/api';

		// Log API base URL in development for debugging
		if (dev && browser) {
			console.log('[ApiClient] Initialized with base URL:', this.baseUrl);
		}
	}

	private getAuthToken(): string | null {
		if (!browser) return null;
		return Cookies.get('auth_token') || localStorage.getItem('auth_token');
	}

	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		};

		const token = this.getAuthToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		return headers;
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type');
		const isJson = contentType?.includes('application/json');

		let data: any;
		try {
			if (isJson) {
				data = await response.json();
			} else {
				data = await response.text();
			}
		} catch (parseError) {
			console.error('[ApiClient] Failed to parse response:', parseError);
			data = { message: 'Error de respuesta del servidor' };
		}

		if (!response.ok) {
			const error: ApiError = {
				message: data.message || 'Ha ocurrido un error',
				code: data.code || 'UNKNOWN_ERROR',
				status: response.status,
				errors: data.errors || {}
			};

			// Log API errors in development for debugging
			if (dev) {
				console.error('[ApiClient] API Error:', {
					url: response.url,
					status: response.status,
					statusText: response.statusText,
					error: data,
					timestamp: new Date().toISOString()
				});
			}

			throw error;
		}

		return data;
	}

	async get<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'GET',
			headers: this.getHeaders()
		});

		return this.handleResponse<T>(response);
	}

	async post<T>(endpoint: string, data?: any): Promise<T> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: data ? JSON.stringify(data) : undefined
			});

			return this.handleResponse<T>(response);
		} catch (networkError: any) {
			// Handle network errors (connection issues, CORS, etc.)
			if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
				throw {
					message: 'Error de conexión. Verifica tu conexión a internet.',
					code: 'NETWORK_ERROR',
					status: 0
				} as ApiError;
			}
			throw networkError;
		}
	}

	async put<T>(endpoint: string, data?: any): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'PUT',
			headers: this.getHeaders(),
			body: data ? JSON.stringify(data) : undefined
		});

		return this.handleResponse<T>(response);
	}

	async patch<T>(endpoint: string, data?: any): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'PATCH',
			headers: this.getHeaders(),
			body: data ? JSON.stringify(data) : undefined
		});

		return this.handleResponse<T>(response);
	}

	async delete<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'DELETE',
			headers: this.getHeaders()
		});

		return this.handleResponse<T>(response);
	}

	async upload<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
		const formData = new FormData();
		formData.append('file', file);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, value);
			});
		}

		const headers: Record<string, string> = {};
		const token = this.getAuthToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'POST',
			headers,
			body: formData
		});

		return this.handleResponse<T>(response);
	}
}

export const apiClient = new ApiClient();