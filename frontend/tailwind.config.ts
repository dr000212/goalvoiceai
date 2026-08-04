import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b1c19",
        mist: "#faf9f4",
        leaf: "#14422c",
        sage: "#c9e6d7",
        coral: "#764246",
        gold: "#b88a2f",
        sky: "#4a6458"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(27, 28, 25, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
