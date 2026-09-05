/** Locale namespace owned by Session export browser feedback. */
export const NS = 'session-log-download'

/** Simplified-Chinese Session export strings. */
export const zh = {
  'action.label': '导出对话',
  'action.archive': '导出文本记录',
  'action.image': '导出对话图片',
  'dialog.preparingTitle': '正在导出 Session',
  'dialog.preparingDescription': '正在准备包含当前 Session、子 Session 和附件的 ZIP 文件。',
  'dialog.successTitle': 'Session 导出已开始下载',
  'dialog.successDescription': '浏览器正在下载 Session ZIP 文件。',
  'dialog.errorTitle': 'Session 导出失败',
  'dialog.close': '关闭',
  'dialog.commandFailed': '无法启动 Session 导出。',
  'dialog.imagePreparingTitle': '正在生成对话图片',
  'dialog.imagePreparingDescription': '正在读取完整对话，并整理为一张不含思考过程的长图。',
  'dialog.imageSuccessTitle': '对话图片已开始下载',
  'dialog.imageSuccessDescription': '浏览器正在下载完整对话长图。',
  'dialog.imageErrorTitle': '对话图片生成失败',
} as const

/** English Session export strings. */
export const en: Record<keyof typeof zh, string> = {
  'action.label': 'Export',
  'action.archive': 'Export text record',
  'action.image': 'Export conversation image',
  'dialog.preparingTitle': 'Exporting Session',
  'dialog.preparingDescription': 'Preparing a ZIP containing this Session, its sub-Sessions, and attachments.',
  'dialog.successTitle': 'Session download started',
  'dialog.successDescription': 'The browser is downloading the Session ZIP.',
  'dialog.errorTitle': 'Session export failed',
  'dialog.close': 'Close',
  'dialog.commandFailed': 'Could not start the Session export.',
  'dialog.imagePreparingTitle': 'Creating conversation image',
  'dialog.imagePreparingDescription': 'Loading the complete conversation and creating one long image without reasoning details.',
  'dialog.imageSuccessTitle': 'Conversation image download started',
  'dialog.imageSuccessDescription': 'The browser is downloading the complete conversation image.',
  'dialog.imageErrorTitle': 'Could not create conversation image',
}

/** Stable locale keys consumed by the shared modal. */
export type SessionLogDownloadKey = keyof typeof zh
