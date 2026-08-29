/** Browser plugin owning Session export download state and its shared modal. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-commands/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { DeepSeekImportPreview, DeepSeekImportResult } from '../deepseek-import-types.ts'
import { SessionLogDownloadController } from './controller.ts'
import { DeepSeekImportSection, type DeepSeekImportSectionInjected } from './DeepSeekImportSection.tsx'
import { exportConversationImage } from './image-export.ts'
import type { SessionLogDownloadDialogInjected } from './Dialog.tsx'
import { SessionLogDownloadHeaderAction } from './HeaderAction.tsx'
import { en, NS, zh, type SessionLogDownloadKey } from './locales.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionLogDownload: SessionLogDownloadController
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'session-log-download': SessionLogDownloadKey
  }
}

export type { SessionLogDownloadEntry, SessionLogDownloadState } from './controller.ts'

export const inject = ['slots', 'locale', 'sessions', 'uiConversation']

function rawFileHeaders(file: File): Record<string, string> {
  return {
    'content-type': file.type || (file.name.toLowerCase().endsWith('.zip') ? 'application/zip' : 'application/json'),
    'x-dsh-import-filename': encodeURIComponent(file.name),
  }
}

async function responseBody<T>(response: Response, label: string): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? `${label}失败（HTTP ${response.status}）`)
  return body
}

async function previewDeepSeekFile(file: File): Promise<DeepSeekImportPreview> {
  const response = await fetch('/api/session.import.deepseek?mode=preview', {
    method: 'POST',
    body: file,
    headers: rawFileHeaders(file),
  })
  const body = await responseBody<Partial<DeepSeekImportPreview>>(response, '解析')
  if (typeof body.total !== 'number'
    || typeof body.available !== 'number'
    || typeof body.imported !== 'number'
    || !Array.isArray(body.conversations)) {
    throw new Error('解析服务返回了无法识别的结果')
  }
  return {
    total: body.total,
    available: body.available,
    imported: body.imported,
    conversations: body.conversations,
  }
}

async function importDeepSeekSelection(file: File, sourceIds: readonly string[]): Promise<DeepSeekImportResult> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('selection', JSON.stringify(sourceIds))
  const response = await fetch('/api/session.import.deepseek', { method: 'POST', body: form })
  const body = await responseBody<Partial<DeepSeekImportResult>>(response, '导入')
  if (typeof body.imported !== 'number' || typeof body.skipped !== 'number' || typeof body.failed !== 'number') {
    throw new Error('导入服务返回了无法识别的结果')
  }
  return {
    imported: body.imported,
    skipped: body.skipped,
    failed: body.failed,
    sessionIds: Array.isArray(body.sessionIds) ? body.sessionIds.filter((id): id is string => typeof id === 'string') : [],
    errors: Array.isArray(body.errors) ? body.errors.filter((error): error is string => typeof error === 'string') : [],
  }
}

/**
 * Provide the download controller and mount its modal into the Session Header.
 * @param ctx - browser context carrying slots and locale services.
 */
export function apply(ctx: ClientContext): void {
  const sessions = ctx.get('sessions') as unknown as ISessions
  const controller = new SessionLogDownloadController(
    undefined,
    undefined,
    async (sessionId, signal) => {
      const binding = sessions.binding(sessionId)
      if (binding === undefined) throw new Error('当前对话尚未加载，请刷新后重试。')
      const title = sessions.list.getSnapshot().byId[sessionId]?.displayTitle
      const source = ctx.uiConversation.binding(binding).target('chat')
      const blob = await exportConversationImage(binding.session, source, title ?? '对话记录', signal)
      return title === undefined ? { blob } : { blob, title }
    },
  )
  ctx.provide('sessionLogDownload', controller)
  ctx.effect(() => async () => { await controller.dispose() }, 'session-log-download: browser download lifecycle')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-log-download: browser dictionaries')
  ctx.on('command/executed', (sessionId, commandName, result) => {
    if (commandName === 'export' && result.kind === 'success') void controller.download(sessionId)
  })
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'session-log-download',
    locale: NS,
    inject: (): SessionLogDownloadDialogInjected => ({
      hooks: { sessionLogDownload: controller.store },
      request: (sessionId: SessionId, kind) => controller.download(sessionId, kind),
      dismiss: (sessionId: SessionId) => { controller.dismiss(sessionId) },
    }),
  }, SessionLogDownloadHeaderAction))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'conversation-import',
    order: 5,
    label: () => '导入对话',
    inject: (): DeepSeekImportSectionInjected => ({
      previewFile: previewDeepSeekFile,
      importSelection: importDeepSeekSelection,
      refreshSessions: () => sessions.refresh(),
    }),
  }, DeepSeekImportSection))
}

export type { SessionLogDownloadDialogInjected, SessionLogDownloadDialogProps } from './Dialog.tsx'
export type { DeepSeekImportSectionInjected } from './DeepSeekImportSection.tsx'
