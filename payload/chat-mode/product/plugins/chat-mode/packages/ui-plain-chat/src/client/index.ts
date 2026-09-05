/** Register the plain-chat sidebar action. */
import type { Context } from '@deepseek-ai/cordis'
import { createElement } from 'react'
import { IconChatOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { ChatAction, type ChatActionInjected } from './ChatAction.tsx'
import { en, NS, zh } from './locales.ts'
import { CHAT_AGENT_PRESET, ChatStarter } from './start-chat.ts'

export { ChatAction, type ChatActionInjected } from './ChatAction.tsx'
export { CHAT_AGENT_PRESET, ChatStarter } from './start-chat.ts'

/** Services required by the plain-chat launcher. */
export const inject = [
  'slots', 'sessions', 'locale', 'remote', 'remote.agentPresets', 'conversationPresentation',
  'uiWorkspace',
]

/** Mount the launcher as the Chat half of the sidebar work-mode switch. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-plain-chat: dictionaries')
  const starter = new ChatStarter(ctx.sessions, ctx.remote as Pick<ClientRemote, 'agentPresets'>)
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.conversationPresentation.register({
    id: 'plain-chat',
    matches: session => session.projectionValues?.agentPreset === CHAT_AGENT_PRESET,
    present: () => ({
      hideHeroConfiguration: true,
      hideComposerModes: true,
      hideAuxiliaryPanes: true,
      placeholder: t('placeholder'),
    }),
  }), 'ui-plain-chat: conversation presentation')
  ctx.effect(() => ctx.uiWorkspace.registerSessionGroup({
    id: 'plain-chat',
    order: -100,
    label: () => t('group'),
    matches: session => session?.projectionValues?.agentPreset === CHAT_AGENT_PRESET,
    start: () => { starter.start() },
    renderIcon: () => createElement(IconChatOutline16),
    newSessionLabel: () => t('session.new'),
    newSessionAriaLabel: () => t('session.new.aria'),
  }), 'ui-plain-chat: sidebar Session group')
  ctx.slots.inject('sidebar.primary.action', () => ctx.slots.register({
    name: 'sidebar.primary.action',
    locale: NS,
    inject: (): ChatActionInjected => ({
      startChat: () => { starter.start() },
      sessions: ctx.sessions.list,
    }),
  }, ChatAction))
}
