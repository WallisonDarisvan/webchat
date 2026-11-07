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
        chat: {
          bg: "#0B141A",
          panel: "#111B21",
          sidebar: "#202C33",
          incoming: "#202C33",
          outgoing: "#005C4B",
          accent: "#00A884",
          highlight: "#25D366",
          border: "#222E35",
          subtle: "#8696A0",
          text: "#E9EDEF"
        }
      },
      animation: {
        'bounce-subtle': 'bounce 1s infinite',
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;

