/**
 * The session header's Agent preset switcher.
 *
 * The Host commits a pick only at an idle maintenance boundary. A pick made
 * while the current turn runs stays queued, so that turn finishes under its
 * original composition and the next turn uses the selected one.
 */

import { useEffect, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconAgentPresetOutline16, IconChevronDownOutline14, Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only: pulls the ui-conversation SlotMap merge (the header actions).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-agent-presets/types'
import type { AgentPresetSettingsState } from './settings-store.ts'
import type { AgentPresetSessionSwitchState } from './session-switch-store.ts'
import { presetDisplayText } from './locales.ts'
import css from './AgentPresetLabel.module.css'

/** Registration-side business face for the header label. */
export interface AgentPresetLabelInjected {
  hooks: {
    /** Roster snapshot bound by the renderer as useAgentPresets. */
    agentPresets: SnapshotStore<AgentPresetSettingsState>
    /** Per-session pending and in-flight switch state. */
    agentPresetSwitch: SnapshotStore<AgentPresetSessionSwitchState>
  }
  /** Read the roster, so the label can show a name rather than an id. */
  load: () => Promise<void>
  /** Queue or apply one Session's new preset. */
  switchPreset: (sessionId: SessionId, agentPreset: string) => Promise<void>
}

/** Full component props. */
export type AgentPresetLabelProps =
  PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'settings.agentPreset'>
  & InjectFace<AgentPresetLabelInjected>

/**
 * Render this session's agent-preset name beside its title.
 * @param props - composed slot props.
 * @returns the label, or null when the session records no preset.
 */
export function AgentPresetLabel({
  sessionId, useSessions, useAgentPresets, useAgentPresetSwitch, load, switchPreset, t,
}: AgentPresetLabelProps) {
  const summary = useSessions(state => state.byId[sessionId])
  const options = useAgentPresets(state => state.options)
  const switchState = useAgentPresetSwitch(state => state.bySession[sessionId])
  const [open, setOpen] = useState(false)
  const projected = summary?.projectionValues?.agentPreset
  const preset = switchState?.pending ?? (typeof projected === 'string' ? projected : undefined)

  useEffect(() => {
    // Deployments that compose no presets never label anything, so the roster
    // is only worth a request once a session reports one.
    if (preset !== undefined && preset !== 'chat') void load()
  }, [preset, load])

  // Plain Chat is a first-class product route, not a work mode users switch
  // into from an Agent session. Its internal composition stays invisible.
  if (preset === 'chat') return null
  if (preset === undefined) return null

  const option = options.find(entry => entry.id === preset)
  const text = option === undefined ? undefined : presetDisplayText(option, t)
  const status = switchState?.pending === undefined || switchState.committed === true
    ? undefined
    : switchState.busy ? t('switching') : summary?.running === true ? t('switchPending') : t('switching')
  return (
    <span className={css.root}>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={options.map((entry) => {
          const display = presetDisplayText(entry, t)
          return {
            id: entry.id,
            label: entry.trust === 'user' ? `${display.name} · ${t('userTrust')}` : display.name,
          }
        })}
        selectedId={preset}
        onSelect={(id) => {
          setOpen(false)
          void switchPreset(sessionId, id)
        }}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.button}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={switchState?.busy === true}
            title={switchState?.error ?? text?.description ?? t('headerHint')}
            onClick={() => { setOpen(value => !value) }}
          >
            <IconAgentPresetOutline16 size={14} className={css.icon} />
            <span className={css.name}>{text?.name ?? preset}</span>
            {status === undefined ? null : <span className={css.status}>{status}</span>}
            <IconChevronDownOutline14 className={open ? css.chevronOpen : css.chevron} />
          </button>
        )}
      />
      {switchState?.error === null || switchState?.error === undefined
        ? null
        : <span className={css.visuallyHidden} role="status">{switchState.error}</span>}
    </span>
  )
}
