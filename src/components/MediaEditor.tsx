import { Check, Plus } from '@phosphor-icons/react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import type { Media, Tag, Weekday } from '../types/media'
import {
  WEEKDAYS_ORDER,
  ensureTrailingTagRow,
  hasIncompleteTag,
  tagsWithBothNameAndValue,
} from '../types/media'

type Props = {
  media: Media
  knownTagNames: string[]
  onChange: (next: Media) => void
  onClose: () => void
  /** Delete this media from the store and close the dialog (after confirmation). */
  onDelete: () => void
  /** Host `<dialog>` ref so we can block Escape close while a tag has name but no value. */
  dialogRef: RefObject<HTMLDialogElement | null>
}

type TagRowPhase = 'name' | 'value'

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

function normalizeTagsForStore(tags: Tag[]): Tag[] {
  return tagsWithBothNameAndValue(tags)
}

function firstIncompleteTagIndex(tags: Tag[]): number {
  for (let i = 0; i < tags.length; i++) {
    const [n, v] = tags[i]
    if (n.trim() !== '' && v.trim() === '') return i
  }
  return -1
}

/**
 * Edit media (name, weekdays, tags) in a modal dialog.
 * Open autofocus (once per mount): title only when it is empty; with a title, never focus the title (skip it
 * for dialog default focus via tabIndex, then focus first tag name or last tag value). Close is blocked while
 * any tag has a name but no value. Only tags with both name and value are kept on close and on disk. `media`
 * updates do not re-run open autofocus (mobile keyboard).
 */
export function MediaEditor({
  media,
  knownTagNames,
  onChange,
  onClose,
  onDelete,
  dialogRef,
}: Props) {
  const datalistId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const tagNameRefs = useRef<(HTMLInputElement | null)[]>([])
  const tagValueRefs = useRef<(HTMLInputElement | null)[]>([])
  /** Phase switch schedules focus; refs are null until the next commit (value vs name are different nodes). */
  const pendingFocusTagNameIndex = useRef<number | null>(null)
  const pendingFocusTagValueIndex = useRef<number | null>(null)
  /** Ensures open-dialog autofocus runs at most once per mount (avoids mobile keyboard refocus loops). */
  const initialOpenFocusDoneRef = useRef(false)
  const mediaRef = useRef(media)
  mediaRef.current = media

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
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, (): TagRowPhase => 'name'),
        ]
      }
      return prev.slice(0, n)
    })
  }, [media.tags.length])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onDialogCancel = (e: Event) => {
      const tags = mediaRef.current.tags
      if (!hasIncompleteTag(tags)) return
      e.preventDefault()
      window.alert(
        'Complete o valor da tag ou apague o nome da tag antes de fechar.',
      )
      const idx = firstIncompleteTagIndex(tags)
      if (idx < 0) return
      pendingFocusTagValueIndex.current = idx
      setTagPhases((p) => {
        const next = [...p]
        next[idx] = 'value'
        return next
      })
    }
    d.addEventListener('cancel', onDialogCancel)
    return () => d.removeEventListener('cancel', onDialogCancel)
  }, [dialogRef, setTagPhases])

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

  /** Snapshot when the dialog opens; do not re-run when `media` updates from typing. */
  useLayoutEffect(() => {
    if (initialOpenFocusDoneRef.current) return
    initialOpenFocusDoneRef.current = true

    const mediaNameEmpty = media.name.trim() === ''

    if (mediaNameEmpty) {
      nameRef.current?.focus()
      nameRef.current?.select()
      scrollFieldIntoView(nameRef.current)
      return
    }

    const focusTagFieldForOpen = () => {
      nameRef.current?.blur()
      const lastNamedIdx = lastTagNameIndex(media.tags)
      if (lastNamedIdx < 0) {
        const tagNameEl = tagNameRefs.current[0]
        tagNameEl?.focus()
        scrollFieldIntoView(tagNameEl)
        return
      }
      const valueEl = tagValueRefs.current[lastNamedIdx]
      valueEl?.focus()
      scrollFieldIntoView(valueEl)
    }

    focusTagFieldForOpen()
    /* Dialog showModal() may focus the first tabbable control after our layout pass; run again after paint. */
    requestAnimationFrame(() => {
      requestAnimationFrame(focusTagFieldForOpen)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open snapshot only; omit `media` so edits never refocus
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

  const focusFirstIncompleteValue = () => {
    const idx = firstIncompleteTagIndex(mediaRef.current.tags)
    if (idx < 0) return
    pendingFocusTagValueIndex.current = idx
    setTagPhases((p) => {
      const next = [...p]
      next[idx] = 'value'
      return next
    })
  }

  const tryClose = () => {
    if (hasIncompleteTag(media.tags)) {
      window.alert(
        'Complete o valor da tag ou apague o nome da tag antes de fechar.',
      )
      focusFirstIncompleteValue()
      return
    }
    onChange({ ...media, tags: normalizeTagsForStore(media.tags) })
    onClose()
  }

  const addEmptyTagRow = () => {
    const i = media.tags.length
    pendingFocusTagNameIndex.current = i
    setTagPhases((p) => [...p, 'name'])
    update({ ...media, tags: [...media.tags, ['', '']] })
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
          tabIndex={media.name.trim() === '' ? 0 : -1}
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
        <div className="media-editor__tags-head">
          <span className="media-editor__tags-label">Tags</span>
          <button
            type="button"
            className="media-editor__tags-add"
            onClick={addEmptyTagRow}
          >
            <Plus size={16} weight="bold" aria-hidden />
            Adicionar
          </button>
        </div>
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
        <button type="button" onClick={tryClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}
