import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Music, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'
import { AudioFileImageOrIcon } from '@/components/AudioFileImageOrIcon'

type AudioFile = {
  id: number
  path: string
  name: string
  category: 'music' | 'effect'
  quickSelect: boolean
  randomPitch: boolean
  imagePath: string | null
  icon: string | null
}

export const QuickSelectPanel = () => {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<AudioFile[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { playMusicUrl, playSfxUrl } = usePlayback()

  useEffect(() => {
    window.electron!.audioFiles.listQuickSelect().then((raw) => setList((raw ?? []) as AudioFile[]))
  }, [])

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const music = list.filter((a) => a.category === 'music')
  const effects = list.filter((a) => a.category === 'effect')

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-[100]' : ''}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glow-border-hover flex items-center gap-2 rounded-lg border border-orange-500/20 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-200 backdrop-blur-sm transition-colors hover:border-orange-400/40 hover:bg-zinc-800 hover:text-amber-100/90"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <Volume2 className="h-4 w-4" />
        <span>Quick select</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="glow-border absolute right-0 top-full z-[100] mt-1 w-72 rounded-lg border border-orange-500/30 bg-zinc-900/95 p-2 shadow-glow backdrop-blur-md"
          >
            {music.length === 0 && effects.length === 0 ? (
              <p className="py-2 text-center text-sm text-zinc-500">No quick-select audio</p>
            ) : (
              <>
                {music.length > 0 ? (
                  <div className="mb-2">
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-500">
                      <Music className="h-3 w-3" /> Music
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {music.map((a) => (
                        <QuickSelectAudioItem key={a.id} file={a} type="music" playMusicUrl={playMusicUrl} />
                      ))}
                    </div>
                  </div>
                ) : null}
                {effects.length > 0 ? (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-500">
                      <Volume2 className="h-3 w-3" /> Effects
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {effects.map((a) => (
                        <QuickSelectAudioItem key={a.id} file={a} type="effect" playSfxUrl={playSfxUrl} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const QuickSelectAudioItem = ({
  file,
  type,
  playMusicUrl,
  playSfxUrl,
}: {
  file: AudioFile
  type: 'music' | 'effect'
  playMusicUrl?: (url: string) => void
  playSfxUrl?: (url: string, randomPitch?: boolean) => void
}) => {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    window.electron!.getAssetUrl(file.path).then(setUrl)
  }, [file.path])

  if (type === 'music' && url && playMusicUrl) {
    return (
      <motion.button
        type="button"
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-amber-100"
        onClick={() => playMusicUrl(url)}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <AudioFileImageOrIcon imagePath={file.imagePath} icon={file.icon} size={20} />
        <span className="truncate">{file.name}</span>
      </motion.button>
    )
  }

  if (type === 'effect' && url && playSfxUrl) {
    return (
      <motion.button
        type="button"
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-amber-100"
        onClick={() => playSfxUrl(url, file.randomPitch)}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <AudioFileImageOrIcon imagePath={file.imagePath} icon={file.icon} size={20} />
        <span className="truncate">{file.name}</span>
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-sm text-zinc-500">
      <AudioFileImageOrIcon imagePath={file.imagePath} icon={file.icon} size={20} />
      <span className="truncate">{file.name}</span>
    </div>
  )
}
