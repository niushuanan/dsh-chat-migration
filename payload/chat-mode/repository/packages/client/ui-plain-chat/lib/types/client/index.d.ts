/** Register the plain-chat sidebar action. */
import type { Context } from '@deepseek-ai/cordis';
export { ChatAction, type ChatActionInjected } from './ChatAction.tsx';
export { CHAT_AGENT_PRESET, ChatStarter } from './start-chat.ts';
/** Services required by the plain-chat launcher. */
export declare const inject: string[];
/** Mount the launcher as the Chat half of the sidebar work-mode switch. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map