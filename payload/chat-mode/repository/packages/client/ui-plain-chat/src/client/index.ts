/** Register the plain-chat sidebar action. */
import type { Context } from '@deepseek-ai/cordis'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { ChatAction, type ChatActionInjected } from './ChatAction.tsx'
import { en, NS, zh } from './locales.ts'
import { ChatStarter } from './start-chat.ts'

export { ChatAction, type ChatActionInjected } from './ChatAction.tsx'
export { CHAT_AGENT_PRESET, ChatStarter } from './start-chat.ts'

/** Services required by the plain-chat launcher. */
export const inject = ['slots', 'sessions', 'locale', 'remote', 'remote.agentPresets']

/** Mount the launcher as the Chat half of the sidebar work-mode switch. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-plain-chat: dictionaries')
  const starter = new ChatStarter(ctx.sessions, ctx.remote as Pick<ClientRemote, 'agentPresets'>)
  ctx.slots.inject('sidebar.primary.action', () => ctx.slots.register({
    name: 'sidebar.primary.action',
    id: 'plain-chat',
    order: -10,
    locale: NS,
    inject: (): ChatActionInjected => ({ startChat: () => { starter.start() } }),
  }, ChatAction))
}
