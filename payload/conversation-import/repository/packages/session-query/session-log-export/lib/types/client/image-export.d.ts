/** Create one readable PNG from a Session's complete visible conversation. */
import type { SessionFace } from '@deepseek-ai/dsh-api-session-controller/client';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
export type ConversationExportRole = 'user' | 'assistant';
/** One visible conversation message included in the image export. */
export interface ConversationExportMessage {
    readonly role: ConversationExportRole;
    readonly text: string;
}
/** Keep questions and answer text, excluding reasoning, tools, system rows, and telemetry. */
export declare function extractConversationMessages(snapshot: ChatSnapshot): ConversationExportMessage[];
/** Load every older Session page, then return the current Chat target snapshot. */
export declare function loadCompleteChatSnapshot(session: SessionFace, source: Pick<ObservableSnapshot<ChatSnapshot | undefined>, 'getSnapshot'>, signal: AbortSignal): Promise<ChatSnapshot>;
/** Render a dedicated export sheet so hidden reasoning can never leak through a DOM screenshot. */
export declare function renderConversationPng(messages: readonly ConversationExportMessage[], title: string, generatedAt?: Date): Promise<Blob>;
/** Load the complete Chat target and render only its visible human/assistant exchange. */
export declare function exportConversationImage(session: SessionFace, source: Pick<ObservableSnapshot<ChatSnapshot | undefined>, 'getSnapshot'>, title: string, signal: AbortSignal): Promise<Blob>;
/** Stable, filesystem-safe PNG name for one exported conversation. */
export declare function conversationImageFilename(sessionId: SessionId, title?: string): string;
//# sourceMappingURL=image-export.d.ts.map