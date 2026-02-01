import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'

type Game = { id: number; name: string; sortOrder: number }
type Scene = { id: number; gameId: number; title: string; description: string; imagePath: string | null; sortOrder: number }

export const DashboardPage = () => {
  const [games, setGames] = useState<Game[]>([])
  const [scenesByGame, setScenesByGame] = useState<Record<number, Scene[]>>({})
  const [newGameName, setNewGameName] = useState('')
  const { setActiveSceneId } = usePlayback()

  useEffect(() => {
    window.electron!.games.list().then((raw) => setGames((raw ?? []) as Game[]))
  }, [])

  useEffect(() => {
    const load = async () => {
      const byGame: Record<number, Scene[]> = {}
      for (const g of games) {
        const list = (await window.electron!.scenes.list(g.id)) as Scene[]
        byGame[g.id] = list ?? []
      }
      setScenesByGame(byGame)
    }
    load()
  }, [games])

  const addGame = async () => {
    if (!newGameName.trim()) return
    await window.electron!.games.create(newGameName.trim())
    setNewGameName('')
    window.electron!.games.list().then((raw) => setGames((raw ?? []) as Game[]))
  }

  const getSceneImageUrl = (imagePath: string | null): Promise<string> | null => {
    if (!imagePath || !window.electron) return null
    return window.electron.getAssetUrl(imagePath) as Promise<string>
  }

  return (
    <div className="relative z-10 p-6">
      <h1 className="gradient-text-warm mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? addGame() : undefined)}
          placeholder="New game name"
          className="glow-border-hover w-64 rounded-lg border border-orange-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 placeholder-zinc-500 backdrop-blur-sm transition-shadow focus:border-orange-400/50 focus:shadow-glow focus:outline-none"
        />
        <motion.button
          type="button"
          onClick={addGame}
          className="glow-btn flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-600/90 px-4 py-2 text-sm font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          Add game
        </motion.button>
      </div>

      <div className="space-y-8">
        {games.map((game) => (
          <section key={game.id}>
            <h2 className="gradient-text-warm mb-3 text-lg font-medium">{game.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(scenesByGame[game.id] ?? []).map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onActivate={() => setActiveSceneId(scene.id)}
                  getImageUrl={getSceneImageUrl}
                />
              ))}
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={`/scenes/new?gameId=${game.id}`}
                  className="glow-border-hover flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-orange-500/40 bg-zinc-900/50 text-zinc-500 transition-all hover:border-orange-400/60 hover:bg-orange-500/10 hover:text-amber-200/80"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add scene
                  </span>
                </Link>
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      {games.length === 0 ? (
        <p className="text-zinc-500">Add a game above, then add scenes to get started.</p>
      ) : null}
    </div>
  )
}

const SceneCard = ({
  scene,
  onActivate,
  getImageUrl,
}: {
  scene: Scene
  onActivate: () => void
  getImageUrl: (path: string | null) => Promise<string> | null
}) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  useEffect(() => {
    const p = getImageUrl(scene.imagePath)
    if (p) p.then(setImgUrl)
    else setImgUrl(null)
  }, [scene.imagePath, getImageUrl])

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glow-border-hover overflow-hidden rounded-lg border border-orange-500/20 bg-zinc-900/60 backdrop-blur-sm"
    >
      <Link to={`/scenes/${scene.id}`} className="block">
        <div className="aspect-video bg-zinc-800/80">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-zinc-100">{scene.title}</h3>
          <p className="line-clamp-2 text-sm text-zinc-500">{scene.description || 'No description'}</p>
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onActivate()
            }}
            className="glow-btn mt-2 rounded bg-gradient-to-r from-orange-600/80 to-amber-600/80 px-2 py-1 text-xs font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Activate scene
          </motion.button>
        </div>
      </Link>
    </motion.div>
  )
}
