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
  /**
   * When set, the candidate batch will always include this index (when possible),
   * so you can "hype rank" a specific media against random others.
   */
  seedIndex?: number | null
}

const defaultRng: Rng = () => Math.random()

/** Compare N media items per round; click records a vote and reorders the list. */
export function HypePanel({
  medias,
  onReorder,
  variant = 'default',
  candidateCount: candidateCountProp,
  candidateNonce = 0,
  seedIndex = null,
}: Props) {
  const isDialog = variant === 'dialog'
  const len = medias.length

  const [internalCount] = useState<HypeCount>(2)
  const candidateCount = candidateCountProp ?? internalCount
  const [candidates, setCandidates] = useState<number[] | null>(() => {
    if (len < 2) return null
    const n = effectiveHypeCount(candidateCountProp ?? 2, len)
    return nextSeededCandidates(len, n, seedIndex, defaultRng)
  })

  /** Recompute candidate indices when media length or hype controls change. */
  useLayoutEffect(() => {
    if (len < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear batch when list is too short
      setCandidates(null)
      return
    }
    const n = effectiveHypeCount(candidateCount, len)
    setCandidates(nextSeededCandidates(len, n, seedIndex, defaultRng))
  }, [len, candidateCount, candidateNonce, seedIndex])

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
      nextSeededCandidates(
        lengthAfter,
        n,
        seedIndex,
        defaultRng,
        previousRoundIndicesAfterReorder.length > 0
          ? previousRoundIndicesAfterReorder
          : null,
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

function nextSeededCandidates(
  mediaLength: number,
  count: number,
  seedIndex: number | null,
  rng: Rng,
  previousRoundIndices: readonly number[] | null = null,
): number[] {
  if (seedIndex === null) {
    return nextHypeCandidates(mediaLength, count, previousRoundIndices, rng)
  }
  if (seedIndex < 0 || seedIndex >= mediaLength) {
    return nextHypeCandidates(mediaLength, count, previousRoundIndices, rng)
  }
  if (count <= 1) return [seedIndex]

  // If we can avoid reusing the previous round, still try to keep `seedIndex` in.
  const base = nextHypeCandidates(mediaLength, count, previousRoundIndices, rng)
  if (base.includes(seedIndex)) return base

  // Replace one entry with the seed. Keep uniqueness.
  const next = [...base]
  next[0] = seedIndex
  return [...new Set(next)].slice(0, count)
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
