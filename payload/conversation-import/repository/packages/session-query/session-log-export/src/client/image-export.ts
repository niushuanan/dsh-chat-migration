/** Create one readable PNG from a Session's complete visible conversation. */

import type { SessionFace } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

export type ConversationExportRole = 'user' | 'assistant'

/** One visible conversation message included in the image export. */
export interface ConversationExportMessage {
  readonly role: ConversationExportRole
  readonly text: string
}

const LOGICAL_WIDTH = 1080
const PAGE_PADDING = 64
const CARD_PADDING_X = 28
const CARD_PADDING_Y = 22
const CARD_WIDTH = 860
const TEXT_FONT = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const META_FONT = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const TITLE_FONT = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const LINE_HEIGHT = 32
const MAX_CANVAS_DIMENSION = 32_000
const MAX_CANVAS_AREA = 48_000_000

function contentText(content: readonly unknown[]): string {
  const parts: string[] = []
  for (const candidate of content) {
    if (typeof candidate !== 'object' || candidate === null || !('type' in candidate)) continue
    const block = candidate as { type: unknown; text?: unknown }
    if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
    else if (block.type === 'image') parts.push('【图片】')
  }
  return parts.join('\n').trim()
}

function assistantText(blocks: readonly unknown[]): string {
  const parts: string[] = []
  for (const candidate of blocks) {
    if (typeof candidate !== 'object' || candidate === null || !('kind' in candidate)) continue
    const block = candidate as { kind: unknown; text?: unknown }
    if (block.kind === 'text' && typeof block.text === 'string') parts.push(block.text)
    else if (block.kind === 'image') parts.push('【图片】')
  }
  return parts.join('\n').trim()
}

/** Keep questions and answer text, excluding reasoning, tools, system rows, and telemetry. */
export function extractConversationMessages(snapshot: ChatSnapshot): ConversationExportMessage[] {
  const messages: ConversationExportMessage[] = []
  for (const node of snapshot.legacy.nodes) {
    if (node.kind === 'user' || node.kind === 'steering') {
      const text = contentText(node.content)
      if (text !== '') messages.push({ role: 'user', text })
    } else if (node.kind === 'assistant') {
      const text = assistantText(node.blocks)
      if (text !== '') messages.push({ role: 'assistant', text })
    }
  }
  const partial = snapshot.legacy.partial === null ? '' : assistantText(snapshot.legacy.partial.blocks)
  if (partial !== '') messages.push({ role: 'assistant', text: partial })
  return messages
}

function abortIfNeeded(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
}

/** Load every older Session page, then return the current Chat target snapshot. */
export async function loadCompleteChatSnapshot(
  session: SessionFace,
  source: Pick<ObservableSnapshot<ChatSnapshot | undefined>, 'getSnapshot'>,
  signal: AbortSignal,
): Promise<ChatSnapshot> {
  let lifecycle = session.getSnapshot()
  let stagnantPages = 0
  while (lifecycle.hasMore) {
    abortIfNeeded(signal)
    const previousCount = source.getSnapshot()?.legacy.nodes.length ?? 0
    await session.loadOlder()
    lifecycle = session.getSnapshot()
    const nextCount = source.getSnapshot()?.legacy.nodes.length ?? 0
    stagnantPages = lifecycle.hasMore && nextCount <= previousCount ? stagnantPages + 1 : 0
    if (stagnantPages >= 2) throw new Error('无法读取完整对话记录，请稍后重试。')
  }
  abortIfNeeded(signal)
  const snapshot = source.getSnapshot()
  if (snapshot === undefined) throw new Error('当前页面无法读取这段对话，请刷新后重试。')
  return snapshot
}

function cleanMarkdown(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_match, alt: string) => `【图片${alt === '' ? '' : `：${alt}`}】`)
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/^```[^\n]*\n?/gm, '')
    .replace(/```$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\r\n?/g, '\n')
    .trim()
}

function wrapText(ctx: CanvasRenderingContext2D, raw: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of cleanMarkdown(raw).split('\n')) {
    if (paragraph === '') { lines.push(''); continue }
    let line = ''
    for (const char of paragraph) {
      const candidate = line + char
      if (line !== '' && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line)
        line = char
      } else line = candidate
    }
    lines.push(line)
  }
  return lines.length === 0 ? [''] : lines
}

interface MessageLayout {
  readonly message: ConversationExportMessage
  readonly lines: readonly string[]
  readonly x: number
  readonly y: number
  readonly height: number
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) reject(new Error('浏览器无法生成对话图片。'))
      else resolve(blob)
    }, 'image/png')
  })
}

/** Render a dedicated export sheet so hidden reasoning can never leak through a DOM screenshot. */
export async function renderConversationPng(
  messages: readonly ConversationExportMessage[],
  title: string,
  generatedAt = new Date(),
): Promise<Blob> {
  const measureCanvas = document.createElement('canvas')
  const measure = measureCanvas.getContext('2d')
  if (measure === null) throw new Error('当前浏览器不支持生成对话图片。')
  measure.font = TEXT_FONT
  let cursorY = 168
  const layouts: MessageLayout[] = []
  for (const message of messages) {
    const lines = wrapText(measure, message.text, CARD_WIDTH - CARD_PADDING_X * 2)
    const height = CARD_PADDING_Y * 2 + 36 + lines.length * LINE_HEIGHT
    const x = message.role === 'user' ? LOGICAL_WIDTH - PAGE_PADDING - CARD_WIDTH : PAGE_PADDING
    layouts.push({ message, lines, x, y: cursorY, height })
    cursorY += height + 24
  }
  const logicalHeight = Math.max(360, cursorY + 40)
  const preferredScale = Math.min(2, globalThis.devicePixelRatio || 1.5)
  const scale = Math.min(preferredScale, MAX_CANVAS_DIMENSION / logicalHeight,
    Math.sqrt(MAX_CANVAS_AREA / (LOGICAL_WIDTH * logicalHeight)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(LOGICAL_WIDTH * scale))
  canvas.height = Math.max(1, Math.floor(logicalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('当前浏览器不支持生成对话图片。')
  ctx.scale(scale, scale)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, LOGICAL_WIDTH, logicalHeight)
  ctx.fillStyle = '#111318'
  ctx.font = TITLE_FONT
  ctx.fillText(title.trim() === '' ? '对话记录' : title.trim(), PAGE_PADDING, 66, LOGICAL_WIDTH - PAGE_PADDING * 2)
  ctx.fillStyle = '#7b818c'
  ctx.font = META_FONT
  ctx.fillText(`导出于 ${generatedAt.toLocaleString()}`, PAGE_PADDING, 102)
  ctx.strokeStyle = '#eceef2'
  ctx.beginPath()
  ctx.moveTo(PAGE_PADDING, 128)
  ctx.lineTo(LOGICAL_WIDTH - PAGE_PADDING, 128)
  ctx.stroke()
  if (layouts.length === 0) {
    ctx.fillStyle = '#7b818c'
    ctx.font = TEXT_FONT
    ctx.fillText('当前对话还没有可导出的问答内容。', PAGE_PADDING, 210)
  }
  for (const layout of layouts) {
    ctx.fillStyle = layout.message.role === 'user' ? '#eef5ff' : '#f7f8fa'
    roundedRect(ctx, layout.x, layout.y, CARD_WIDTH, layout.height, 20)
    ctx.fill()
    ctx.fillStyle = layout.message.role === 'user' ? '#316ee8' : '#626975'
    ctx.font = META_FONT
    ctx.fillText(layout.message.role === 'user' ? '你' : '助手', layout.x + CARD_PADDING_X, layout.y + CARD_PADDING_Y + 18)
    ctx.fillStyle = '#15171b'
    ctx.font = TEXT_FONT
    let textY = layout.y + CARD_PADDING_Y + 60
    for (const line of layout.lines) {
      ctx.fillText(line, layout.x + CARD_PADDING_X, textY)
      textY += LINE_HEIGHT
    }
  }
  return await canvasBlob(canvas)
}

/** Load the complete Chat target and render only its visible human/assistant exchange. */
export async function exportConversationImage(
  session: SessionFace,
  source: Pick<ObservableSnapshot<ChatSnapshot | undefined>, 'getSnapshot'>,
  title: string,
  signal: AbortSignal,
): Promise<Blob> {
  const snapshot = await loadCompleteChatSnapshot(session, source, signal)
  return await renderConversationPng(extractConversationMessages(snapshot), title)
}

/** Stable, filesystem-safe PNG name for one exported conversation. */
export function conversationImageFilename(sessionId: SessionId, title?: string): string {
  const stem = (title?.trim() || String(sessionId))
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
  return `${stem || 'conversation'}-conversation.png`
}
