/**
 * Media model and weekday tokens (pt-BR UI: three letters, uppercase).
 * Persistence: JSON Lines (https://jsonlines.org/) in a local `.jsonl` file;
 * the service worker precaches only the SPA shell, not the `.jsonl`.
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

/** Parse and normalize a weekday token; unknown tokens are ignored. */
export function parseWeekdayToken(raw: string): Weekday | null {
  const t = raw.trim().toUpperCase()
  return WEEKDAY_SET.has(t) ? (t as Weekday) : null
}

/** Load persisted string `"SEG,DOM"` into a `Set`. */
export function weekdaysFromDisk(s: string | undefined): Set<Weekday> {
  const out = new Set<Weekday>()
  if (!s?.trim()) return out
  for (const part of s.split(',')) {
    const d = parseWeekdayToken(part)
    if (d) out.add(d)
  }
  return out
}

/** Serialize `Set` to persisted string; order follows `WEEKDAYS_ORDER`. */
export function weekdaysToDisk(ws: Set<Weekday>): string {
  const list = WEEKDAYS_ORDER.filter((d) => ws.has(d))
  return list.join(',')
}

export type Tag = [string, string]

export type Media = {
  name: string
  weekdays: Set<Weekday>
  tags: Tag[]
  /** URL strings; optional, preserved on JSONL read/write. */
  urls?: string[]
}

export function emptyMedia(): Media {
  return { name: '', weekdays: new Set(), tags: [['', '']] }
}

export function cloneMedia(m: Media): Media {
  return {
    name: m.name,
    weekdays: new Set(m.weekdays),
    tags: m.tags.map(([a, b]) => [a, b] as Tag),
    ...(m.urls !== undefined && { urls: [...m.urls] }),
  }
}

/** Short label for UI: tag name and value when present. */
export function formatTagLabel(t: Tag): string {
  const nt = t[0].trim()
  const vt = t[1].trim()
  if (!nt) return ''
  if (vt) return `${nt}: ${vt}`
  return nt
}

/** Tag name set but value empty (must fix or clear name before closing the editor). */
export function hasIncompleteTag(tags: Tag[]): boolean {
  for (const [n, v] of tags) {
    if (n.trim() !== '' && v.trim() === '') return true
  }
  return false
}

/** Only rows with both non-empty name and value (used when persisting and on editor close). */
export function tagsWithBothNameAndValue(tags: Tag[]): Tag[] {
  return tags.filter(([n, v]) => n.trim() !== '' && v.trim() !== '')
}

function isRowWhollyEmpty(t: Tag): boolean {
  return t[0].trim() === '' && t[1].trim() === ''
}

/**
 * One trailing `['', '']` when the last row has a name so the user can add another tag;
 * if there are no tags at all, one empty row. Used while editing, not a persistence shape.
 */
export function ensureTrailingTagRow(tags: Tag[]): Tag[] {
  if (tags.length === 0) tags.push(['', ''])
  return tags
}

/**
 * Call when opening the editor (new or existing item). Injects a placeholder tag row if none, removes
 * invalid all-empty rows when there is more than one row (keeps a single `['', '']` as the only row),
 * then appends a draft row if the last named tag has no slot after it. Does not write to disk.
 */
export function openMediaForEdit(m: Media): Media {
  const base = cloneMedia(m)
  let tags: Tag[] = base.tags.map((t) => [...t] as Tag)
  if (tags.length > 1) {
    tags = tags.filter((t) => !isRowWhollyEmpty(t))
  }
  if (tags.length === 0) {
    tags = [['', '']]
  }
  tags = ensureTrailingTagRow(tags)
  return { ...base, tags }
}

/** First tags with non-empty name, at most `max` (e.g. 2 for pills). */
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

/** First Unicode code point of the tag name (for narrow layouts). */
export function firstCharOfTagName(tag: Tag): string {
  const nt = tag[0].trim()
  if (!nt) return ''
  return Array.from(nt)[0] ?? ''
}

/**
 * Compact pill text: first character of the name only; if a value exists, show it in full after `:`.
 */
export function compactTagPillText(tag: Tag): string {
  const nt = tag[0].trim()
  const vt = tag[1].trim()
  if (!nt) return ''
  const abbrev = firstCharOfTagName(tag)
  if (!vt) return abbrev
  return `${abbrev}: ${vt}`
}

/**
 * Compact pills (e.g. ranking on narrow viewports): abbreviated name; value always shown in full.
 */
export function firstDisplayTagAbbrevs(
  media: Media,
  max = 2,
): { displayText: string; ariaLabel: string }[] {
  const out: { displayText: string; ariaLabel: string }[] = []
  for (const row of media.tags) {
    const ariaLabel = formatTagLabel(row)
    if (!ariaLabel) continue
    out.push({
      displayText: compactTagPillText(row),
      ariaLabel,
    })
    if (out.length >= max) break
  }
  return out
}
