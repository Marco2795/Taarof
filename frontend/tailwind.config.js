/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        taarof: {
          50: '#fff5f2',
          100: '#ffe6de',
          200: '#ffc7b3',
          300: '#ff9d7a',
          400: '#ff6f47',
          500: '#f4471f', // primary brand color
          600: '#d9330f',
          700: '#b3260c',
          800: '#8c1f0f',
          900: '#701c10',
        },
        dune: {
          50: '#faf7f2',
          900: '#2b211a',
        },
      },
      fontFamily: {
        display: ['"Noto Naskh Arabic"', '"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
