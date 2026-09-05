/** Runtime-extensible, target-neutral conversation presentation policy. */
import { Service, type Context } from '@deepseek-ai/cordis'
import type { SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Optional shell choices contributed by a product plugin for one Session. */
export interface ConversationPresentation {
  /** Hide Workspace and agent-composition controls in the blank-session hero. */
  readonly hideHeroConfiguration?: boolean
  /** Hide Access, Plan, and left/right extension controls in the composer. */
  readonly hideComposerModes?: boolean
  /** Hide secondary panes owned by independently loaded plugins. */
  readonly hideAuxiliaryPanes?: boolean
  /** Optional composer placeholder owned by the matching product mode. */
  readonly placeholder?: string
}

/** One removable product plugin's classification rule. */
export interface ConversationPresentationRule {
  readonly id: string
  readonly order?: number
  readonly matches: (session: SessionSummary) => boolean
  readonly present: (session: SessionSummary) => ConversationPresentation
}

/** Fold all matching rules without teaching the shell any product mode names. */
export function resolveConversationPresentation(
  rules: readonly ConversationPresentationRule[],
  session: SessionSummary | undefined,
): ConversationPresentation {
  if (session === undefined) return {}
  let resolved: ConversationPresentation = {}
  for (const rule of rules) {
    if (rule.matches(session)) resolved = { ...resolved, ...rule.present(session) }
  }
  return resolved
}

/** Live registry whose entries disappear with their owning plugin effect. */
export class ConversationPresentationRegistry extends Service {
  readonly rules: SnapshotStore<readonly ConversationPresentationRule[]> = createSnapshotStore([])
  private readonly entries = new Map<string, ConversationPresentationRule>()

  constructor(ctx: Context) {
    super(ctx, 'conversationPresentation')
  }

  register(rule: ConversationPresentationRule): () => void {
    if (rule.id.trim() === '') throw new Error('conversation presentation rule id must not be empty')
    if (this.entries.has(rule.id)) {
      throw new Error(`conversation presentation rule "${rule.id}" is already registered`)
    }
    this.entries.set(rule.id, rule)
    this.publish()
    let active = true
    return () => {
      if (!active) return
      active = false
      if (this.entries.get(rule.id) !== rule) return
      this.entries.delete(rule.id)
      this.publish()
    }
  }

  private publish(): void {
    this.rules.set([...this.entries.values()].sort((left, right) =>
      (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id)))
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Product-mode presentation rules; definitions remain inside plugins. */
    conversationPresentation: ConversationPresentationRegistry
  }
}
