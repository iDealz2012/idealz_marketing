/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   '#0A2342',
        brand:  '#1F5FA6',
        accent: '#00B4D8',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
