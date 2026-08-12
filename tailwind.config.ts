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
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        ivory: "var(--ivory)",
        paper: "var(--paper)",
        card: "var(--card)",
        gold: {
          DEFAULT: "var(--gold)",
          deep: "var(--gold-deep)",
        },
        rose: {
          DEFAULT: "var(--rose)",
          soft: "var(--rose-soft)",
        },
        line: "var(--line)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        velada: "0 20px 40px -20px rgba(43, 36, 56, 0.35)",
        card: "0 14px 30px -18px rgba(43, 36, 56, 0.35)",
        "card-hover": "0 22px 34px -16px rgba(43, 36, 56, 0.4)",
        seal: "0 6px 14px -4px rgba(143, 100, 37, 0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
