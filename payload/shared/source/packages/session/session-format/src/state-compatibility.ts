/** Optional plugin-owned declarations for sequence-independent historical state. */
import { SessionFormatError, SessionFormatUnsupportedMigrationError } from './error.ts'
import { sessionFormatVersion } from './json.ts'
import type { SessionFormatEvent, SessionFormatStateCompatibility } from './types.ts'

const declarations = new Map<string, SessionFormatStateCompatibility>()

/**
 * Register one plugin's bounded historical state semantics through a Cordis effect.
 * The declaration may not reinterpret payloads or override first-party validation.
 * @param declaration - exact type, version range, and complete state validator.
 * @returns disposer that removes this declaration when its plugin unloads.
 */
export function registerSessionFormatStateCompatibility(declaration: SessionFormatStateCompatibility): () => void {
  const from = sessionFormatVersion(declaration.fromVersion, 'state compatibility fromVersion')
  const to = sessionFormatVersion(declaration.toVersion, 'state compatibility toVersion')
  if (to <= from) throw new SessionFormatError('state compatibility must span at least one adjacent migration')
  if (declarations.has(declaration.type)) {
    throw new SessionFormatError(`Session state compatibility for ${JSON.stringify(declaration.type)} is duplicated`)
  }
  const registered = Object.freeze({ ...declaration })
  declarations.set(declaration.type, registered)
  return () => {
    if (declarations.get(declaration.type) === registered) declarations.delete(declaration.type)
  }
}

/**
 * Validate a declared external state at one source or target generation.
 * Call only for types absent from the edge's first-party inventory.
 * @param event - historical event whose payload and envelope are retained.
 * @param version - generation being validated, inside the owner's explicit range.
 * @returns true for validated declared state, false when no declaration covers it.
 * @throws {SessionFormatUnsupportedMigrationError} when declared state has unsupported data or references.
 */
export function isCompatibleSessionFormatState(event: SessionFormatEvent, version: number): boolean {
  const declaration = declarations.get(event.type)
  if (declaration === undefined || version < declaration.fromVersion || version > declaration.toVersion) return false
  if (event.sourceEventSeqs !== undefined || event.surfaceOp !== undefined || !declaration.accepts(event.data)) {
    throw new SessionFormatUnsupportedMigrationError(
      `format v${version} contains unsupported historical state ${JSON.stringify(event.type)} at seq ${event.seq}`,
    )
  }
  return true
}
