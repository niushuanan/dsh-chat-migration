import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { ComposerAddMenu } from './ComposerAddMenu.tsx'
import { en, zh, type ComposerAddMenuKey } from './locales.ts'

export { ComposerAddMenu } from './ComposerAddMenu.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Composer attachment and capability directory copy. */
    composerAddMenu: ComposerAddMenuKey
  }
}

const NS = 'composerAddMenu'

export const inject = ['slots', 'locale']

/** Occupy the native composer add seat with the unified one-layer directory. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'composer-add-menu: dictionaries')
  ctx.slots.inject('conversation.input.add', () => ctx.slots.register({
    name: 'conversation.input.add',
    priority: -10,
    locale: NS,
  }, ComposerAddMenu))
}
