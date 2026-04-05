# Ribbon

> Try now at: https://wesauis.github.io/ribbon

Local-first web app to manage a small catalog of **media entries** (name, weekdays, tags) stored in a **JSON Lines** (`.jsonl`) file on your machine. Uses the **File System Access API** (Chromium browsers) so data stays on disk, not on a server.

**Stack:** React 19, TypeScript, Vite, Fuse.js (search), PWA plugin (offline shell only—the `.jsonl` file is never precached).

For conventions, JSONL details, and commit style, see [`AGENTS.md`](./AGENTS.md).

## Development

Requirements: **Node.js** (current LTS is fine) and **npm**.

```bash
npm install
npm run dev
```

- **`npm run dev`** — Vite dev server with HMR  
- **`npm run build`** — TypeScript check + production bundle (`dist/`)  
- **`npm run lint`** — ESLint  

Open the app in **Chrome** (or another Chromium browser), pick or create a `.jsonl` file, then edit entries from the week grid, ranking list, or search.

## Deploy (optional)

GitHub Pages example: set `VITE_BASE=/your-repo-name/` for project pages, then run `npm run deploy` (see `scripts/deploy.mjs`).
