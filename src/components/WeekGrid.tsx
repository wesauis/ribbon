import type { Media } from '../types/media'
import { WEEKDAYS_ORDER } from '../types/media'
import { TagPills } from './TagPills'
import { MediaRowContextMenu } from './MediaRowContextMenu'

type Props = {
  medias: Media[]
  onEditMedia: (index: number) => void
  onHype: (index: number) => void
}

export function WeekGrid({ medias, onEditMedia, onHype }: Props) {
  return (
    <div className="week-grid">
      {WEEKDAYS_ORDER.map((day) => (
        <section key={day} className="week-grid__col">
          <h2 className="week-grid__title">{day}</h2>
          <ul className="week-grid__list">
            {medias.map((m, index) => {
              if (!m.weekdays.has(day)) return null
              return (
                <li key={`${index}-${day}`}>
                  <WeekRow
                    media={m}
                    index={index}
                    onEditMedia={onEditMedia}
                    onHype={onHype}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

type RowProps = {
  media: Media
  index: number
  onEditMedia: (index: number) => void
  onHype: (index: number) => void
}

function WeekRow({ media, index, onEditMedia, onHype }: RowProps) {
  return (
    <MediaRowContextMenu
      mediaIndex={index}
      onEdit={onEditMedia}
      onHype={onHype}
    >
      <button
        type="button"
        className="week-grid__item"
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
        <span className="week-grid__name">{media.name}</span>
        <TagPills media={media} />
      </button>
    </MediaRowContextMenu>
  )
}
