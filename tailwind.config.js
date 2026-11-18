/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        agri: {
          50: "#f0fdf4",
          600: "#16a34a", // Primary Leaf Green
          700: "#15803d", // Deep Emerald
          800: "#166534", // Dark Forest
        },
        soil: {
          100: "#fef3c7",
          600: "#d97706", // Amber / Harvest Gold
          800: "#92400e", // Rich Earth Brown
        },
        skyTheme: {
          50: "#f0f9ff",
          500: "#0ea5e9", // Weather / Water Blue
        },
      },
    },
  },
  plugins: [],
};
