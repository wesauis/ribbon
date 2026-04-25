import { useMemo, useRef } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Fire, PencilSimple } from '@phosphor-icons/react'
import { useLongPress } from '../hooks/useLongPress'

type Props = {
  mediaIndex: number
  onEdit: (index: number) => void
  onHypeRank: (index: number) => void
  children: React.ReactNode
}

function dispatchContextMenu(el: HTMLElement, x: number, y: number): void {
  const ev = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
  })
  el.dispatchEvent(ev)
}

export function MediaRowContextMenu({
  mediaIndex,
  onEdit,
  onHypeRank,
  children,
}: Props) {
  const triggerRef = useRef<HTMLElement | null>(null)

  const { handlers, wasLongPressRef } = useLongPress((pos) => {
    const el = triggerRef.current
    if (!el) return
    dispatchContextMenu(el, pos.x, pos.y)
  })

  const onClickGuard = useMemo(() => {
    return () => wasLongPressRef.current
  }, [wasLongPressRef])

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <span
          // Radix requires a single element child for asChild.
          ref={(el) => {
            triggerRef.current = el
          }}
          className="media-row-context"
          onClick={(e) => {
            if (!onClickGuard()) return
            e.preventDefault()
            e.stopPropagation()
          }}
          {...handlers}
        >
          {children}
        </span>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="shadcn-cm__content" sideOffset={6}>
          <ContextMenu.Item
            className="shadcn-cm__item"
            onSelect={() => onEdit(mediaIndex)}
          >
            <PencilSimple className="shadcn-cm__icon" size={16} />
            <span>Editar</span>
          </ContextMenu.Item>
          <ContextMenu.Item
            className="shadcn-cm__item"
            onSelect={() => onHypeRank(mediaIndex)}
          >
            <Fire className="shadcn-cm__icon" size={16} />
            <span>Hype rank</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

