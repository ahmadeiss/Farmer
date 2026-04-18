import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Design Tokens ─────────────────────────────────────────────────────

      colors: {
        // Primary: Deep Agricultural Green (confident, fresh, trustworthy)
        forest: {
          50:  "#edfaf3",
          100: "#d2f4e3",
          200: "#a8e7ca",
          300: "#72d4a9",
          400: "#3aba84",
          500: "#1a9d65",  // Primary CTA
          600: "#127d50",  // Hover
          700: "#0f6341",  // Active / Dark
          800: "#0d5036",
          900: "#0b3f2c",
          950: "#051f16",
        },

        // Secondary: Warm Earth / Sand (authentic, local, warm)
        earth: {
          50:  "#fdf7ef",
          100: "#faebd5",
          200: "#f4d4a8",
          300: "#ecb870",
          400: "#e29438",
          500: "#d4771a",  // Accent CTA
          600: "#b85f14",
          700: "#974913",
          800: "#7c3b14",
          900: "#673113",
          950: "#381708",
        },

        // Neutral: Warm Stone (not cold gray)
        stone: {
          50:  "#fafaf9",
          100: "#f5f4f2",
          200: "#ede9e5",
          300: "#d9d3cd",
          400: "#b8afa7",
          500: "#948880",
          600: "#766c65",
          700: "#5e5650",
          800: "#3e3a37",
          900: "#262320",
          950: "#13110f",
        },

        // Semantic Status Colors
        success: {
          50:  "#edfaf3",
          100: "#d2f4e3",
          500: "#1a9d65",
          600: "#127d50",
          700: "#0f6341",
        },
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          500: "#d97706",
          600: "#b45309",
          700: "#92400e",
        },
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
        },
        info: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },

        // Surface / Background tokens
        surface: {
          DEFAULT: "#ffffff",
          warm:    "#faf9f7",   // Page background (warm cream)
          muted:   "#f3f1ee",   // Cards on warm bg
          border:  "#e8e4df",   // Default border
        },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        arabic: ["var(--font-cairo)", "IBM Plex Sans Arabic", "sans-serif"],
        sans:   ["var(--font-cairo)", "IBM Plex Sans Arabic", "Inter", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],     // 10px
        xs:   ["0.75rem",  { lineHeight: "1.125rem" }],  // 12px
        sm:   ["0.875rem", { lineHeight: "1.375rem" }],  // 14px
        base: ["1rem",     { lineHeight: "1.625rem" }],  // 16px
        lg:   ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
        xl:   ["1.25rem",  { lineHeight: "1.875rem" }],  // 20px
        "2xl":["1.5rem",   { lineHeight: "2rem" }],      // 24px
        "3xl":["1.875rem", { lineHeight: "2.375rem" }],  // 30px
        "4xl":["2.25rem",  { lineHeight: "2.75rem" }],   // 36px
        "5xl":["3rem",     { lineHeight: "3.5rem" }],    // 48px
        "6xl":["3.75rem",  { lineHeight: "4.25rem" }],   // 60px
      },

      fontWeight: {
        light:    "300",
        normal:   "400",
        medium:   "500",
        semibold: "600",
        bold:     "700",
        extrabold:"800",
      },

      // ── Spacing Scale ───────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
        "34":  "8.5rem",
        "68":  "17rem",
        "72":  "18rem",
        "76":  "19rem",
        "84":  "21rem",
        "88":  "22rem",
        "92":  "23rem",
        "96":  "24rem",
        "112": "28rem",
        "128": "32rem",
      },

      // ── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        none: "0",
        xs:   "0.25rem",   // 4px  – tags, tight elements
        sm:   "0.375rem",  // 6px  – small buttons
        DEFAULT: "0.5rem", // 8px  – inputs, small cards
        md:   "0.75rem",   // 12px – standard cards
        lg:   "1rem",      // 16px – large cards
        xl:   "1.25rem",   // 20px – panels
        "2xl":"1.5rem",    // 24px – hero sections
        "3xl":"2rem",      // 32px – decorative
        full: "9999px",    // pills, avatars
      },

      // ── Shadows ─────────────────────────────────────────────────────────
      boxShadow: {
        xs:     "0 1px 2px rgba(0,0,0,0.05)",
        sm:     "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
        DEFAULT:"0 2px 6px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        md:     "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        lg:     "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        xl:     "0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        "2xl":  "0 24px 60px rgba(0,0,0,0.15)",
        // Semantic
        card:        "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover":"0 6px 20px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)",
        modal:       "0 20px 60px rgba(0,0,0,0.18)",
        "forest":    "0 4px 14px rgba(26,157,101,0.25)",
        "earth":     "0 4px 14px rgba(212,119,26,0.25)",
        inner:       "inset 0 2px 4px rgba(0,0,0,0.06)",
        none:        "none",
      },

      // ── Transitions ─────────────────────────────────────────────────────
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "300": "300ms",
      },

      // ── Z-index ─────────────────────────────────────────────────────────
      zIndex: {
        "nav":     "40",
        "overlay": "50",
        "modal":   "60",
        "toast":   "70",
      },

      // ── Animation ───────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.25s ease-out",
        "slide-up":      "slide-up 0.3s ease-out",
        "slide-in-right":"slide-in-right 0.25s ease-out",
        "scale-in":      "scale-in 0.2s ease-out",
        shimmer:         "shimmer 1.6s ease-in-out infinite",
        "pulse-slow":    "pulse 2s ease-in-out infinite",
      },

      // ── Backdrop blur ───────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
      },
    },
  },

  plugins: [],

  corePlugins: {
    preflight: true,
  },
};

export default config;
