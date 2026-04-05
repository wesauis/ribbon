import { useCallback, useId, useMemo, useRef, useState } from 'react'
import type { Media } from '../types/media'
import { fuzzySearchMedias } from '../search/fuzzy'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  onOpenCreate: (nameFromQuery: string) => void
  onOpenMedia: (index: number) => void
}

export function MediaSearch({ medias, onOpenCreate, onOpenMedia }: Props) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState(0)

  const matched = useMemo(
    () => fuzzySearchMedias(medias, query),
    [medias, query],
  )

  const rowCount = 1 + matched.length

  const commit = useCallback(() => {
    if (activeRow === 0) {
      onOpenCreate(query.trim())
      setOpen(false)
      return
    }
    const slot = activeRow - 1
    if (slot >= 0 && slot < matched.length) {
      onOpenMedia(matched[slot].index)
      setOpen(false)
    }
  }, [activeRow, matched, onOpenCreate, onOpenMedia, query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveRow((r) => Math.min(r + 1, rowCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveRow((r) => Math.max(r - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="media-search">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open ? `${listId}-opt-${activeRow}` : undefined
        }
        placeholder="Buscar mídia ou criar…"
        value={query}
        onChange={(e) => {
          const v = e.target.value
          setQuery(v)
          setOpen(true)
          setActiveRow(
            fuzzySearchMedias(medias, v).length > 0 ? 1 : 0,
          )
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && (
        <ul id={listId} className="media-search__list" role="listbox">
          <li
            id={`${listId}-opt-0`}
            role="option"
            aria-selected={activeRow === 0}
            className={activeRow === 0 ? 'is-active' : ''}
            onMouseEnter={() => setActiveRow(0)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onOpenCreate(query.trim())
              setOpen(false)
            }}
          >
            Criar nova mídia…
          </li>
          {matched.map((m, i) => {
            const row = i + 1
            const media = medias[m.index]
            return (
              <li
                key={m.index}
                id={`${listId}-opt-${row}`}
                role="option"
                aria-selected={activeRow === row}
                className={
                  activeRow === row
                    ? 'media-search__option is-active'
                    : 'media-search__option'
                }
                onMouseEnter={() => setActiveRow(row)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onOpenMedia(m.index)
                  setOpen(false)
                }}
              >
                <span className="media-search__row">
                  <span className="media-search__name">
                    {media?.name ?? '?'}
                  </span>
                  {media && (
                    <TagPills media={media} className="tag-pills--end" />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
