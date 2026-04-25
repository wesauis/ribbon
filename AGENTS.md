# Ribbon — agent guide

This document helps AI coding agents and contributors work on **Ribbon** consistently.

## What it is

Ribbon is a **local-first, single-page web app** for managing a personal catalog of **media entries** (“mídias”). Each entry has:

- A **name**
- **Weekdays** (which days of the week it applies to)
- Optional **tags** (name/value pairs)

Users browse by **week grid**, **global ranking** (file order), and **fuzzy search**. A **“hype”** flow helps reorder items through pairwise choices. Data lives in a **`.jsonl` file** on disk (Chrome’s **File System Access API**); nothing is stored on a remote server.

## Stack

| Layer | Choice |
| --- | --- |
| UI | **React 19** (`react`, `react-dom`) |
| Language | **TypeScript** |
| Build | **Vite** (`vite`, `@vitejs/plugin-react`) |
| Search | **Fuse.js** (fuzzy search over media names) |
| Offline / install | **vite-plugin-pwa** (service worker precaches the SPA assets; **not** the `.jsonl` file) |
| Persistence | **File System Access API** — open/create `.jsonl`, read/write via `FileSystemFileHandle` |

Deployment (e.g. GitHub Pages) is optional; the app can be built with a configurable `VITE_BASE`. The live site still only accesses data through the user’s chosen local file.

## JSON Lines (`.jsonl`) storage

- Format follows **[JSON Lines](https://jsonlines.org/)**: **one JSON object per line**, newline-separated.
- **Array order = file order**: the in-memory `medias[]` order matches line order; that order is the **global rank** shown in the ranking view.
- Each line is one **`Media`** object serialized with `src/db/jsonl.ts`:
  - Required on disk: **`name`** (non-empty string).
  - **`weekdays`**: optional string like `"SEG,QUI"` (see `weekdaysToDisk` / `weekdaysFromDisk` in `src/types/media.ts`).
  - **`tags`**: optional array of `[name]` or `[name, value]`; empty tag names are omitted on write.
  - **Compact write**: empty-ish fields are omitted where possible to keep lines small.
- **Read**: `parseJsonlText` splits on newlines, `JSON.parse` per line, invalid lines are skipped.
- **Write**: `serializeMediasToJsonl` builds one string with trailing newline; `writeMediasToHandle` writes the whole file.

Agents changing the data model should update parsing/serialization in `src/db/jsonl.ts` and types in `src/types/media.ts` together, and consider backward compatibility for existing files.

## Repository layout (high level)

- `src/App.tsx` — file picker, state, views (week / ranking), modal editor, hype dialog.
- `src/db/jsonl.ts` — JSONL read/write and `Media` ↔ disk mapping.
- `src/types/media.ts` — `Media`, `Tag`, weekday helpers, label helpers for UI.
- `src/components/` — `MediaEditor`, `MediaSearch`, `WeekGrid`, `MediaRankList`, `HypePanel`, `TagPills`, etc.
- `src/search/fuzzy.ts` — Fuse.js wiring.
- `src/hype/hype.ts` — hype reordering logic.

## Language and locale conventions

| Kind | Locale / language |
| --- | --- |
| **Source code** (identifiers, comments, `README`, this file, commit messages when the repo uses English) | **English (en-US)** |
| **User-visible UI strings** (labels, buttons, dialogs, `aria-label` / `title` meant for end users) | **Portuguese (Brazil) — pt-BR** |

The UI is already authored in **pt-BR**. When adding or changing behavior:

- Prefer **English** for new comments, docstrings, and internal documentation.
- Keep **pt-BR** for any string shown in the interface (unless the product owner decides otherwise).

This keeps code review and tooling consistent while matching the intended audience for on-screen text.

## CSS and class naming

Follow **[CUBE CSS](https://cube.fyi/)** for naming and organizing CSS:

- Prefer clear, role-based component classes (e.g. `media-rank-list`, `media-rank-list__item`) and small, reusable utility patterns when needed.
- Keep classes consistent with the existing codebase style; avoid inventing a second naming scheme.

## Commit messages

Follow **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** (see the [spec source](https://github.com/conventional-commits/conventionalcommits.org/blob/master/content/v1.0.0/index.md)):

- **Format:** `<type>[optional scope]: <description>` — optional body and footers after a blank line.
- **Common types:** `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `perf`, `test`, `build`, `ci` (and others your tooling allows).
- **Breaking changes:** indicate with `!` after the type/scope (e.g. `feat(api)!:`) and/or a `BREAKING CHANGE:` footer as described in the spec.
- **Language:** commit subjects and bodies **must use English (en-US)** so history matches this guide and stays machine-friendly.

Examples:

- `feat(search): add fuzzy match for media names`
- `fix(editor): prevent duplicate tag names`
- `docs: update AGENTS.md for JSON Lines persistence`

## Commands

- `npm run dev` — local dev server  
- `npm run build` — `tsc -b` + production bundle  
- `npm run lint` — ESLint  
