import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0A0F0D",
          raised: "#121917",
          light: "#FFFFFF",
          "light-alt": "#F5F7F6",
        },
        text: {
          primary: "#14212B",
          secondary: "#FFFFFF",
          tertiary: "#575A7B",
          muted: "#A7B0AC",
        },
        accent: {
          DEFAULT: "#09B850",
          hover: "#078A3D",
          tint: "#0BCF5F",
        },
        border: {
          dark: "rgba(255,255,255,0.10)",
          light: "#E3E7E5",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      fontSize: {
        xs: ["14px", "20px"],
        sm: ["16px", "24px"],
        md: ["17px", "28.9px"],
        lg: ["20px", "28px"],
        xl: ["28px", "34px"],
        "2xl": ["32px", "38px"],
        "3xl": ["40px", "46px"],
        "4xl": ["56px", "60px"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "24px",
        pill: "999px",
      },
      spacing: {
        13: "5px",
        14: "8px",
        15: "16px",
        16: "20px",
        17: "21px",
        18: "24px",
        19: "25px",
        20: "30px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(10,15,13,0.08)",
        glow: "0 0 40px rgba(9,184,80,0.25)",
      },
      transitionTimingFunction: {
        awenue: "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
