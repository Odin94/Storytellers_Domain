import { Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'

export const StopAllButton = () => {
  const { stopAll } = usePlayback()
  return (
    <motion.button
      type="button"
      onClick={stopAll}
      className="glow-border glow-border-hover flex items-center gap-2 rounded-lg border border-orange-500/30 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-amber-100/90 backdrop-blur-sm transition-colors hover:border-orange-400/50 hover:bg-zinc-800/90 hover:text-amber-50"
      title="Stop all sounds"
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <Square className="h-4 w-4" />
      <span>Stop all</span>
    </motion.button>
  )
}
