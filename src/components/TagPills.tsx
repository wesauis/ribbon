import type { Media } from '../types/media'
import { firstDisplayTags } from '../types/media'

type Props = {
  media: Media
  /** Classe extra no contentor (ex. alinhamento na lista de busca). */
  className?: string
}

/** Até duas tags com nome não vazio, em formato pill. */
export function TagPills({ media, className = '' }: Props) {
  const labels = firstDisplayTags(media, 2)
  if (labels.length === 0) return null
  return (
    <div className={`tag-pills ${className}`.trim()}>
      {labels.map((text, i) => (
        <span key={i} className="tag-pills__pill">
          {text}
        </span>
      ))}
    </div>
  )
}
