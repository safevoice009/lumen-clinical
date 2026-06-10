/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        clinical: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          500: "#0ea5e9", // Medical Sky Blue
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        tealmed: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6", // Teal Clinical Accent
          600: "#0d9488",
          700: "#0f766e",
        },
        slatebg: {
          50: "#fbfaf7", // Warm Paper Slate
          100: "#f4f2eb",
          200: "#e8e5db",
          300: "#d3cedf",
          900: "#1c1917", // Rich Dark Charcoal
          950: "#0c0a09",
        }
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(14, 165, 233, 0.4)" },
          "50%": { transform: "scale(1.03)", boxShadow: "0 0 16px 4px rgba(14, 165, 233, 0.2)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        }
      }
    },
  },
  plugins: [],
}
