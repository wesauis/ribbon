import { useLayoutEffect, useState } from 'react'
import type { Media } from '../types/media'
import {
  applyHypePick,
  effectiveHypeCount,
  nextHypeCandidates,
  type HypeCount,
  type Rng,
} from '../hype/hype'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  onReorder: (next: Media[]) => void
  /**
   * `dialog`: inside the modal — full titles (multi-line), no rank badge.
   * The count control lives in the dialog header (`App`).
   */
  variant?: 'default' | 'dialog'
  /** In dialog mode, set from the header (`App`). */
  candidateCount?: HypeCount
  /** Incremented in `App` when the count group changes — new random batch. */
  candidateNonce?: number
}

const defaultRng: Rng = () => Math.random()

/** Compare N media items per round; click records a vote and reorders the list. */
export function HypePanel({
  medias,
  onReorder,
  variant = 'default',
  candidateCount: candidateCountProp,
  candidateNonce = 0,
}: Props) {
  const isDialog = variant === 'dialog'
  const len = medias.length

  const [internalCount] = useState<HypeCount>(2)
  const candidateCount = candidateCountProp ?? internalCount
  const [candidates, setCandidates] = useState<number[] | null>(() => {
    if (len < 2) return null
    const n = effectiveHypeCount(candidateCountProp ?? 2, len)
    return nextHypeCandidates(len, n, null, defaultRng)
  })

  /** Recompute candidate indices when media length or hype controls change. */
  useLayoutEffect(() => {
    if (len < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear batch when list is too short
      setCandidates(null)
      return
    }
    const n = effectiveHypeCount(candidateCount, len)
    setCandidates(nextHypeCandidates(len, n, null, defaultRng))
  }, [len, candidateCount, candidateNonce])

  if (len < 2) {
    return (
      <section
        className={`hype-panel hype-panel--disabled ${isDialog ? 'hype-panel--dialog' : ''}`}
        aria-label="Hype"
      >
        {!isDialog && <h2 className="hype-panel__title">Hype</h2>}
        <p className="hype-panel__hint">
          São necessárias pelo menos 2 mídias na base para comparar e atualizar o
          ranking.
        </p>
      </section>
    )
  }

  if (candidates === null) {
    return null
  }

  const onPick = (picked: number) => {
    const prevIndices = candidates
    const nextMedias = applyHypePick(medias, picked, candidates)
    const finalMedias = nextMedias ?? medias

    if (nextMedias !== null) {
      onReorder(nextMedias)
    }

    const lengthAfter = finalMedias.length
    const n = effectiveHypeCount(candidateCount, lengthAfter)

    const previousRoundIndicesAfterReorder = [
      ...new Set(
        prevIndices
          .map((i) => medias[i]!)
          .map((m) => finalMedias.findIndex((x) => x === m))
          .filter((idx) => idx >= 0),
      ),
    ]

    setCandidates(
      nextHypeCandidates(
        lengthAfter,
        n,
        previousRoundIndicesAfterReorder.length > 0
          ? previousRoundIndicesAfterReorder
          : null,
        defaultRng,
      ),
    )
  }

  const candidatesKey = candidates.join('-')
  const displayIndices = isDialog
    ? [...candidates].sort((a, b) => a - b)
    : candidates

  return (
    <section
      className={`hype-panel ${isDialog ? 'hype-panel--dialog' : ''}`}
      aria-label="Hype"
    >
      {!isDialog && <h2 className="hype-panel__title">Hype</h2>}
      <div className="hype-panel__grid">
        {displayIndices.map((index) => (
          <HypeCard
            key={`${candidatesKey}-${index}`}
            media={medias[index]!}
            rank={index + 1}
            showRank={!isDialog}
            onVote={() => onPick(index)}
          />
        ))}
      </div>
    </section>
  )
}

type CardProps = {
  media: Media
  rank: number
  showRank?: boolean
  onVote: () => void
}

function HypeCard({ media, rank, showRank = true, onVote }: CardProps) {
  return (
    <button
      type="button"
      className="hype-panel__card"
      onClick={onVote}
    >
      {showRank && <span className="hype-panel__rank">#{rank}</span>}
      <span className="hype-panel__name">{media.name}</span>
      <TagPills media={media} />
    </button>
  )
}
