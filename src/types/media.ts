/**
 * Modelo de mídia e dias da semana (pt-BR, 3 letras, maiúsculas).
 * Persistência: JSON Lines (https://jsonlines.org/) em ficheiro `.jsonl` local;
 * o Service Worker só faz precache do SPA, não do `.jsonl`.
 */
export const WEEKDAYS_ORDER = [
  'DOM',
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SAB',
] as const

export type Weekday = (typeof WEEKDAYS_ORDER)[number]

const WEEKDAY_SET = new Set<string>(WEEKDAYS_ORDER)

/** Valida e normaliza token de dia; tokens desconhecidos são ignorados. */
export function parseWeekdayToken(raw: string): Weekday | null {
  const t = raw.trim().toUpperCase()
  return WEEKDAY_SET.has(t) ? (t as Weekday) : null
}

/** Converte string persistida "SEG,DOM" para Set. */
export function weekdaysFromDisk(s: string | undefined): Set<Weekday> {
  const out = new Set<Weekday>()
  if (!s?.trim()) return out
  for (const part of s.split(',')) {
    const d = parseWeekdayToken(part)
    if (d) out.add(d)
  }
  return out
}

/** Converte Set para string persistida; ordem segue WEEKDAYS_ORDER. */
export function weekdaysToDisk(ws: Set<Weekday>): string {
  const list = WEEKDAYS_ORDER.filter((d) => ws.has(d))
  return list.join(',')
}

export type Tag = [string, string]

export type Media = {
  name: string
  weekdays: Set<Weekday>
  tags: Tag[]
}

export function emptyMedia(): Media {
  return { name: '', weekdays: new Set(), tags: [['', '']] }
}

export function cloneMedia(m: Media): Media {
  return {
    name: m.name,
    weekdays: new Set(m.weekdays),
    tags: m.tags.map(([a, b]) => [a, b] as Tag),
  }
}

/** Texto curto para UI: nome da tag e valor se existir. */
export function formatTagLabel(t: Tag): string {
  const nt = t[0].trim()
  const vt = t[1].trim()
  if (!nt) return ''
  if (vt) return `${nt}: ${vt}`
  return nt
}

/** Primeiras tags com nome não vazio, no máximo `max` (ex.: 2 para pills). */
export function firstDisplayTags(media: Media, max = 2): string[] {
  const out: string[] = []
  for (const row of media.tags) {
    const label = formatTagLabel(row)
    if (!label) continue
    out.push(label)
    if (out.length >= max) break
  }
  return out
}
