import type { SessionId } from '@deepseek-ai/dsh-client-connection/client';
/** Query marker carried only by DSH windows opened through the multi-window plugin. */
export declare const DSH_WINDOW_ROLE_PARAM = "dsh-window";
/** Stable per-window identity used to isolate persisted navigation. */
export declare const DSH_WINDOW_ID_PARAM = "dsh-window-id";
/** Session selected when an auxiliary window is first opened. */
export declare const DSH_WINDOW_SESSION_PARAM = "dsh-session";
/** Presentation marker for an auxiliary document embedded as a conversation pane. */
export declare const DSH_WINDOW_EMBED_PARAM = "dsh-embed";
export interface DshWindowContext {
    role: 'primary' | 'auxiliary';
    windowId?: string;
    sessionId?: SessionId;
    embedded?: boolean;
}
/** Parse the small, URL-owned identity contract shared by runtime and UI plugins. */
export declare function parseDshWindowContext(search: string): DshWindowContext;
/** Current browser window identity; non-browser runtimes are always primary. */
export declare function currentDshWindowContext(): DshWindowContext;
/** Whether this document is one of the plugin-created auxiliary windows. */
export declare function isAuxiliaryDshWindow(): boolean;
/** Whether this document is a compact conversation pane inside the primary page. */
export declare function isEmbeddedDshPane(): boolean;
/** Main and auxiliary windows must never overwrite one another's last-opened conversation. */
export declare function sessionSelectionStorageKey(search?: string): string;
/** Build a same-origin URL that boots one auxiliary window on a given session. */
export declare function auxiliaryDshWindowUrl(currentUrl: string, windowId: string, sessionId: SessionId): string;
/** Build the isolated same-origin document used by one in-page conversation pane. */
export declare function embeddedDshPaneUrl(currentUrl: string, paneId: string, sessionId: SessionId): string;
//# sourceMappingURL=window-context.d.ts.map