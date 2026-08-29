import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#70153a",
          hover: "#5a102e",
        },
        secondary: {
          DEFAULT: "#efc975",
          hover: "#e0b85d",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        "brand-dark": "#1a1a1a",
        "brand-light": "#ffffff",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [],
};
export default config;

