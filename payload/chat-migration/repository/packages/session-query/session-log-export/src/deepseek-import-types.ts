/** Browser-safe contracts shared by DeepSeek history import's Host and Settings page. */

export type DeepSeekImportedMessage =
  | { readonly role: 'user'; readonly text: string; readonly time: number }
  | {
    readonly role: 'assistant'
    readonly text: string
    readonly reasoning?: string
    readonly model: string
    readonly time: number
  }

export interface DeepSeekImportedConversation {
  readonly sourceId: string
  readonly title: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly messages: readonly DeepSeekImportedMessage[]
}

export interface DeepSeekImportResult {
  readonly imported: number
  readonly skipped: number
  readonly failed: number
  readonly sessionIds: readonly string[]
  readonly errors: readonly string[]
}
