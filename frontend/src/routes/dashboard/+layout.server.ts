import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const token = cookies.get('auth_token');
	
	// If no token, redirect to login
	if (!token) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// We'll validate the token on the client side in the layout component
	return {};
};