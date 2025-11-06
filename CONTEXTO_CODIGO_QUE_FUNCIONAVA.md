@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * Monity Design System - CSS Variables
 * Based on rules.mdc design specifications
 */

@layer base {
  :root {
    /* Backgrounds */
    --background: #0A0A0A;
    --primary-bg: #191E29;
    --secondary-bg: #23263a;
    --card-bg: #171717;

    /* Borders & Dividers */
    --border: #262626;
    --border-hover: rgba(38, 38, 38, 0.8);

    /* Accent Colors */
    --accent: #01C38D;
    --accent-hover: #01A071;
    --accent-light: rgba(1, 195, 141, 0.1);
    --accent-medium: rgba(1, 195, 141, 0.2);

    /* Text Colors */
    --text-primary: #FFFFFF;
    --text-secondary: #696E79;
    --text-muted: #9CA3AF;
    --text-gray: #D1D5DB;

    /* Status Colors */
    --success: #10B981;
    --success-light: rgba(16, 185, 129, 0.2);
    --error: #EF4444;
    --error-light: rgba(239, 68, 68, 0.2);
    --warning: #F59E0B;
    --warning-light: rgba(245, 158, 11, 0.2);
    --info: #3B82F6;
    --info-light: rgba(59, 130, 246, 0.2);

    /* Transaction Colors */
    --income: #4ADE80;
    --income-bg: rgba(34, 197, 94, 0.2);
    --expense: #FFFFFF;
    --expense-bg: rgba(255, 255, 255, 0.1);
    --savings: #60A5FA;
    --savings-bg: rgba(59, 130, 246, 0.2);

    /* Financial Health Colors */
    --health-excellent: #4ADE80;
    --health-good: #60A5FA;
    --health-fair: #FBBF24;
    --health-poor: #F87171;

    /* Overlays */
    --overlay: rgba(0, 0, 0, 0.5);
    --overlay-light: rgba(0, 0, 0, 0.3);
    --overlay-heavy: rgba(0, 0, 0, 0.8);
  }
}

@layer base {
  * {
    @apply border-border-default;
  }

  body {
    @apply bg-primary-bg text-text-primary;
    font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Custom utility classes for gradients */
@layer utilities {
  .gradient-primary {
    background: linear-gradient(to right, #01C38D, #01A071);
  }

  .gradient-text {
    background: linear-gradient(to right, #01C38D, #01A071);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gradient-reverse {
    background: linear-gradient(to right, #01A071, #01C38D);
  }
}


metro.config.js :

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Configurações adicionais para resolver problemas de build
config.resolver.platforms = ["ios", "android", "native", "web"];

module.exports = withNativeWind(config, { 
  input: "./global.css",
  inlineRem: 16
});


tailwind.config.js:

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