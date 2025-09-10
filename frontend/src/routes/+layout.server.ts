import type { LayoutServerLoad } from './$types';

export const load = (async ({ request, url }) => {
	// Get user agent for mobile detection
	const userAgent = request.headers.get('user-agent') || '';
	
	// Basic mobile detection for Argentina's mobile-first market
	const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
	
	// Argentina timezone (UTC-3)
	const timezone = 'America/Argentina/Buenos_Aires';
	
	// Language detection (Spanish for Argentina)
	const acceptLanguage = request.headers.get('accept-language') || 'es-AR';
	const locale = acceptLanguage.startsWith('es') ? 'es-AR' : 'es-AR'; // Default to Argentina Spanish
	
	return {
		device: {
			isMobile,
			userAgent
		},
		i18n: {
			locale,
			timezone
		},
		url: {
			pathname: url.pathname,
			origin: url.origin
		}
	};
}) satisfies LayoutServerLoad;