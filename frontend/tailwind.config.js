/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        foreground: '#fafafa',
        card: {
          DEFAULT: '#141417',
          foreground: '#fafafa',
        },
        popover: {
          DEFAULT: '#141417',
          foreground: '#fafafa',
        },
        primary: {
          DEFAULT: '#10b981',
          foreground: '#0a0a0b',
        },
        secondary: {
          DEFAULT: '#1e1e24',
          foreground: '#a1a1aa',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#71717a',
        },
        accent: {
          DEFAULT: '#1e1e24',
          foreground: '#fafafa',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fafafa',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#0a0a0b',
        },
        success: {
          DEFAULT: '#10b981',
          foreground: '#0a0a0b',
        },
        border: '#27272a',
        input: '#27272a',
        ring: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
