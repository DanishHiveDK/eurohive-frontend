import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Eurohive Design Tokens ──────────────────────────────
      colors: {
        midnight: {
          DEFAULT: "#0B1D3A",
          50: "#E8EDF5",
          100: "#C5D0E5",
          200: "#8DA2C5",
          300: "#5574A5",
          400: "#2B4A7A",
          500: "#132D5E",
          600: "#0B1D3A",
          700: "#081428",
          800: "#050C18",
          900: "#020609",
        },
        honey: {
          DEFAULT: "#E8A838",
          50: "#FEF9F0",
          100: "#FDF0D9",
          200: "#F9DCA8",
          300: "#F5C968",
          400: "#E8A838",
          500: "#D4912A",
          600: "#B07320",
          700: "#8C5918",
          800: "#684210",
          900: "#442B0A",
        },
        cream: {
          DEFAULT: "#FBF8F2",
          100: "#F5F0E8",
          200: "#E5E1D8",
          300: "#D5D1C8",
        },
        success: {
          DEFAULT: "#22C55E",
          light: "#DCFCE7",
          dark: "#16A34A",
        },
        warning: {
          DEFAULT: "#F97316",
          light: "#FFF7ED",
          dark: "#EA580C",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#FEF2F2",
          dark: "#DC2626",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#EFF6FF",
          dark: "#2563EB",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        serif: ["DM Serif Display", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 4px 20px rgba(232, 168, 56, 0.08)",
        glow: "0 0 0 3px rgba(232, 168, 56, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
