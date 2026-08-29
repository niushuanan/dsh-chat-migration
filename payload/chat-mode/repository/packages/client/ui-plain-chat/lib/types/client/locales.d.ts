/** Locale namespace owned by the plain-chat launcher. */
export declare const NS = "plainChat";
export declare const zh: {
    start: string;
    'start.label': string;
};
export type PlainChatKey = keyof typeof zh;
export declare const en: {
    start: string;
    'start.label': string;
};
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        plainChat: PlainChatKey;
    }
}
//# sourceMappingURL=locales.d.ts.map