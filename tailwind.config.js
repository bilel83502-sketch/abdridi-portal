/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#2563EB', light: '#EFF6FF', dark: '#1E40AF' },
        nav: { DEFAULT: '#0B0F1A', light: '#141A2B', border: '#1A2236' },
        surface: { DEFAULT: '#FFFFFF', sub: '#F5F6F8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
