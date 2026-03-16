import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "#ffffff",
          hover: "#fafbff",
          elevated: "#ffffff",
        },
        brand: {
          DEFAULT: "#EC4899",
          hover: "#DB2777",
          light: "#FCE7F3",
          dark: "#BE185D",
          deep: "#9D174D",
        },
        sky: {
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
        navy: {
          DEFAULT: "#89CFF0",
          light: "#B8E8F7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
