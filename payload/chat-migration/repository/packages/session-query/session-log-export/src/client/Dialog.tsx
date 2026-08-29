import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionExportKind, SessionLogDownloadState } from './controller.ts'
import { NS } from './locales.ts'

/** Browser operations and state injected into the Session Header contribution. */
export interface SessionLogDownloadDialogInjected {
  hooks: { sessionLogDownload: ObservableSnapshot<SessionLogDownloadState> }
  request: (sessionId: SessionId, kind: SessionExportKind) => Promise<void>
  dismiss: (sessionId: SessionId) => void
}

export type SessionLogDownloadDialogProps =
  PropsRuntime<'conversation.session.header.utilities'>
  & PropsLocale<typeof NS>
  & InjectFace<SessionLogDownloadDialogInjected>

/**
 * Modal shared by the Session Header button and this browser's `/export` command.
 * @param props - Session runtime, bound controller state, actions, and localized copy.
 * @returns the modal portal contribution.
 */
export function SessionLogDownloadDialog({
  sessionId, useSessionLogDownload, dismiss, t,
}: SessionLogDownloadDialogProps) {
  const entry = useSessionLogDownload(state => state.bySession[String(sessionId)])

  const status = entry?.status
  const image = entry?.kind === 'image'
  const open = entry?.open === true
  const error = status === 'error' ? entry?.error || t('dialog.commandFailed') : null
  const title = status === 'downloading'
    ? t(image ? 'dialog.imagePreparingTitle' : 'dialog.preparingTitle')
    : status === 'success'
      ? t(image ? 'dialog.imageSuccessTitle' : 'dialog.successTitle')
      : t(image ? 'dialog.imageErrorTitle' : 'dialog.errorTitle')
  const description = status === 'downloading'
    ? t(image ? 'dialog.imagePreparingDescription' : 'dialog.preparingDescription')
    : status === 'success'
      ? t(image ? 'dialog.imageSuccessDescription' : 'dialog.successDescription')
      : error ?? t('dialog.commandFailed')

  return (
    <Modal
      open={open}
      onClose={() => { dismiss(sessionId) }}
      title={title}
      description={description}
      closeLabel={t('dialog.close')}
      footer={<Button variant="primary" onClick={() => { dismiss(sessionId) }}>{t('dialog.close')}</Button>}
    />
  )
}
