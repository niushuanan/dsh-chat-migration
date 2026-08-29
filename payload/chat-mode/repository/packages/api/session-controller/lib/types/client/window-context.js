/** Query marker carried only by DSH windows opened through the multi-window plugin. */
export const DSH_WINDOW_ROLE_PARAM = 'dsh-window';
/** Stable per-window identity used to isolate persisted navigation. */
export const DSH_WINDOW_ID_PARAM = 'dsh-window-id';
/** Session selected when an auxiliary window is first opened. */
export const DSH_WINDOW_SESSION_PARAM = 'dsh-session';
/** Presentation marker for an auxiliary document embedded as a conversation pane. */
export const DSH_WINDOW_EMBED_PARAM = 'dsh-embed';
const AUXILIARY_ROLE = 'auxiliary';
const CONVERSATION_PANE_EMBED = 'conversation-pane';
const PRIMARY_SELECTION_KEY = 'dsh.sessions.current';
/** Parse the small, URL-owned identity contract shared by runtime and UI plugins. */
export function parseDshWindowContext(search) {
    const params = new URLSearchParams(search);
    const role = params.get(DSH_WINDOW_ROLE_PARAM);
    const windowId = params.get(DSH_WINDOW_ID_PARAM)?.trim();
    if (role !== AUXILIARY_ROLE || windowId === undefined || windowId === '') {
        return { role: 'primary' };
    }
    const sessionId = params.get(DSH_WINDOW_SESSION_PARAM)?.trim();
    return {
        role: 'auxiliary',
        windowId,
        ...(sessionId === undefined || sessionId === '' ? {} : { sessionId: sessionId }),
        ...(params.get(DSH_WINDOW_EMBED_PARAM) === CONVERSATION_PANE_EMBED ? { embedded: true } : {}),
    };
}
/** Current browser window identity; non-browser runtimes are always primary. */
export function currentDshWindowContext() {
    if (typeof location === 'undefined')
        return { role: 'primary' };
    return parseDshWindowContext(location.search);
}
/** Whether this document is one of the plugin-created auxiliary windows. */
export function isAuxiliaryDshWindow() {
    return currentDshWindowContext().role === 'auxiliary';
}
/** Whether this document is a compact conversation pane inside the primary page. */
export function isEmbeddedDshPane() {
    return currentDshWindowContext().embedded === true;
}
/** Main and auxiliary windows must never overwrite one another's last-opened conversation. */
export function sessionSelectionStorageKey(search) {
    const context = search === undefined ? currentDshWindowContext() : parseDshWindowContext(search);
    return context.role === 'auxiliary'
        ? `${PRIMARY_SELECTION_KEY}.window.${context.windowId}`
        : PRIMARY_SELECTION_KEY;
}
/** Build a same-origin URL that boots one auxiliary window on a given session. */
export function auxiliaryDshWindowUrl(currentUrl, windowId, sessionId) {
    const url = new URL(currentUrl);
    url.searchParams.set(DSH_WINDOW_ROLE_PARAM, AUXILIARY_ROLE);
    url.searchParams.set(DSH_WINDOW_ID_PARAM, windowId);
    url.searchParams.set(DSH_WINDOW_SESSION_PARAM, sessionId);
    return url.toString();
}
/** Build the isolated same-origin document used by one in-page conversation pane. */
export function embeddedDshPaneUrl(currentUrl, paneId, sessionId) {
    const url = new URL(auxiliaryDshWindowUrl(currentUrl, paneId, sessionId));
    url.searchParams.set(DSH_WINDOW_EMBED_PARAM, CONVERSATION_PANE_EMBED);
    return url.toString();
}
//# sourceMappingURL=window-context.js.map