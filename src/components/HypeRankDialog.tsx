import { useEffect, useMemo, useState } from 'react'
import type { Media } from '../types/media'
import {
  applyHypePick,
  makeInitialHypeState,
  nextHypeRound,
  type HypePick,
  type HypeRound,
  type HypeState,
} from '../hype/hype-rank'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  targetIndex: number | null
  isOpen: boolean
  onClose: () => void
  onReorder: (next: Media[]) => void
}

type DoneInfo = {
  originalIndex: number
  newIndex: number
  name: string
  rounds: number
}

export function HypeRankDialog({
  medias,
  targetIndex,
  isOpen,
  onClose,
  onReorder,
}: Props) {
  const [state, setState] = useState<HypeState | null>(null)
  const [round, setRound] = useState<HypeRound | null>(null)
  const [done, setDone] = useState<DoneInfo | null>(null)

  const canStart = useMemo(() => {
    return targetIndex !== null && targetIndex >= 0 && targetIndex < medias.length
  }, [targetIndex, medias.length])

  useEffect(() => {
    if (!isOpen) return
    if (!canStart || targetIndex === null) return
    const st = makeInitialHypeState(targetIndex, medias.length)
    setState(st)
    setRound(nextHypeRound(st, medias.length))
    setDone(null)
  }, [isOpen, canStart, targetIndex, medias.length])

  const onPick = (pick: HypePick) => {
    if (!state || !round) return
    const res = applyHypePick(medias, state, round, pick)
    if (res.medias !== medias) {
      onReorder(res.medias)
    }
    setState(res.state)
    if (res.done) {
      const idx = res.state.targetIndex
      const m = res.medias[idx]!
      setRound(null)
      setDone({
        originalIndex: res.state.originalIndex,
        newIndex: idx,
        name: m.name,
        rounds: res.state.round,
      })
      return
    }
    setRound(nextHypeRound(res.state, res.medias.length))
  }

  if (!isOpen) return null

  if (!canStart) {
    return (
      <div className="hype-rank__wrap" aria-label="Hype">
        <p className="hype-panel__hint">Selecione uma mídia para iniciar o Hype.</p>
        <div className="media-editor__actions">
          <button type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="hype-rank__wrap" aria-label="Hype">
        <h3 className="hype-rank__title">Hype concluído</h3>
        <p className="hype-panel__hint">
          <strong>{done.name}</strong> saiu de #{done.originalIndex + 1} para #
          {done.newIndex + 1} em {done.rounds} rounds.
        </p>
        <div className="media-editor__actions">
          <button type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  if (!state || !round) {
    return (
      <div className="hype-rank__wrap" aria-label="Hype">
        <p className="hype-panel__hint">Preparando comparação…</p>
      </div>
    )
  }

  const top = round.topIndex !== null ? medias[round.topIndex]! : null
  const mid = medias[round.targetIndex]!
  const bottom = round.bottomIndex !== null ? medias[round.bottomIndex]! : null

  return (
    <section className="hype-panel hype-panel--dialog hype-rank" aria-label="Hype">
      <p className="hype-rank__meta">Round {state.round + 1}/10</p>
      <div
        className="hype-panel__grid hype-rank__grid"
        role="group"
        aria-label="Escolha a melhor"
      >
        {top && round.topIndex !== null && (
          <HypePickCard
            media={top}
            onPick={() => onPick('top')}
          />
        )}
        <HypePickCard
          media={mid}
          onPick={() => onPick('middle')}
          emphasis
        />
        {bottom && round.bottomIndex !== null && (
          <HypePickCard
            media={bottom}
            onPick={() => onPick('bottom')}
          />
        )}
      </div>
    </section>
  )
}

type PickProps = {
  media: Media
  onPick: () => void
  emphasis?: boolean
}

function HypePickCard({ media, onPick, emphasis = false }: PickProps) {
  return (
    <button
      type="button"
      className={`hype-panel__card ${emphasis ? 'hype-rank__card--emphasis' : ''}`}
      onClick={onPick}
    >
      <span className="hype-panel__name">{media.name}</span>
      <TagPills media={media} />
    </button>
  )
}

