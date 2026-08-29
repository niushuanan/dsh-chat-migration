import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Durable preset that identifies a plain-chat Session. */
export const CHAT_AGENT_PRESET = 'chat'

type ChatSessions = Pick<ISessions, 'list' | 'create' | 'open'>
type PresetRemote = Pick<ClientRemote, 'agentPresets'>

/** Reuse a blank chat or create and compose exactly one replacement. */
export class ChatStarter {
  private creating: Promise<SessionId> | undefined

  constructor(
    private readonly sessions: ChatSessions,
    private readonly remote: PresetRemote,
  ) {}

  private async createChat(): Promise<SessionId> {
    const id = await this.sessions.create()
    const result = await this.remote.agentPresets.select(id, CHAT_AGENT_PRESET)
    if (!result.ok) throw new Error(result.error.message)
    return id
  }

  /** Open an existing blank chat or coalesce concurrent creation attempts. */
  start(): void {
    const list = this.sessions.list.getSnapshot()
    const reusable = list.ids.find((id) => {
      const row = list.byId[id]
      return row?.blank === true && row.projectionValues?.agentPreset === CHAT_AGENT_PRESET
    })
    if (reusable !== undefined) {
      this.sessions.open(reusable)
      return
    }

    const pending = this.creating ?? this.createChat()
    if (this.creating === undefined) {
      this.creating = pending
      void pending.finally(() => {
        if (this.creating === pending) this.creating = undefined
      }).catch(() => undefined)
    }
    void pending.then(
      (id) => { this.sessions.open(id) },
      (reason) => { console.warn('start chat failed:', reason) },
    )
  }
}
