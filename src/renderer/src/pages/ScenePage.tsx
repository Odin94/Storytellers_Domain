import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Play, Square, Music, Volume2, ArrowLeft, Pencil, Plus, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayback } from '@/contexts/PlaybackContext'

type SceneWithAudio = {
  scene: { id: number; gameId: number; title: string; description: string; imagePath: string | null }
  music: Array<{ id: number; path: string; name: string; isDefault: boolean }>
  soundEffects: Array<{ id: number; path: string; name: string; randomPitch?: boolean }>
}

export const ScenePage = () => {
  const { sceneId } = useParams<{ sceneId: string }>()
  const [searchParams] = useSearchParams()
  const gameIdParam = searchParams.get('gameId')
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : null
  const isNew = sceneId === 'new'
  const id = isNew ? null : (sceneId ? parseInt(sceneId, 10) : null)
  const [data, setData] = useState<SceneWithAudio | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingScene, setEditingScene] = useState(false)
  const [addMusicOpen, setAddMusicOpen] = useState(false)
  const [addEffectOpen, setAddEffectOpen] = useState(false)
  const navigate = useNavigate()
  const { setActiveSceneId, playMusicUrl, stopMusic, playingMusicPathKey, musicProgress } = usePlayback()

  useEffect(() => {
    if (id == null || Number.isNaN(id)) {
      setData(null)
      return
    }
    window.electron!.scenes.getWithAudio(id).then((raw) => setData(raw as SceneWithAudio | null))
  }, [id])

  useEffect(() => {
    if (data?.scene?.imagePath) window.electron!.getAssetUrl(data.scene.imagePath).then(setImgUrl)
    else setImgUrl(null)
  }, [data?.scene?.imagePath])

  if (isNew && gameId != null && !Number.isNaN(gameId)) {
    return (
      <CreateSceneForm gameId={gameId} onCreated={(newId) => navigate(`/scenes/${newId}`)} onCancel={() => navigate('/')} />
    )
  }

  const activateScene = () => {
    if (id != null && !Number.isNaN(id)) setActiveSceneId(id)
    const defaultTrack = data?.music.find((m) => m.isDefault)
    if (defaultTrack) {
      window.electron!.getAssetUrl(defaultTrack.path).then((url) => playMusicUrl(url, defaultTrack.path))
    }
  }

  const playMusic = (path: string) => {
    window.electron!.getAssetUrl(path).then((url) => playMusicUrl(url, path))
  }

  if (id == null || Number.isNaN(id)) {
    if (!isNew) {
      return (
        <div className="p-6">
          <Link to="/" className="text-zinc-400 hover:text-white">Back to dashboard</Link>
          <p className="mt-4 text-zinc-500">Invalid scene.</p>
        </div>
      )
    }
    if (gameId == null || Number.isNaN(gameId)) {
      return (
        <div className="p-6">
          <Link to="/" className="text-zinc-400 hover:text-white">Back to dashboard</Link>
          <p className="mt-4 text-zinc-500">Select a game to add a scene.</p>
        </div>
      )
    }
  }

  if (data == null) {
    return (
      <div className="p-6">
        <Link to="/" className="text-zinc-400 hover:text-white">Back to dashboard</Link>
        <p className="mt-4 text-zinc-500">Loading...</p>
      </div>
    )
  }

  const { scene, music, soundEffects } = data

  const refreshScene = () => {
    if (id == null || Number.isNaN(id)) return
    window.electron!.scenes.getWithAudio(id).then((raw) => setData(raw as SceneWithAudio | null))
  }

  const removeMusic = async (audioFileId: number) => {
    if (id == null) return
    await window.electron!.sceneMusic.remove(id, audioFileId)
    refreshScene()
  }

  const removeEffect = async (audioFileId: number) => {
    if (id == null) return
    await window.electron!.sceneSoundEffects.remove(id, audioFileId)
    refreshScene()
  }

  return (
    <div className="relative z-10 p-6">
      <div className="mb-4 flex items-center gap-4">
        <Link
          to="/"
          className="glow-border-hover flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:text-amber-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <motion.button
          type="button"
          onClick={() => setEditMode((e) => !e)}
          className={`glow-border-hover flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors ${editMode ? 'bg-orange-500/30 text-amber-200' : 'text-zinc-400 hover:text-amber-200'}`}
          whileTap={{ scale: 0.98 }}
        >
          <Pencil className="h-4 w-4" />
          Edit mode
        </motion.button>
      </div>

      {editingScene ? (
        <EditSceneForm
          scene={scene}
          onClose={() => setEditingScene(false)}
          onSaved={() => {
            refreshScene()
            setEditingScene(false)
          }}
        />
      ) : null}

      <div className="mb-6 flex gap-6">
        <div className="glow-border glow-border-hover w-64 shrink-0 overflow-hidden rounded-lg border border-orange-500/20 bg-zinc-900/60 backdrop-blur-sm">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center text-zinc-600">
              <span>No image</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="gradient-text-warm text-2xl font-semibold">{scene.title}</h1>
            {editMode ? (
              <motion.button
                type="button"
                onClick={() => setEditingScene(true)}
                className="glow-border-hover rounded p-1 text-zinc-500 hover:text-amber-200"
                whileTap={{ scale: 0.95 }}
                title="Edit scene"
              >
                <Pencil className="h-4 w-4" />
              </motion.button>
            ) : null}
          </div>
          <p className="mt-2 text-zinc-400">{scene.description || 'No description'}</p>
          <motion.button
            type="button"
            onClick={activateScene}
            className="glow-btn mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-600/90 px-4 py-2 text-sm font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="h-4 w-4" />
            Activate scene
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="gradient-text-warm flex items-center gap-2 text-lg font-medium">
              <Music className="h-5 w-5" />
              Background music
            </h2>
            {editMode ? (
              <motion.button
                type="button"
                onClick={() => setAddMusicOpen(true)}
                className="glow-border-hover flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:text-amber-200"
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-3 w-3" />
                Add
              </motion.button>
            ) : null}
          </div>
          <ul className="glow-border glow-border-hover space-y-1 rounded-lg border border-orange-500/20 bg-zinc-900/50 p-2 backdrop-blur-sm">
            {music.length === 0 ? (
              <li className="px-2 py-1 text-sm text-zinc-500">No music assigned</li>
            ) : (
              music.map((m) => {
                const isPlaying = playingMusicPathKey === m.path
                const duration = musicProgress.duration
                const progress =
                  isPlaying && duration > 0
                    ? (musicProgress.current % duration) / duration
                    : 0
                return (
                  <li key={m.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      {isPlaying ? (
                        <motion.button
                          type="button"
                          onClick={stopMusic}
                          className="flex shrink-0 rounded p-1 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                          whileTap={{ scale: 0.95 }}
                          title="Stop"
                        >
                          <Square className="h-4 w-4 fill-current" />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => playMusic(m.path)}
                          className="flex shrink-0 rounded p-1 text-zinc-400 hover:bg-orange-500/20 hover:text-amber-200"
                          whileTap={{ scale: 0.95 }}
                          title="Play"
                        >
                          <Play className="h-4 w-4" />
                        </motion.button>
                      )}
                      <span className="min-w-0 flex-1 truncate px-1 py-1 text-sm text-zinc-200">
                        {m.name}
                        {m.isDefault ? ' (default)' : ''}
                      </span>
                      {editMode ? (
                        <motion.button
                          type="button"
                          onClick={() => removeMusic(m.id)}
                          className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-300"
                          whileTap={{ scale: 0.95 }}
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      ) : null}
                    </div>
                    {isPlaying ? (
                      <div className="h-1 overflow-hidden rounded-full bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-amber-500/80 transition-[width] duration-150"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    ) : null}
                  </li>
                )
              })
            )}
          </ul>
          {addMusicOpen && id != null ? (
            <AddAudioModal
              category="music"
              sceneId={id}
              existingIds={music.map((m) => m.id)}
              onAdd={async (audioId, isDefault) => {
                await window.electron!.sceneMusic.add(id!, audioId, isDefault ?? false)
                refreshScene()
                setAddMusicOpen(false)
              }}
              onClose={() => setAddMusicOpen(false)}
            />
          ) : null}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="gradient-text-warm flex items-center gap-2 text-lg font-medium">
              <Volume2 className="h-5 w-5" />
              Sound effects
            </h2>
            {editMode ? (
              <motion.button
                type="button"
                onClick={() => setAddEffectOpen(true)}
                className="glow-border-hover flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:text-amber-200"
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-3 w-3" />
                Add
              </motion.button>
            ) : null}
          </div>
          <ul className="glow-border glow-border-hover space-y-1 rounded-lg border border-orange-500/20 bg-zinc-900/50 p-2 backdrop-blur-sm">
            {soundEffects.length === 0 ? (
              <li className="px-2 py-1 text-sm text-zinc-500">No effects assigned</li>
            ) : (
              soundEffects.map((e) => (
                <li key={e.id} className="flex items-center gap-1">
                  <SoundEffectButton
                    id={e.id}
                    path={e.path}
                    name={e.name}
                    randomPitch={e.randomPitch ?? false}
                  />
                  {editMode ? (
                    <motion.button
                      type="button"
                      onClick={() => removeEffect(e.id)}
                      className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-300"
                      whileTap={{ scale: 0.95 }}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {addEffectOpen && id != null ? (
            <AddAudioModal
              category="effect"
              sceneId={id}
              existingIds={soundEffects.map((e) => e.id)}
              onAdd={async (audioId) => {
                await window.electron!.sceneSoundEffects.add(id!, audioId)
                refreshScene()
                setAddEffectOpen(false)
              }}
              onClose={() => setAddEffectOpen(false)}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}

type AudioFileRow = { id: number; name: string; category: 'music' | 'effect' }

const AddAudioModal = ({
  category,
  existingIds,
  onAdd,
  onClose,
}: {
  category: 'music' | 'effect'
  sceneId: number
  existingIds: number[]
  onAdd: (audioId: number, isDefault?: boolean) => void
  onClose: () => void
}) => {
  const [list, setList] = useState<AudioFileRow[]>([])
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    window.electron!.audioFiles.list().then((raw) => {
      const all = (raw ?? []) as AudioFileRow[]
      setList(all.filter((a) => a.category === category && !existingIds.includes(a.id)))
    })
  }, [category, existingIds])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glow-border max-h-[70vh] w-full max-w-sm overflow-hidden rounded-xl border border-orange-500/30 bg-zinc-900 shadow-glow"
      >
        <div className="border-b border-orange-500/20 p-3">
          <h3 className="gradient-text-warm font-medium">
            Add {category === 'music' ? 'music' : 'sound effect'}
          </h3>
        </div>
        {category === 'music' ? (
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-orange-500/50"
            />
            Set as default
          </label>
        ) : null}
        <ul className="max-h-60 overflow-auto p-2">
          {list.length === 0 ? (
            <li className="px-2 py-2 text-sm text-zinc-500">No {category} in library.</li>
          ) : (
            list.map((a) => (
              <li key={a.id}>
                <motion.button
                  type="button"
                  onClick={() => onAdd(a.id, category === 'music' ? isDefault : undefined)}
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-orange-500/15 hover:text-amber-100"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {a.name}
                </motion.button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-orange-500/20 p-2">
          <motion.button
            type="button"
            onClick={onClose}
            className="glow-border-hover w-full rounded-lg border border-orange-500/30 py-2 text-sm text-zinc-300"
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

const EditSceneForm = ({
  scene,
  onClose,
  onSaved,
}: {
  scene: { id: number; title: string; description: string; imagePath: string | null }
  onClose: () => void
  onSaved: () => void
}) => {
  const [title, setTitle] = useState(scene.title)
  const [description, setDescription] = useState(scene.description)
  const [imagePath, setImagePath] = useState<string | null>(scene.imagePath)

  const pickImage = async () => {
    const path = await window.electron!.dialogOpenFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    })
    if (path) setImagePath(path)
  }

  const save = async () => {
    await window.electron!.scenes.update(scene.id, { title, description, imagePath: imagePath ?? undefined })
    onSaved()
  }

  return (
    <div className="glow-border mb-6 rounded-xl border border-orange-500/30 bg-zinc-900/80 p-4 backdrop-blur-sm">
      <h3 className="gradient-text-warm mb-3 font-medium">Edit scene</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-orange-400/50 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-orange-400/50 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={pickImage}
            className="glow-border-hover rounded-lg border border-orange-500/30 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
            whileTap={{ scale: 0.98 }}
          >
            {imagePath ? 'Change image' : 'Choose image'}
          </motion.button>
          {imagePath ? (
            <motion.button
              type="button"
              onClick={() => setImagePath(null)}
              className="rounded-lg border border-zinc-600 px-2 py-1.5 text-xs text-zinc-400"
              whileTap={{ scale: 0.98 }}
            >
              Clear
            </motion.button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={save}
            className="glow-btn rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-600/90 px-4 py-2 text-sm font-medium text-amber-50"
            whileTap={{ scale: 0.98 }}
          >
            Save
          </motion.button>
          <motion.button
            type="button"
            onClick={onClose}
            className="glow-border-hover rounded-lg border border-orange-500/30 px-4 py-2 text-sm text-zinc-300"
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </div>
  )
}

const CreateSceneForm = ({
  gameId,
  onCreated,
  onCancel,
}: {
  gameId: number
  onCreated: (id: number) => void
  onCancel: () => void
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const pickImage = async () => {
    const path = await window.electron!.dialogOpenFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    })
    if (path) setImagePath(path)
  }

  const submit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const scene = (await window.electron!.scenes.create({
        gameId,
        title: title.trim(),
        description: description.trim(),
        imagePath: imagePath ?? undefined,
      })) as { id: number }
      onCreated(scene.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative z-10 p-6">
      <div className="mb-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="glow-border-hover flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:text-amber-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="gradient-text-warm text-xl font-semibold">New scene</h1>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 placeholder-zinc-500 backdrop-blur-sm transition-shadow focus:border-orange-400/50 focus:shadow-glow focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 placeholder-zinc-500 backdrop-blur-sm transition-shadow focus:border-orange-400/50 focus:shadow-glow focus:outline-none"
        />
        <div>
          <motion.button
            type="button"
            onClick={pickImage}
            className="glow-border-hover rounded-lg border border-orange-500/30 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300 backdrop-blur-sm transition-colors hover:border-orange-400/50 hover:text-amber-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {imagePath ? 'Change image' : 'Choose image'}
          </motion.button>
        </div>
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={submit}
            disabled={saving || !title.trim()}
            className="glow-btn rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-600/90 px-4 py-2 text-sm font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500 disabled:opacity-50"
            whileHover={saving || !title.trim() ? {} : { scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? 'Creating…' : 'Create scene'}
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            className="glow-border-hover rounded-lg border border-orange-500/30 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-amber-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </div>
  )
}

const SoundEffectButton = ({
  id,
  path,
  name,
  randomPitch = false,
}: {
  id: number
  path: string
  name: string
  randomPitch?: boolean
}) => {
  const [url, setUrl] = useState<string | null>(null)
  const { playSfxUrl, stopSfx, sfxProgress } = usePlayback()
  const key = `effect-${id}`
  const isPlaying = key in sfxProgress
  const progress = sfxProgress[key] ?? 0

  useEffect(() => {
    window.electron!.getAssetUrl(path).then(setUrl)
  }, [path])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <motion.button
            type="button"
            onClick={() => stopSfx(key)}
            className="flex shrink-0 rounded p-1 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            whileTap={{ scale: 0.95 }}
            title="Stop"
          >
            <Square className="h-4 w-4 fill-current" />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={() => (url ? playSfxUrl(url, randomPitch, key) : undefined)}
            className="flex shrink-0 rounded p-1 text-zinc-400 hover:bg-orange-500/20 hover:text-amber-200"
            whileTap={{ scale: 0.95 }}
            title="Play"
          >
            <Play className="h-4 w-4" />
          </motion.button>
        )}
        <span className="min-w-0 flex-1 truncate px-1 py-1 text-sm text-zinc-200">{name}</span>
      </div>
      {isPlaying ? (
        <div className="h-1 overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-amber-500/80 transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
