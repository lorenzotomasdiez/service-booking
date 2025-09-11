// Authentication Store for BarberPro
// Manages user authentication state and tokens
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import Cookies from 'js-cookie';
import { authApi, type User, type AuthResponse } from '$lib/api/auth';

export interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: false,
	error: null
};

// Create the auth store
function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Initialize auth state from storage
	const initializeAuth = async () => {
		if (!browser) return;

		update(state => ({ ...state, isLoading: true }));

		try {
			const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
			
			if (token) {
				// Verify token and get user data
				const response = await authApi.me();
				
				if (response.success && response.data) {
					update(state => ({
						...state,
						user: response.data,
						token,
						isAuthenticated: true,
						isLoading: false,
						error: null
					}));
				} else {
					// Token is invalid, clear it
					clearAuth();
				}
			} else {
				update(state => ({ ...state, isLoading: false }));
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
			clearAuth();
		}
	};

	// Login function
	const login = async (email: string, password: string, rememberMe: boolean = false) => {
		update(state => ({ ...state, isLoading: true, error: null }));

		try {
			const response = await authApi.login({ email, password, rememberMe });

			if (response.success && response.data) {
				const { user, token, expiresIn } = response.data;

				// Store token based on remember me preference
				if (rememberMe) {
					const expirationDate = new Date(Date.now() + expiresIn * 1000);
					Cookies.set('auth_token', token, { expires: expirationDate, secure: true, sameSite: 'lax' });
				} else {
					Cookies.set('auth_token', token, { secure: true, sameSite: 'lax' });
					localStorage.setItem('auth_token', token);
				}

				update(state => ({
					...state,
					user,
					token,
					isAuthenticated: true,
					isLoading: false,
					error: null
				}));

				// Redirect based on user role
				const redirectPath = user.role === 'provider' ? '/dashboard/provider' : '/dashboard/client';
				goto(redirectPath);

				return { success: true };
			}
		} catch (error: any) {
			const errorMessage = error.message || 'Error al iniciar sesión';
			update(state => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));

			return { success: false, error: errorMessage };
		}
	};

	// Register function
	const register = async (userData: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		phone: string;
		role: 'client' | 'provider';
	}) => {
		update(state => ({ ...state, isLoading: true, error: null }));

		try {
			const response = await authApi.register({
				...userData,
				confirmPassword: userData.password,
				acceptTerms: true
			});

			if (response.success && response.data) {
				const { user, token, expiresIn } = response.data;

				// Store token
				Cookies.set('auth_token', token, { secure: true, sameSite: 'lax' });
				localStorage.setItem('auth_token', token);

				update(state => ({
					...state,
					user,
					token,
					isAuthenticated: true,
					isLoading: false,
					error: null
				}));

				// Redirect to dashboard
				const redirectPath = user.role === 'provider' ? '/dashboard/provider' : '/dashboard/client';
				goto(redirectPath);

				return { success: true };
			}
		} catch (error: any) {
			const errorMessage = error.message || 'Error al registrarse';
			update(state => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));

			return { success: false, error: errorMessage, errors: error.errors };
		}
	};

	// Logout function
	const logout = async () => {
		try {
			await authApi.logout();
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			clearAuth();
			goto('/');
		}
	};

	// Clear authentication data
	const clearAuth = () => {
		if (browser) {
			Cookies.remove('auth_token');
			localStorage.removeItem('auth_token');
		}

		update(state => ({
			...state,
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
			error: null
		}));
	};

	// Update user profile
	const updateUser = (userData: Partial<User>) => {
		update(state => ({
			...state,
			user: state.user ? { ...state.user, ...userData } : null
		}));
	};

	// Clear error
	const clearError = () => {
		update(state => ({ ...state, error: null }));
	};

	// Refresh token
	const refreshToken = async () => {
		try {
			const response = await authApi.refreshToken();
			
			if (response.success && response.data) {
				const { user, token } = response.data;
				
				Cookies.set('auth_token', token, { secure: true, sameSite: 'lax' });
				localStorage.setItem('auth_token', token);

				update(state => ({
					...state,
					user,
					token,
					isAuthenticated: true
				}));

				return true;
			}
		} catch (error) {
			console.error('Token refresh error:', error);
			clearAuth();
			return false;
		}
	};

	return {
		subscribe,
		initializeAuth,
		login,
		register,
		logout,
		updateUser,
		clearError,
		refreshToken,
		clearAuth
	};
}

export const authStore = createAuthStore();

// Derived stores for common auth checks
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const authError = derived(authStore, $auth => $auth.error);
export const isProvider = derived(authStore, $auth => $auth.user?.role === 'provider');
export const isClient = derived(authStore, $auth => $auth.user?.role === 'client');