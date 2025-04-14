import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary, #06b6d4)",
          dark: "var(--primary-dark, #387fbf)",
        },
        background: {
          light: "var(--bg-light, #f6f6f6)",
          dark: "var(--bg-dark, #000000)",
          card: {
            light: "var(--card-light, #ffffff)",
            dark: "var(--card-dark, #1a1a3d)",
          },
        },
        text: {
          light: "var(--text-light, #1f2937)",
          dark: "var(--text-dark, #e5e7eb)",
          muted: {
            light: "var(--text-muted-light, #6b7280)",
            dark: "var(--text-muted-dark, #9ca3af)",
          },
        },
        border: {
          light: "var(--border-light, #d1d5db)",
          dark: "var(--border-dark, #374151)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;