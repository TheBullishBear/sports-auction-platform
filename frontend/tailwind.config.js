/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        auction: {
          dark: '#080d1a',
          card: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          gold: '#fbbf24',
          accent: '#38bdf8',
          success: '#10b981',
          danger: '#ef4444',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gavel': 'strike 0.3s ease-in-out',
        'bounce-subtle': 'bounce 2s infinite',
      },
      keyframes: {
        strike: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-25deg)' },
        },
      },
    },
  },
  plugins: [],
};
