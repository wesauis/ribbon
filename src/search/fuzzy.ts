/**
 * Busca difusa (Fuse.js) em nome e tags; desempate pelo índice no array (ordem do ficheiro).
 */
import Fuse from 'fuse.js'
import type { Media } from '../types/media'

function searchText(m: Media): string {
  const tagPart = m.tags
    .map(([a, b]) => `${a} ${b}`.trim())
    .filter(Boolean)
    .join(' ')
  return `${m.name} ${tagPart}`.trim()
}

export type MediaWithIndex = { media: Media; index: number; searchText: string }

function withIndex(medias: Media[]): MediaWithIndex[] {
  return medias.map((media, index) => ({
    media,
    index,
    searchText: searchText(media),
  }))
}

/** Fuzzy na lista; empate de score desempata pelo índice menor (ordem do ficheiro). */
export function fuzzySearchMedias(
  medias: Media[],
  query: string,
): { index: number; score: number }[] {
  const q = query.trim()
  if (!q) {
    return medias.map((_, index) => ({ index, score: 0 }))
  }
  const list = withIndex(medias)
  const fuse = new Fuse(list, {
    keys: ['searchText'],
    includeScore: true,
    threshold: 0.45,
    ignoreLocation: true,
  })
  const results = fuse.search(q)
  const mapped = results
    .filter((r) => r.score !== undefined)
    .map((r) => ({
      index: r.item.index,
      score: r.score as number,
    }))
  mapped.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    return a.index - b.index
  })
  return mapped
}
