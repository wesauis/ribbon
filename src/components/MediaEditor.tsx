import { useEffect, useId, useMemo, useRef } from 'react'
import type { Media, Tag, Weekday } from '../types/media'
import { WEEKDAYS_ORDER } from '../types/media'

type Props = {
  media: Media
  knownTagNames: string[]
  onChange: (next: Media) => void
  onClose: () => void
  /** Remove esta mídia da base e fecha o diálogo (após confirmação). */
  onDelete: () => void
}

function ensureTrailingTagRow(tags: Tag[]): Tag[] {
  const out = tags.map((t) => [...t] as Tag)
  const last = out[out.length - 1]
  if (last && last[0].trim() !== '') {
    out.push(['', ''])
  }
  if (out.length === 0) out.push(['', ''])
  return out
}

/** Índice da última tag com nome não vazio; -1 se não houver nenhuma. */
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

/**
 * Formulário de edição de uma mídia (nome, dias, tags) no diálogo modal.
 * Foco inicial: nome vazio → nome; nome preenchido sem tags com nome → campo “nome” da nova tag;
 * com pelo menos uma tag nomeada → valor da última tag nomeada.
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

  const sortedKnown = useMemo(
    () => [...new Set(knownTagNames)].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [knownTagNames],
  )

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
        const el = tagNameRefs.current[0]
        el?.focus()
        scrollFieldIntoView(el)
        return
      }
      const el = tagValueRefs.current[tagIdx]
      el?.focus()
      scrollFieldIntoView(el)
    })
    /* Intencionalmente só na montagem: evita roubar o foco ao editar campos. */
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

  /** Aplica alteração numa célula de tag; retorna false se o nome for duplicado (só coluna nome). */
  const setTag = (i: number, col: 0 | 1, val: string): boolean => {
    const tags = media.tags.map((row, j) =>
      j === i ? (col === 0 ? ([val, row[1]] as Tag) : ([row[0], val] as Tag)) : row,
    )
    if (col === 0) {
      const n = val.trim()
      if (
        n &&
        tags.some((t, j) => j !== i && t[0].trim() === n)
      ) {
        return false
      }
    }
    update({ ...media, tags })
    return true
  }

  /**
   * Nome da tag igual a uma opção conhecida (ex.: escolha na datalist) e valor vazio:
   * passa o foco para o valor para continuar a edição sem clique extra.
   */
  const onTagNameChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const valueWasEmpty = media.tags[i][1].trim() === ''
    const n = val.trim()
    const isKnownName = n !== '' && sortedKnown.includes(n)
    const applied = setTag(i, 0, val)
    if (!applied || !valueWasEmpty || !isKnownName) return
    queueMicrotask(() => {
      const el = tagValueRefs.current[i]
      el?.focus()
      scrollFieldIntoView(el)
    })
  }

  const onTagNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      tagValueRefs.current[i]?.focus()
    }
  }

  const onTagValueKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
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
        {media.tags.map((row, i) => (
          <div key={i} className="media-editor__tag-row">
            <input
              ref={(el) => {
                tagNameRefs.current[i] = el
              }}
              type="text"
              list={datalistId}
              placeholder="nome"
              value={row[0]}
              onChange={(e) => onTagNameChange(i, e)}
              onFocus={() => {
                /* datalist mostra opções ao focar no Chrome */
              }}
              onKeyDown={(e) => onTagNameKeyDown(e, i)}
            />
            <input
              ref={(el) => {
                tagValueRefs.current[i] = el
              }}
              type="text"
              placeholder="valor"
              value={row[1]}
              onChange={(e) => setTag(i, 1, e.target.value)}
              onKeyDown={(e) => onTagValueKeyDown(e, i)}
            />
          </div>
        ))}
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

