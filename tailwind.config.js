module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1280px",
    },
    fontFamily: {
      sans: [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ],
      display: ["Syne", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["DM Mono", "ui-monospace", "monospace"],
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",

      white: "#FFFFFF",

      gray100: "#EEEEEE",
      gray200: "#ECECEC",
      gray300: "#C1C1C1",
      gray400: "#686868",
      gray500: "#282828",

      red: "#F05454",
      yellow: "#F5B461",
      green: "#9BDEAC",
      blue: "#66BFBF",
      lightgreen: "#F2FDFB",

      haru: {
        bg: "#FFFFFF",
        surface: "#F5F5F5",
        card: "#FAFAFA",
        accent: "#7C3AED",
        hot: "#FF3D57",
        orange: "#FF8C00",
        text: "#0D0D0D",
        muted: "#6B6B6B",
        border: "#E8E8E8",
        success: "#00C896",
        "tag-violet": "#F0EBFF",
        "tag-red": "#FFF0F2",
        watermark: "#F0F0F0",
        line: "#CCCCCC",
        category: "#9B9B9B",
      },
    },
    extend: {},
  },
  variants: {
    extend: {
      transform: ["group-hover"],
      scale: ["group-hover"],
      transitionDuration: ["group-hover"],
      letterSpacing: ["group-hover"],
      width: ["group-hover"],
      borderColor: ["group-hover"],
    },
    // divideColor: ['group-hover'],
  },
  plugins: [],
};
