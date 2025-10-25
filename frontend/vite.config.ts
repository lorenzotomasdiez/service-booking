import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		host: '0.0.0.0', // Listen on all interfaces for Docker accessibility
		// Allow connections from Docker containers
		strictPort: false,
		// Enable CORS for Docker networking
		cors: true,
		// HMR configuration for hot module replacement in Docker
		hmr: {
			// Use localhost for HMR communication
			protocol: 'ws',
			host: 'localhost',
			port: 5173
		}
	},
	// Performance optimizations for Argentina mobile users
	build: {
		// Split chunks for better caching
		rollupOptions: {
			output: {
				// Optimize chunk naming for caching
				chunkFileNames: 'chunks/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash][extname]'
			}
		},
		// Optimize bundle size for Argentina mobile networks
		target: 'es2018',
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.logs in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info']
			},
			mangle: {
				safari10: true // Support for older mobile browsers
			},
			format: {
				comments: false
			}
		},
		// Enable source maps for production debugging
		sourcemap: true,
		// Optimize chunk size for mobile
		chunkSizeWarningLimit: 500 // 500kb chunks max for mobile
	},
	// Dependency optimization
	optimizeDeps: {
		include: [
			'svelte/transition',
			'svelte/easing',
			'svelte/motion',
			'socket.io-client',
			'mercadopago'
		],
		exclude: ['@fontsource/fira-mono', '@fontsource/inter', '@fontsource/poppins']
	},
	// Preview optimization for development
	preview: {
		port: 4173,
		host: true,
		headers: {
			'Cache-Control': 'public, max-age=600' // 10 minutes cache for preview
		}
	},
	// CSS optimization
	css: {
		devSourcemap: true
	},
	// Define global constants for optimization flags
	define: {
		__ARGENTINA_MOBILE_OPTIMIZED__: true,
		__REAL_TIME_FEATURES__: true
	}
});