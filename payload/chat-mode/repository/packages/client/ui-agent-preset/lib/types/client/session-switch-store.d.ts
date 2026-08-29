/**
 * Per-session Agent preset switching for the conversation header.
 *
 * A pick made during a running turn remains pending until the shared Session
 * list reports idle. The Host owns the actual maintenance boundary; this
 * controller only keeps the user's choice stable and retries a transient
 * busy refusal after the turn finishes.
 */
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
/** Pending switch state for one Session header. */
export interface AgentPresetSessionSwitchEntry {
    /** Preset accepted by the UI but not yet visible in the Session projection. */
    readonly pending?: string;
    /** Whether a Host switch call is currently in flight. */
    readonly busy: boolean;
    /** Host committed the pick; only the shared Session projection is catching up. */
    readonly committed?: boolean;
    /** Last non-transient failure, cleared by the next pick. */
    readonly error: string | null;
}
/** Reactive state shared by every mounted Session header. */
export interface AgentPresetSessionSwitchState {
    readonly bySession: Readonly<Record<string, AgentPresetSessionSwitchEntry>>;
}
/** Session facts needed to decide when a switch may be attempted. */
export interface SwitchableSessionSummary {
    readonly id: SessionId;
    readonly running: boolean;
    readonly projectionValues?: {
        readonly agentPreset?: string | null;
    };
}
/** Queue and commit per-session preset switches without interrupting turns. */
export declare class AgentPresetSessionSwitchController {
    private readonly remote;
    private readonly session;
    private readonly refresh;
    readonly store: SnapshotStore<AgentPresetSessionSwitchState>;
    constructor(remote: Pick<ClientRemote, 'agentPresets'>, session: (sessionId: SessionId) => SwitchableSessionSummary | undefined, refresh: () => void);
    private entry;
    private set;
    private clear;
    /** Accept one header-menu pick and apply it at the next idle boundary. */
    select(sessionId: SessionId, agentPreset: string): Promise<void>;
    /** Reconcile every pending choice after Session list state changes. */
    flushAll(): void;
    private flush;
}
//# sourceMappingURL=session-switch-store.d.ts.map