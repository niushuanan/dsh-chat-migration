import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
export interface ChatActionInjected {
    startChat: () => void;
}
export type ChatActionProps = PropsRuntime<'sidebar.primary.action'> & PropsLocale<'plainChat'> & ChatActionInjected;
/** Render a wide sidebar row or its compact rail action. */
export declare function ChatAction({ wide, segment, active, startChat, t }: ChatActionProps): import("react").JSX.Element;
//# sourceMappingURL=ChatAction.d.ts.map