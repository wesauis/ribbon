import { useCallback, useEffect, useRef } from 'react'

type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onPointerMove: (e: React.PointerEvent) => void
}

type Opts = {
  delayMs?: number
  moveTolerancePx?: number
}

type Point = { x: number; y: number }

export function useLongPress(
  onLongPress: (pos: Point) => void,
  opts: Opts = {},
): { handlers: LongPressHandlers; wasLongPressRef: React.RefObject<boolean> } {
  const delayMs = opts.delayMs ?? 450
  const moveTolerancePx = opts.moveTolerancePx ?? 10

  const timerRef = useRef<number | null>(null)
  const startRef = useRef<Point | null>(null)
  const lastRef = useRef<Point | null>(null)
  const wasLongPressRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clear, [clear])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return
      wasLongPressRef.current = false
      const p = { x: e.clientX, y: e.clientY }
      startRef.current = p
      lastRef.current = p
      clear()
      timerRef.current = window.setTimeout(() => {
        const pos = lastRef.current ?? p
        wasLongPressRef.current = true
        onLongPress(pos)
      }, delayMs)
    },
    [clear, delayMs, onLongPress],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (timerRef.current === null) return
      const p = { x: e.clientX, y: e.clientY }
      lastRef.current = p
      const s = startRef.current
      if (!s) return
      const dx = p.x - s.x
      const dy = p.y - s.y
      if (dx * dx + dy * dy > moveTolerancePx * moveTolerancePx) {
        clear()
      }
    },
    [clear, moveTolerancePx],
  )

  const onPointerUp = useCallback(() => {
    clear()
  }, [clear])

  const onPointerCancel = useCallback(() => {
    clear()
  }, [clear])

  return {
    handlers: { onPointerDown, onPointerUp, onPointerCancel, onPointerMove },
    wasLongPressRef,
  }
}

