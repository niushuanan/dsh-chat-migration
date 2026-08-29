---
description: "Native Web conversation portability: DeepSeek history import plus Session-log ZIP export."
kind: "package-reference"
---

# @deepseek-ai/dsh-session-log-export

English | [中文](README.zh.md)

## Summary

`dsh-session-log-export` owns the Web product's conversation portability surfaces. Users can import an official DeepSeek JSON or ZIP export from **Settings → Import conversations**, preserving conversation order, titles, timestamps, questions, answers, and exported reasoning. The existing `Session log` action and `/export` command still download a DSH session tree — including descendants and attachments — as a ZIP. Setup and usage come first; implementation details follow.

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

Use this package when the Web bundle should let users move conversations into or out of DSH. It requires Connection, the command registry, Session query and persistence, and attachments. Mount the plugin, then either open **Settings → Import conversations** and select a DeepSeek export, or click `Session log` in a Session Header / type `/export` to download `dsh-session-<id>.zip`.

### When to choose it

Choose it for a Web deployment that needs native user-facing conversation import and export. Import writes standard DSH Session events and works with normal Session persistence. Export still requires a backend that stores a per-session raw artifact (the shipped JSONL backend supports plaintext and zstd; SQLite export is not supported). Avoid it when a programmatic or Host-path export is needed: exports are browser downloads.

### Composition

```yaml
- id: session-log-download
  name: '@deepseek-ai/dsh-session-log-export'
```

The Web bundle mounts the package with Connection, `dsh-commands`, `dsh-client-ui-commands`, and `dsh-client-ui-conversation`.

### Configuration

| Field | Default | Meaning |
|---|---|---|
| `compressionLevel` | `6` | DEFLATE level from 0 through 9 for each ZIP entry. |

### Command contract

| Input | Result |
|---|---|
| `/export` | Records a human-command lifecycle; the submitting browser downloads `GET /api/session.export?sessionId=<id>&includeDescendants=true` |
| `/export <path>` | An error; browser downloads choose their destination through the browser's ordinary download behavior |

### What to expect

DeepSeek import accepts the official `.json` file or a `.zip` containing it. Both the official mapping shape and the raw DeepSeek API export shape are normalized. Regenerated branches are reduced to the selected branch, `THINK` fragments become native reasoning blocks, reference markers become links when source URLs are present, and imported sessions use the `chat` preset. Conversations are written incrementally and the UI stays in a busy state until the native Session list refreshes. Re-importing the same source ids skips duplicates without rewriting them.

The dialog reports three phases: preparing, download started, or failed. Closing the dialog does not cancel an in-flight download, and the dialog does not reopen when that operation later settles. One session admits one active download at a time; repeated gestures share that operation. The export includes the live session's newest events: the host endpoint flushes a live root session before reading, so a slash-triggered ZIP includes the `command/run` and `command/done` pair that started the download; cold persisted sessions need no flush.

### Failures

The dialog shows a preparation error when the preflight fails before ZIP streaming starts — for example an unreachable or misconfigured host endpoint. A descendant or attachment read failure after the browser accepts the GET is reported by the browser download manager, not by the dialog.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

This section explains how the package wires the export control and points at the code that realizes it; the observable behavior is fully covered in [Use this package](#use-this-package).

### Design split

The package has two halves. The Host half ([`src/index.ts`](src/index.ts)) registers the `/export` command and contributes exact authenticated routes for `GET`/`HEAD /api/session.export` and `POST /api/session.import.deepseek`; [`src/archive.ts`](src/archive.ts) builds the bounded ZIP stream, while [`src/deepseek-import.ts`](src/deepseek-import.ts) normalizes exports into native Session events and refreshes durable projection indexes. The browser half ([`src/client/index.ts`](src/client/index.ts)) provides the shared download controller, registers the import settings page, and refreshes the Session list after import.

### Download flow

Both entry paths issue a `HEAD` preflight to `GET /api/session.export?...`, then hand the GET URL to the browser download manager without buffering the ZIP in JavaScript. One controller owns one in-flight download per session, collapses concurrent gestures into that operation, and cancels the preflight on plugin disposal. Modal state lives in a snapshot store keyed by session, so the button and the command share one dialog per session.

The Host route is a feature-owned exact Fetch contribution. Connection applies its Host/Origin and browser-session checks and bridges the streaming `Response`; this package owns query validation, live-session flushes, raw artifact and attachment reads, ZIP generation, and HTTP status semantics.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the package-level contract is not enough. They move from the Web control to the host endpoint and the surrounding command and session surfaces.

- [dsh-client-connection](../../client/connection/README.md) — the authenticated Fetch-route carrier used by the Host endpoint.
- [Commands subsystem reference](../../../docs/subsystems/commands.md) — the human-command registry the `/export` command registers on.
- [dsh-client-ui-commands](../../client/ui-commands/README.md) — the browser command surface that renders and acknowledges `/export`.
- [Session Query package map](../README.md) — the retrieval family this package belongs to.

-----

<a id="model-experience"></a>
## Model Experience

### Human `/export` control

#### What the model sees

Nothing. `/export` stays on the human-command plane, and the ZIP download does not enter model history.

#### Token effect

Zero. The command creates no model turn.

#### KV Cache effect

None. The log-only command lifecycle and browser download do not change the derived request prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define when this package is a poor fit or needs special operational care. They are current package constraints, not a task backlog.

- **Requires a per-session raw artifact backend** — the download endpoint needs a persistence backend with a per-session raw artifact; the shipped JSONL backend supports plaintext and zstd, and SQLite export is not supported.
- **Browser download, not a Host-path writer** — the browser chooses the local destination; no Host path or native folder action is returned.
- **Preflight reports only pre-stream failures** — a descendant or attachment failure after the browser accepts the GET is reported by the browser download manager, not by the dialog.
- **DeepSeek import only** — the import page currently accepts DeepSeek official history exports; other chatbot schemas are rejected rather than guessed.
- **Only data present in the export can be restored** — questions, answers, timestamps, reasoning, and link references are mapped when present. Binary attachments that DeepSeek does not include in the export cannot be recreated.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

This Dev Note is working context for maintainers: open design questions and directions that are not decided. It is explicitly non-authoritative — shipped behavior, limits, and accepted rationale live in the sections above, the package code, and the linked pages.

#### Future: export destinations beyond the browser

The download is deliberately browser-scoped; a Host-path or native folder export would need a new endpoint contract and a decision on where the ZIP lands.

</details>
