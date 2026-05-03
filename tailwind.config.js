/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/js/**/*.{js,ts,jsx,tsx}",
    "./templates/**/*.php",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        /** Matches FrontendThemeCss / common.css — used by customer account React app */
        yatra: {
          primary: "var(--yatra-primary, #3b82f6)",
          "primary-dark": "var(--yatra-primary-dark, #2563eb)",
          "primary-darker": "var(--yatra-primary-darker, #1e40af)",
          "primary-light": "var(--yatra-primary-light, #60a5fa)",
          soft: "var(--yatra-primary-light-soft, #eff6ff)",
          "on-dark": "var(--yatra-primary-color-dark, #60a5fa)",
          "surface-dark": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 20%, rgb(15 23 42))",
          "surface-dark-muted": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 12%, rgb(15 23 42))",
          "chip-bg": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 12%, #ffffff)",
          "border-subtle": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 22%, #e5e7eb)",
          "border-dark": "color-mix(in srgb, var(--yatra-primary-light-dark, #1e3a8a) 42%, rgb(30 41 59))",
          "border-hover": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 30%, #d1d5db)",
          "border-hover-dark": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 38%, rgb(55 65 81))",
          "hover-soft": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 7%, #ffffff)",
          "hover-soft-dark": "color-mix(in srgb, var(--yatra-primary, #3b82f6) 10%, rgb(15 23 42))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

