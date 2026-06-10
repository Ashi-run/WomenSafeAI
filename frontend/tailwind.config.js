/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#f0faf8',
          100: '#d0f0ea',
          200: '#a2e0d4',
          300: '#64c8b4',
          400: '#2faa8e',
          500: '#1A6B5A',
          600: '#155a4b',
          700: '#10473c',
          800: '#0c3730',
          900: '#082922',
        },
        coral: {
          50:  '#fef4f2',
          100: '#fde5e0',
          200: '#fbc9bf',
          300: '#f7a090',
          400: '#f07060',
          500: '#E8614A',
          600: '#d44535',
          700: '#b23428',
          800: '#8f2a20',
          900: '#6e221a',
        },
        lavender: {
          50:  '#f5f3fb',
          100: '#ede8f6',
          200: '#d9d0ed',
          300: '#bcaede',
          400: '#9b84ca',
          500: '#7B6EA8',
          600: '#6a5d96',
          700: '#574c7b',
          800: '#453c61',
          900: '#35304c',
        },
        sage: {
          500: '#4CAF79',
          600: '#3d9465',
        },
        amber: {
          500: '#F5A623',
          600: '#d9901a',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      backgroundImage: {
        'mesh-teal': 'radial-gradient(at 40% 20%, hsla(166,60%,20%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,40%,25%,0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340,30%,30%,0.15) 0px, transparent 50%)',
        'mesh-results': 'radial-gradient(at 20% 80%, hsla(166,50%,15%,0.4) 0px, transparent 50%), radial-gradient(at 90% 10%, hsla(280,30%,20%,0.2) 0px, transparent 50%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.1)',
        'score': '0 8px 32px rgba(26,107,90,0.2)',
      },
    },
  },
  plugins: [],
}
