import { Check } from '@phosphor-icons/react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import type { Media, Tag, Weekday } from '../types/media'
import { WEEKDAYS_ORDER } from '../types/media'

type Props = {
  media: Media
  knownTagNames: string[]
  onChange: (next: Media) => void
  onClose: () => void
  /** Delete this media from the store and close the dialog (after confirmation). */
  onDelete: () => void
}

type TagRowPhase = 'name' | 'value'

function ensureTrailingTagRow(tags: Tag[]): Tag[] {
  const out = tags.map((t) => [...t] as Tag)
  const last = out[out.length - 1]
  if (last && last[0].trim() !== '') {
    out.push(['', ''])
  }
  if (out.length === 0) out.push(['', ''])
  return out
}

/** Index of the last tag with a non-empty name, or -1 if none. */
function lastTagNameIndex(tags: Tag[]): number {
  let last = -1
  for (let i = 0; i < tags.length; i++) {
    if (tags[i][0].trim() !== '') last = i
  }
  return last
}

function scrollFieldIntoView(el: HTMLElement | null) {
  if (!el) return
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function initialTagPhases(tags: Tag[]): TagRowPhase[] {
  return tags.map((t) => (t[0].trim() === '' ? 'name' : 'value'))
}

function rowPhase(phases: TagRowPhase[], i: number, row: Tag): TagRowPhase {
  if (row[0].trim() === '') return 'name'
  return phases[i] ?? 'value'
}

/**
 * Edit media (name, weekdays, tags) in a modal dialog.
 * Initial focus: empty name → name field; at least one named tag → last tag value; otherwise no tag autofocus.
 */
export function MediaEditor({
  media,
  knownTagNames,
  onChange,
  onClose,
  onDelete,
}: Props) {
  const datalistId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const tagNameRefs = useRef<(HTMLInputElement | null)[]>([])
  const tagValueRefs = useRef<(HTMLInputElement | null)[]>([])
  /** Phase switch schedules focus; refs are null until the next commit (value vs name are different nodes). */
  const pendingFocusTagNameIndex = useRef<number | null>(null)
  const pendingFocusTagValueIndex = useRef<number | null>(null)

  const [tagPhases, setTagPhases] = useState<TagRowPhase[]>(() => initialTagPhases(media.tags))

  const sortedKnown = useMemo(
    () => [...new Set(knownTagNames)].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [knownTagNames],
  )

  useEffect(() => {
    setTagPhases((prev) => {
      const n = media.tags.length
      if (n === prev.length) return prev
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, () => 'name' satisfies TagRowPhase)]
      }
      return prev.slice(0, n)
    })
  }, [media.tags.length])

  useLayoutEffect(() => {
    const vIdx = pendingFocusTagValueIndex.current
    if (vIdx !== null) {
      pendingFocusTagValueIndex.current = null
      const vel = tagValueRefs.current[vIdx]
      if (vel) {
        vel.focus()
        scrollFieldIntoView(vel)
      }
    }
    const nIdx = pendingFocusTagNameIndex.current
    if (nIdx !== null) {
      pendingFocusTagNameIndex.current = null
      const nel = tagNameRefs.current[nIdx]
      if (nel) {
        nel.focus()
        const len = nel.value.length
        nel.setSelectionRange(len, len)
        scrollFieldIntoView(nel)
      }
    }
  }, [tagPhases])

  useEffect(() => {
    queueMicrotask(() => {
      const nameFilled = media.name.trim() !== ''
      if (!nameFilled) {
        nameRef.current?.focus()
        nameRef.current?.select()
        scrollFieldIntoView(nameRef.current)
        return
      }
      const tagIdx = lastTagNameIndex(media.tags)
      if (tagIdx < 0) {
        return
      }
      const el = tagValueRefs.current[tagIdx]
      el?.focus()
      scrollFieldIntoView(el)
    })
    /* Mount only: avoid stealing focus while editing fields. */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial focus only on mount
  }, [])

  const update = (next: Media) => {
    onChange({ ...next, tags: ensureTrailingTagRow(next.tags) })
  }

  const setName = (name: string) => {
    update({ ...media, name })
  }

  const toggleDay = (d: Weekday) => {
    const ws = new Set(media.weekdays)
    if (ws.has(d)) ws.delete(d)
    else ws.add(d)
    update({ ...media, weekdays: ws })
  }

  /** Apply a tag cell change; returns false if the name duplicates another row (name column only). */
  const setTag = (i: number, col: 0 | 1, val: string): boolean => {
    const tags = media.tags.map((row, j) =>
      j === i ? (col === 0 ? ([val, row[1]] as Tag) : ([row[0], val] as Tag)) : row,
    )
    if (col === 0) {
      const n = val.trim()
      if (n && tags.some((t, j) => j !== i && t[0].trim() === n)) {
        return false
      }
    }
    update({ ...media, tags })
    return true
  }

  const commitToValuePhase = (i: number) => {
    const n = media.tags[i][0].trim()
    if (!n) return
    pendingFocusTagValueIndex.current = i
    setTagPhases((p) => {
      const next = [...p]
      next[i] = 'value'
      return next
    })
  }

  const openNamePhase = (i: number) => {
    pendingFocusTagNameIndex.current = i
    setTagPhases((p) => {
      const next = [...p]
      next[i] = 'name'
      return next
    })
  }

  const onTagNameChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    setTag(i, 0, e.target.value)
  }

  const onTagNameKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    const n = media.tags[i][0].trim()
    if (e.key === 'Enter') {
      if (!n) return
      e.preventDefault()
      commitToValuePhase(i)
      return
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      if (!n) return
      e.preventDefault()
      commitToValuePhase(i)
    }
  }

  const onTagValueKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = i + 1
      if (tagNameRefs.current[next]) {
        tagNameRefs.current[next]?.focus()
      }
    }
  }

  return (
    <div className="media-editor">
      <datalist id={datalistId}>
        {sortedKnown.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <label className="media-editor__field">
        <span>Nome</span>
        <input
          ref={nameRef}
          type="text"
          value={media.name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <fieldset className="media-editor__weekdays">
        <legend>Dias da semana</legend>
        <div className="media-editor__weekday-btns">
          {WEEKDAYS_ORDER.map((d) => (
            <label key={d} className="media-editor__chk">
              <input
                type="checkbox"
                checked={media.weekdays.has(d)}
                onChange={() => toggleDay(d)}
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="media-editor__tags">
        <span className="media-editor__tags-label">Tags</span>
        {media.tags.map((row, i) => {
          const phase = rowPhase(tagPhases, i, row)
          return (
            <div key={i} className="media-editor__tag-row">
              {phase === 'name' ? (
                <div className="media-editor__tag-group">
                  <input
                    ref={(el) => {
                      tagNameRefs.current[i] = el
                    }}
                    className="media-editor__tag-name-input"
                    type="text"
                    list={datalistId}
                    placeholder="nome"
                    value={row[0]}
                    onChange={(e) => onTagNameChange(i, e)}
                    onKeyDown={(e) => onTagNameKeyDown(e, i)}
                  />
                  {row[0].trim() !== '' && (
                    <button
                      type="button"
                      className="media-editor__tag-commit"
                      aria-label="Confirmar nome e editar valor"
                      onClick={() => commitToValuePhase(i)}
                    >
                      <Check size={16} weight="bold" aria-hidden />
                    </button>
                  )}
                </div>
              ) : (
                <div className="media-editor__tag-group">
                  <button
                    type="button"
                    className="media-editor__tag-addon"
                    title={row[0]}
                    onClick={() => openNamePhase(i)}
                  >
                    {row[0]}
                  </button>
                  <input
                    ref={(el) => {
                      tagValueRefs.current[i] = el
                    }}
                    className="media-editor__tag-value-input"
                    type="text"
                    placeholder="valor"
                    value={row[1]}
                    onChange={(e) => setTag(i, 1, e.target.value)}
                    onKeyDown={(e) => onTagValueKeyDown(e, i)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="media-editor__actions">
        <button
          type="button"
          className="media-editor__delete"
          onClick={() => {
            if (window.confirm('Apagar esta mídia? Esta ação não pode ser desfeita.')) {
              onDelete()
            }
          }}
        >
          Apagar
        </button>
        <button type="button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}
