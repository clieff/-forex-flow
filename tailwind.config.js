const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans]
      },
      colors: {
        forex: {
          bg: "#0A0F1A",
          panel: "#131B2B",
          border: "#1E2A3A",
          mint: "#00C9A7",
          lagoon: "#00B4D8",
          danger: "#FF6B6B",
          text: "#E6EEF8",
          muted: "#8EA3B8"
        }
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, rgba(0, 201, 167, 1) 0%, rgba(0, 180, 216, 1) 100%)",
        "panel-gradient":
          "linear-gradient(180deg, rgba(19, 27, 43, 0.96) 0%, rgba(13, 20, 33, 0.98) 100%)"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(0, 201, 167, 0.14)",
        panel: "0 18px 60px rgba(6, 12, 24, 0.45)",
        highlight: "0 10px 35px rgba(0, 201, 167, 0.16)"
      },
      keyframes: {
        "background-pan": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "160px 160px" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.15)", opacity: "0" }
        }
      },
      animation: {
        "background-pan": "background-pan 28s linear infinite",
        marquee: "marquee 24s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
        pulseRing: "pulseRing 1.6s ease-out infinite"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },
      letterSpacing: {
        premium: "0.08em"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
