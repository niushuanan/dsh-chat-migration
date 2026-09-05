/** Host registration for the plain-chat preset bundled by this plugin. */

import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-presets'

export const inject = ['agentPresets']

export function apply(ctx: Context): void {
  const root = fileURLToPath(new URL('../../../presets/', import.meta.url))
  ctx.effect(
    () => ctx.agentPresets.registerRoot({ path: root, trust: 'system' }),
    'chat-mode: plain-chat preset root',
  )
}
