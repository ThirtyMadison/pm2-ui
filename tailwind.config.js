/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
    keyframes: {
      'bg-pulse': {
        '0%, 100%': { backgroundColor: 'rgb(39 39 42)'},
        '50%': { backgroundColor: 'rgb(24 24 27)'},
      }
    },
    animation: {
      'bg-pulse': 'bg-pulse 2s ease-in-out infinite',
    }
  },
  plugins: [],
};
