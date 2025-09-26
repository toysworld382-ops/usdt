/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'orange': '#F97316',
          'gold': '#F59E0B',
        },
        'dark': {
          'primary': '#030712',   // bg-gray-950
          'secondary': '#111827', // bg-gray-900
          'card': '#1F2937',      // bg-gray-800
          'border': '#374151',    // bg-gray-700
        }
      },
      fontFamily: {
        sans: [...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
