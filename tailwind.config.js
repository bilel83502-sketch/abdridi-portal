/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#2563EB', accent: '#60A5FA' },
        nav: { DEFAULT: '#0F0F23', elevated: '#16162E', border: 'rgba(255,255,255,0.07)' },
        surface: { DEFAULT: '#FFFFFF', sub: '#F8FAFC', cream: '#FAF7F2' },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
