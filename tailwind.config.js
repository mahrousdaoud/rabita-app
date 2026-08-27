/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          950: "#3D0B12",
          900: "#5C1019",
          800: "#7A1622",
          700: "#8B1E2E",
        },
        gold: {
          400: "#D9B84A",
          500: "#C9A227",
          600: "#A8841C",
        },
        sand: {
          50: "#F7F5F0",
          100: "#EFEAE0",
        },
        ink: "#1F2937",
        good: "#4C9A6A",
        bad: "#C1443C",
      },
      fontFamily: {
        display: ["Almarai", "sans-serif"],
        body: ["Tajawal", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
