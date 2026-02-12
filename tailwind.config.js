/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Outdoorsy color palette for bird counting app
        forest: {
          DEFAULT: "#2F5D50",
          dark: "#254A3E",
        },
        moss: "#6B8F71",
        sand: {
          DEFAULT: "#F2EFEA",
          dark: "#E8E5E0",
        },
        bark: "#4A3F35",
        rust: {
          DEFAULT: "#C76D4B",
          dark: "#B05D3B",
        },
        sky: "#7FAFC5",
        sunlit: "#E3C770",
        slate: {
          DEFAULT: "#8A9088",
          border: "#D5D0C8",
        },
        "dark-bg": "#1a1a1a",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        custom: "0 2px 8px rgba(74, 63, 53, 0.1)",
        "custom-lg": "0 4px 12px rgba(74, 63, 53, 0.1)",
        "custom-xl": "0 4px 16px rgba(74, 63, 53, 0.1)",
        "custom-2xl": "0 8px 24px rgba(74, 63, 53, 0.1)",
      },
      keyframes: {
        slideDown: {
          "0%": {
            opacity: "0",
            transform: "translateX(-50%) translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(-50%) translateY(0)",
          },
        },
      },
      animation: {
        slideDown: "slideDown 0.3s ease",
      },
    },
  },
  plugins: [],
};
