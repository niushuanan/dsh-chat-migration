/** DeepSeek official-history normalization and native DSH Session materialization. */
import { SessionId, type SessionEvent, type SessionHeader } from '@deepseek-ai/dsh-session/types';
import type { SessionPersistence } from '@deepseek-ai/dsh-session-persistence';
import type { DeepSeekImportedConversation, DeepSeekImportPreview, DeepSeekImportResult } from './deepseek-import-types.ts';
export type { DeepSeekImportedConversation, DeepSeekImportedMessage, DeepSeekImportResult, } from './deepseek-import-types.ts';
/** Durable native Session ready for one persistence append. */
export interface DeepSeekImportedSession {
    readonly header: SessionHeader;
    readonly events: readonly SessionEvent[];
}
type ImportPersistence = Pick<SessionPersistence, 'listSnapshots' | 'create' | 'append'>;
type PreviewPersistence = Pick<SessionPersistence, 'listSnapshots'>;
type ImportFinalizer = (session: DeepSeekImportedSession) => Promise<void>;
/** Parse either the official mapping export or the raw DeepSeek API export. */
export declare function parseDeepSeekExportJson(input: string): DeepSeekImportedConversation[];
/** Decode a JSON file or ZIP containing the official DeepSeek JSON export. */
export declare function parseDeepSeekExportBytes(bytes: Uint8Array, filename?: string, contentType?: string): DeepSeekImportedConversation[];
export declare function deepSeekImportedSessionId(source: string): ReturnType<typeof SessionId>;
/** Build the newest-first, write-free conversation picker projection. */
export declare function previewDeepSeekHistory(persistence: PreviewPersistence, conversations: readonly DeepSeekImportedConversation[]): Promise<DeepSeekImportPreview>;
/** Resolve a browser selection against the freshly reparsed source file. */
export declare function selectDeepSeekConversations(conversations: readonly DeepSeekImportedConversation[], sourceIds: readonly string[]): DeepSeekImportedConversation[];
/** Convert one normalized source conversation into standard DSH history events. */
export declare function buildDeepSeekImportedSession(conversation: DeepSeekImportedConversation): DeepSeekImportedSession;
/** Persist normalized conversations without keeping their complete logs live in Host memory. */
export declare function importDeepSeekHistory(persistence: ImportPersistence, conversations: readonly DeepSeekImportedConversation[], finalize?: ImportFinalizer): Promise<DeepSeekImportResult>;
//# sourceMappingURL=deepseek-import.d.ts.map