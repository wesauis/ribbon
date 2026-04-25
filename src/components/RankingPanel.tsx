import { useLayoutEffect, useState } from 'react'
import type { Media } from '../types/media'
import {
  applyRankingPick,
  effectiveRankingCount,
  nextRankingCandidates,
  type RankingCount,
  type Rng,
} from '../ranking/ranking'
import { TagPills } from './TagPills'

type Props = {
  medias: Media[]
  onReorder: (next: Media[]) => void
  /**
   * `dialog`: inside the modal - full titles (multi-line), no rank badge.
   * The count control lives in the dialog header (`App`).
   */
  variant?: 'default' | 'dialog'
  /** In dialog mode, set from the header (`App`). */
  candidateCount?: RankingCount
  /** Incremented in `App` when the count group changes - new random batch. */
  candidateNonce?: number
}

const defaultRng: Rng = () => Math.random()

/** Compare N media items per round; click records a vote and reorders the list. */
export function RankingPanel({
  medias,
  onReorder,
  variant = 'default',
  candidateCount: candidateCountProp,
  candidateNonce = 0,
}: Props) {
  const isDialog = variant === 'dialog'
  const len = medias.length

  const [internalCount] = useState<RankingCount>(2)
  const candidateCount = candidateCountProp ?? internalCount
  const [candidates, setCandidates] = useState<number[] | null>(() => {
    if (len < 2) return null
    const n = effectiveRankingCount(candidateCountProp ?? 2, len)
    return nextRankingCandidates(len, n, null, defaultRng)
  })

  /** Recompute candidate indices when media length or ranking controls change. */
  useLayoutEffect(() => {
    if (len < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear batch when list is too short
      setCandidates(null)
      return
    }
    const n = effectiveRankingCount(candidateCount, len)
    setCandidates(nextRankingCandidates(len, n, null, defaultRng))
  }, [len, candidateCount, candidateNonce])

  if (len < 2) {
    return (
      <section
        className={`hype-panel hype-panel--disabled ${isDialog ? 'hype-panel--dialog' : ''}`}
        aria-label="Ranking"
      >
        {!isDialog && <h2 className="hype-panel__title">Ranking</h2>}
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
    const nextMedias = applyRankingPick(medias, picked, candidates)
    const finalMedias = nextMedias ?? medias

    if (nextMedias !== null) {
      onReorder(nextMedias)
    }

    const lengthAfter = finalMedias.length
    const n = effectiveRankingCount(candidateCount, lengthAfter)

    const previousRoundIndicesAfterReorder = [
      ...new Set(
        prevIndices
          .map((i) => medias[i]!)
          .map((m) => finalMedias.findIndex((x) => x === m))
          .filter((idx) => idx >= 0),
      ),
    ]

    setCandidates(
      nextRankingCandidates(
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
      aria-label="Ranking"
    >
      {!isDialog && <h2 className="hype-panel__title">Ranking</h2>}
      <div className="hype-panel__grid">
        {displayIndices.map((index) => (
          <RankingCard
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

function RankingCard({ media, rank, showRank = true, onVote }: CardProps) {
  return (
    <button type="button" className="hype-panel__card" onClick={onVote}>
      {showRank && <span className="hype-panel__rank">#{rank}</span>}
      <span className="hype-panel__name">{media.name}</span>
      <TagPills media={media} />
    </button>
  )
}

