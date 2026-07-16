/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#F1EADC',
        ink: '#122622',
        teal: {
          DEFAULT: '#134E4A',
          dark: '#0B302D',
          light: '#1F6F68',
        },
        gold: '#C39A3D',
        clay: '#B4543A',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        stamp: '9999px',
      },
    },
  },
  plugins: [],
}
