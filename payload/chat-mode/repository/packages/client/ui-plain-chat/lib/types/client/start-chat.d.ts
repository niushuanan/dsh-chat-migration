import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client';
/** Durable preset that identifies a plain-chat Session. */
export declare const CHAT_AGENT_PRESET = "chat";
type ChatSessions = Pick<ISessions, 'list' | 'create' | 'open'>;
type PresetRemote = Pick<ClientRemote, 'agentPresets'>;
/** Reuse a blank chat or create and compose exactly one replacement. */
export declare class ChatStarter {
    private readonly sessions;
    private readonly remote;
    private creating;
    constructor(sessions: ChatSessions, remote: PresetRemote);
    private createChat;
    /** Open an existing blank chat or coalesce concurrent creation attempts. */
    start(): void;
}
export {};
//# sourceMappingURL=start-chat.d.ts.map