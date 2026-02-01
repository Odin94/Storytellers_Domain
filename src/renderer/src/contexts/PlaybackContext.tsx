import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type SfxEntry = { stop: () => void; startTime: number; duration: number }

type PlaybackContextValue = {
  stopAll: () => void
  musicRef: React.RefObject<HTMLAudioElement | null>
  playMusicUrl: (url: string, pathKey?: string) => void
  stopMusic: () => void
  playingMusicPathKey: string | null
  musicProgress: { current: number; duration: number }
  playSfxUrl: (url: string, randomPitch?: boolean, key?: string) => void
  stopSfx: (key: string) => void
  sfxProgress: Record<string, number>
  registerSfxRef: (ref: { stop: () => void } | null) => void
  activeSceneId: number | null
  setActiveSceneId: (id: number | null) => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider')
  return ctx
}

const sfxRefs = new Map<string, SfxEntry>()
const legacySfxRefs = new Set<{ stop: () => void }>()

let sharedAudioContext: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!sharedAudioContext) sharedAudioContext = new AudioContext()
  return sharedAudioContext
}

export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [activeSceneId, setActiveSceneIdState] = useState<number | null>(null)
  const [playingMusicPathKey, setPlayingMusicPathKey] = useState<string | null>(null)
  const [musicProgress, setMusicProgress] = useState<{ current: number; duration: number }>({ current: 0, duration: 0 })
  const [sfxProgress, setSfxProgress] = useState<Record<string, number>>({})
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const musicBlobUrlRef = useRef<string | null>(null)

  const playMusicUrl = useCallback((url: string, pathKey?: string) => {
    const el = musicRef.current
    if (!el) return
    if (musicBlobUrlRef.current) {
      URL.revokeObjectURL(musicBlobUrlRef.current)
      musicBlobUrlRef.current = null
    }
    setPlayingMusicPathKey(pathKey ?? url)
    const setSrcAndPlay = (src: string) => {
      el.src = src
      el.loop = true
      el.play().catch(() => { })
    }
    if (url.startsWith('app://')) {
      const pathParam = new URL(url).searchParams.get('path')
      const filePath = pathParam ? decodeURIComponent(pathParam) : null
      if (!filePath) return
      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
      const mime: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.webm': 'audio/webm',
      }
      const contentType = mime[ext] ?? 'audio/mpeg'
        ; (window.electron as { getAssetArrayBuffer: (p: string) => Promise<Uint8Array | null> })
          .getAssetArrayBuffer(filePath)
          .then((buf: Uint8Array | null) => {
            if (!buf) return
            const blob = new Blob([new Uint8Array(buf)], { type: contentType })
            const blobUrl = URL.createObjectURL(blob)
            musicBlobUrlRef.current = blobUrl
            setSrcAndPlay(blobUrl)
          })
          .catch(() => { })
    } else {
      setSrcAndPlay(url)
    }
  }, [])

  const stopMusic = useCallback(() => {
    const el = musicRef.current
    if (musicBlobUrlRef.current) {
      URL.revokeObjectURL(musicBlobUrlRef.current)
      musicBlobUrlRef.current = null
    }
    if (el) {
      el.pause()
      el.currentTime = 0
      el.removeAttribute('src')
    }
    setPlayingMusicPathKey(null)
    setMusicProgress({ current: 0, duration: 0 })
  }, [])

  useEffect(() => {
    const el = musicRef.current
    if (!el || !playingMusicPathKey) return
    const onTimeUpdate = () => setMusicProgress({ current: el.currentTime, duration: el.duration || 0 })
    const onDurationChange = () => setMusicProgress((p) => ({ ...p, duration: el.duration || 0 }))
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('durationchange', onDurationChange)
    onTimeUpdate()
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('durationchange', onDurationChange)
    }
  }, [playingMusicPathKey])

  const playSfxUrl = useCallback((url: string, randomPitch = false, key?: string) => {
    const ctx = getAudioContext()
    const sfxKey = key ?? `sfx-${Date.now()}-${Math.random()}`
    const getArrayBuffer = (): Promise<ArrayBuffer | null> => {
      if (url.startsWith('app://')) {
        const pathParam = new URL(url).searchParams.get('path')
        const filePath = pathParam ? decodeURIComponent(pathParam) : null
        if (!filePath) return Promise.resolve(null)
        return (window.electron as { getAssetArrayBuffer: (p: string) => Promise<Uint8Array | null> }).getAssetArrayBuffer(filePath)
          .then((buf: Uint8Array | null) => {
            if (!buf) return null
            return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
          })
      }
      return fetch(url).then((r) => r.arrayBuffer())
    }
    const existing = sfxRefs.get(sfxKey)
    if (existing) existing.stop()
    getArrayBuffer()
      .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
      .then((buffer) => {
        if (!buffer) return
        const startTime = ctx.currentTime
        const duration = buffer.duration
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        if (randomPitch) {
          const detuneCents = (Math.random() - 0.5) * 40
          source.detune.setValueAtTime(detuneCents, ctx.currentTime)
        }
        const stop = () => {
          try {
            source.stop()
          } catch {
            // already stopped
          }
          sfxRefs.delete(sfxKey)
          setSfxProgress((p) => {
            const next = { ...p }
            delete next[sfxKey]
            return next
          })
        }
        sfxRefs.set(sfxKey, { stop, startTime, duration })
        setSfxProgress((p) => ({ ...p, [sfxKey]: 0 }))
        source.onended = () => {
          sfxRefs.delete(sfxKey)
          setSfxProgress((p) => {
            const next = { ...p }
            delete next[sfxKey]
            return next
          })
        }
        source.start(0)
      })
      .catch(() => { })
  }, [])

  const stopSfx = useCallback((key: string) => {
    const entry = sfxRefs.get(key)
    if (entry) {
      entry.stop()
      sfxRefs.delete(key)
      setSfxProgress((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }, [])

  useEffect(() => {
    if (Object.keys(sfxProgress).length === 0) return
    const id = setInterval(() => {
      const ctx = getAudioContext()
      const now = ctx.currentTime
      const next: Record<string, number> = {}
      sfxRefs.forEach((entry, k) => {
        next[k] = Math.min(1, (now - entry.startTime) / entry.duration)
      })
      setSfxProgress(next)
    }, 80)
    return () => clearInterval(id)
  }, [sfxProgress])

  const stopAll = useCallback(() => {
    if (musicBlobUrlRef.current) {
      URL.revokeObjectURL(musicBlobUrlRef.current)
      musicBlobUrlRef.current = null
    }
    if (musicRef.current) {
      musicRef.current.pause()
      musicRef.current.currentTime = 0
      musicRef.current.removeAttribute('src')
    }
    setPlayingMusicPathKey(null)
    setMusicProgress({ current: 0, duration: 0 })
    sfxRefs.forEach((r) => r.stop())
    sfxRefs.clear()
    legacySfxRefs.forEach((r) => r.stop())
    setSfxProgress({})
  }, [])

  const setActiveSceneId = useCallback((id: number | null) => {
    setActiveSceneIdState(id)
  }, [])

  const value: PlaybackContextValue = {
    stopAll,
    musicRef,
    playMusicUrl,
    stopMusic,
    playingMusicPathKey,
    musicProgress,
    playSfxUrl,
    stopSfx,
    sfxProgress,
    registerSfxRef: (ref) => (ref ? legacySfxRefs.add(ref) : undefined),
    activeSceneId,
    setActiveSceneId,
  }

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}
