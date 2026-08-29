import { IconChatOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import css from './ChatAction.module.css'

export interface ChatActionInjected { startChat: () => void }

export type ChatActionProps = PropsRuntime<'sidebar.primary.action'>
  & PropsLocale<'plainChat'>
  & ChatActionInjected

/** Render a wide sidebar row or its compact rail action. */
export function ChatAction({ wide, segment, active, startChat, t }: ChatActionProps) {
  return (
    <Tooltip label={t('start.label')} delayMs={500} disabled={wide}>
      <button
        type="button"
        className={segment ? css.segment : `${css.action}${wide ? ` ${css.wide}` : ` ${css.rail}`}`}
        aria-label={t('start.label')}
        aria-pressed={segment ? active === true : undefined}
        onClick={startChat}
      >
        {!wide && <IconChatOutline16 size={18} />}
        {wide && <span className={segment ? css.segmentLabel : css.label}>{t('start')}</span>}
      </button>
    </Tooltip>
  )
}
