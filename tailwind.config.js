/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bal: {
            DEFAULT: "#2563EB", // Vibrant Royal Blue for Bal Vibhag
            dark: "#1D4ED8",
            light: "#DBEAFE",
            surface: "#EFF6FF",
          },
          blk: {
            DEFAULT: "#E11D48", // Rose Red / Magenta for Balika Vibhag
            dark: "#BE123C",
            light: "#FFE4E6",
            surface: "#FFF1F2",
          },
          gold: {
            DEFAULT: "#D97706", // Festive Saffron / Gold
            dark: "#B45309",
            light: "#FEF3C7",
          },
          maroon: {
            DEFAULT: "#881337",
            dark: "#4C0519",
          }
        },
      },
      fontFamily: {
        sans: ['"Baloo Bhai 2"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Baloo Bhai 2"', 'Outfit', 'sans-serif'],
        gujarati: ['"Baloo Bhai 2"', 'sans-serif'],
      },
      boxShadow: {
        // Claymorphism utility shadows
        'clay-card': '8px 8px 16px rgba(163, 177, 198, 0.45), -8px -8px 16px rgba(255, 255, 255, 0.85), inset 2px 2px 4px rgba(255, 255, 255, 0.6), inset -2px -2px 4px rgba(163, 177, 198, 0.2)',
        'clay-button': '5px 5px 10px rgba(163, 177, 198, 0.4), -5px -5px 10px rgba(255, 255, 255, 0.8), inset 1px 1px 2px rgba(255, 255, 255, 0.5)',
        'clay-pressed': 'inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.7)',
        'clay-bal': '8px 8px 16px rgba(37, 99, 235, 0.25), -8px -8px 16px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.6)',
        'clay-blk': '8px 8px 16px rgba(225, 29, 72, 0.25), -8px -8px 16px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.6)',
      },
      borderRadius: {
        'clay': '1.5rem',
        'clay-lg': '2rem',
        'clay-xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
