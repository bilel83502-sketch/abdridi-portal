/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#06080F',
          elevated: '#0A0E1A',
          card: '#0D1120',
          hover: '#111628',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          hover: 'rgba(255,255,255,0.10)',
        },
        accent: {
          cyan: '#00C2FF',
          indigo: '#6366F1',
          green: '#34D399',
          purple: '#A855F7',
          amber: '#F59E0B',
        },
        txt: {
          DEFAULT: '#E8ECF2',
          secondary: '#9498A8',
          muted: '#6B7084',
          faint: '#4B4F62',
        },
      },
    },
  },
  plugins: [],
};
