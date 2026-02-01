import { ipcMain, dialog } from "electron"
import fs from "fs"
import path from "path"
import { getDb } from "../db"
import {
    audioFiles,
    games,
    scenes,
    sceneMusic,
    sceneSoundEffects,
    type NewAudioFile,
    type NewGame,
    type NewScene,
    type NewSceneMusic,
    type NewSceneSoundEffect,
} from "../db/schema"
import { eq, asc, and } from "drizzle-orm"
import { getAppAssetUrl, readAssetFile } from "../protocol"

const AUDIO_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"])

const scanDir = (dir: string, acc: string[] = []): string[] => {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const e of entries) {
            const full = path.join(dir, e.name)
            if (e.isDirectory()) {
                scanDir(full, acc)
            } else if (e.isFile() && AUDIO_EXT.has(path.extname(e.name).toLowerCase())) {
                acc.push(full)
            }
        }
    } catch {
        // skip
    }
    return acc
}

export const registerIpcHandlers = () => {
    ipcMain.handle("dialog:openDirectory", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ["openDirectory"],
        })
        return canceled ? null : filePaths[0] ?? null
    })

    ipcMain.handle("dialog:openFile", async (_, opts: { filters?: { name: string; extensions: string[] }[] }) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: opts?.filters ?? [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"] }],
        })
        return canceled ? null : filePaths[0] ?? null
    })

    ipcMain.handle("fs:scanAudioFolder", (_, dirPath: string) => {
        return scanDir(dirPath)
    })

    ipcMain.handle("asset:getUrl", (_, filePath: string) => {
        return getAppAssetUrl(filePath)
    })

    ipcMain.handle("asset:getArrayBuffer", (_, filePath: string) => {
        const buf = readAssetFile(filePath)
        return buf ?? null
    })

    ipcMain.handle("games:list", async () => {
        const db = getDb()
        return db.select().from(games).orderBy(asc(games.sortOrder), asc(games.id))
    })

    ipcMain.handle("games:create", async (_, name: string) => {
        const db = getDb()
        const [row] = await db
            .insert(games)
            .values({ name } as NewGame)
            .returning()
        return row
    })

    ipcMain.handle("games:update", async (_, id: number, name: string) => {
        const db = getDb()
        await db.update(games).set({ name }).where(eq(games.id, id))
        return { id, name }
    })

    ipcMain.handle("games:delete", async (_, id: number) => {
        const db = getDb()
        await db.delete(games).where(eq(games.id, id))
        return true
    })

    ipcMain.handle("scenes:list", async (_, gameId: number) => {
        const db = getDb()
        return db.select().from(scenes).where(eq(scenes.gameId, gameId)).orderBy(asc(scenes.sortOrder), asc(scenes.id))
    })

    ipcMain.handle("scenes:get", async (_, id: number) => {
        const db = getDb()
        const [row] = await db.select().from(scenes).where(eq(scenes.id, id))
        return row ?? null
    })

    ipcMain.handle("scenes:getWithAudio", async (_, id: number) => {
        const db = getDb()
        const [scene] = await db.select().from(scenes).where(eq(scenes.id, id))
        if (!scene) return null
        const musicRows = await db
            .select({ audioFile: audioFiles, isDefault: sceneMusic.isDefault, sortOrder: sceneMusic.sortOrder })
            .from(sceneMusic)
            .innerJoin(audioFiles, eq(sceneMusic.audioFileId, audioFiles.id))
            .where(eq(sceneMusic.sceneId, id))
            .orderBy(asc(sceneMusic.sortOrder))
        const effectRows = await db
            .select({ audioFile: audioFiles, sortOrder: sceneSoundEffects.sortOrder })
            .from(sceneSoundEffects)
            .innerJoin(audioFiles, eq(sceneSoundEffects.audioFileId, audioFiles.id))
            .where(eq(sceneSoundEffects.sceneId, id))
            .orderBy(asc(sceneSoundEffects.sortOrder))
        return {
            scene,
            music: musicRows.map((r) => ({ ...r.audioFile, isDefault: r.isDefault, sortOrder: r.sortOrder })),
            soundEffects: effectRows.map((r) => ({ ...r.audioFile, sortOrder: r.sortOrder })),
        }
    })

    ipcMain.handle("scenes:create", async (_, data: { gameId: number; title: string; description?: string; imagePath?: string | null }) => {
        const db = getDb()
        const [row] = await db
            .insert(scenes)
            .values({
                gameId: data.gameId,
                title: data.title,
                description: data.description ?? "",
                imagePath: data.imagePath ?? null,
            } as NewScene)
            .returning()
        return row
    })

    ipcMain.handle("scenes:update", async (_, id: number, data: { title?: string; description?: string; imagePath?: string | null }) => {
        const db = getDb()
        await db
            .update(scenes)
            .set({
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.imagePath !== undefined && { imagePath: data.imagePath }),
            })
            .where(eq(scenes.id, id))
        return true
    })

    ipcMain.handle("scenes:delete", async (_, id: number) => {
        const db = getDb()
        await db.delete(scenes).where(eq(scenes.id, id))
        return true
    })

    ipcMain.handle("scene-music:add", async (_, sceneId: number, audioFileId: number, isDefault: boolean) => {
        const db = getDb()
        if (isDefault) {
            await db.update(sceneMusic).set({ isDefault: false }).where(eq(sceneMusic.sceneId, sceneId))
        }
        await db.insert(sceneMusic).values({ sceneId, audioFileId, isDefault, sortOrder: 0 } as NewSceneMusic)
        return true
    })

    ipcMain.handle("scene-music:remove", async (_, sceneId: number, audioFileId: number) => {
        const db = getDb()
        await db.delete(sceneMusic).where(and(eq(sceneMusic.sceneId, sceneId), eq(sceneMusic.audioFileId, audioFileId)))
        return true
    })

    ipcMain.handle("scene-music:setDefault", async (_, sceneId: number, audioFileId: number) => {
        const db = getDb()
        await db.update(sceneMusic).set({ isDefault: false }).where(eq(sceneMusic.sceneId, sceneId))
        await db
            .update(sceneMusic)
            .set({ isDefault: true })
            .where(and(eq(sceneMusic.sceneId, sceneId), eq(sceneMusic.audioFileId, audioFileId)))
        return true
    })

    ipcMain.handle("scene-sound-effects:add", async (_, sceneId: number, audioFileId: number) => {
        const db = getDb()
        await db.insert(sceneSoundEffects).values({ sceneId, audioFileId, sortOrder: 0 } as NewSceneSoundEffect)
        return true
    })

    ipcMain.handle("scene-sound-effects:remove", async (_, sceneId: number, audioFileId: number) => {
        const db = getDb()
        await db
            .delete(sceneSoundEffects)
            .where(and(eq(sceneSoundEffects.sceneId, sceneId), eq(sceneSoundEffects.audioFileId, audioFileId)))
        return true
    })

    ipcMain.handle("audio-files:list", async () => {
        const db = getDb()
        return db.select().from(audioFiles).orderBy(asc(audioFiles.name))
    })

    ipcMain.handle("audio-files:listQuickSelect", async () => {
        const db = getDb()
        return db.select().from(audioFiles).where(eq(audioFiles.quickSelect, true)).orderBy(asc(audioFiles.name))
    })

    ipcMain.handle("audio-files:create", async (_, data: NewAudioFile) => {
        const db = getDb()
        const [row] = await db.insert(audioFiles).values(data).returning()
        return row
    })

    ipcMain.handle("audio-files:update", async (_, id: number, data: Partial<NewAudioFile>) => {
        const db = getDb()
        await db.update(audioFiles).set(data).where(eq(audioFiles.id, id))
        return true
    })

    ipcMain.handle("audio-files:delete", async (_, id: number) => {
        const db = getDb()
        await db.delete(audioFiles).where(eq(audioFiles.id, id))
        return true
    })
}
