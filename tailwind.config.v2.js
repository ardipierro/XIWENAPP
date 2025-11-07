/** @type {import('tailwindcss').Config} */

/**
 * XIWENAPP V2 - Tailwind Configuration
 *
 * STRICT 3-COLOR DESIGN SYSTEM
 * - primary: Dark gray (main UI, backgrounds, text)
 * - accent: Emerald green (actions, success, highlights)
 * - neutral: Medium gray (borders, disabled, secondary)
 *
 * Philosophy:
 * - Constraints breed creativity
 * - Less colors = stronger visual identity
 * - Easier maintenance and consistency
 * - Smaller CSS bundle
 *
 * Usage Guidelines:
 * - primary: Backgrounds, main text, cards, panels
 * - accent: Buttons, links, success states, active states
 * - neutral: Borders, dividers, disabled states, muted text
 *
 * DO NOT add more colors without team approval!
 */

export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // ============================================
      // 🎨 3-COLOR SYSTEM (STRICT)
      // ============================================
      colors: {
        // PRIMARY - Dark Gray (Zinc)
        // Used for: Backgrounds, main text, primary UI elements
        primary: {
          DEFAULT: '#18181b',      // zinc-900 - Main dark background
          50: '#fafafa',           // zinc-50 - Light mode background
          100: '#f4f4f5',          // zinc-100 - Subtle bg (light mode)
          200: '#e4e4e7',          // zinc-200 - Borders (light mode)
          800: '#27272a',          // zinc-800 - Hover states (dark)
          900: '#18181b',          // zinc-900 - Main background (dark)
          950: '#09090b',          // zinc-950 - Deepest dark
        },

        // ACCENT - Emerald Green
        // Used for: CTAs, success states, active states, highlights
        accent: {
          DEFAULT: '#10b981',      // emerald-500 - Primary actions
          400: '#34d399',          // emerald-400 - Hover state
          500: '#10b981',          // emerald-500 - Main accent
          600: '#059669',          // emerald-600 - Pressed/active state
          700: '#047857',          // emerald-700 - Dark mode variation
        },

        // NEUTRAL - Medium Gray (Zinc)
        // Used for: Borders, dividers, disabled states, muted text
        neutral: {
          DEFAULT: '#a1a1aa',      // zinc-400 - Main neutral
          300: '#d4d4d8',          // zinc-300 - Light borders
          400: '#a1a1aa',          // zinc-400 - Secondary text
          500: '#71717a',          // zinc-500 - Muted text
          600: '#52525b',          // zinc-600 - Disabled state
        },

        // ============================================
        // 🚨 SEMANTIC ALIASES (Map to 3 colors)
        // ============================================
        // These are aliases to make code more readable
        // but they all map to our 3-color system

        success: '#10b981',        // Maps to accent
        warning: '#10b981',        // Maps to accent (no separate warning color)
        error: '#ef4444',          // Exception: Keep red for errors only
        info: '#a1a1aa',           // Maps to neutral

        // Background shades (semantic names)
        bg: {
          primary: '#fafafa',      // Light mode: primary-50
          secondary: '#f4f4f5',    // Light mode: primary-100
          dark: '#18181b',         // Dark mode: primary-900
          darker: '#09090b',       // Dark mode: primary-950
        },

        // Text shades (semantic names)
        text: {
          primary: '#18181b',      // Light mode: primary-900
          secondary: '#71717a',    // neutral-500
          muted: '#a1a1aa',        // neutral-400
          inverse: '#fafafa',      // Dark mode: primary-50
        },

        // Border shades (semantic names)
        border: {
          DEFAULT: '#e4e4e7',      // Light: primary-200
          dark: '#27272a',         // Dark: primary-800
          focus: '#10b981',        // accent
        },
      },

      // ============================================
      // 📐 SPACING SYSTEM
      // ============================================
      spacing: {
        xs: '0.25rem',     // 4px
        sm: '0.5rem',      // 8px
        md: '1rem',        // 16px
        lg: '1.5rem',      // 24px
        xl: '2rem',        // 32px
        '2xl': '3rem',     // 48px
        '3xl': '4rem',     // 64px
      },

      // ============================================
      // 🔲 BORDER RADIUS
      // ============================================
      borderRadius: {
        sm: '0.375rem',    // 6px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem',      // 8px
        lg: '0.75rem',     // 12px
        xl: '1rem',        // 16px
        '2xl': '1.5rem',   // 24px
      },

      // ============================================
      // 🌑 SHADOWS
      // ============================================
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        focus: '0 0 0 3px rgb(16 185 129 / 0.1)',
      },

      // ============================================
      // 📝 TYPOGRAPHY
      // ============================================
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
        '5xl': ['3rem', { lineHeight: '1' }],          // 48px
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // ============================================
      // 🎬 ANIMATIONS
      // ============================================
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin': 'spin 0.8s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // ============================================
      // ⚡ TRANSITIONS
      // ============================================
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        base: '200ms',
        slow: '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },

  plugins: [],

  // ============================================
  // ⚠️ SAFELIST (Use sparingly!)
  // ============================================
  // Only add classes here if they're generated dynamically
  // and Tailwind can't detect them in the code
  safelist: [
    // Example: 'bg-accent-500', 'text-accent-600'
    // Add here only if needed for dynamic classes
  ],
}
