/**
 * Shell da aplicação: escolha do ficheiro `.jsonl`, lista de mídias e diálogo de edição.
 * Chrome + File System Access API; o Service Worker (vite-plugin-pwa) só faz precache do SPA.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { HypePanel } from './components/HypePanel'
import { MediaEditor } from './components/MediaEditor'
import { MediaRankList } from './components/MediaRankList'
import { MediaSearch } from './components/MediaSearch'
import { WeekGrid } from './components/WeekGrid'
import {
  readMediasFromFile,
  writeMediasToHandle,
} from './db/jsonl'
import type { FilePickerAcceptType } from './types/file-system-access'
import type { Media } from './types/media'
import { emptyMedia } from './types/media'
import {
  effectiveHypeCount,
  HYPE_COUNTS,
  type HypeCount,
} from './hype/hype'

const JSONL_TYPES: FilePickerAcceptType[] = [
  {
    description: 'JSON Lines',
    accept: {
      'application/jsonl': ['.jsonl'],
      'text/plain': ['.jsonl'],
    },
  },
]

function newMediaFromQuery(q: string): Media {
  const m = emptyMedia()
  const name = q.trim() || 'Mídia'
  m.name = name
  return m
}

function knownTagNamesFromMedias(medias: Media[]): string[] {
  const s = new Set<string>()
  for (const m of medias) {
    for (const [n] of m.tags) {
      const t = n.trim()
      if (t) s.add(t)
    }
  }
  return [...s]
}

type AppView = 'week' | 'ranking'

export default function App() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const hypeDialogRef = useRef<HTMLDialogElement>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  )
  const [medias, setMedias] = useState<Media[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [appView, setAppView] = useState<AppView>('week')
  const [hypeCandidateCount, setHypeCandidateCount] = useState<HypeCount>(2)
  /** Incrementa ao escolher quantidade no grupo — força novo lote de candidatos. */
  const [hypeCandidateNonce, setHypeCandidateNonce] = useState(0)

  const persist = useCallback(
    async (next: Media[]) => {
      if (!fileHandle) return
      await writeMediasToHandle(fileHandle, next)
    },
    [fileHandle],
  )

  const onHypeReorder = useCallback(
    (next: Media[]) => {
      setMedias(next)
      void persist(next)
    },
    [persist],
  )

  const loadFromHandle = useCallback(async (handle: FileSystemFileHandle) => {
    const file = await handle.getFile()
    const list = await readMediasFromFile(file)
    setMedias(list)
    setFileHandle(handle)
  }, [])

  const openFile = async () => {
    const [handle] = await window.showOpenFilePicker({
      types: JSONL_TYPES,
      excludeAcceptAllOption: true,
    })
    await loadFromHandle(handle)
  }

  const createFile = async () => {
    const handle = await window.showSaveFilePicker({
      types: JSONL_TYPES,
      suggestedName: 'ribbon.jsonl',
      excludeAcceptAllOption: true,
    })
    await writeMediasToHandle(handle, [])
    await loadFromHandle(handle)
  }

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (editingIndex !== null) {
      if (!d.open) d.showModal()
    } else {
      d.close()
    }
  }, [editingIndex])

  useEffect(() => {
    if (appView === 'week') {
      hypeDialogRef.current?.close()
    }
  }, [appView])

  useEffect(() => {
    if (medias.length < 2) {
      hypeDialogRef.current?.close()
    }
  }, [medias.length])

  const onDialogClose = () => {
    setEditingIndex(null)
  }

  const updateMediaAt = (index: number, next: Media) => {
    setMedias((prev) => {
      const cp = [...prev]
      cp[index] = next
      if (next.name.trim()) {
        void persist(cp)
      }
      return cp
    })
  }

  const onOpenCreate = (nameFromQuery: string) => {
    if (fileHandle === null) return
    hypeDialogRef.current?.close()
    const nm = newMediaFromQuery(nameFromQuery)
    setMedias((prev) => {
      const next = [...prev, nm]
      void persist(next)
      setEditingIndex(next.length - 1)
      return next
    })
  }

  const onOpenMedia = (index: number) => {
    hypeDialogRef.current?.close()
    setEditingIndex(index)
  }

  const onEditorChange = (next: Media) => {
    if (editingIndex === null) return
    updateMediaAt(editingIndex, next)
  }

  const onDeleteMedia = () => {
    if (editingIndex === null || fileHandle === null) return
    const idx = editingIndex
    setMedias((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      void persist(next)
      return next
    })
    setEditingIndex(null)
  }

  const knownTags = knownTagNamesFromMedias(medias)

  if (fileHandle === null) {
    return (
      <div className="app app--gate">
        <h1>Ribbon</h1>
        <p className="app__hint">
          Abra um ficheiro <code>.jsonl</code> ou crie um novo (Chrome).
        </p>
        <div className="app__gate-actions">
          <button type="button" onClick={() => void openFile()}>
            Abrir base…
          </button>
          <button type="button" onClick={() => void createFile()}>
            Criar nova base…
          </button>
        </div>
      </div>
    )
  }

  const editingMedia =
    editingIndex !== null ? medias[editingIndex] : null

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-brand">
          <h1 className="app__title">Ribbon</h1>
          <div
            className="app__view-toggle"
            role="tablist"
            aria-label="Vista principal"
          >
            <button
              type="button"
              role="tab"
              id="tab-week"
              aria-selected={appView === 'week'}
              aria-controls="app-main-panel"
              className={
                appView === 'week'
                  ? 'app__view-toggle-btn is-active'
                  : 'app__view-toggle-btn'
              }
              onClick={() => setAppView('week')}
            >
              Semana
            </button>
            <button
              type="button"
              role="tab"
              id="tab-ranking"
              aria-selected={appView === 'ranking'}
              aria-controls="app-main-panel"
              className={
                appView === 'ranking'
                  ? 'app__view-toggle-btn is-active'
                  : 'app__view-toggle-btn'
              }
              onClick={() => setAppView('ranking')}
            >
              Ranking
            </button>
          </div>
        </div>
        <div className="app__header-search">
          <button
            type="button"
            className="app__ranking-hype-btn"
            aria-label="Hype"
            title={
              medias.length < 2
                ? 'São necessárias pelo menos 2 mídias'
                : 'Hype'
            }
            disabled={medias.length < 2}
            onClick={() => hypeDialogRef.current?.showModal()}
          >
            👑
          </button>
          <MediaSearch
            medias={medias}
            onOpenCreate={onOpenCreate}
            onOpenMedia={onOpenMedia}
          />
        </div>
      </header>

      <main
        id="app-main-panel"
        role="tabpanel"
        aria-labelledby={appView === 'week' ? 'tab-week' : 'tab-ranking'}
        className="app__main"
      >
        {appView === 'week' ? (
          <WeekGrid medias={medias} onEditMedia={onOpenMedia} />
        ) : (
          <div className="app__ranking-view">
            <MediaRankList medias={medias} onEditMedia={onOpenMedia} />
          </div>
        )}
      </main>

      <dialog
        ref={hypeDialogRef}
        className="app__dialog app__dialog--hype"
        aria-labelledby="hype-dialog-title"
      >
        <div className="hype-dialog__chrome">
          <header className="hype-dialog__header">
            <h2 id="hype-dialog-title" className="hype-dialog__title">
              Hype
            </h2>
            <span className="hype-dialog__header-spacer" aria-hidden />
            <div
              className="hype-panel__count-toggle"
              role="group"
              aria-label="Quantidade a comparar"
            >
              {HYPE_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={
                    effectiveHypeCount(hypeCandidateCount, medias.length) === n
                      ? 'hype-panel__count-btn is-active'
                      : 'hype-panel__count-btn'
                  }
                  disabled={medias.length < n}
                  onClick={() => {
                    setHypeCandidateCount(n)
                    setHypeCandidateNonce((k) => k + 1)
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="hype-dialog__close"
              aria-label="Fechar comparador"
              onClick={() => hypeDialogRef.current?.close()}
            >
              ×
            </button>
          </header>
          <div className="hype-dialog__body">
            <HypePanel
              medias={medias}
              onReorder={onHypeReorder}
              variant="dialog"
              candidateCount={hypeCandidateCount}
              candidateNonce={hypeCandidateNonce}
            />
          </div>
        </div>
      </dialog>

      <dialog
        ref={dialogRef}
        className="app__dialog"
        onClose={onDialogClose}
      >
        {editingMedia && editingIndex !== null && (
          <MediaEditor
            key={editingIndex}
            media={editingMedia}
            knownTagNames={knownTags}
            onChange={onEditorChange}
            onDelete={onDeleteMedia}
            onClose={() => {
              dialogRef.current?.close()
            }}
          />
        )}
      </dialog>
    </div>
  )
}
