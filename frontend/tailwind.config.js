/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"]
      },
      colors: {
        bg: {
          950: "#05060a",
          900: "#070a12",
          850: "#0b1020",
          800: "#0b1220"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.10), 0 20px 60px rgba(0,0,0,0.55)",
        glowHover: "0 0 0 1px rgba(167,139,250,0.25), 0 28px 90px rgba(0,0,0,0.60)"
      },
      keyframes: {
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } }
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
