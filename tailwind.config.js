import { fontFamily } from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Cosmic Theme Specifics
        cosmic: {
          950: '#0a0a0f', // Deepest background
          900: '#13131f', // Sidebar/Card background
          800: '#1c1c2e', // Hover states
          700: '#2a2a40', // Borders
          600: '#3f3f5a',
          500: '#5c5c7d',
          400: '#8080a0',
          300: '#a3a3c2',
          200: '#c5c5e0',
          100: '#e0e0f5',
          50: '#f0f0fa',
        },
        neon: {
          blue: '#00f0ff',
          purple: '#bd00ff',
          pink: '#ff0099',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(to bottom right, #0a0a0f, #13131f)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
        'neon-gradient': 'linear-gradient(to right, #00f0ff, #bd00ff)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 240, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(189, 0, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
