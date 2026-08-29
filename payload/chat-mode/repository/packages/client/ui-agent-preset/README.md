---
description: "Agent-preset surfaces for the Web GUI: the default-preset setting, the new-session chip, the session-header label, and the preset roster management section; for users and maintainers of agent composition."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-agent-preset

English | [中文](README.zh.md)

## Summary

This package provides the agent-preset surfaces of the Web GUI: a General-settings row choosing which preset new sessions are composed from, a chip on the new-session screen choosing the next session's preset, a live selector in the session header, and a settings section that manages the roster — copy, delete, default, and the way into a preset's own files. A header pick changes an idle session immediately; a pick made during a running turn waits for the next idle boundary, so active work finishes under the composition it began with. When a deployment composes no presets, all four surfaces render nothing and every session shares the host composition.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin alongside the settings and conversation packages; the preset surfaces then appear where their slots render. The General-settings row opens on the deployment default and applies to sessions started afterwards; the new-session chip stages a pick that lands on the next blank session and is spent on first use, so the following new session opens on the default again.

### Managing the roster

The settings section shows the roster as cards: a copy dialog is the only way a preset is created — the browser edits no composition text — and every custom card keeps a location action that opens the preset's own files. The default is set from any surface; deleting removes the preset directory while sessions already composed from it keep running. A shipped preset opens in a read-only viewer and offers no location or delete. A roster row carrying `broken` renders as a marked card whose body and duplication are disabled, because a copy of a broken preset is another broken preset; broken custom rows keep their location and delete actions so the files can be fixed and ghost directories cleared. The card face still shows the preset's own description — a chooser cannot act on a package specifier there — and the host's reason rides the badge as a tooltip, plus a visually hidden alert that carries it to assistive technology, which a disabled card body cannot.

### The conversational entry

When the roster carries the self-referential `cordis` preset, a dashed add-card stages it and starts a new session — the section closes the settings panel and the new-session chip's own applier composes the blank session the workspace flow produces.

### The session-header selector

The session header shows the preset this conversation currently uses and opens the same roster as a menu. An idle session switches immediately. During a running turn the selected preset stays visibly queued, the active turn keeps its original tools and prompt, and the Host commits the change at the next idle maintenance boundary before newly waking input starts another turn.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Options and the current default both come from one `agentPresets/list` call — the roster already reports which id a session with no explicit choice gets, so the row needs no settings-schema introspection — and the write targets the `agent-presets` settings namespace's `default` field, which is what the host resolves at creation. The settings section queries `settings.canOpenAgentPresetDirectory()` when it first loads and joins that result with the roster; a failed query removes only the native-open affordance. The new-session chip owns its one-use staged choice. The session header has a separate per-session switch controller: it queues picks while the session summary reports `running`, retries a transient `agent-preset-locked` refusal, and clears its optimistic label only after the shared session projection reports the committed preset. [`dsh-client-connection`](../connection/README.md) authenticates `agentPresets/read`, `agentPresets/copy`, `settings/openAgentPresetDirectory`, `agentPresets/deletePreset`, `agentPresets/list`, and every other Host API method with the same browser session. A composition still names the plugins a session runs, so reading one is reconnaissance, while copy, delete, and the settings-owned directory opener manage the roster and drive the host desktop. The section re-reads on its own actions, `settings/document-updated`, and `connection/reset`, because composition files are edited outside the browser and nothing on the wire announces a file change.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the preset surface is not enough. They move from the browser surfaces to the preset domain and the composition model.

- [dsh-agent-presets](../../preset/agent-presets/README.md) — the host roster and composition the surfaces read and manage.
- [ui-conversation](../ui-conversation/README.md) — declares the hero and session-header slots the chip and label fill.
- [ui-settings](../ui-settings/README.md) — the settings shell that hosts the General row and the roster section.
- [Client package map](../README.md) — adjacent browser UI packages.

-----

<a id="model-experience"></a>
## Model Experience

Directly for later turns in the selected session: the selected preset owns the tools, skills, commands, and prompt sections assembled for the next turn. The active turn and prior transcript are not rewritten.

#### KV Cache effect

Changing the default never touches a running session. Switching an existing session changes its model-visible prefix on the next turn, so cache reuse across that composition boundary is not expected; the active request is left untouched.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define the current preset surfaces. They are current package constraints, not a general composition comparison or a task backlog.

- **A preset without metadata is listed by id** — display text is optional, and a copy given no name deliberately falls back to its directory name rather than presenting itself identically to its source.
- **A revealed path is display text, not a link** — where the host has no desktop opener the row shows the directory to copy by hand; the browser cannot open a host filesystem location itself.
- **Composition edits are invisible to the page** — the files are edited outside the browser and nothing on the wire announces a file change, so the roster re-reads on its own actions, `settings/changed`, and `connection/reset`, not on every disk edit.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
