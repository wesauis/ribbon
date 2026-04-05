import { useMemo } from 'react'
import {
  firstDisplayTagAbbrevs,
  firstDisplayTags,
  type Media,
} from '../types/media'
import { useMediaQuery } from '../hooks/useMediaQuery'

type Props = {
  media: Media
  /** Classe extra no contentor (ex. alinhamento na lista de busca). */
  className?: string
  /**
   * Em viewports estreitas, abrevia o **nome** a 1 carácter; o **valor** mantém-se sempre completo.
   */
  abbreviateTagNamesMobile?: boolean
}

/** Até duas tags com nome não vazio, em formato pill. */
export function TagPills({
  media,
  className = '',
  abbreviateTagNamesMobile = false,
}: Props) {
  /* Alinha com layouts “mobile” da app (ex. grelha a 2 colunas em ≤900px). */
  const narrow = useMediaQuery('(max-width: 900px)')
  const useAbbrev = abbreviateTagNamesMobile && narrow

  const content = useMemo(() => {
    if (useAbbrev) {
      const rows = firstDisplayTagAbbrevs(media, 2)
      if (rows.length === 0) return null
      return (
        <>
          {rows.map((row, i) => (
            <span
              key={i}
              className="tag-pills__pill tag-pills__pill--abbr"
              title={row.ariaLabel}
              aria-label={row.ariaLabel}
            >
              {row.displayText}
            </span>
          ))}
        </>
      )
    }
    const labels = firstDisplayTags(media, 2)
    if (labels.length === 0) return null
    return (
      <>
        {labels.map((text, i) => (
          <span key={i} className="tag-pills__pill">
            {text}
          </span>
        ))}
      </>
    )
  }, [media, useAbbrev])

  if (content === null) return null

  return (
    <div className={`tag-pills ${className}`.trim()}>
      {content}
    </div>
  )
}
