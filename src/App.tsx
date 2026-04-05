/**
 * Shell da aplicação: escolha do ficheiro `.jsonl`, lista de mídias e diálogo de edição.
 * Chrome + File System Access API; o Service Worker (vite-plugin-pwa) só faz precache do SPA.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { MediaEditor } from './components/MediaEditor'
import { MediaSearch } from './components/MediaSearch'
import { WeekGrid } from './components/WeekGrid'
import {
  readMediasFromFile,
  writeMediasToHandle,
} from './db/jsonl'
import type { FilePickerAcceptType } from './types/file-system-access'
import type { Media } from './types/media'
import { emptyMedia } from './types/media'

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

export default function App() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  )
  const [medias, setMedias] = useState<Media[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const persist = useCallback(
    async (next: Media[]) => {
      if (!fileHandle) return
      await writeMediasToHandle(fileHandle, next)
    },
    [fileHandle],
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
    const nm = newMediaFromQuery(nameFromQuery)
    setMedias((prev) => {
      const next = [...prev, nm]
      void persist(next)
      setEditingIndex(next.length - 1)
      return next
    })
  }

  const onOpenMedia = (index: number) => {
    setEditingIndex(index)
  }

  const onEditorChange = (next: Media) => {
    if (editingIndex === null) return
    updateMediaAt(editingIndex, next)
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
        <h1 className="app__title">Ribbon</h1>
        <MediaSearch
          medias={medias}
          onOpenCreate={onOpenCreate}
          onOpenMedia={onOpenMedia}
        />
      </header>

      <WeekGrid medias={medias} onEditMedia={onOpenMedia} />

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
            onClose={() => {
              dialogRef.current?.close()
            }}
          />
        )}
      </dialog>
    </div>
  )
}
