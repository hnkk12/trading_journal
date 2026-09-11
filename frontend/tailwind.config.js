/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f9d6a",
          dark: "#0b7a53",
          light: "#e3f8ef",
        },
        loss: "#e53e5c",
      },
    },
  },
  plugins: [],
};
