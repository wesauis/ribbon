import type { Media } from '../types/media'

/** RNG in [0, 1); injectable for tests. */
export type Rng = () => number

/** Allowed candidate counts in the Hype comparator. */
export const HYPE_COUNTS = [2, 3, 4, 5] as const
export type HypeCount = (typeof HYPE_COUNTS)[number]

/**
 * Reorder the media list after picking a favorite among `candidates`.
 * The best rank among them is `min(candidates)`; the picked item moves to that slot.
 */
export function applyHypePick(
  medias: Media[],
  picked: number,
  candidates: readonly number[],
): Media[] | null {
  const minIdx = Math.min(...candidates)
  if (picked === minIdx) return null
  const next = [...medias]
  const [el] = next.splice(picked, 1)
  const insertAt = picked < minIdx ? minIdx - 1 : minIdx
  next.splice(insertAt, 0, el)
  return next
}

function shuffleInPlace<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = arr[i]!
    arr[i] = arr[j]!
    arr[j] = t
  }
}

/**
 * Pick `count` distinct indices in `[0, length)`, excluding `exclude`.
 */
export function pickRandomDistinct(
  length: number,
  count: number,
  exclude: ReadonlySet<number>,
  rng: Rng,
): number[] {
  const pool: number[] = []
  for (let i = 0; i < length; i++) {
    if (!exclude.has(i)) pool.push(i)
  }
  if (pool.length < count) {
    throw new Error(
      `pickRandomDistinct: pool (${pool.length}) < count (${count})`,
    )
  }
  shuffleInPlace(pool, rng)
  return pool.slice(0, count)
}

/**
 * Next batch of indices to compare.
 *
 * If `mediaLength > count * 4`, the next round **does not reuse** any index in
 * `previousRoundIndices` (fully fresh comparison vs. the previous round). Otherwise
 * (`mediaLength <= count * 4`), any random sample is allowed, including overlap with the prior round.
 *
 * `previousRoundIndices` are indices in the **current** (already reordered) array for the
 * previous round’s items; there may be more than `count` if the count setting changed.
 */
export function nextHypeCandidates(
  mediaLength: number,
  count: number,
  previousRoundIndices: readonly number[] | null,
  rng: Rng,
): number[] {
  if (count < 2 || count > 5) {
    throw new Error('nextHypeCandidates: count must be between 2 and 5')
  }
  if (mediaLength < count) {
    throw new Error('nextHypeCandidates: not enough media entries for this count')
  }

  const mustDisjoint = mediaLength > count * 4

  if (mustDisjoint && previousRoundIndices !== null && previousRoundIndices.length > 0) {
    const exclude = new Set(previousRoundIndices)
    const poolSize = mediaLength - exclude.size
    if (poolSize >= count) {
      return pickRandomDistinct(mediaLength, count, exclude, rng)
    }
  }

  return pickRandomDistinct(mediaLength, count, new Set(), rng)
}

export function isValidHypeCandidates(
  indices: readonly number[],
  mediaLength: number,
  expectedCount: number,
): boolean {
  if (mediaLength < expectedCount || indices.length !== expectedCount) {
    return false
  }
  const s = new Set(indices)
  if (s.size !== expectedCount) return false
  return indices.every((i) => i >= 0 && i < mediaLength)
}

/** Effective count (clamped by `len` and the 2–5 range). */
export function effectiveHypeCount(
  preferred: HypeCount,
  mediaLength: number,
): number {
  if (mediaLength < 2) return 0
  return Math.min(Math.max(2, preferred), 5, mediaLength)
}
