import { IconChatOutline16, IconNewChatOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { useCallback, useSyncExternalStore } from 'react'
import css from './ChatAction.module.css'

interface ModeSessionState {
  readonly current: string | undefined
  readonly byId: Record<string, {
    readonly projectionValues?: Record<string, unknown>
  }>
}

export interface ChatActionInjected {
  startChat: () => void
  sessions: HostObservable<ModeSessionState>
}

export type ChatActionProps = PropsRuntime<'sidebar.primary.action'>
  & PropsLocale<'plainChat'>
  & ChatActionInjected

/** Own the complete two-mode switch while this plugin is installed. */
export function ChatAction({
  wide, label, ariaLabel, startSession, startChat, sessions, t,
}: ChatActionProps) {
  const subscribe = useCallback((listener: () => void) => sessions.subscribe(listener), [sessions])
  const getSnapshot = useCallback(() => sessions.getSnapshot(), [sessions])
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const sessionId = state.current
  const chatActive = sessionId !== undefined
    && state.byId[sessionId]?.projectionValues?.agentPreset === 'chat'
  return (
    <div className={`${css.modeSwitch}${wide ? '' : ` ${css.collapsed}`}`} role="group">
      {wide && <span className={css.modeThumb} aria-hidden="true" data-position={chatActive ? 'right' : 'left'} />}
      <Tooltip label={ariaLabel} delayMs={500} disabled={wide}>
        <button
          type="button"
          className={css.segment}
          aria-label={ariaLabel}
          aria-pressed={!chatActive}
          onClick={startSession}
        >
          {!wide && <IconNewChatOutline16 size={18} />}
          {wide && <span className={css.segmentLabel}>{t('mode.agent') || label}</span>}
        </button>
      </Tooltip>
      <Tooltip label={t('start.label')} delayMs={500} disabled={wide}>
      <button
        type="button"
        className={css.segment}
        aria-label={t('start.label')}
        aria-pressed={chatActive}
        onClick={startChat}
      >
        {!wide && <IconChatOutline16 size={18} />}
        {wide && <span className={css.segmentLabel}>{t('start')}</span>}
      </button>
      </Tooltip>
    </div>
  )
}
