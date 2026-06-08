/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        tertiary: 'var(--tertiary)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--foreground)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#fafafa',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: '#0a0a0b',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: '#0a0a0b',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--primary)',
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
