/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a', // Slate 900
        darkCard: '#1e293b', // Slate 800
        accentBlue: '#3b82f6',
        accentIndigo: '#6366f1',
        accentViolet: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
