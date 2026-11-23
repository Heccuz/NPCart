/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12100e',
        coal: '#1c1917',
        shale: '#2a2522',
        bone: '#f4efe6',
        sand: '#e7ddcb',
        ember: {
          DEFAULT: '#e4572e',
          dark: '#bf3f1c',
        },
        moss: '#7d8f7b',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(18, 16, 14, 0.55)',
      },
    },
  },
  plugins: [],
}
