import { contextBridge, ipcRenderer } from "electron"

const api = {
    getAppPath: (name: "userData" | "appData") => ipcRenderer.invoke("get-app-path", name),
    dialogOpenDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    dialogOpenFile: (opts?: { filters?: { name: string; extensions: string[] }[] }) => ipcRenderer.invoke("dialog:openFile", opts ?? {}),
    scanAudioFolder: (dirPath: string) => ipcRenderer.invoke("fs:scanAudioFolder", dirPath),
    getAssetUrl: (filePath: string) => ipcRenderer.invoke("asset:getUrl", filePath),
    getAssetArrayBuffer: (filePath: string) => ipcRenderer.invoke("asset:getArrayBuffer", filePath),

    games: {
        list: () => ipcRenderer.invoke("games:list"),
        create: (name: string) => ipcRenderer.invoke("games:create", name),
        update: (id: number, name: string) => ipcRenderer.invoke("games:update", id, name),
        delete: (id: number) => ipcRenderer.invoke("games:delete", id),
    },
    scenes: {
        list: (gameId: number) => ipcRenderer.invoke("scenes:list", gameId),
        get: (id: number) => ipcRenderer.invoke("scenes:get", id),
        getWithAudio: (id: number) => ipcRenderer.invoke("scenes:getWithAudio", id),
        create: (data: { gameId: number; title: string; description?: string; imagePath?: string | null }) =>
            ipcRenderer.invoke("scenes:create", data),
        update: (id: number, data: { title?: string; description?: string; imagePath?: string | null }) =>
            ipcRenderer.invoke("scenes:update", id, data),
        delete: (id: number) => ipcRenderer.invoke("scenes:delete", id),
    },
    sceneMusic: {
        add: (sceneId: number, audioFileId: number, isDefault: boolean) =>
            ipcRenderer.invoke("scene-music:add", sceneId, audioFileId, isDefault),
        remove: (sceneId: number, audioFileId: number) => ipcRenderer.invoke("scene-music:remove", sceneId, audioFileId),
        setDefault: (sceneId: number, audioFileId: number) => ipcRenderer.invoke("scene-music:setDefault", sceneId, audioFileId),
    },
    sceneSoundEffects: {
        add: (sceneId: number, audioFileId: number) => ipcRenderer.invoke("scene-sound-effects:add", sceneId, audioFileId),
        remove: (sceneId: number, audioFileId: number) => ipcRenderer.invoke("scene-sound-effects:remove", sceneId, audioFileId),
    },
    audioFiles: {
        list: () => ipcRenderer.invoke("audio-files:list"),
        listQuickSelect: () => ipcRenderer.invoke("audio-files:listQuickSelect"),
        create: (data: {
            path: string
            name: string
            category: "music" | "effect"
            quickSelect?: boolean
            randomPitch?: boolean
            imagePath?: string | null
            icon?: string | null
        }) => ipcRenderer.invoke("audio-files:create", data),
        update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke("audio-files:update", id, data),
        delete: (id: number) => ipcRenderer.invoke("audio-files:delete", id),
    },
}

contextBridge.exposeInMainWorld("electron", api)
