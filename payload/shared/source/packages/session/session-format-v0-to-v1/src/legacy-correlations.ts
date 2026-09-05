import { SessionFormatError } from '@deepseek-ai/dsh-session-format'
import type { SessionFormatEvent } from '@deepseek-ai/dsh-session-format'
import { assertReleasedV0Keys, releasedV0Record } from './validation-helpers.ts'

/**
 * Restore identities absent from pre-correlation v0 compaction and retry records.
 * @param events - complete source events in durable order.
 * @param sessionId - source Session identity used to name reconstructed groups.
 * @returns detached normalized events, retaining their sequence and payload facts.
 */
export function normalizeReleasedV0Correlations(
  events: readonly SessionFormatEvent[],
  sessionId: string,
): readonly SessionFormatEvent[] {
  const retries = new Map<string, string>()
  let compact: { id: string; startSeq: number; summarySeq?: number } | undefined
  return events.map((source) => {
    let event = source
    const legacyCompact = ['compact/start', 'compact/summary', 'compact/end', 'compact/prune'].includes(event.type)
    if (legacyCompact) event = { ...event, type: event.type.replace('compact/', 'compaction/') }
    if (legacyCompact && event.type !== 'compaction/prune') {
      const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`)
      if (!Object.hasOwn(data, 'compactionId')) {
        if (event.type === 'compaction/start') {
          assertReleasedV0Keys(data, ['turn'], [], `compact/start ${event.seq} data`)
          if (compact !== undefined) throw new SessionFormatError('legacy compact/start overlaps an open compaction')
          compact = { id: `legacy-compaction:${sessionId}:${event.seq}`, startSeq: event.seq }
        }
        if (compact === undefined) throw new SessionFormatError(`legacy ${source.type} has no recorded compaction start`)
        if (Object.hasOwn(data, 'sourceCommandId')) {
          throw new SessionFormatError(`legacy ${source.type} has sourceCommandId without compactionId`)
        }
        event = { ...event, data: { ...data, compactionId: compact.id } }
        if (event.type === 'compaction/summary') compact.summarySeq = event.seq
      }
    }
    if (event.type === 'user/message' && compact !== undefined) {
      const data = releasedV0Record(event.data, `user/message ${event.seq} data`)
      const provenance = releasedV0Record(data['source'], `user/message ${event.seq} source`)
      if (provenance['kind'] === 'plugin' && provenance['plugin'] === 'compact'
        && !Object.hasOwn(provenance, 'compactionId')) {
        assertReleasedV0Keys(provenance, ['kind', 'plugin'], [], `user/message ${event.seq} source`)
        const references = event['sourceEventSeqs']
        if (!Array.isArray(references) || references[0] !== compact.startSeq || references[1] !== compact.summarySeq
          || compact.summarySeq === undefined) {
          throw new SessionFormatError(`legacy checkpoint ${event.seq} does not reference its recorded compaction`)
        }
        event = { ...event, data: { ...data, source: { ...provenance, compactionId: compact.id } } }
      }
    }
    if (event.type === 'compaction/end' || event.type === 'session/end-seed') compact = undefined
    if (event.type === 'llm/retry') {
      const data = releasedV0Record(event.data, `llm/retry ${event.seq} data`)
      const key = JSON.stringify([data['turn'], data['step'], data['provider'], data['policyKey']])
      if (!Object.hasOwn(data, 'retryId')) {
        const retryId = retries.get(key) ?? `legacy-retry:${sessionId}:${event.seq}`
        event = { ...event, data: { ...data, retryId } }
        retries.set(key, retryId)
      } else if (typeof data['retryId'] === 'string') {
        retries.set(key, data['retryId'])
      }
    }
    return event
  })
}
