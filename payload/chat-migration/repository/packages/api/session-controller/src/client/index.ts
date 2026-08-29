/** Client Session object layer, Agent scopes, and Remote lifecycle wiring. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent/types'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import { createSessionControlStream } from './transport.ts'
import { ClientSessions } from './sessions/service.ts'
import type { SessionRemotes } from './sessions/remotes.ts'
import type {} from '../remote-events.ts'

// Compatibility surface for pre-0.1.2 browser plugins. The official
// controller now owns these utilities in focused modules, while existing DSH
// extensions still import them from the controller's public client face.
export type { Context as ClientContext } from '@deepseek-ai/cordis'
export type { SessionId } from '@deepseek-ai/dsh-session/types'
export { createSnapshotStore, defineStore } from '@deepseek-ai/dsh-client-store'
export type { EngineStoreHandle, SnapshotStore } from '@deepseek-ai/dsh-client-store'
export {
  DSH_WINDOW_SESSION_PARAM,
  auxiliaryDshWindowUrl,
  currentDshWindowContext,
  embeddedDshPaneUrl,
  isAuxiliaryDshWindow,
  parseDshWindowContext,
  sessionSelectionStorageKey,
} from './window-context.ts'
export { SESSION_DRAG_MIME } from './drag-transfer.ts'

export {
  createSessionControlStream,
  SessionEventStream,
  SESSION_SEARCH_RESULT_LIMIT,
  SESSION_SEARCH_SNIPPET_MAX_CODE_POINTS,
  sessionStreamFailure,
} from './transport.ts'
export type {
  ClientSessionPageRequest,
  SessionControlStream,
  SessionControlStreamOptions,
  SessionEventStreamOptions,
  SessionJournalChange,
  SessionRemote,
} from './transport.ts'
export { createScope, scopeOf } from './scope.ts'
export type { AgentContext, AgentScopeHandle } from './scope.ts'
export { SessionCreateError, SessionForkError } from './sessions/service.ts'
export type { SessionBinding, SessionListState, SessionSummary } from './sessions/service.ts'
export type {
  SessionListPhase,
  SessionListSnapshot,
  SessionSearchResultItem,
  SubagentCatalogSnapshot,
} from './sessions/manager.ts'
export type { Session } from './sessions/session.ts'
export type {
  ProjectionsBaseline,
  ProjectionValueStore,
  SessionProjectionMap,
  UseProjection,
} from './sessions/projection-store.ts'
export type {
  BeginSubmissionInput,
  ISession,
  PendingSubmissionRetirement,
  ProjectionsFace,
  SessionFace,
  SubmissionHandle,
} from './contract/session.ts'
export type { ISessions } from './contract/sessions.ts'
export { MutableSessionEventSource } from './contract/events.ts'
export type {
  SessionEventChange,
  SessionEventLike,
  SessionEventLikeEntry,
  SessionEventSource,
  SessionEventWindow,
  SessionLiveEventEntry,
} from './contract/events.ts'
export type {
  OpenState,
  PendingSubmission,
  PendingSubmissionImage,
  PromptError,
  QueuedMessage,
  SessionSnapshot,
} from './contract/snapshot.ts'
export type { ClientFailure, ClientResult } from './contract/result.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Client Session object layer and Agent scope owner. */
    sessions: import('./contract/sessions.ts').ISessions
  }
}

/** Required wire, Remote, and Context projection services. */
export const inject = [
  'connection',
  'typert',
  'remote',
  'remote.commands',
  'remote.session',
  'remote.subagents',
]

/**
 * Install Client Session state and its reconnecting control stream.
 * @param ctx - Client Cordis context.
 */
export function apply(ctx: Context): void {
  const connection = ctx.get('connection') as ConnectionHandle
  const remotes = ctx.remote as unknown as SessionRemotes
  const sessions = new ClientSessions(ctx, remotes)
  ctx.remote.$on('api-session/added', (summary) => { sessions.handleSessionAdded(summary) })
  ctx.remote.$on('api-session/removed', (sessionId) => { sessions.handleSessionRemoved(sessionId) })
  ctx.remote.$on('api-session/status', (sessionId, running) => {
    sessions.handleSessionStatus(sessionId, running)
  })
  ctx.remote.$on('api-session/activity', (sessionId, updatedAt) => {
    sessions.handleSessionActivity(sessionId, updatedAt)
  })
  ctx.remote.$on('api-session/error', (sessionId, message) => {
    sessions.handleSessionError(sessionId, message)
  })

  const control = createSessionControlStream(remotes, {
    accept: (frame) => { sessions.handleControlFrame(frame) },
    failed: (error) => { console.error('[session-controller] control stream failed:', error) },
  })
  control.start()
  ctx.on('connection/reset', () => { sessions.handleConnected() })
  if (connection.generation.getSnapshot() !== undefined) sessions.handleConnected()
  ctx.typert.contexts.registerClient('agent', {
    identity: candidate => sessions.scopeOf(candidate),
    resolve: sessionId => sessions.resolveAgentScope(sessionId),
  })
  ctx.effect(() => async () => { await control.dispose() }, 'session-controller.client.control')
}
