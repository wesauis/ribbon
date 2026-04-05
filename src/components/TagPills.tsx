import { useMemo } from 'react'
import {
  firstDisplayTagAbbrevs,
  firstDisplayTags,
  type Media,
} from '../types/media'
import { useMediaQuery } from '../hooks/useMediaQuery'

type Props = {
  media: Media
  /** Extra class on the container (e.g. alignment in search results). */
  className?: string
  /**
   * On narrow viewports, abbreviate the tag **name** to one character; **value** stays fully visible.
   */
  abbreviateTagNamesMobile?: boolean
}

/** Up to two tags with non-empty names, rendered as pills. */
export function TagPills({
  media,
  className = '',
  abbreviateTagNamesMobile = false,
}: Props) {
  /* Match app “mobile” layouts (e.g. week grid at 2 columns for ≤900px). */
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
