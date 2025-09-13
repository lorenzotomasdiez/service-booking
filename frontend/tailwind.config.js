/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/app.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Main brand color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // Argentine gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006'
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Success/verified color
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // Warning/pending color
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Error/danger color
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Default text color
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Dark text color
          900: '#0f172a',
          950: '#020617'
        },
        // Argentina-specific colors
        argentina: {
          sky: '#74c0fc',
          sun: '#ffd43b',
          flag: '#0077be'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        // Argentina mobile-specific breakpoints
        'argentina-mobile': '360px',
        'argentina-tablet': '768px'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 8px 30px -5px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-lg': '0 0 40px rgba(37, 99, 235, 0.4)'
      },
      backdropBlur: {
        xs: '2px'
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }]
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16'
      },
      // Argentina-specific utilities
      scale: {
        '102': '1.02',
        '103': '1.03'
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms'
      },
      blur: {
        '2xs': '1px'
      }
    }
  },
  plugins: [
    // Custom plugin for Argentina-specific utilities
    function({ addUtilities, addComponents, theme }) {
      // Argentina mobile touch optimizations
      addUtilities({
        '.touch-optimization': {
          '-webkit-tap-highlight-color': 'transparent',
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          'user-select': 'none',
          'touch-action': 'manipulation'
        },
        '.argentina-safe-area': {
          'padding-top': 'max(1rem, env(safe-area-inset-top))',
          'padding-bottom': 'max(1rem, env(safe-area-inset-bottom))',
          'padding-left': 'max(1rem, env(safe-area-inset-left))',
          'padding-right': 'max(1rem, env(safe-area-inset-right))'
        },
        '.peso-format': {
          'font-variant-numeric': 'tabular-nums',
          'text-align': 'right'
        },
        '.dni-format': {
          'letter-spacing': '0.1em',
          'font-variant-numeric': 'tabular-nums'
        },
        '.phone-format': {
          'letter-spacing': '0.05em',
          'font-variant-numeric': 'tabular-nums'
        }
      });

      // Argentina-specific components
      addComponents({
        '.btn-argentina': {
          'background': `linear-gradient(135deg, ${theme('colors.argentina.sky')} 0%, ${theme('colors.argentina.flag')} 100%)`,
          'color': 'white',
          'border': 'none',
          'padding': '0.75rem 1.5rem',
          'border-radius': '0.5rem',
          'font-weight': '600',
          'transition': 'all 0.2s ease-in-out',
          '&:hover': {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 12px rgba(0, 119, 190, 0.3)'
          }
        },
        '.card-argentina': {
          'background': 'white',
          'border-radius': '1rem',
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'border': `1px solid ${theme('colors.neutral.200')}`,
          'overflow': 'hidden',
          'transition': 'all 0.2s ease-in-out',
          '&:hover': {
            'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        },
        '.form-argentina': {
          '.form-input': {
            'min-height': '48px',
            'border-radius': '0.5rem',
            'border': `1px solid ${theme('colors.neutral.300')}`,
            'padding': '0.75rem 1rem',
            'transition': 'all 0.2s ease-in-out',
            '&:focus': {
              'border-color': theme('colors.primary.500'),
              'box-shadow': `0 0 0 3px ${theme('colors.primary.100')}`
            }
          },
          '.form-label': {
            'font-weight': '500',
            'color': theme('colors.neutral.700'),
            'margin-bottom': '0.5rem',
            'display': 'block'
          },
          '.form-error': {
            'color': theme('colors.error.600'),
            'font-size': '0.875rem',
            'margin-top': '0.25rem'
          }
        }
      });
    }
  ]
};