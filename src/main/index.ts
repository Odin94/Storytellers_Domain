import { app, BrowserWindow, ipcMain } from "electron"
import fs from "fs"
import path from "path"
import pkg from "electron-updater"
const { autoUpdater } = pkg
import { initDb, closeDb } from "./db"
import { registerIpcHandlers } from "./ipc/handlers"
import { registerProtocol } from "./protocol"

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged

if (!isDev) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on("update-available", () => {})
    autoUpdater.on("update-not-available", () => {})
    autoUpdater.on("error", () => {})
}

let mainWindow: BrowserWindow | null = null

const getPreloadPath = (): string => {
    const preloadDir = path.join(__dirname, "../preload")
    const candidates = ["index.cjs", "index.js", "index.mjs"]
    for (const name of candidates) {
        const p = path.join(preloadDir, name)
        if (fs.existsSync(p)) return p
    }
    const files = fs.readdirSync(preloadDir)
    const entry = files.find((f) => f.startsWith("index") && (f.endsWith(".cjs") || f.endsWith(".js") || f.endsWith(".mjs")))
    return entry ? path.join(preloadDir, entry) : path.join(preloadDir, "index.cjs")
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
        backgroundColor: "#0a0a0a",
    })

    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173")
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
    }

    mainWindow.once("ready-to-show", () => {
        mainWindow?.show()
    })

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

app.whenReady().then(async () => {
    await initDb()
    registerProtocol()
    registerIpcHandlers()
    createWindow()

    if (!isDev) {
        autoUpdater.checkForUpdates().catch(() => {})
    }

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", async () => {
    await closeDb()
    if (process.platform !== "darwin") app.quit()
})

ipcMain.handle("get-app-path", (_, name: "userData" | "appData") => {
    return app.getPath(name)
})
