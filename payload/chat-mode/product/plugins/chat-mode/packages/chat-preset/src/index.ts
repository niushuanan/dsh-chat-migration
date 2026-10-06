/** Registers the internal chat composition with the current declarative registry. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-preset-registry'

export const inject = ['agentPresets']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.agentPresets.register({
    id: 'chat', name: '聊天', order: 99,
    description: '产品内部使用的纯对话预设，不提供文件、命令或 Agent 工具。',
    plugins: [
      { id: 'persona', name: '@deepseek-ai/dsh-persona', config: {
        prefix: 'You are a helpful conversational assistant. Respond naturally, directly, and thoughtfully to the user. You can search and read public web pages when the answer needs current or source-backed information, and should cite the relevant URLs. You cannot access local files, folders, projects, commands, applications, or other external systems. Never imply that you performed actions outside this conversation or beyond the web tools actually available to you.',
        complete: true, includeRuntimeContext: false,
      } },
      { id: 'tool-web', name: '@deepseek-ai/dsh-tool-web', config: { fetch: true, searchTimeoutMs: 60000 } },
    ],
  }), 'chat-mode: plain-chat preset')
}
