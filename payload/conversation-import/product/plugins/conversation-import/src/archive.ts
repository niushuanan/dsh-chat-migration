/**
 * Plugin-owned compatibility facade for the target DSH session-log exporter.
 *
 * Keeping the facade inside this plugin lets its combined export/import host
 * route stay self-contained while the removable-plugin fallback remains the
 * upstream session-log-download package.
 */

export {
  DEFAULT_SESSION_LOG_COMPRESSION_LEVEL,
  flushLiveSessionLog,
  readSessionLogText,
  serializeSessionLog,
  SESSION_LOG_FILENAME,
  sessionLogExportDeps,
  sessionLogZipEntries,
  sessionLogZipFilename,
  streamSessionLogZip,
} from '@deepseek-ai/dsh-session-log-export'

export type {
  SessionLogCompressionLevel,
  SessionLogExportDeps,
  SessionLogExportReady,
  SessionLogZipEntry,
} from '@deepseek-ai/dsh-session-log-export'
