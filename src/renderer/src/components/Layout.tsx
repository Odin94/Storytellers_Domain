import { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Music, LayoutDashboard, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'
import { StopAllButton } from '@/components/StopAllButton'
import { QuickSelectPanel } from '@/components/QuickSelectPanel'
import { ActiveSceneBar } from '@/components/ActiveSceneBar'

const COMING_SOON = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'npcs', label: 'NPCs' },
  { id: 'dice', label: 'Dice roller' },
  { id: 'hue', label: 'Philips Hue' },
  { id: 'alexa', label: 'Alexa' },
]

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { musicRef } = usePlayback()
  const [showComingSoon, setShowComingSoon] = useState(false)
  const moreDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showComingSoon) return
    const handleMouseDown = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setShowComingSoon(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showComingSoon])

  return (
    <div className="relative flex h-screen flex-col bg-black">
      <div className="bg-blur-orb">
        <div
          className="absolute -right-[20%] -top-[20%] h-[60vmax] w-[60vmax] rounded-full opacity-30 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[15%] -left-[15%] h-[50vmax] w-[50vmax] rounded-full opacity-25 blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.45) 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-[30%] top-[40%] h-[40vmax] w-[40vmax] rounded-full opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }}
        />
      </div>
      <audio ref={musicRef} preload="metadata" className="hidden" />
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 backdrop-blur-sm transition-shadow duration-300 hover:shadow-glow">
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="glow-border-hover flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 transition-colors hover:text-amber-200"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/audio"
            className="glow-border-hover flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:text-amber-200/90"
          >
            <Music className="h-5 w-5" />
            <span>Audio</span>
          </Link>
          <div ref={moreDropdownRef} className={`relative ${showComingSoon ? 'z-[100]' : ''}`}>
            <motion.button
              type="button"
              onClick={() => setShowComingSoon((s) => !s)}
              className="glow-border-hover flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-500 transition-colors hover:text-amber-200/80"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Coming soon"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">More</span>
            </motion.button>
            <AnimatePresence>
              {showComingSoon ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="glow-border absolute left-0 top-full z-[200] mt-1 w-40 rounded-lg border border-orange-500/30 bg-zinc-900/95 py-2 shadow-glow backdrop-blur-md"
                >
                  <p className="px-3 pb-1 text-xs font-medium text-zinc-500">Coming soon</p>
                  {COMING_SOON.map((item) => (
                    <div key={item.id} className="px-3 py-1 text-sm text-zinc-400">
                      {item.label}
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <QuickSelectPanel />
          <StopAllButton />
        </div>
      </header>
      <ActiveSceneBar />
      <main className="relative z-10 flex-1 overflow-auto">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
