import { type ReactElement, useCallback, useMemo, useRef, useState } from 'react'
import { IconChatOutline16, IconSearchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  DeepSeekImportPreview,
  DeepSeekImportPreviewItem,
  DeepSeekImportResult,
} from '../deepseek-import-types.ts'
import css from './DeepSeekImportSection.module.css'

export interface DeepSeekImportSectionInjected {
  readonly previewFile: (file: File) => Promise<DeepSeekImportPreview>
  readonly importSelection: (file: File, sourceIds: readonly string[]) => Promise<DeepSeekImportResult>
  readonly refreshSessions: () => Promise<void>
}

function sizeLabel(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`
  if (bytes < 1_048_576) return `${Math.round(bytes / 1_024)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function resultLabel(result: DeepSeekImportResult): string {
  const pieces = [`已导入 ${result.imported} 个对话`]
  if (result.skipped > 0) pieces.push(`跳过 ${result.skipped} 个已存在对话`)
  if (result.failed > 0) pieces.push(`${result.failed} 个导入失败`)
  return `${pieces.join('，')}。`
}

const DATE_FORMAT = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
})

function conversationMeta(item: DeepSeekImportPreviewItem): string {
  const pieces = [DATE_FORMAT.format(item.updatedAt), `${item.messageCount} 条消息`]
  if (item.reasoningCount > 0) pieces.push(`${item.reasoningCount} 段思考`)
  return pieces.join(' · ')
}

/** Native Settings page for previewing and selectively importing DeepSeek history. */
export function DeepSeekImportSection({
  previewFile,
  importSelection,
  refreshSessions,
}: DeepSeekImportSectionInjected): ReactElement {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'preview' | 'import'>()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<DeepSeekImportPreview>()
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const [query, setQuery] = useState('')

  const choose = useCallback(() => { input.current?.click() }, [])
  const selectedFile = useCallback(async (nextFile: File | undefined) => {
    if (nextFile === undefined || busy !== undefined) return
    setBusy('preview')
    setError('')
    setStatus('正在解析对话窗口，不会写入任何记录…')
    setFile(nextFile)
    setPreview(undefined)
    setSelected(new Set())
    setQuery('')
    try {
      const nextPreview = await previewFile(nextFile)
      setPreview(nextPreview)
      setSelected(new Set(nextPreview.conversations
        .filter(conversation => !conversation.imported)
        .map(conversation => conversation.sourceId)))
      setStatus('')
    } catch (caught) {
      setStatus('')
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(undefined)
    }
  }, [busy, previewFile])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN')
    if (preview === undefined || normalized === '') return preview?.conversations ?? []
    return preview.conversations.filter(conversation =>
      conversation.title.toLocaleLowerCase('zh-CN').includes(normalized))
  }, [preview, query])
  const availableFiltered = useMemo(
    () => filtered.filter(conversation => !conversation.imported),
    [filtered],
  )
  const allFilteredSelected = availableFiltered.length > 0
    && availableFiltered.every(conversation => selected.has(conversation.sourceId))

  const toggle = useCallback((sourceId: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(sourceId)) next.delete(sourceId)
      else next.add(sourceId)
      return next
    })
  }, [])
  const selectFiltered = useCallback(() => {
    setSelected((current) => {
      const next = new Set(current)
      for (const conversation of availableFiltered) next.add(conversation.sourceId)
      return next
    })
  }, [availableFiltered])
  const clearSelection = useCallback(() => { setSelected(new Set()) }, [])

  const runImport = useCallback(async () => {
    if (file === undefined || preview === undefined || selected.size === 0 || busy !== undefined) return
    const sourceIds = [...selected]
    setBusy('import')
    setError('')
    setStatus(`正在导入所选对话（${sourceIds.length} 个），请保持页面打开…`)
    try {
      const result = await importSelection(file, sourceIds)
      await refreshSessions()
      setStatus(resultLabel(result))
      if (result.errors.length > 0) setError(result.errors.join('\n'))
      if (result.failed === 0) {
        const imported = new Set(sourceIds)
        const conversations = preview.conversations.map(conversation =>
          imported.has(conversation.sourceId) ? { ...conversation, imported: true } : conversation)
        const importedCount = conversations.filter(conversation => conversation.imported).length
        setPreview({
          total: conversations.length,
          imported: importedCount,
          available: conversations.length - importedCount,
          conversations,
        })
        setSelected(new Set())
      }
    } catch (caught) {
      setStatus('')
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(undefined)
    }
  }, [busy, file, importSelection, preview, refreshSessions, selected])

  return (
    <section className={css.root} aria-label="导入对话">
      <header className={css.header}>
        <div>
          <h2>导入对话</h2>
          <p>先预览 DeepSeek 导出的每个对话窗口，再选择真正需要迁移的内容。</p>
        </div>
      </header>

      <div className={css.body}>
        <div className={css.sourceCard}>
          <div className={css.sourceIcon} aria-hidden="true"><IconChatOutline16 size={20} /></div>
          <div className={css.sourceCopy}>
            <strong>{file?.name ?? 'DeepSeek 历史对话'}</strong>
            <span>{file === undefined
              ? '支持官方导出的 JSON，或包含该 JSON 的 ZIP 文件。'
              : `${sizeLabel(file.size)} · 文件只在当前导入流程中使用`}</span>
          </div>
          <button type="button" className={css.importButton} disabled={busy !== undefined} onClick={choose}>
            {busy === 'preview' ? '正在解析…' : file === undefined ? '选择导出文件' : '重新选择'}
          </button>
          <input
            ref={input}
            className={css.fileInput}
            type="file"
            accept=".json,.zip,application/json,application/zip"
            aria-label="选择 DeepSeek 导出文件"
            onChange={(event) => {
              const nextFile = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              void selectedFile(nextFile)
            }}
          />
        </div>

        {preview === undefined && busy !== 'preview' && (
          <ol className={css.steps}>
            <li><span>1</span><div><strong>选择 DeepSeek 导出文件</strong><p>我的 → 系统设置 → 数据管理 → 导出所有历史对话。</p></div></li>
            <li><span>2</span><div><strong>逐个确认对话窗口</strong><p>解析后可搜索、勾选或批量选择，不会立刻写入。</p></div></li>
            <li><span>3</span><div><strong>导入到“聊天”目录</strong><p>保留原始问题、回答、时间和导出中已有的思维过程。</p></div></li>
          </ol>
        )}

        {preview !== undefined && (
          <div className={css.picker}>
            <div className={css.pickerHeading}>
              <div>
                <h3>选择要导入的对话</h3>
                <p>每一行对应 DeepSeek 中的一个独立对话窗口。</p>
              </div>
              <div className={css.summary} aria-label="解析结果">
                <span>{preview.total} 个对话窗口</span>
                <span className={css.summaryAvailable}>{preview.available} 个可导入</span>
                {preview.imported > 0 && <span>{preview.imported} 个已导入</span>}
              </div>
            </div>

            <div className={css.toolbar}>
              <label className={css.searchBox}>
                <IconSearchOutline16 size={16} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="搜索对话"
                  placeholder="搜索对话标题"
                  value={query}
                  onChange={(event) => { setQuery(event.currentTarget.value) }}
                />
              </label>
              <span className={css.matchCount}>{filtered.length} 条结果</span>
              <button type="button" className={css.textButton} disabled={availableFiltered.length === 0 || allFilteredSelected} onClick={selectFiltered}>全选当前结果</button>
              <button type="button" className={css.textButton} disabled={selected.size === 0} onClick={clearSelection}>清空选择</button>
            </div>

            <div className={css.conversationList} role="list" aria-label="DeepSeek 对话窗口">
              {filtered.map(conversation => (
                <label key={conversation.sourceId} className={conversation.imported ? css.conversationImported : css.conversationRow}>
                  <input
                    type="checkbox"
                    aria-label={`选择 ${conversation.title}`}
                    checked={selected.has(conversation.sourceId)}
                    disabled={conversation.imported || busy !== undefined}
                    onChange={() => { toggle(conversation.sourceId) }}
                  />
                  <span className={css.checkmark} aria-hidden="true" />
                  <span className={css.conversationCopy}>
                    <strong>{conversation.title}</strong>
                    <span>{conversationMeta(conversation)}</span>
                  </span>
                  {conversation.imported && <span className={css.importedBadge}>已导入</span>}
                </label>
              ))}
              {filtered.length === 0 && <div className={css.empty}>没有匹配的对话</div>}
            </div>

            <div className={css.pickerFooter}>
              <p>{selected.size === 0 ? '请选择至少一个尚未导入的对话' : `已选择 ${selected.size} 个对话`}</p>
              <button
                type="button"
                className={css.confirmButton}
                disabled={selected.size === 0 || busy !== undefined}
                onClick={() => { void runImport() }}
              >{busy === 'import' ? '正在导入…' : `导入 ${selected.size} 个对话`}</button>
            </div>
          </div>
        )}

        {status !== '' && <div className={css.status} role="status">{busy !== undefined && <span className={css.spinner} />}{status}</div>}
        {error !== '' && <div className={css.error} role="alert">{error}</div>}
        <p className={css.note}>导入内容仅写入本机 DeepSeek Harness；已存在的对话会自动标记并跳过，不会生成副本。</p>
      </div>
    </section>
  )
}
