/**
 * Read/write JSON Lines (https://jsonlines.org/) `.jsonl` files.
 * Each line is one JSON object; empty-ish fields are omitted on write to keep files compact.
 * `medias` array order matches line order in the file.
 */

import type { Media, Tag } from '../types/media'
import { weekdaysFromDisk, weekdaysToDisk } from '../types/media'

type DiskTag = [string] | [string, string]

type DiskMedia = {
  name?: unknown
  weekdays?: unknown
  tags?: unknown
  urls?: unknown
}

function isOmitted(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (value === false || value === 0) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

function compactTag(t: Tag): DiskTag | null {
  const n = t[0].trim()
  if (!n) return null
  const v = t[1].trim()
  if (!v) return [n]
  return [n, v]
}

/** Build a JSON-serializable object with keys omitted per compact-write rules. */
export function mediaToDiskObject(m: Media): Record<string, unknown> {
  const name = m.name.trim()
  if (!name) throw new Error('Cannot persist media with empty name.')
  const o: Record<string, unknown> = { name }
  const wd = weekdaysToDisk(m.weekdays)
  if (!isOmitted(wd)) o.weekdays = wd
  const tagsCompact: DiskTag[] = []
  for (const t of m.tags) {
    const c = compactTag(t)
    if (c) tagsCompact.push(c)
  }
  if (tagsCompact.length > 0) o.tags = tagsCompact
  if (m.urls !== undefined && m.urls.length > 0) o.urls = [...m.urls]
  return o
}

export function mediaToDiskLine(m: Media): string {
  return JSON.stringify(mediaToDiskObject(m))
}

function parseTag(raw: unknown): Tag | null {
  if (!Array.isArray(raw) || raw.length < 1) return null
  const n = String(raw[0] ?? '').trim()
  if (!n) return null
  const v = raw.length > 1 ? String(raw[1] ?? '').trim() : ''
  return [n, v]
}

/** Parse one `.jsonl` line into an in-memory `Media`. */
export function parseMediaLine(obj: unknown): Media | null {
  if (typeof obj !== 'object' || obj === null) return null
  const d = obj as DiskMedia
  const name = typeof d.name === 'string' ? d.name.trim() : ''
  if (!name) return null
  let weekdaysStr = ''
  if (typeof d.weekdays === 'string') weekdaysStr = d.weekdays
  const weekdays = weekdaysFromDisk(weekdaysStr)
  const tags: Tag[] = []
  if (Array.isArray(d.tags)) {
    for (const item of d.tags) {
      const t = parseTag(item)
      if (t) tags.push(t)
    }
  }
  if (tags.length === 0) tags.push(['', ''])
  const out: Media = { name, weekdays, tags }
  if (Array.isArray(d.urls)) {
    const urls: string[] = []
    for (const u of d.urls) {
      if (typeof u === 'string') urls.push(u)
    }
    if (urls.length > 0) out.urls = urls
  }
  return out
}

/** Split file text into records; invalid lines are skipped. */
export function parseJsonlText(text: string): Media[] {
  const out: Media[] = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const obj = JSON.parse(trimmed) as unknown
      const m = parseMediaLine(obj)
      if (m) out.push(m)
    } catch {
      /* Corrupted line; skip. */
    }
  }
  return out
}

export async function readMediasFromFile(file: File): Promise<Media[]> {
  const text = await file.text()
  return parseJsonlText(text)
}

export function serializeMediasToJsonl(medias: Media[]): string {
  const lines = medias.map((m) => mediaToDiskLine(m))
  if (lines.length === 0) return ''
  return lines.join('\n') + '\n'
}

export async function writeMediasToHandle(
  handle: FileSystemFileHandle,
  medias: Media[],
): Promise<void> {
  const data = serializeMediasToJsonl(medias)
  const w = await handle.createWritable()
  await w.write(data)
  await w.close()
}
