/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Money Flow design tokens — warm paper + ink, money-semantic colors
      colors: {
        paper: "#FAF9F6",
        "paper-2": "#F2F0EA",
        surface: "#FFFFFF",
        "surface-2": "#FBFAF7",
        ink: "#181712",
        "ink-2": "#59574E",
        "ink-3": "#8C897D",
        "ink-4": "#B6B2A6",
        line: "#E8E5DD",
        "line-2": "#D8D4C8",
        "line-strong": "#C4BFB1",
        positive: "#1A7A50",
        "positive-2": "#14633F",
        "positive-soft": "#E4F1E9",
        negative: "#BE4A30",
        "negative-2": "#9C3A24",
        "negative-soft": "#F8E8E2",
        warning: "#B07A1E",
        "warning-soft": "#F6ECD6",
        info: "#2C5E8A",
        "info-soft": "#E2ECF4",
        accent: "#1A7A50",
        "accent-soft": "#E4F1E9",
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px", // default control radius
        lg: "20px", // cards
        xl: "28px", // sheets, large cards
        "2xl": "36px",
      },
      fontSize: {
        "2xs": "11px",
        md: "18px",
      },
      // RN needs one family name per weight — no synthetic bolding
      fontFamily: {
        sans: ["HankenGrotesk_400Regular"],
        "sans-medium": ["HankenGrotesk_500Medium"],
        "sans-semibold": ["HankenGrotesk_600SemiBold"],
        "sans-bold": ["HankenGrotesk_700Bold"],
        mono: ["SplineSansMono_500Medium"],
        "mono-semibold": ["SplineSansMono_600SemiBold"],
      },
    },
  },
  plugins: [],
};
