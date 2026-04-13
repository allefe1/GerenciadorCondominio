import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5416c9",
        "primary-container": "#6c3ce1",
        "on-primary": "#ffffff",
        "primary-fixed": "#e8ddff",
        "primary-fixed-dim": "#cebdff",
        "on-primary-fixed": "#21005e",
        "on-primary-fixed-variant": "#5110c6",
        secondary: "#6c38d2",
        "secondary-container": "#8555ed",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#e9ddff",
        "secondary-fixed-dim": "#d1bcff",
        "on-secondary-fixed": "#24005b",
        "on-secondary-fixed-variant": "#5618bc",
        tertiary: "#591ebb",
        "tertiary-container": "#723fd4",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#eaddff",
        "tertiary-fixed-dim": "#d2bcff",
        "on-tertiary-fixed": "#24005a",
        "on-tertiary-fixed-variant": "#571ab8",
        "on-tertiary-container": "#e5d6ff",
        surface: "#faf9f9",
        "surface-bright": "#faf9f9",
        "surface-dim": "#dbdad9",
        "surface-container": "#efeded",
        "surface-container-low": "#f5f3f3",
        "surface-container-high": "#e9e8e8",
        "surface-container-highest": "#e3e2e2",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#e3e2e2",
        "surface-tint": "#6a39de",
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#494455",
        background: "#faf9f9",
        "on-background": "#1b1c1c",
        outline: "#7a7486",
        "outline-variant": "#cbc3d7",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 24px 60px rgba(27, 28, 28, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7B4AE2 0%, #9B6BFF 100%)",
        "cta-gradient": "linear-gradient(135deg, #5416c9 0%, #6c3ce1 100%)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
