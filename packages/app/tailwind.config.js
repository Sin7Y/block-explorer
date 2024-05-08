const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{html,js,ts,vue}"],
  theme: {
    container: false,
    extend: {
      fontFamily: {
        sans: ["Poppins", ...defaultTheme.fontFamily.sans],
        mono: ["Roboto Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        primary: {
          50: "#effde8",
          100: "#dafacd",
          200: "#b8f6a0",
          300: "#7aeb53",
          400: "#64e03b",
          500: "#43c61c",
          600: "#2f9e12",
          700: "#267912",
          800: "#235f15",
          900: "#205116",
          950: "#0b2d06",
        },
        secondary: colors.yellow,
        neutral: colors.gray,

        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
      },
      screens: {
        xs: "480px",
        "4xl": "1920px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    function ({ addComponents }) {
      addComponents({
        ".container": {
          maxWidth: "90%",
          marginLeft: "auto",
          marginRight: "auto",
          "@screen xl": {
            maxWidth: "1240px",
          },
        },
      });
    },
  ],
};
