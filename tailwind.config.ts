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
        paper: {
          DEFAULT: "var(--paper)",
          warm: "#FAF6ED",
          aged: "#F4EDE0",
        },
        card: "var(--card)",
        gold: {
          DEFAULT: "var(--gold)",
          deep: "var(--gold-deep)",
        },
        rose: {
          DEFAULT: "var(--rose)",
          soft: "var(--rose-soft)",
        },
        sky: {
          50: "#F2F7FD",
          100: "#E3EEF9",
          200: "#C8DFF5",
          300: "#A5CAED",
          400: "#75ACE0",
          500: "#4D8EC9",
          600: "#3672AA",
          700: "#2B5885",
        },
        blush: {
          50: "#FDF5F6",
          100: "#FAE7EA",
          200: "#F4CDD4",
          400: "#E6899A",
          500: "#D36E82",
        },
        line: "var(--line)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        handwriting: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        velada: "0 20px 40px -20px rgba(35, 60, 95, 0.18)",
        card: "0 10px 28px -14px rgba(35, 60, 95, 0.16)",
        "card-hover": "0 20px 36px -12px rgba(35, 60, 95, 0.22)",
        seal: "0 6px 16px -4px rgba(74, 131, 179, 0.45)",
        letter: "0 22px 50px -15px rgba(28, 55, 88, 0.18), 0 0 0 1px rgba(75, 120, 168, 0.08)",
        dogear: "-4px 4px 10px rgba(25, 45, 70, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
