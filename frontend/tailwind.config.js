/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#EDF3FC",
        primary: {
          DEFAULT: "#426FA8",
          hover: "#355a8a",
          light: "#E4EFFC",
        },
        navy: {
          DEFAULT: "#0B1730",
          dark: "#060D1B",
          light: "#1A2E56"
        },
        secondary: "#66758A",
        border: "#D9E2EF",
        accent: {
          purple: "#5A3A8B",
          purpleLight: "#F2ECF9",
        },
        status: {
          success: "#39B56B",
          warning: "#E5A83B",
          error: "#D9534F",
          info: "#426FA8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(11, 23, 48, 0.04)',
        'card': '0 4px 20px rgba(11, 23, 48, 0.06)',
        'modal': '0 10px 35px rgba(11, 23, 48, 0.12)',
      }
    },
  },
  plugins: [],
}
