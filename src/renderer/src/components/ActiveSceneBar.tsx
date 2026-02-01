import { Link } from 'react-router-dom'
import { Play, Pause, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'
import { useState, useEffect } from 'react'

export const ActiveSceneBar = () => {
  const { activeSceneId, musicRef } = usePlayback()
  const [sceneTitle, setSceneTitle] = useState<string>('')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (activeSceneId == null) {
      setSceneTitle('')
      return
    }
    window.electron!.scenes.get(activeSceneId).then((s: unknown) => {
      const scene = s as { title: string } | null
      setSceneTitle(scene?.title ?? '')
    })
  }, [activeSceneId])

  useEffect(() => {
    const el = musicRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    setPlaying(!el.paused)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [musicRef])

  const togglePlay = () => {
    const el = musicRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => { })
    else el.pause()
  }

  if (activeSceneId == null) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-border relative z-5 flex shrink-0 items-center justify-between border-b border-orange-500/20 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-400">Active scene:</span>
        <span className="text-sm text-amber-100/90">{sceneTitle || '...'}</span>
        <motion.button
          type="button"
          onClick={togglePlay}
          className="glow-border-hover rounded p-1.5 text-zinc-400 transition-colors hover:bg-orange-500/20 hover:text-amber-200"
          title={playing ? 'Pause' : 'Play'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </motion.button>
        <Link
          to={`/scenes/${activeSceneId}`}
          className="glow-border-hover flex items-center gap-1 rounded p-1.5 text-sm text-zinc-400 transition-colors hover:bg-orange-500/20 hover:text-amber-200"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open scene</span>
        </Link>
      </div>
    </motion.div>
  )
}
