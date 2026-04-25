import { useEffect, useMemo, useRef } from 'react'

export type MediaContextMenuAction = 'edit' | 'hype'

export type MediaContextMenuState = {
  isOpen: boolean
  x: number
  y: number
  mediaIndex: number
}

type Props = {
  state: MediaContextMenuState | null
  onClose: () => void
  onAction: (action: MediaContextMenuAction, mediaIndex: number) => void
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function MediaContextMenu({ state, onClose, onAction }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  const pos = useMemo(() => {
    if (!state) return null
    // Keep within viewport with a rough menu size bound.
    const w = 220
    const h = 120
    const x = clamp(state.x, 8, window.innerWidth - w - 8)
    const y = clamp(state.y, 8, window.innerHeight - h - 8)
    return { x, y }
  }, [state])

  useEffect(() => {
    if (!state) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current
      if (!el) return
      if (e.target instanceof Node && el.contains(e.target)) return
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
    }
  }, [state, onClose])

  if (!state || !pos) return null

  return (
    <div
      className="media-context-menu__backdrop"
      aria-hidden={!state.isOpen}
    >
      <div
        ref={menuRef}
        role="menu"
        aria-label="Menu de mídia"
        className="media-context-menu"
        style={{ left: pos.x, top: pos.y }}
      >
        <button
          type="button"
          role="menuitem"
          className="media-context-menu__item"
          onClick={() => onAction('edit', state.mediaIndex)}
        >
          Editar
        </button>
        <button
          type="button"
          role="menuitem"
          className="media-context-menu__item"
          onClick={() => onAction('hype', state.mediaIndex)}
        >
          Hype rank
        </button>
      </div>
    </div>
  )
}

