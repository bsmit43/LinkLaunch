/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// LinkLaunch Deep Space Theme
				primary: {
					DEFAULT: '#6366F1',
					50: '#EEEDFD',
					100: '#DDDCFB',
					200: '#BBBAF8',
					300: '#9997F4',
					400: '#7775F1',
					500: '#6366F1',
					600: '#3437EC',
					700: '#1518D8',
					800: '#1013A3',
					900: '#0B0E6E',
					950: '#090B53'
				},
				secondary: {
					DEFAULT: '#EC4899',
					50: '#FDF2F8',
					100: '#FCE7F3',
					200: '#FBCFE8',
					300: '#F9A8D4',
					400: '#F472B6',
					500: '#EC4899',
					600: '#DB2777',
					700: '#BE185D',
					800: '#9D174D',
					900: '#831843',
					950: '#500724'
				},
				accent: {
					DEFAULT: '#F59E0B',
					50: '#FFFBEB',
					100: '#FEF3C7',
					200: '#FDE68A',
					300: '#FCD34D',
					400: '#FBBF24',
					500: '#F59E0B',
					600: '#D97706',
					700: '#B45309',
					800: '#92400E',
					900: '#78350F',
					950: '#451A03'
				},
				background: {
					DEFAULT: '#0F0F1A',
					secondary: '#1A1A2E',
					tertiary: '#16213E'
				},
				foreground: {
					DEFAULT: '#F8FAFC',
					muted: '#94A3B8'
				},
				border: {
					DEFAULT: 'rgba(255, 255, 255, 0.1)',
					strong: 'rgba(255, 255, 255, 0.2)'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'hero-gradient': 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
				'card-gradient': 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
			},
			animation: {
				'shimmer': 'shimmer 2s linear infinite',
				'float': 'float 6s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'gradient': 'gradient 8s linear infinite',
				'marquee': 'marquee var(--duration) linear infinite',
				'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
				'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
				'shine': 'shine var(--duration) infinite linear',
				'aurora': 'aurora 60s linear infinite',
				'meteor': 'meteor 5s linear infinite',
				'ripple': 'ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite',
				'grid': 'grid 15s linear infinite',
				'orbit': 'orbit calc(var(--duration)*1s) linear infinite',
				'background-position-spin': 'background-position-spin 3000ms infinite alternate'
			},
			keyframes: {
				shimmer: {
					'0%, 90%, 100%': { 'background-position': 'calc(-100% - var(--shimmer-width)) 0' },
					'30%, 60%': { 'background-position': 'calc(100% + var(--shimmer-width)) 0' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
					'50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' }
				},
				gradient: {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				marquee: {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(calc(-100% - var(--gap)))' }
				},
				'marquee-vertical': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(calc(-100% - var(--gap)))' }
				},
				'border-beam': {
					'100%': { 'offset-distance': '100%' }
				},
				shine: {
					'0%': { 'background-position': '0% 0%' },
					'50%': { 'background-position': '100% 100%' },
					to: { 'background-position': '0% 0%' }
				},
				aurora: {
					from: { backgroundPosition: '50% 50%, 50% 50%' },
					to: { backgroundPosition: '350% 50%, 350% 50%' }
				},
				meteor: {
					'0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
					'70%': { opacity: '1' },
					'100%': { transform: 'rotate(215deg) translateX(-500px)', opacity: '0' }
				},
				ripple: {
					'0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
					'50%': { transform: 'translate(-50%, -50%) scale(0.9)' }
				},
				grid: {
					'0%': { transform: 'translateY(-50%)' },
					'100%': { transform: 'translateY(0)' }
				},
				orbit: {
					'0%': { transform: 'rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)' },
					'100%': { transform: 'rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)' }
				},
				'background-position-spin': {
					'0%': { backgroundPosition: 'top center' },
					'100%': { backgroundPosition: 'bottom center' }
				}
			}
		}
	},
	plugins: []
};
