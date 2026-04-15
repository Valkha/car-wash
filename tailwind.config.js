/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./en/*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        gold: {
          400: '#D4AF37',
          500: '#AA8C2C',
        },
        charcoal: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1e1e1e',
        }
      }
    }
  },
  plugins: [],
}