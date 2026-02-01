import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'

type IconComponent = React.ComponentType<{ size?: number; className?: string }>

const LUCIDE_MAP: Record<string, IconComponent> = {}
for (const [name, value] of Object.entries(LucideIcons)) {
  if (typeof value === 'function' && name[0] === name[0].toUpperCase()) {
    LUCIDE_MAP[name.toLowerCase()] = value as IconComponent
  }
}

export const LUCIDE_ICON_NAMES = Object.keys(LUCIDE_MAP).sort()

type Props = {
  imagePath: string | null
  icon: string | null
  className?: string
  size?: number
}

export const AudioFileImageOrIcon = ({ imagePath, icon, className = '', size = 24 }: Props) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imagePath || !window.electron) {
      setImgUrl(null)
      return
    }
    window.electron.getAssetUrl(imagePath).then(setImgUrl)
  }, [imagePath])

  if (imagePath && imgUrl) {
    return (
      <img
        src={imgUrl}
        alt=""
        className={`shrink-0 rounded object-cover ${className}`}
        width={size}
        height={size}
      />
    )
  }

  if (icon && icon.trim()) {
    const trimmed = icon.trim()
    const lower = trimmed.toLowerCase()
    const IconComponent = LUCIDE_MAP[lower]
    if (IconComponent) {
      return <IconComponent size={size} className={`shrink-0 text-amber-400/90 ${className}`} />
    }
    return (
      <span className={`flex shrink-0 items-center justify-center text-base ${className}`} style={{ width: size, height: size }}>
        {trimmed}
      </span>
    )
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded bg-zinc-700/50 text-zinc-500 ${className}`}
      style={{ width: size, height: size }}
    >
      —
    </span>
  )
}
