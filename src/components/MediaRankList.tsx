import type { Media } from '../types/media'
import { TagPills } from './TagPills'
import { MediaRowContextMenu } from './MediaRowContextMenu'

type Props = {
  medias: Media[]
  onEditMedia: (index: number) => void
  onHypeRank: (index: number) => void
}

/**
 * All media in file order with global rank (#1 … #n).
 * Click opens the editor (same as the week grid). No section title — the tab indicates the view.
 */
export function MediaRankList({ medias, onEditMedia, onHypeRank }: Props) {
  if (medias.length === 0) {
    return (
      <section
        className="media-rank-list media-rank-list--empty"
        aria-label="Lista de ranking"
      >
        <p className="media-rank-list__hint">Ainda não há mídias na base.</p>
      </section>
    )
  }

  return (
    <section className="media-rank-list" aria-label="Lista de ranking">
      <ul className="media-rank-list__ul">
        {medias.map((m, index) => (
          <li key={index}>
            <RankRow
              media={m}
              index={index}
              onEditMedia={onEditMedia}
              onHypeRank={onHypeRank}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

type RowProps = {
  media: Media
  index: number
  onEditMedia: (index: number) => void
  onHypeRank: (index: number) => void
}

function RankRow({ media, index, onEditMedia, onHypeRank }: RowProps) {
  return (
    <MediaRowContextMenu
      mediaIndex={index}
      onEdit={onEditMedia}
      onHypeRank={onHypeRank}
    >
      <button
        type="button"
        className="media-rank-list__item"
        onClick={() => {
          // Desktop: edit only on double click.
          if (window.matchMedia('(pointer: fine)').matches) return
          onEditMedia(index)
        }}
        onDoubleClick={() => onEditMedia(index)}
        onKeyDown={(e) => {
          // Keep keyboard accessible on desktop.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEditMedia(index)
          }
        }}
      >
        <span className="media-rank-list__rank">#{index + 1}</span>
        <span className="media-rank-list__name">{media.name}</span>
        <TagPills
          media={media}
          className="tag-pills--end"
          abbreviateTagNamesMobile
        />
      </button>
    </MediaRowContextMenu>
  )
}
