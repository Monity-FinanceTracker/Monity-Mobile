/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#262624',
        'primary-bg': '#262624',
        'secondary-bg': '#1F1E1D',
        'card-bg': '#1F1E1D',
        'input-bg': '#30302E',

        // Borders
        'border-default': '#262626',
        'button-border': '#FAF9F5',

        // Accent
        accent: {
          DEFAULT: '#56a69f',
          hover: '#4a8f88',
          light: 'rgba(86, 166, 159, 0.1)',
          medium: 'rgba(86, 166, 159, 0.2)',
        },

        // Text
        text: {
          primary: '#FAF9F5',
          secondary: '#FAF9F5',
          muted: '#30302E',
          gray: '#FAF9F5',
        },

        // Status
        success: {
          DEFAULT: '#56a69f',
          light: 'rgba(86, 166, 159, 0.2)',
        },
        error: {
          DEFAULT: '#EF4444',
          light: 'rgba(239, 68, 68, 0.2)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: 'rgba(245, 158, 11, 0.2)',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: 'rgba(59, 130, 246, 0.2)',
        },

        // Transactions
        income: {
          DEFAULT: '#56a69f',
          bg: 'rgba(86, 166, 159, 0.2)',
        },
        expense: {
          DEFAULT: '#FAF9F5',
          bg: 'rgba(250, 249, 245, 0.1)',
        },
        savings: {
          DEFAULT: '#60A5FA',
          bg: 'rgba(59, 130, 246, 0.2)',
        },

        // Financial Health
        health: {
          excellent: '#56a69f',
          good: '#56a69f',
          fair: '#FBBF24',
          poor: '#F87171',
        },
      },
      backgroundColor: {
        'overlay': 'rgba(0, 0, 0, 0.5)',
        'overlay-light': 'rgba(0, 0, 0, 0.3)',
        'overlay-heavy': 'rgba(0, 0, 0, 0.8)',
      },
      borderColor: {
        DEFAULT: '#262626',
        'button': '#FAF9F5',
      },
    },
  },
  plugins: [],
};
