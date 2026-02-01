import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Music, Volume2, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { AudioFileImageOrIcon, LUCIDE_ICON_NAMES } from '@/components/AudioFileImageOrIcon'

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

export const AudioPage = () => {
  const [existing, setExisting] = useState<AudioFile[]>([])
  const [newPaths, setNewPaths] = useState<string[]>([])
  const [scanPath, setScanPath] = useState<string | null>(null)

  useEffect(() => {
    window.electron!.audioFiles.list().then((raw) => setExisting((raw ?? []) as AudioFile[]))
  }, [])

  const pickFolder = async () => {
    const path = await window.electron!.dialogOpenDirectory()
    if (!path) return
    setScanPath(path)
    const paths = await window.electron!.scanAudioFolder(path)
    const inDb = new Set(existing.map((a) => a.path))
    setNewPaths(paths.filter((p) => !inDb.has(p)))
  }

  const addToLibrary = async (filePath: string, name: string, category: 'music' | 'effect') => {
    await window.electron!.audioFiles.create({
      path: filePath,
      name: name || (filePath.split(/[/\\]/).pop() ?? 'Audio'),
      category,
      quickSelect: false,
      randomPitch: false,
    })
    window.electron!.audioFiles.list().then((raw) => setExisting((raw ?? []) as AudioFile[]))
    setNewPaths((prev) => prev.filter((p) => p !== filePath))
  }

  const toggleQuickSelect = async (id: number, current: boolean) => {
    await window.electron!.audioFiles.update(id, { quickSelect: !current })
    window.electron!.audioFiles.list().then((raw) => setExisting((raw ?? []) as AudioFile[]))
  }

  const toggleRandomPitch = async (id: number, current: boolean) => {
    await window.electron!.audioFiles.update(id, { randomPitch: !current })
    window.electron!.audioFiles.list().then((raw) => setExisting((raw ?? []) as AudioFile[]))
  }

  const [editingAudio, setEditingAudio] = useState<AudioFile | null>(null)

  const refreshList = () => {
    window.electron!.audioFiles.list().then((raw) => setExisting((raw ?? []) as AudioFile[]))
  }

  return (
    <div className="relative z-10 p-6">
      <h1 className="gradient-text-warm mb-6 text-2xl font-semibold">Audio</h1>

      <div className="mb-6">
        <motion.button
          type="button"
          onClick={pickFolder}
          className="glow-btn flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-600/90 px-4 py-2 text-sm font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <FolderOpen className="h-4 w-4" />
          Scan folder for new audio
        </motion.button>
      </div>

      {newPaths.length > 0 ? (
        <section className="mb-8">
          <h2 className="gradient-text-warm mb-3 text-lg font-medium">New audio files</h2>
          <p className="mb-2 text-sm text-zinc-500">
            Add files to your library. Choose a name and category (music or effect).
          </p>
          <ul className="glow-border glow-border-hover space-y-2 rounded-lg border border-orange-500/20 bg-zinc-900/60 p-3 backdrop-blur-sm">
            {newPaths.map((filePath) => (
              <NewAudioRow key={filePath} filePath={filePath} onAdd={addToLibrary} />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="gradient-text-warm mb-3 text-lg font-medium">Library</h2>
        <div className="glow-border overflow-x-auto rounded-lg border border-orange-500/20 bg-zinc-900/60 backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-500/20 bg-zinc-800/50">
                <th className="w-12 px-2 py-2 text-left font-medium text-zinc-400" />
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Category</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Quick select</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Random pitch</th>
                <th className="w-16 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {existing.map((a) => (
                <tr key={a.id} className="border-b border-orange-500/10 last:border-0">
                  <td className="px-2 py-2">
                    <AudioFileImageOrIcon imagePath={a.imagePath} icon={a.icon} size={28} />
                  </td>
                  <td className="px-3 py-2 text-zinc-200">{a.name}</td>
                  <td className="px-3 py-2">
                    <span className="flex w-fit items-center gap-1">
                      {a.category === 'music' ? <Music className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {a.category}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <motion.button
                      type="button"
                      onClick={() => toggleQuickSelect(a.id, a.quickSelect)}
                      className={`rounded px-2 py-0.5 text-xs transition-colors ${a.quickSelect ? 'bg-orange-500/80 text-amber-50 shadow-glow' : 'bg-zinc-700 text-zinc-400 hover:bg-orange-500/30 hover:text-amber-100'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {a.quickSelect ? 'Yes' : 'No'}
                    </motion.button>
                  </td>
                  <td className="px-3 py-2">
                    {a.category === 'effect' ? (
                      <motion.button
                        type="button"
                        onClick={() => toggleRandomPitch(a.id, a.randomPitch)}
                        className={`rounded px-2 py-0.5 text-xs transition-colors ${a.randomPitch ? 'bg-orange-500/80 text-amber-50 shadow-glow' : 'bg-zinc-700 text-zinc-400 hover:bg-orange-500/30 hover:text-amber-100'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {a.randomPitch ? 'On' : 'Off'}
                      </motion.button>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <motion.button
                      type="button"
                      onClick={() => setEditingAudio(a)}
                      className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-orange-500/20 hover:text-amber-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Edit image/icon"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editingAudio ? (
          <EditAudioModal
            file={editingAudio}
            onClose={() => setEditingAudio(null)}
            onSaved={() => {
              refreshList()
              setEditingAudio(null)
            }}
          />
        ) : null}
        {existing.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No audio in library. Scan a folder to add files.</p>
        ) : null}
      </section>
    </div>
  )
}

const SUGGESTIONS_MAX = 12

const EditAudioModal = ({
  file,
  onClose,
  onSaved,
}: {
  file: AudioFile
  onClose: () => void
  onSaved: () => void
}) => {
  const [name, setName] = useState(file.name)
  const [imagePath, setImagePath] = useState<string | null>(file.imagePath)
  const [icon, setIcon] = useState(file.icon ?? '')
  const [showIconSuggestions, setShowIconSuggestions] = useState(false)
  const iconInputRef = useRef<HTMLDivElement>(null)

  const iconSuggestions = icon.trim()
    ? LUCIDE_ICON_NAMES.filter((n) => n.toLowerCase().includes(icon.toLowerCase())).slice(0, SUGGESTIONS_MAX)
    : LUCIDE_ICON_NAMES.slice(0, SUGGESTIONS_MAX)

  useEffect(() => {
    if (!showIconSuggestions) return
    const handleMouseDown = (e: MouseEvent) => {
      if (iconInputRef.current && !iconInputRef.current.contains(e.target as Node)) {
        setShowIconSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showIconSuggestions])

  const setImage = async () => {
    const path = await window.electron!.dialogOpenFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    })
    if (path) {
      await window.electron!.audioFiles.update(file.id, { imagePath: path, icon: null })
      setImagePath(path)
      setIcon('')
    }
  }

  const clearImage = async () => {
    await window.electron!.audioFiles.update(file.id, { imagePath: null })
    setImagePath(null)
  }

  const saveIcon = async () => {
    const val = icon.trim() || null
    await window.electron!.audioFiles.update(file.id, { icon: val, imagePath: null })
    setImagePath(null)
    onSaved()
  }

  const saveName = async () => {
    if (name.trim() !== file.name) {
      await window.electron!.audioFiles.update(file.id, { name: name.trim() })
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glow-border w-full max-w-md rounded-xl border border-orange-500/30 bg-zinc-900 p-6 shadow-glow"
      >
        <h3 className="gradient-text-warm mb-4 text-lg font-semibold">Edit audio</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-orange-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Image or icon</label>
            <div className="flex items-center gap-2">
              <AudioFileImageOrIcon imagePath={imagePath} icon={icon.trim() || null} size={40} />
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  onClick={setImage}
                  className="rounded-lg border border-orange-500/30 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-orange-500/20 hover:text-amber-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Set image
                </motion.button>
                {imagePath ? (
                  <motion.button
                    type="button"
                    onClick={clearImage}
                    className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear
                  </motion.button>
                ) : null}
              </div>
            </div>
            <div ref={iconInputRef} className="relative mt-2">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                onFocus={() => setShowIconSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowIconSuggestions(false), 150)
                  setTimeout(saveIcon, 200)
                }}
                placeholder="Emoji or Lucide name (music, volume2…)"
                className="glow-border-hover w-full rounded-lg border border-orange-500/30 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none"
              />
              {showIconSuggestions ? (
                <ul className="glow-border absolute left-0 right-0 top-full z-[100] mt-1 max-h-48 overflow-auto rounded-lg border border-orange-500/30 bg-zinc-900 py-1 shadow-glow">
                  {iconSuggestions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-zinc-500">No matching icons</li>
                  ) : (
                    iconSuggestions.map((iconName) => (
                      <li key={iconName}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setIcon(iconName)
                            setShowIconSuggestions(false)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-amber-100"
                        >
                          <AudioFileImageOrIcon imagePath={null} icon={iconName} size={20} />
                          <span>{iconName}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <motion.button
            type="button"
            onClick={onClose}
            className="glow-border-hover rounded-lg border border-orange-500/30 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            whileTap={{ scale: 0.98 }}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

const NewAudioRow = ({
  filePath,
  onAdd,
}: {
  filePath: string
  onAdd: (path: string, name: string, category: 'music' | 'effect') => void
}) => {
  const [name, setName] = useState(filePath.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, ''))
  const [category, setCategory] = useState<'music' | 'effect'>('music')

  return (
    <li className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="glow-border-hover min-w-[160px] rounded border border-orange-500/30 bg-zinc-900/80 px-2 py-1 text-zinc-100 transition-shadow focus:border-orange-400/50 focus:shadow-glow focus:outline-none"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as 'music' | 'effect')}
        className="glow-border-hover rounded border border-orange-500/30 bg-zinc-900/80 px-2 py-1 text-zinc-100 transition-shadow focus:border-orange-400/50 focus:outline-none"
      >
        <option value="music">Music</option>
        <option value="effect">Effect</option>
      </select>
      <motion.button
        type="button"
        onClick={() => onAdd(filePath, name, category)}
        className="glow-btn rounded bg-gradient-to-r from-orange-600/80 to-amber-600/80 px-2 py-1 text-sm font-medium text-amber-50 shadow-glow hover:from-orange-500 hover:to-amber-500"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Add to library
      </motion.button>
    </li>
  )
}
