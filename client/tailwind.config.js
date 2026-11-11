/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius-default)',
        dialog: 'var(--radius-dialog)',
      },
    },
  },
  plugins: [],
};
