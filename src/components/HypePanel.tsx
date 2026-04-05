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
   * `dialog`: dentro do modal — títulos completos (várias linhas), sem rank.
   * O grupo de quantidade fica no cabeçalho do diálogo (App).
   */
  variant?: 'default' | 'dialog'
  /** No diálogo, definido no cabeçalho (App). */
  candidateCount?: HypeCount
  /** Incrementado no App ao clicar no grupo de quantidade — novo lote aleatório. */
  candidateNonce?: number
}

const defaultRng: Rng = () => Math.random()

/** Compara N mídias por ronda; o clique só regista voto e reordena o ficheiro. */
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

  useLayoutEffect(() => {
    if (len < 2) {
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
