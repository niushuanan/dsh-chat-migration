import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Result of asking an optional UI extension to reveal a conversation beside the current one. */
export type OpenAuxiliaryPaneResult = 'opened' | 'visible' | 'limit'

/**
 * Neutral capability for revealing a conversation in an auxiliary pane.
 *
 * The workspace layer owns only this structural contract. Optional plugins
 * may provide it, and consumers must feature-detect it before exposing an
 * action. The official product has no implementation and needs none.
 */
export interface AuxiliaryPaneOpener {
  canOpenSession(sessionId?: SessionId): boolean | Promise<boolean>
  openSession(sessionId: SessionId): OpenAuxiliaryPaneResult | Promise<OpenAuxiliaryPaneResult>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Optional auxiliary-conversation presentation capability. */
    auxiliaryPane: AuxiliaryPaneOpener
  }
}
