import type { Media } from '../types/media'
import { WEEKDAYS_ORDER } from '../types/media'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  onEditMedia: (index: number) => void
}

export function WeekGrid({ medias, onEditMedia }: Props) {
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
                  <button
                    type="button"
                    className="week-grid__item"
                    onClick={() => onEditMedia(index)}
                  >
                    <span className="week-grid__name">{m.name}</span>
                    <TagPills media={m} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
