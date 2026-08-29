/**
 * Per-session Agent preset switching for the conversation header.
 *
 * A pick made during a running turn remains pending until the shared Session
 * list reports idle. The Host owns the actual maintenance boundary; this
 * controller only keeps the user's choice stable and retries a transient
 * busy refusal after the turn finishes.
 */

import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { messageOf } from './settings-store.ts'

/** Pending switch state for one Session header. */
export interface AgentPresetSessionSwitchEntry {
  /** Preset accepted by the UI but not yet visible in the Session projection. */
  readonly pending?: string
  /** Whether a Host switch call is currently in flight. */
  readonly busy: boolean
  /** Host committed the pick; only the shared Session projection is catching up. */
  readonly committed?: boolean
  /** Last non-transient failure, cleared by the next pick. */
  readonly error: string | null
}

/** Reactive state shared by every mounted Session header. */
export interface AgentPresetSessionSwitchState {
  readonly bySession: Readonly<Record<string, AgentPresetSessionSwitchEntry>>
}

/** Session facts needed to decide when a switch may be attempted. */
export interface SwitchableSessionSummary {
  readonly id: SessionId
  readonly running: boolean
  readonly projectionValues?: { readonly agentPreset?: string | null }
}

const INITIAL: AgentPresetSessionSwitchState = { bySession: {} }

/** Queue and commit per-session preset switches without interrupting turns. */
export class AgentPresetSessionSwitchController {
  readonly store: SnapshotStore<AgentPresetSessionSwitchState> = createSnapshotStore(INITIAL)

  constructor(
    private readonly remote: Pick<ClientRemote, 'agentPresets'>,
    private readonly session: (sessionId: SessionId) => SwitchableSessionSummary | undefined,
    private readonly refresh: () => void,
  ) {}

  private entry(sessionId: SessionId): AgentPresetSessionSwitchEntry | undefined {
    return this.store.getSnapshot().bySession[sessionId]
  }

  private set(sessionId: SessionId, entry: AgentPresetSessionSwitchEntry): void {
    const state = this.store.getSnapshot()
    this.store.set({ bySession: { ...state.bySession, [sessionId]: entry } })
  }

  private clear(sessionId: SessionId): void {
    const state = this.store.getSnapshot()
    if (state.bySession[sessionId] === undefined) return
    this.store.set({
      bySession: Object.fromEntries(Object.entries(state.bySession).filter(([id]) => id !== sessionId)),
    })
  }

  /** Accept one header-menu pick and apply it at the next idle boundary. */
  async select(sessionId: SessionId, agentPreset: string): Promise<void> {
    const entry = this.entry(sessionId)
    if (entry?.busy === true) return
    const current = entry?.pending ?? presetOf(this.session(sessionId))
    if (current === agentPreset) {
      this.clear(sessionId)
      return
    }
    this.set(sessionId, { pending: agentPreset, busy: false, error: null })
    await this.flush(sessionId)
  }

  /** Reconcile every pending choice after Session list state changes. */
  flushAll(): void {
    for (const sessionId of Object.keys(this.store.getSnapshot().bySession)) {
      void this.flush(sessionId as SessionId)
    }
  }

  private async flush(sessionId: SessionId): Promise<void> {
    const queued = this.entry(sessionId)
    if (queued?.pending === undefined || queued.busy) return
    const agentPreset = queued.pending
    const session = this.session(sessionId)
    if (session === undefined) {
      this.clear(sessionId)
      return
    }
    if (presetOf(session) === agentPreset) {
      this.clear(sessionId)
      return
    }
    if (session.running) return

    this.set(sessionId, { pending: agentPreset, busy: true, error: null })
    try {
      const result = await this.remote.agentPresets.select(sessionId, agentPreset)
      const current = this.entry(sessionId)
      if (current?.pending !== agentPreset) return
      if (!result.ok) {
        if (result.error.code === 'agent-preset-locked') {
          this.set(sessionId, { pending: agentPreset, busy: false, error: null })
          return
        }
        this.set(sessionId, { busy: false, error: result.error.message })
        return
      }
      // Keep the committed choice visible until the generic Session
      // projection catches up. It is already settled from the user's point of
      // view, so do not leave the header saying "Switching" while that generic
      // list refresh runs.
      this.set(sessionId, {
        pending: result.value, busy: false, committed: true, error: null,
      })
      this.refresh()
    } catch (error) {
      this.set(sessionId, { busy: false, error: messageOf(error) })
    }
  }
}

function presetOf(session: SwitchableSessionSummary | undefined): string | undefined {
  const value = session?.projectionValues?.agentPreset
  return typeof value === 'string' ? value : undefined
}
