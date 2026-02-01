import { protocol } from "electron"
import fs from "fs"
import path from "path"

const ALLOWED_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm", ".png", ".jpg", ".jpeg", ".gif", ".webp"])

const MIME: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".webm": "audio/webm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

export const readAssetFile = (filePath: string): Buffer | null => {
    const ext = path.extname(filePath).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) return null
    try {
        return fs.readFileSync(filePath)
    } catch {
        return null
    }
}

export const registerProtocol = () => {
    protocol.handle("app", (request) => {
        const url = new URL(request.url)
        const pathParam = url.searchParams.get("path")
        if (!pathParam) {
            return new Response("Missing path", { status: 400 })
        }
        let decodedPath: string
        try {
            decodedPath = decodeURIComponent(pathParam)
        } catch {
            return new Response("Invalid path", { status: 400 })
        }
        const buf = readAssetFile(decodedPath)
        if (buf == null) return new Response("Not found", { status: 404 })
        const ext = path.extname(decodedPath).toLowerCase()
        const mime = MIME[ext] ?? "application/octet-stream"
        return new Response(buf, {
            headers: { "Content-Type": mime },
        })
    })
}

export const getAppAssetUrl = (filePath: string): string => {
    return `app://asset?path=${encodeURIComponent(filePath)}`
}
