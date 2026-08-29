/** Locale namespace owned by the plain-chat launcher. */
export const NS = 'plainChat'

export const zh = {
  start: '聊天模式',
  'start.label': '开始纯聊天',
} satisfies Record<string, string>

export type PlainChatKey = keyof typeof zh

export const en = {
  start: 'Chat mode',
  'start.label': 'Start plain chat',
} satisfies Record<PlainChatKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { plainChat: PlainChatKey }
}
