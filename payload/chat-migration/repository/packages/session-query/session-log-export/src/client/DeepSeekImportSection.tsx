import { type ReactElement, useCallback, useRef, useState } from 'react'
import { IconChatOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DeepSeekImportResult } from '../deepseek-import-types.ts'
import css from './DeepSeekImportSection.module.css'

export interface DeepSeekImportSectionInjected {
  readonly importFile: (file: File) => Promise<DeepSeekImportResult>
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

/** Native Settings page for one-file DeepSeek history migration. */
export function DeepSeekImportSection({
  importFile,
  refreshSessions,
}: DeepSeekImportSectionInjected): ReactElement {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<{ name: string; size: number }>()

  const choose = useCallback(() => { input.current?.click() }, [])
  const selectedFile = useCallback(async (file: File | undefined) => {
    if (file === undefined || busy) return
    setBusy(true)
    setError('')
    setSelected({ name: file.name, size: file.size })
    setStatus('正在解析并写入历史对话，请保持页面打开…')
    try {
      const result = await importFile(file)
      await refreshSessions()
      setStatus(resultLabel(result))
      if (result.errors.length > 0) setError(result.errors.join('\n'))
    } catch (caught) {
      setStatus('')
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }, [busy, importFile, refreshSessions])

  return (
    <section className={css.root} aria-label="导入对话">
      <header className={css.header}>
        <div>
          <h2>导入对话</h2>
          <p>把 DeepSeek 官方平台导出的历史记录，原生迁移到 DeepSeek Harness。</p>
        </div>
      </header>

      <div className={css.body}>
        <div className={css.sourceCard}>
          <div className={css.sourceIcon} aria-hidden="true"><IconChatOutline16 size={20} /></div>
          <div className={css.sourceCopy}>
            <strong>DeepSeek 历史对话</strong>
            <span>支持官方导出的 JSON，或包含该 JSON 的 ZIP 文件。</span>
          </div>
          <button type="button" className={css.importButton} disabled={busy} onClick={choose}>
            {busy ? '正在导入…' : '选择导出文件'}
          </button>
          <input
            ref={input}
            className={css.fileInput}
            type="file"
            accept=".json,.zip,application/json,application/zip"
            aria-label="选择 DeepSeek 导出文件"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              void selectedFile(file)
            }}
          />
        </div>

        <ol className={css.steps}>
          <li><span>1</span><div><strong>在 DeepSeek 导出</strong><p>我的 → 系统设置 → 数据管理 → 导出所有历史对话。</p></div></li>
          <li><span>2</span><div><strong>在这里选择文件</strong><p>导入会保留原始问题、回答、时间和导出中已有的思维过程。</p></div></li>
          <li><span>3</span><div><strong>继续正常使用</strong><p>导入结果会进入“聊天”目录，并按原对话时间排列。</p></div></li>
        </ol>

        {selected !== undefined && (
          <div className={css.fileMeta}>
            <span>{selected.name}</span><span>{sizeLabel(selected.size)}</span>
          </div>
        )}
        {status !== '' && <div className={css.status} role="status">{busy && <span className={css.spinner} />}{status}</div>}
        {error !== '' && <div className={css.error} role="alert">{error}</div>}
        <p className={css.note}>重复导入同一份记录会自动跳过已有对话，不会生成副本。当前仅兼容 DeepSeek 官方平台。</p>
      </div>
    </section>
  )
}
