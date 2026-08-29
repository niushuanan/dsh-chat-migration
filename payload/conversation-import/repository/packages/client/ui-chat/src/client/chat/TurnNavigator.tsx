import {
  memo, useId, useLayoutEffect, useState, type CSSProperties, type MouseEvent, type PointerEvent,
} from 'react'
import type { ChatViewSlotProps } from '../contract/slots.ts'
import type { TurnNavigationItem } from '../contract/snapshot.ts'
import css from './TurnNavigator.module.css'

interface TurnNavigatorProps {
  readonly items: readonly TurnNavigationItem[]
  readonly activeTurn: number | null
  /** Older bounded pages are still being accumulated into the complete rail. */
  readonly settling: boolean
  readonly onNavigate: (item: TurnNavigationItem) => void
  readonly t: ChatViewSlotProps['t']
}

/** Resting gap between neighbouring marks before the rail compresses to fit. */
const TURN_SPACING_PX = 10
/** Rail padding above the first mark and below the last one, per end. */
const RAIL_INSET_PX = 6

type TurnPositionStyle = CSSProperties & {
  readonly '--turn-natural-position': string
  readonly '--turn-position': string
}

type TurnRailStyle = CSSProperties & {
  readonly '--turn-natural-height': string
  readonly '--turn-rail-inset': string
}

function itemPosition(index: number, count: number): TurnPositionStyle {
  const ratio = count <= 1 ? 0 : index / (count - 1)
  return {
    '--turn-natural-position': `${String(index * TURN_SPACING_PX)}px`,
    '--turn-position': `${String(ratio * 100)}%`,
  }
}

function railSize(count: number): TurnRailStyle {
  return {
    '--turn-natural-height': `${String((count - 1) * TURN_SPACING_PX + 2 * RAIL_INSET_PX)}px`,
    '--turn-rail-inset': `${String(RAIL_INSET_PX)}px`,
  }
}

function itemAtPointer(
  items: readonly TurnNavigationItem[],
  rail: HTMLElement,
  clientY: number,
): TurnNavigationItem | undefined {
  const rect = rail.getBoundingClientRect()
  const usableHeight = Math.max(1, rect.height - 2 * RAIL_INSET_PX)
  const ratio = Math.max(0, Math.min(1, (clientY - rect.top - RAIL_INSET_PX) / usableHeight))
  return items[Math.round(ratio * (items.length - 1))]
}

function TurnNavigatorRail({ items, activeTurn, settling, onNavigate, t }: TurnNavigatorProps) {
  // Keep the useful tail rail still while bounded history pages arrive. The
  // complete array is committed in one layout pass when paging settles, so a
  // long conversation never grows and reflows one tiny mark per request.
  const [publishedItems, setPublishedItems] = useState(items)
  useLayoutEffect(() => {
    if (!settling) setPublishedItems(current => current === items ? current : items)
  }, [items, settling])
  const [previewTurn, setPreviewTurn] = useState<number | null>(null)
  const previewId = useId()
  if (publishedItems.length < 2) return null
  const previewIndex = publishedItems.findIndex(item => item.turn === previewTurn)
  const preview = previewIndex < 0 ? undefined : publishedItems[previewIndex]
  const previewPosition = previewIndex < 0
    ? undefined
    : itemPosition(previewIndex, publishedItems.length)
  const previewAtPointer = (event: PointerEvent<HTMLElement>): void => {
    setPreviewTurn(itemAtPointer(publishedItems, event.currentTarget, event.clientY)?.turn ?? null)
  }
  const navigateAtPointer = (event: MouseEvent<HTMLElement>): void => {
    const item = itemAtPointer(publishedItems, event.currentTarget, event.clientY)
    if (item !== undefined) onNavigate(item)
  }
  return (
    <div className={css.slot}>
      <nav
        className={css.rail}
        style={railSize(publishedItems.length)}
        aria-label={t('chat.turnNavigation.label')}
        aria-busy={settling || undefined}
        onClick={navigateAtPointer}
        onPointerMove={previewAtPointer}
        onPointerLeave={() => { setPreviewTurn(null) }}
      >
        <div className={css.marks}>
          {publishedItems.map((item, index) => {
            const active = item.turn === activeTurn
            const showingPreview = item.turn === previewTurn
            const markClass = active
              ? `${css.mark} ${css.markActive}`
              : showingPreview ? `${css.mark} ${css.markPreview}` : css.mark
            return (
              <div
                key={item.turn}
                className={css.markPosition}
                style={itemPosition(index, publishedItems.length)}
              >
                <button
                  type="button"
                  className={markClass}
                  aria-label={t('chat.turnNavigation.jump', { turn: item.turn })}
                  aria-current={active ? 'true' : undefined}
                  aria-describedby={showingPreview ? previewId : undefined}
                  onClick={(event) => {
                    event.stopPropagation()
                    onNavigate(item)
                  }}
                  onFocus={() => { setPreviewTurn(item.turn) }}
                  onBlur={() => { setPreviewTurn(null) }}
                />
              </div>
            )
          })}
        </div>
        {preview !== undefined && previewPosition !== undefined && (
          <div id={previewId} role="tooltip" className={css.preview} style={previewPosition}>
            <div className={css.previewTurn}>
              {t('chat.turnNavigation.turn', { turn: preview.turn })}
            </div>
            {preview.prompt !== '' && <div className={css.previewPrompt}>{preview.prompt}</div>}
            {preview.response !== '' && <div className={css.previewResponse}>{preview.response}</div>}
          </div>
        )}
      </nav>
    </div>
  )
}

/**
 * Compact rail of the currently loaded Turns with hover and focus previews.
 *
 * Memoized because it renders two host elements per loaded Turn while the
 * enclosing view re-renders on every streaming delta: without the guard a long
 * session rebuilds hundreds of marks per commit for a rail that only changes
 * when a Turn is added, removed, or becomes active. Its props must therefore
 * stay referentially stable across those commits.
 */
export const TurnNavigator = memo(TurnNavigatorRail)
