import type { Media } from '../types/media'

export type HypeRound = {
  topIndex: number | null
  targetIndex: number
  bottomIndex: number | null
}

export type HypeState = {
  originalIndex: number
  round: number
  targetIndex: number
}

export type HypePick = 'top' | 'middle' | 'bottom'

export function makeInitialHypeState(targetIndex: number, len: number): HypeState {
  if (len <= 0) throw new Error('makeInitialHypeState: empty list')
  if (targetIndex < 0 || targetIndex >= len) {
    throw new Error('makeInitialHypeState: invalid targetIndex')
  }
  return {
    originalIndex: targetIndex,
    round: 0,
    targetIndex,
  }
}

export function canRunHype(state: HypeState, len: number): boolean {
  if (len < 2) return false
  return state.targetIndex >= 0 && state.targetIndex < len
}

function randomIntInclusive(min: number, max: number): number {
  const n = max - min + 1
  return min + Math.floor(Math.random() * n)
}

export function nextHypeRound(state: HypeState, len: number): HypeRound | null {
  if (!canRunHype(state, len)) return null
  const { targetIndex } = state

  const topIndex =
    targetIndex > 0 ? randomIntInclusive(0, targetIndex - 1) : null
  const bottomIndex =
    targetIndex < len - 1 ? randomIntInclusive(targetIndex + 1, len - 1) : null

  if (topIndex === null && bottomIndex === null) return null

  return { topIndex, targetIndex, bottomIndex }
}

function moveItem(medias: Media[], from: number, to: number): Media[] {
  if (from === to) return medias
  const next = [...medias]
  const [el] = next.splice(from, 1)
  next.splice(to, 0, el)
  return next
}

export function applyHypePick(
  medias: Media[],
  state: HypeState,
  round: HypeRound,
  pick: HypePick,
): { medias: Media[]; state: HypeState; done: boolean } {
  const { topIndex, targetIndex, bottomIndex } = round

  if (state.targetIndex !== targetIndex) {
    throw new Error('applyHypePick: stale round (targetIndex mismatch)')
  }

  const nextRound = state.round + 1
  const done = nextRound >= 10

  // "Top" is the pivot slot. Picking top means "keep as-is".
  if (pick === 'top' || topIndex === null) {
    return { medias, state: { ...state, round: nextRound }, done }
  }

  const targetMedia = medias[state.targetIndex]!

  if (pick === 'middle') {
    const nextMedias = moveItem(medias, targetIndex, topIndex)
    const newTargetIndex = nextMedias.findIndex((m) => m === targetMedia)
    return {
      medias: nextMedias,
      state: { ...state, round: nextRound, targetIndex: newTargetIndex },
      done,
    }
  }

  if (bottomIndex === null) {
    return { medias, state: { ...state, round: nextRound }, done }
  }

  // Picked bottom: move bottom into the top slot.
  const nextMedias = moveItem(medias, bottomIndex, topIndex)
  const newTargetIndex = nextMedias.findIndex((m) => m === targetMedia)
  return {
    medias: nextMedias,
    state: { ...state, round: nextRound, targetIndex: newTargetIndex },
    done,
  }
}

