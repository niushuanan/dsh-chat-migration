/** DeepSeek official-history normalization and native DSH Session materialization. */

import { createHash } from 'node:crypto'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session-title'
import {
  SESSION_FORMAT_VERSION,
  SessionId,
  type SessionEvent,
  type SessionHeader,
} from '@deepseek-ai/dsh-session/types'
import type { SessionPersistence } from '@deepseek-ai/dsh-session-persistence'
import { strFromU8, unzipSync } from 'fflate'
import type {
  DeepSeekImportedConversation,
  DeepSeekImportedMessage,
  DeepSeekImportPreview,
  DeepSeekImportResult,
} from './deepseek-import-types.ts'

export type {
  DeepSeekImportedConversation,
  DeepSeekImportedMessage,
  DeepSeekImportResult,
} from './deepseek-import-types.ts'

type JsonRecord = Record<string, unknown>

/** Durable native Session ready for one persistence append. */
export interface DeepSeekImportedSession {
  readonly header: SessionHeader
  readonly events: readonly SessionEvent[]
}

type ImportPersistence = Pick<SessionPersistence, 'listSnapshots' | 'create' | 'append'>
type PreviewPersistence = Pick<SessionPersistence, 'listSnapshots'>
type ImportFinalizer = (session: DeepSeekImportedSession) => Promise<void>

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sourceId(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  return ''
}

function epochMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const milliseconds = value < 1_000_000_000_000 ? value * 1_000 : value
    return Number.isSafeInteger(milliseconds) ? milliseconds : Math.round(milliseconds)
  }
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric >= 0) return epochMs(numeric)
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function normalizedTitle(value: unknown): string {
  const title = text(value).replace(/\s+/gu, ' ')
  if (title === '') return 'DeepSeek 对话'
  return title.length <= 160 ? title : `${title.slice(0, 159)}…`
}

function fragmentsOf(message: JsonRecord): readonly JsonRecord[] {
  return Array.isArray(message.fragments)
    ? message.fragments.map(record).filter((fragment): fragment is JsonRecord => fragment !== undefined)
    : []
}

interface ReferenceSource {
  readonly index: number
  readonly title: string
  readonly url: string
}

function referencesOf(fragments: readonly JsonRecord[]): readonly ReferenceSource[] {
  const sources = new Map<number, ReferenceSource>()
  const accept = (value: unknown, fallbackIndex: number): void => {
    const candidate = record(value)
    if (candidate === undefined) return
    const url = text(candidate.url)
    if (url === '') return
    const rawIndex = candidate.cite_index
    const index = typeof rawIndex === 'number' && Number.isSafeInteger(rawIndex) && rawIndex >= 0
      ? rawIndex
      : fallbackIndex
    if (sources.has(index)) return
    sources.set(index, { index, url, title: text(candidate.title) || url })
  }
  for (const fragment of fragments) {
    const type = text(fragment.type).toUpperCase()
    if (type === 'SEARCH' || type === 'TOOL_SEARCH') {
      if (Array.isArray(fragment.results)) fragment.results.forEach(accept)
      continue
    }
    if (type === 'READ_LINK') accept(fragment, sources.size)
    if (type === 'TOOL_OPEN') accept(fragment.result, sources.size)
  }
  return [...sources.values()]
}

function replaceReferences(answer: string, sources: readonly ReferenceSource[]): string {
  if (sources.length === 0) return answer
  const byIndex = new Map(sources.map(source => [source.index, source]))
  return answer.replace(/\[reference:(\d+)\]/giu, (match, digits: string) => {
    const source = byIndex.get(Number(digits))
    return source === undefined ? match : `[来源 ${source.index + 1}](${source.url})`
  })
}

function normalizeMessage(
  value: unknown,
  fallbackTime: number,
  explicitRole?: string,
  fallbackModel = 'deepseek-chat',
): DeepSeekImportedMessage | undefined {
  const message = record(value)
  if (message === undefined) return undefined
  const fragments = fragmentsOf(message)
  if (fragments.length === 0) return undefined
  const roleName = explicitRole?.toUpperCase()
  const role = roleName === 'USER'
    || (roleName === undefined && fragments.some(fragment => text(fragment.type).toUpperCase() === 'REQUEST'))
    ? 'user'
    : roleName === 'ASSISTANT' || roleName === undefined
      ? 'assistant'
      : undefined
  if (role === undefined) return undefined
  const time = epochMs(message.inserted_at) ?? epochMs(message.create_time) ?? fallbackTime
  if (role === 'user') {
    const content = fragments
      .filter(fragment => text(fragment.type).toUpperCase() === 'REQUEST')
      .map(fragment => text(fragment.content))
      .filter(Boolean)
      .join('\n\n')
    return content === '' ? undefined : { role, text: content, time }
  }
  const answer = fragments
    .filter(fragment => text(fragment.type).toUpperCase() === 'RESPONSE')
    .map(fragment => text(fragment.content))
    .filter(Boolean)
    .join('\n\n')
  const reasoning = fragments
    .filter(fragment => text(fragment.type).toUpperCase() === 'THINK')
    .map(fragment => text(fragment.content))
    .filter(Boolean)
    .join('\n\n')
  if (answer === '' && reasoning === '') return undefined
  return {
    role,
    text: replaceReferences(answer, referencesOf(fragments)),
    ...reasoning === '' ? {} : { reasoning },
    model: text(message.model) || fallbackModel,
    time,
  }
}

function mappingPath(conversation: JsonRecord, mapping: JsonRecord): readonly JsonRecord[] {
  const currentId = sourceId(conversation.current_message_id)
  if (currentId !== '') {
    const path: JsonRecord[] = []
    const visited = new Set<string>()
    let id = currentId
    while (id !== '' && !visited.has(id)) {
      visited.add(id)
      const node = record(mapping[id])
      if (node === undefined) break
      path.push(node)
      id = sourceId(node.parent)
    }
    if (path.length > 0) return path.reverse()
  }
  const path: JsonRecord[] = []
  const visited = new Set<string>()
  let id = record(mapping.root) === undefined
    ? Object.keys(mapping).find(key => record(mapping[key])?.parent === null) ?? ''
    : 'root'
  while (id !== '' && !visited.has(id)) {
    visited.add(id)
    const node = record(mapping[id])
    if (node === undefined) break
    path.push(node)
    const children = Array.isArray(node.children) ? node.children : []
    id = sourceId(children[0])
  }
  return path
}

function officialConversation(value: unknown): DeepSeekImportedConversation | undefined {
  const conversation = record(value)
  const mapping = record(conversation?.mapping)
  if (conversation === undefined || mapping === undefined) return undefined
  const id = sourceId(conversation.id)
  if (id === '') return undefined
  const createdAt = epochMs(conversation.inserted_at) ?? epochMs(conversation.create_time) ?? 0
  const messages = mappingPath(conversation, mapping)
    .map((node, index) => normalizeMessage(node.message, createdAt + index))
    .filter((message): message is DeepSeekImportedMessage => message !== undefined)
  if (messages.length === 0) return undefined
  const lastMessageTime = messages.at(-1)?.time ?? createdAt
  return {
    sourceId: id,
    title: normalizedTitle(conversation.title),
    createdAt,
    updatedAt: epochMs(conversation.updated_at) ?? epochMs(conversation.update_time) ?? lastMessageTime,
    messages,
  }
}

function rawMessagePath(conversation: JsonRecord, messages: readonly JsonRecord[]): readonly JsonRecord[] {
  const byId = new Map(messages.map(message => [sourceId(message.message_id), message]))
  let currentId = sourceId(record(conversation.chat_session)?.current_message_id)
  if (currentId === '' || !byId.has(currentId)) {
    const parents = new Set(messages.map(message => sourceId(message.parent_id)).filter(Boolean))
    currentId = [...messages]
      .filter(message => !parents.has(sourceId(message.message_id)))
      .sort((left, right) => (epochMs(left.inserted_at) ?? 0) - (epochMs(right.inserted_at) ?? 0))
      .map(message => sourceId(message.message_id))
      .at(-1) ?? ''
  }
  const path: JsonRecord[] = []
  const visited = new Set<string>()
  while (currentId !== '' && !visited.has(currentId)) {
    visited.add(currentId)
    const message = byId.get(currentId)
    if (message === undefined) break
    path.push(message)
    currentId = sourceId(message.parent_id)
  }
  return path.reverse()
}

function rawConversation(value: unknown): DeepSeekImportedConversation | undefined {
  const conversation = record(value)
  const session = record(conversation?.chat_session)
  if (conversation === undefined || session === undefined || !Array.isArray(conversation.chat_messages)) return undefined
  const id = sourceId(conversation.id) || sourceId(session.id)
  if (id === '') return undefined
  const rawMessages = conversation.chat_messages
    .map(record)
    .filter((message): message is JsonRecord => message !== undefined && sourceId(message.message_id) !== '')
  if (rawMessages.length === 0) return undefined
  const createdAt = epochMs(conversation.create_time) ?? epochMs(session.inserted_at) ?? 0
  const model = text(session.model_type) || 'deepseek-chat'
  const messages = rawMessagePath(conversation, rawMessages)
    .map((message, index) => normalizeMessage(message, createdAt + index, text(message.role), model))
    .filter((message): message is DeepSeekImportedMessage => message !== undefined)
  if (messages.length === 0) return undefined
  return {
    sourceId: id,
    title: normalizedTitle(conversation.title ?? session.title),
    createdAt,
    updatedAt: epochMs(conversation.update_time) ?? epochMs(session.updated_at) ?? messages.at(-1)?.time ?? createdAt,
    messages,
  }
}

/** Parse either the official mapping export or the raw DeepSeek API export. */
export function parseDeepSeekExportJson(input: string): DeepSeekImportedConversation[] {
  let decoded: unknown
  try {
    decoded = JSON.parse(input)
  } catch {
    throw new Error('不是有效的 DeepSeek 导出文件：JSON 无法解析')
  }
  const root = record(decoded)
  const values = Array.isArray(decoded)
    ? decoded
    : Array.isArray(root?.conversations)
      ? root.conversations
      : Array.isArray(root?.data)
        ? root.data
        : []
  const conversations = values
    .map(value => officialConversation(value) ?? rawConversation(value))
    .filter((conversation): conversation is DeepSeekImportedConversation => conversation !== undefined)
    .sort((left, right) => left.createdAt - right.createdAt || left.sourceId.localeCompare(right.sourceId))
  if (conversations.length === 0) {
    throw new Error('不是有效的 DeepSeek 导出文件：没有找到可导入的对话')
  }
  return conversations
}

/** Decode a JSON file or ZIP containing the official DeepSeek JSON export. */
export function parseDeepSeekExportBytes(
  bytes: Uint8Array,
  filename = '',
  contentType = '',
): DeepSeekImportedConversation[] {
  const zip = filename.toLowerCase().endsWith('.zip')
    || contentType.toLowerCase().includes('zip')
    || (bytes[0] === 0x50 && bytes[1] === 0x4b)
  if (!zip) return parseDeepSeekExportJson(new TextDecoder().decode(bytes))
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('不是有效的 DeepSeek 导出文件：ZIP 无法解压')
  }
  const candidates = Object.entries(files)
    .filter(([path]) => path.toLowerCase().endsWith('.json') && !path.startsWith('__MACOSX/'))
    .sort(([leftPath, left], [rightPath, right]) => {
      const leftPreferred = /conversation|chat|deepseek/iu.test(leftPath) ? 1 : 0
      const rightPreferred = /conversation|chat|deepseek/iu.test(rightPath) ? 1 : 0
      return rightPreferred - leftPreferred || right.byteLength - left.byteLength
    })
  const selected = candidates[0]
  if (selected === undefined) throw new Error('不是有效的 DeepSeek 导出文件：ZIP 中没有 JSON 对话文件')
  return parseDeepSeekExportJson(strFromU8(selected[1]))
}

export function deepSeekImportedSessionId(source: string): ReturnType<typeof SessionId> {
  return SessionId(`session-deepseek-${createHash('sha256').update(source).digest('hex').slice(0, 24)}`)
}

/** Build the newest-first, write-free conversation picker projection. */
export async function previewDeepSeekHistory(
  persistence: PreviewPersistence,
  conversations: readonly DeepSeekImportedConversation[],
): Promise<DeepSeekImportPreview> {
  const existing = new Set((await persistence.listSnapshots()).map(snapshot => String(snapshot.header.id)))
  const items = conversations.map(conversation => ({
    sourceId: conversation.sourceId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messages.length,
    reasoningCount: conversation.messages.filter(message =>
      message.role === 'assistant' && message.reasoning !== undefined).length,
    imported: existing.has(String(deepSeekImportedSessionId(conversation.sourceId))),
  })).sort((left, right) =>
    right.updatedAt - left.updatedAt
    || right.createdAt - left.createdAt
    || left.sourceId.localeCompare(right.sourceId))
  const imported = items.filter(item => item.imported).length
  return {
    total: items.length,
    available: items.length - imported,
    imported,
    conversations: items,
  }
}

/** Resolve a browser selection against the freshly reparsed source file. */
export function selectDeepSeekConversations(
  conversations: readonly DeepSeekImportedConversation[],
  sourceIds: readonly string[],
): DeepSeekImportedConversation[] {
  const selected = new Set(sourceIds)
  const known = new Set(conversations.map(conversation => conversation.sourceId))
  const missing = [...selected].filter(sourceId => !known.has(sourceId))
  if (missing.length > 0) throw new Error('所选对话与当前导出文件不匹配，请重新选择文件')
  return conversations.filter(conversation => selected.has(conversation.sourceId))
}

/** Convert one normalized source conversation into standard DSH history events. */
export function buildDeepSeekImportedSession(conversation: DeepSeekImportedConversation): DeepSeekImportedSession {
  const id = deepSeekImportedSessionId(conversation.sourceId)
  const header: SessionHeader = {
    version: SESSION_FORMAT_VERSION,
    id,
    createdAt: conversation.createdAt,
    cwd: process.cwd(),
    agentPreset: 'chat',
  }
  const events: SessionEvent[] = []
  let clock = conversation.createdAt
  const append = (type: SessionEvent['type'], data: unknown, time: number, surface = false): void => {
    clock = Math.max(clock, time)
    events.push({
      type,
      seq: events.length,
      time: clock,
      data,
      ...surface ? { surfaceOp: 'append' as const } : {},
    } as SessionEvent)
  }
  append('session/title', {
    title: conversation.title,
    messageSeqs: [],
    source: { kind: 'user' },
  }, conversation.createdAt)
  let turn = 0
  for (let index = 0; index < conversation.messages.length;) {
    const first = conversation.messages[index]
    if (first === undefined) break
    const user = first.role === 'user' ? first : undefined
    const assistant = first.role === 'assistant'
      ? first
      : conversation.messages[index + 1]?.role === 'assistant'
        ? conversation.messages[index + 1] as Extract<DeepSeekImportedMessage, { role: 'assistant' }>
        : undefined
    index += user !== undefined && assistant !== undefined ? 2 : 1
    turn += 1
    const startTime = user?.time ?? assistant?.time ?? conversation.createdAt
    append('turn/start', { turn }, startTime)
    append('step/start', { turn, step: 1 }, startTime)
    if (user !== undefined) {
      append('user/message', createUserMessage({
        content: [{ type: 'text', text: user.text }],
        source: { kind: 'user' },
      }), user.time, true)
    }
    if (assistant !== undefined) {
      const content = [
        ...assistant.reasoning === undefined ? [] : [{ type: 'reasoning' as const, text: assistant.reasoning }],
        ...assistant.text === '' ? [] : [{ type: 'text' as const, text: assistant.text }],
      ]
      append('assistant/message', {
        turn,
        step: 1,
        message: createAssistantMessage({
          content,
          source: { provider: 'deepseek-import', model: assistant.model },
        }),
      }, assistant.time, true)
    }
    const endTime = assistant?.time ?? user?.time ?? startTime
    append('step/end', { turn, step: 1 }, endTime)
    append('turn/end', { turn, reason: { kind: 'completed' } }, endTime)
  }
  return { header, events }
}

/** Persist normalized conversations without keeping their complete logs live in Host memory. */
export async function importDeepSeekHistory(
  persistence: ImportPersistence,
  conversations: readonly DeepSeekImportedConversation[],
  finalize?: ImportFinalizer,
): Promise<DeepSeekImportResult> {
  const existing = new Set((await persistence.listSnapshots()).map(snapshot => String(snapshot.header.id)))
  const importedIds: string[] = []
  const errors: string[] = []
  let skipped = 0
  let failed = 0
  for (const [index, conversation] of conversations.entries()) {
    const imported = buildDeepSeekImportedSession(conversation)
    if (existing.has(String(imported.header.id))) {
      skipped += 1
      continue
    }
    try {
      await persistence.create(imported.header)
      await persistence.append(imported.header.id, imported.events)
      existing.add(String(imported.header.id))
      importedIds.push(String(imported.header.id))
      try {
        await finalize?.(imported)
      } catch (error) {
        if (errors.length < 5) errors.push(`${conversation.title}：列表索引刷新失败（${error instanceof Error ? error.message : String(error)}）`)
      }
    } catch (error) {
      failed += 1
      if (errors.length < 5) errors.push(`${conversation.title}：${error instanceof Error ? error.message : String(error)}`)
    }
    if (index % 20 === 19) await new Promise<void>((resolve) => { setImmediate(resolve) })
  }
  return {
    imported: importedIds.length,
    skipped,
    failed,
    sessionIds: importedIds,
    errors,
  }
}
