/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00FFA3",
        secondary: "#00B8FF",
        background: "#0A0A0A",
        surface: "#1A1A1A",
        text: "#FFFFFF",
      },
    },
  },
  plugins: [],
}; 