import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mars: {
          50: "#fff5f2",
          100: "#ffe8e1",
          200: "#ffd5c7",
          300: "#ffb49e",
          400: "#ff8266",
          500: "#f05a36",
          600: "#dc3c17",
          700: "#b92c0c",
          800: "#98270e",
          900: "#7c2512",
          950: "#440f05",
        },
        surface: {
          darkest: "#07080a",
          darker: "#0d1015",
          dark: "#141820",
          card: "#191f2b",
          border: "#263042",
          hover: "#222a3a",
        },
        telemetry: {
          cyan: "#00e5ff",
          green: "#10b981",
          yellow: "#f59e0b",
          amber: "#f97316",
          red: "#ef4444",
          violet: "#a855f7",
        }
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        'hud': '0 0 15px -3px rgba(240, 90, 54, 0.15)',
        'hud-cyan': '0 0 15px -3px rgba(0, 229, 255, 0.15)',
      }
    },
  },
  plugins: [],
};

export default config;
