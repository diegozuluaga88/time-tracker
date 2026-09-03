/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./packages/strata-ds/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "rgb(from var(--border) r g b / <alpha-value>)",
                input: "rgb(from var(--input) r g b / <alpha-value>)",
                ring: "rgb(from var(--ring) r g b / <alpha-value>)",
                background: "rgb(from var(--background) r g b / <alpha-value>)",
                foreground: "rgb(from var(--foreground) r g b / <alpha-value>)",
                primary: {
                    DEFAULT: "rgb(from var(--primary) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--primary-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-primary-soft) r g b / <alpha-value>)",
                    tint: "rgb(from var(--color-primary-tint) r g b / <alpha-value>)",
                    // alias para escribir bg-primary/40 etc con soft variant.
                },
                secondary: {
                    DEFAULT: "rgb(from var(--secondary) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--secondary-foreground) r g b / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "rgb(from var(--destructive) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--destructive-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-status-error-soft) r g b / <alpha-value>)",
                },
                // TT.27 · semantic status colors (mapean a --color-status-*).
                // Faltaban en el config · las clases bg-success/border-success
                // se emitían vacías · el checkbox marcado se veía en blanco.
                success: {
                    DEFAULT: "rgb(from var(--color-status-success) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--color-status-success-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-status-success-soft) r g b / <alpha-value>)",
                },
                warning: {
                    DEFAULT: "rgb(from var(--color-status-warning) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--color-status-warning-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-status-warning-soft) r g b / <alpha-value>)",
                },
                info: {
                    DEFAULT: "rgb(from var(--color-status-info) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--color-status-info-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-status-info-soft) r g b / <alpha-value>)",
                },
                ai: {
                    DEFAULT: "rgb(from var(--color-status-ai) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--color-status-ai-foreground) r g b / <alpha-value>)",
                    soft: "rgb(from var(--color-status-ai-soft) r g b / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "rgb(from var(--muted) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--muted-foreground) r g b / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "rgb(from var(--accent) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--accent-foreground) r g b / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "rgb(from var(--popover) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--popover-foreground) r g b / <alpha-value>)",
                },
                card: {
                    DEFAULT: "rgb(from var(--card) r g b / <alpha-value>)",
                    foreground: "rgb(from var(--card-foreground) r g b / <alpha-value>)",
                },
                brand: {
                    50: "rgb(from var(--color-brand-50) r g b / <alpha-value>)",
                    100: "rgb(from var(--color-brand-100) r g b / <alpha-value>)",
                    200: "rgb(from var(--color-brand-200) r g b / <alpha-value>)",
                    300: "rgb(from var(--color-brand-300) r g b / <alpha-value>)",
                    400: "rgb(from var(--color-brand-400) r g b / <alpha-value>)",
                    500: "rgb(from var(--color-brand-500) r g b / <alpha-value>)",
                    600: "rgb(from var(--color-brand-600) r g b / <alpha-value>)",
                    700: "rgb(from var(--color-brand-700) r g b / <alpha-value>)",
                    800: "rgb(from var(--color-brand-800) r g b / <alpha-value>)",
                    900: "rgb(from var(--color-brand-900) r g b / <alpha-value>)",
                    950: "rgb(from var(--color-brand-950) r g b / <alpha-value>)",
                    lime: "rgb(from var(--color-brand-lime) r g b / <alpha-value>)",
                },
                zinc: {
                    50: "rgb(from var(--color-zinc-50) r g b / <alpha-value>)",
                    100: "rgb(from var(--color-zinc-100) r g b / <alpha-value>)",
                    200: "rgb(from var(--color-zinc-200) r g b / <alpha-value>)",
                    300: "rgb(from var(--color-zinc-300) r g b / <alpha-value>)",
                    400: "rgb(from var(--color-zinc-400) r g b / <alpha-value>)",
                    500: "rgb(from var(--color-zinc-500) r g b / <alpha-value>)",
                    600: "rgb(from var(--color-zinc-600) r g b / <alpha-value>)",
                    700: "rgb(from var(--color-zinc-700) r g b / <alpha-value>)",
                    800: "rgb(from var(--color-zinc-800) r g b / <alpha-value>)",
                    900: "rgb(from var(--color-zinc-900) r g b / <alpha-value>)",
                    950: "rgb(from var(--color-zinc-950) r g b / <alpha-value>)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--fontFamily-sans)"],
                brand: ["var(--fontFamily-brand)"],
            },
            boxShadow: {
                "glow-sm": "var(--shadow-glow-sm)",
                "glow-md": "var(--shadow-glow-md)", // Standard
                "glow-lg": "var(--shadow-glow-lg)",
            },
        },
    },
    plugins: [],
}
