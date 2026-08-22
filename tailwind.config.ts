import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f2a5c",
        teal: "#0f9d7c",
      },
    },
  },
  plugins: [],
};

export default config;
