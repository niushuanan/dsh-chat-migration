/** Reviewed descriptor-v2 normalization shared by the v0 and v1 source edges. */
import type { SessionFormatEvent } from '@deepseek-ai/dsh-session-format'
import { assertReleasedEventPayload } from './validation.ts'
import { assertReleasedV0Keys, releasedV0Record } from './validation-helpers.ts'

/**
 * Promote descriptor v2 without changing its declared child composition.
 * Descriptor v3 adds only optional reasoning effort; v2 cannot already contain it.
 * @param event - one event from a released v0 or v1 source.
 * @returns the original event, or an independently validated descriptor with version 3.
 */
export function normalizeReleasedSubagentDescriptor(event: SessionFormatEvent): SessionFormatEvent {
  if (event.type !== 'subagent/descriptor') return event
  const data = releasedV0Record(event.data, `subagent/descriptor ${event.seq} data`)
  if (data['version'] !== 2) return event
  assertReleasedV0Keys(
    data,
    ['version', 'mode', 'provider'],
    ['label', 'agentProvider', 'agentModel', 'persona', 'toolFilter'],
    `subagent/descriptor ${event.seq} v2 data`,
  )
  const target = { ...event, data: { ...data, version: 3 } }
  assertReleasedEventPayload(target, 1)
  return target
}
