import { useState, type ReactNode } from 'react'
import { IconDownloadOutline16, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionExportKind } from './controller.ts'
import { SessionLogDownloadDialog, type SessionLogDownloadDialogProps } from './Dialog.tsx'
import css from './HeaderAction.module.css'

/**
 * Render the Session Header export capsule and its shared result dialog.
 * @param props - Session runtime, download controller, and localized dialog copy.
 * @returns the persistent Header action and Session-scoped dialog.
 */
export function SessionLogDownloadHeaderAction(props: SessionLogDownloadDialogProps): ReactNode {
  const { sessionId, useSessionLogDownload, request, t } = props
  const [open, setOpen] = useState(false)
  const entry = useSessionLogDownload(state => state.bySession[String(sessionId)])
  const busy = entry?.status === 'downloading'

  return (
    <>
      <Menu
        open={open}
        portal
        align="end"
        compact
        items={[
          { id: 'archive', label: t('action.archive') },
          { id: 'image', label: t('action.image') },
        ]}
        onClose={() => { setOpen(false) }}
        onSelect={(id) => {
          setOpen(false)
          void request(sessionId, id as SessionExportKind)
        }}
        anchor={(
          <button
            type="button"
            className={css.sessionLogButton}
            disabled={busy}
            aria-busy={busy}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => { setOpen(value => !value) }}
          >
            <span>{t('action.label')}</span>
            <IconDownloadOutline16 size={12} />
          </button>
        )}
      />
      <SessionLogDownloadDialog {...props} />
    </>
  )
}
