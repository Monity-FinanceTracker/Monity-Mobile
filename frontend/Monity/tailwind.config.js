/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#0A0A0A',
        'primary-bg': '#191E29',
        'secondary-bg': '#23263a',
        'card-bg': '#171717',

        // Borders
        'border-default': '#262626',

        // Accent
        accent: {
          DEFAULT: '#01C38D',
          hover: '#01A071',
          light: 'rgba(1, 195, 141, 0.1)',
          medium: 'rgba(1, 195, 141, 0.2)',
        },

        // Text
        text: {
          primary: '#FFFFFF',
          secondary: '#696E79',
          muted: '#9CA3AF',
          gray: '#D1D5DB',
        },

        // Status
        success: {
          DEFAULT: '#10B981',
          light: 'rgba(16, 185, 129, 0.2)',
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
          DEFAULT: '#4ADE80',
          bg: 'rgba(34, 197, 94, 0.2)',
        },
        expense: {
          DEFAULT: '#FFFFFF',
          bg: 'rgba(255, 255, 255, 0.1)',
        },
        savings: {
          DEFAULT: '#60A5FA',
          bg: 'rgba(59, 130, 246, 0.2)',
        },

        // Financial Health
        health: {
          excellent: '#4ADE80',
          good: '#60A5FA',
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
      },
    },
  },
  plugins: [],
};
