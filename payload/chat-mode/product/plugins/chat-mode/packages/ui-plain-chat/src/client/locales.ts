/** Locale namespace owned by the plain-chat launcher. */
export const NS = 'plainChat'

export const zh = {
  start: '聊天模式',
  'start.label': '开始纯聊天',
  'mode.agent': 'Agentic Coding',
  placeholder: '输入消息',
  group: '聊天',
  'session.new': '新聊天',
  'session.new.aria': '新建聊天',
} satisfies Record<string, string>

export type PlainChatKey = keyof typeof zh

export const en = {
  start: 'Chat mode',
  'start.label': 'Start plain chat',
  'mode.agent': 'Agentic Coding',
  placeholder: 'Send a message',
  group: 'Chats',
  'session.new': 'New Chat',
  'session.new.aria': 'New Chat',
} satisfies Record<PlainChatKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { plainChat: PlainChatKey }
}
