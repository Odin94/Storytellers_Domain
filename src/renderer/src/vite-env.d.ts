/// <reference types="vite/client" />

declare global {
    interface Window {
        electron: {
            getAppPath: (name: "userData" | "appData") => Promise<string>
            dialogOpenDirectory: () => Promise<string | null>
            dialogOpenFile: (opts?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>
            scanAudioFolder: (dirPath: string) => Promise<string[]>
            getAssetUrl: (filePath: string) => Promise<string>
            getAssetArrayBuffer: (filePath: string) => Promise<Uint8Array | null>
            games: {
                list: () => Promise<unknown[]>
                create: (n: string) => Promise<unknown>
                update: (id: number, n: string) => Promise<unknown>
                delete: (id: number) => Promise<unknown>
            }
            scenes: {
                list: (gameId: number) => Promise<unknown[]>
                get: (id: number) => Promise<unknown>
                getWithAudio: (id: number) => Promise<unknown>
                create: (d: unknown) => Promise<unknown>
                update: (id: number, d: unknown) => Promise<unknown>
                delete: (id: number) => Promise<unknown>
            }
            sceneMusic: {
                add: (sceneId: number, audioId: number, isDefault: boolean) => Promise<unknown>
                remove: (sceneId: number, audioId: number) => Promise<unknown>
                setDefault: (sceneId: number, audioId: number) => Promise<unknown>
            }
            sceneSoundEffects: {
                add: (sceneId: number, audioId: number) => Promise<unknown>
                remove: (sceneId: number, audioId: number) => Promise<unknown>
            }
            audioFiles: {
                list: () => Promise<unknown[]>
                listQuickSelect: () => Promise<unknown[]>
                create: (d: unknown) => Promise<unknown>
                update: (id: number, d: unknown) => Promise<unknown>
                delete: (id: number) => Promise<unknown>
            }
        }
    }
}

export {}
