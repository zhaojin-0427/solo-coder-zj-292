/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f3',
          100: '#f9ece0',
          200: '#f2d6bc',
          300: '#e9b98f',
          400: '#de955e',
          500: '#d67a3d',
          600: '#c86332',
          700: '#a64d2a',
          800: '#863f28',
          900: '#6d3624',
        },
        luxury: {
          gold: '#C9A962',
          goldDark: '#A88B3D',
          black: '#1A1A1A',
          cream: '#F5F1EA',
          charcoal: '#333333',
        }
      }
    },
  },
  plugins: [],
}
