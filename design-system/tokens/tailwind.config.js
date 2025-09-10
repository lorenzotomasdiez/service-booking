/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/app.html'
  ],
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.6rem' }], // Spanish-optimized line height
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }]
      },
      spacing: {
        // Additional spacing for component layouts
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 8px 30px -5px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'primary': '0 4px 14px 0 rgba(37, 99, 235, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shake': 'shake 0.5s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        }
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Custom component utilities
    function({ addUtilities, addComponents, theme }) {
      // Button component utilities
      addComponents({
        '.btn': {
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
          fontSize: theme('fontSize.base'),
          lineHeight: theme('lineHeight.tight'),
          transition: 'all 0.2s ease-in-out',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          minHeight: '48px', // Touch target
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
          }
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          border: '2px solid ' + theme('colors.primary.600'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.primary.700'),
            borderColor: theme('colors.primary.700'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.primary')
          },
          '&:active': {
            transform: 'translateY(0)',
            backgroundColor: theme('colors.primary.800')
          }
        },
        '.btn-secondary': {
          backgroundColor: 'transparent',
          color: theme('colors.primary.600'),
          border: '2px solid ' + theme('colors.primary.600'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.primary.50'),
            borderColor: theme('colors.primary.700'),
            color: theme('colors.primary.700')
          }
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.neutral.500'),
          border: '2px solid transparent',
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.neutral.100'),
            color: theme('colors.neutral.700')
          }
        },
        '.btn-success': {
          backgroundColor: theme('colors.success.600'),
          color: theme('colors.white'),
          border: '2px solid ' + theme('colors.success.600'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.success.700'),
            borderColor: theme('colors.success.700')
          }
        },
        '.btn-danger': {
          backgroundColor: theme('colors.error.600'),
          color: theme('colors.white'),
          border: '2px solid ' + theme('colors.error.600'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.error.700'),
            borderColor: theme('colors.error.700')
          }
        },
        '.btn-lg': {
          padding: theme('spacing.4') + ' ' + theme('spacing.8'),
          fontSize: theme('fontSize.lg'),
          minHeight: '56px'
        },
        '.btn-sm': {
          padding: theme('spacing.2') + ' ' + theme('spacing.4'),
          fontSize: theme('fontSize.sm'),
          minHeight: '40px'
        }
      });

      // Card component utilities
      addComponents({
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.soft'),
          border: '1px solid ' + theme('colors.neutral.200'),
          transition: 'all 0.2s ease-in-out'
        },
        '.card-hover': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.medium')
          }
        },
        '.card-interactive': {
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme('colors.primary.600'),
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.primary')
          },
          '&:active': {
            transform: 'scale(0.98)'
          }
        }
      });

      // Form component utilities
      addComponents({
        '.form-input': {
          width: '100%',
          padding: theme('spacing.3') + ' ' + theme('spacing.4'),
          border: '2px solid ' + theme('colors.neutral.200'),
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.base'),
          fontFamily: theme('fontFamily.sans'),
          backgroundColor: theme('colors.white'),
          color: theme('colors.neutral.800'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.600'),
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
          },
          '&:hover:not(:disabled)': {
            borderColor: theme('colors.neutral.300')
          },
          '&:disabled': {
            backgroundColor: theme('colors.neutral.100'),
            color: theme('colors.neutral.500'),
            cursor: 'not-allowed',
            opacity: '0.6'
          },
          '&::placeholder': {
            color: theme('colors.neutral.400')
          }
        },
        '.form-input-error': {
          borderColor: theme('colors.error.600'),
          '&:focus': {
            borderColor: theme('colors.error.600'),
            boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
          }
        },
        '.form-input-success': {
          borderColor: theme('colors.success.600'),
          '&:focus': {
            borderColor: theme('colors.success.600'),
            boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)'
          }
        }
      });

      // Status badge utilities
      addComponents({
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: theme('spacing.1') + ' ' + theme('spacing.3'),
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs'),
          fontWeight: theme('fontWeight.semibold'),
          textTransform: 'uppercase',
          letterSpacing: theme('letterSpacing.wide')
        },
        '.badge-primary': {
          backgroundColor: theme('colors.primary.100'),
          color: theme('colors.primary.800')
        },
        '.badge-success': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.800')
        },
        '.badge-warning': {
          backgroundColor: theme('colors.warning.100'),
          color: theme('colors.warning.800')
        },
        '.badge-error': {
          backgroundColor: theme('colors.error.100'),
          color: theme('colors.error.800')
        },
        '.badge-neutral': {
          backgroundColor: theme('colors.neutral.100'),
          color: theme('colors.neutral.800')
        }
      });

      // Skeleton loading utilities
      addUtilities({
        '.skeleton': {
          backgroundColor: theme('colors.neutral.200'),
          borderRadius: theme('borderRadius.md'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        },
        '.skeleton-text': {
          height: theme('spacing.4'),
          width: '100%'
        },
        '.skeleton-text-sm': {
          height: theme('spacing.3'),
          width: '60%'
        },
        '.skeleton-avatar': {
          height: theme('spacing.12'),
          width: theme('spacing.12'),
          borderRadius: theme('borderRadius.full')
        },
        '.skeleton-image': {
          height: theme('spacing.48'),
          width: '100%'
        }
      });

      // Mobile-specific utilities
      addUtilities({
        '.touch-manipulation': {
          touchAction: 'manipulation'
        },
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent'
        },
        '.safe-area-top': {
          paddingTop: 'max(1rem, env(safe-area-inset-top))'
        },
        '.safe-area-bottom': {
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }
      });

      // Argentina-specific utilities
      addUtilities({
        '.text-argentina': {
          fontFamily: theme('fontFamily.sans'),
          lineHeight: theme('lineHeight.relaxed'), // Better for Spanish
          letterSpacing: theme('letterSpacing.normal')
        },
        '.price-format': {
          fontFamily: theme('fontFamily.mono'),
          fontWeight: theme('fontWeight.semibold'),
          color: theme('colors.primary.600')
        }
      });
    }
  ]
};