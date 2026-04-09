export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
        cream: '#f5f0e8', dark: '#1c1612',
      },
      fontFamily: { display:['"Playfair Display"','Georgia','serif'], body:['"Source Sans 3"','sans-serif'] },
    },
  },
  plugins: [],
}
