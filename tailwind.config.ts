import type { Config } from "tailwindcss";

/**
 * NOIR design tokens: near-black canvas, white primary, a soft periwinkle
 * accent and hairline surfaces.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark glass surfaces (ink.* utilities flip to dark).
        ink: {
          950: "#060707",
          900: "#08090a",
          800: "#0f1013",
          700: "#16171b",
          line: "rgba(255,255,255,0.08)",
        },
        // Accent: soft periwinkle (links, active states).
        pink: {
          DEFAULT: "#c7cdff",
          soft: "#e3e6ff",
          deep: "#9aa3ff",
        },
        rose: {
          DEFAULT: "#c7cdff",
          soft: "#e3e6ff",
        },
        ember: {
          DEFAULT: "#c7cdff",
          soft: "#9aa3ff",
        },
        up: "#2fe39a",
        down: "#ff5c6c",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px -20px rgba(124,140,255,0.45)",
        card: "0 40px 90px -50px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
