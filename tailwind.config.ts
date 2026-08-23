import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f2a5c",
        teal: "#0d9488",
        sidebar: "#0f172a",
        "sidebar-hover": "#1e293b",
        "sidebar-active": "#312e81",
      },
    },
  },
  plugins: [],
};

export default config;
