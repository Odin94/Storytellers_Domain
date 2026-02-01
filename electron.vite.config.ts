import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"
import path from "path"

export default defineConfig({
    main: {
        build: {
            rollupOptions: {
                external: ["better-sqlite3"],
            },
            externalizeDeps: true,
        },
    },
    preload: {
        build: {
            externalizeDeps: true,
            rollupOptions: {
                output: {
                    format: "cjs",
                    entryFileNames: "[name].cjs",
                },
            },
        },
    },
    renderer: {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src/renderer/src"),
            },
        },
    },
})
