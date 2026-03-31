import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-input": "var(--bg-input)",
        "bg-input-hover": "var(--bg-input-hover)",
        "accent-blue": "var(--accent-blue)",
        "accent-violet": "var(--accent-violet)",
        "accent-green": "var(--accent-green)",
        "accent-red": "var(--accent-red)",
        "accent-warning": "var(--accent-warning)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset",
        "card-hover":
          "0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
        "glow-blue": "0 0 20px rgba(54,177,255,0.35)",
        "glow-button": "0 0 30px rgba(54,177,255,0.4), 0 4px 16px rgba(106,117,255,0.3)",
        modal:
          "0 24px 80px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
