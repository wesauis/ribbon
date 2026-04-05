/** RNG em [0, 1); injetável para testes. */
export type Rng = () => number

/** Quantidades permitidas no comparador Hype. */
export const HYPE_COUNTS = [2, 3, 4, 5] as const
export type HypeCount = (typeof HYPE_COUNTS)[number]

/**
 * Reordena o array após escolher o favorito entre os candidatos.
 * O melhor rank entre eles é `min(candidatos)`; o escolhido sobe para essa posição.
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
 * Escolhe `count` índices distintos em `[0, length)`, excluindo `exclude`.
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
 * Próximo lote de índices para comparar.
 *
 * Se `mediaLength > count * 4`, a ronda seguinte **não repete** nenhum dos
 * índices em `previousRoundIndices` (comparação totalmente nova em relação à
 * anterior). Caso contrário (`mediaLength <= count * 4`), permite qualquer
 * amostra aleatória, incluindo repetir itens da ronda anterior.
 *
 * `previousRoundIndices` são os índices no array **atual** (já reordenado) dos
 * itens da ronda anterior; podem ser mais do que `count` se a quantidade mudou.
 */
export function nextHypeCandidates(
  mediaLength: number,
  count: number,
  previousRoundIndices: readonly number[] | null,
  rng: Rng,
): number[] {
  if (count < 2 || count > 5) {
    throw new Error('nextHypeCandidates: count deve estar entre 2 e 5')
  }
  if (mediaLength < count) {
    throw new Error('nextHypeCandidates: nem mídias suficientes para esta quantidade')
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

/** Quantidade efetiva (respeita `len` e o intervalo 2–5). */
export function effectiveHypeCount(
  preferred: HypeCount,
  mediaLength: number,
): number {
  if (mediaLength < 2) return 0
  return Math.min(Math.max(2, preferred), 5, mediaLength)
}
