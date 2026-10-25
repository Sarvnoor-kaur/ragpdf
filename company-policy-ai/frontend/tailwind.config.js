/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium SaaS color palette
        mainBg: '#F7F8FC',
        cardBg: '#FFFFFF',
        primaryText: '#151827',
        secondaryText: '#697386',
        primaryAccent: '#635BFF',
        secondaryAccent: '#8B5CF6',
        border: '#E8EAF2',
        success: '#16A34A',
        // Legacy colors for backwards compatibility
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        accentBlue: '#3b82f6',
        accentIndigo: '#6366f1',
        accentViolet: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
