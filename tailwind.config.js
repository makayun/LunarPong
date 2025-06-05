/** @type {import('tailwindcss').Config} */
export default {
  content: ["./public/*.html"],
  theme: {
    extend: {
      colors: {
        pink: 'pink',
        'green-500': '#0f0',
        'gray-900': 'rgb(32, 28, 28)',
        'purple-700': '#6a0dad',
        'cyan-300': 'rgb(168, 230, 230)',
        'yellow-300': 'rgb(200, 245, 117)',
      },
    },
  },
  plugins: [],
};