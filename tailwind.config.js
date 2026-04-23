/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        secondary: '#64748b',
        accent: '#2563eb',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      }
    },
  },
  plugins: [],
}
