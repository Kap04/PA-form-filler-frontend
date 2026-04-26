import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fb',
          100: '#e8edf6',
          200: '#ced8ea',
          300: '#a8b7d5',
          400: '#6f83b4',
          500: '#40547f',
          600: '#2d3a5a',
          700: '#20293f',
          800: '#151c2b',
          900: '#0b1020',
        },
        sand: '#f7f1e8',
        coral: '#ff6b4a',
        mint: '#4fd1c5',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(3, 8, 20, 0.35)',
      },
      backgroundImage: {
        'hero-grid': 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
      animation: {
        float: 'float 9s ease-in-out infinite',
        fadeUp: 'fadeUp 0.7s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
