import type { ChatNodeOwnerProps, ChatViewSlotProps } from '../contract/slots.ts';
import type { ChatNode } from '../contract/chat-nodes.ts';
interface ChatNodeSeatProps extends ChatNodeOwnerProps {
    readonly nodeKey: string;
    readonly useSession: ChatViewSlotProps['useSession'];
    readonly renderSlot: ChatViewSlotProps['renderSlot'];
    readonly t: ChatViewSlotProps['t'];
}
/** Stable source identity owned by the conversation row, outside pluggable renderers. */
export declare function messageAnchor(node: ChatNode): {
    readonly role: 'assistant';
    readonly seq: number;
} | undefined;
/** Subscribe and dispatch one stable Context key without observing sibling Nodes. */
export declare const ChatNodeSeat: import("react").MemoExoticComponent<({ nodeKey, selectedCallId, cwd, openFile, inspectCall, forkAt, renderMessageImages, fileMentions, useSession, renderSlot, t, }: ChatNodeSeatProps) => import("react").JSX.Element | null>;
export {};
//# sourceMappingURL=ChatNodeSeat.d.ts.map