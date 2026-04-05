import type { Media } from '../types/media'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  onEditMedia: (index: number) => void
}

/**
 * Lista todas as mídias na ordem do ficheiro com rank global (#1 … #n).
 * Clicar abre o editor (igual à grelha semanal). Sem título — o separador já indica a vista.
 */
export function MediaRankList({ medias, onEditMedia }: Props) {
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
            <button
              type="button"
              className="media-rank-list__item"
              onClick={() => onEditMedia(index)}
            >
              <span className="media-rank-list__rank">#{index + 1}</span>
              <span className="media-rank-list__name">{m.name}</span>
              <TagPills
                media={m}
                className="tag-pills--end"
                abbreviateTagNamesMobile
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
