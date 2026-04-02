/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf9ef',
          100: '#faf0d4',
          200: '#f4dfa8',
          300: '#edc872',
          400: '#e5ac3e',
          500: '#D4AF37',
          600: '#c08e1d',
          700: '#a06d1a',
          800: '#82571c',
          900: '#6b481a',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#1B1F3B',
          600: '#16193a',
          700: '#121535',
          800: '#0e1030',
          900: '#0a0c2a',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0D9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        cloud: '#F2F0EB',
      },
      fontFamily: {
        heading: ['Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
        },
      });
    },
  ],
};
