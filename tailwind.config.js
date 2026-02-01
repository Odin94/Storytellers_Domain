/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/renderer/**/*.{html,tsx,ts,jsx,js}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                glow: {
                    orange: "#f97316",
                    amber: "#f59e0b",
                    yellow: "#fbbf24",
                },
            },
            boxShadow: {
                glow: "0 0 20px -5px rgba(249, 115, 22, 0.4), 0 0 40px -10px rgba(245, 158, 11, 0.25)",
                "glow-lg": "0 0 30px -5px rgba(249, 115, 22, 0.5), 0 0 60px -15px rgba(245, 158, 11, 0.3)",
            },
            animation: {
                "glow-pulse": "glow-pulse 3s ease-in-out infinite",
            },
            keyframes: {
                "glow-pulse": {
                    "0%, 100%": { opacity: "0.6" },
                    "50%": { opacity: "1" },
                },
            },
        },
    },
    plugins: [],
}
