# `@deepseek-ai/dsh-composer-add-menu`

English | [中文](README.zh.md)

Native one-layer add directory for the Web composer. It replaces the temporary Profile package and occupies `conversation.input.add` without creating another command, attachment, or reference protocol. It is baseline product interaction rather than a switchable catalog plugin.

Work conversations reuse the conversation owner's image-validation path and Workspace file/folder picker. The **Commands, plugins and skills** group then lists the current Session's official Host command catalog first, followed by the remaining slash-provided Skills. Selecting an entry inserts `/name ` at the textarea selection and never executes it immediately. If an official command and a Skill share a name, the official command wins. Pure Chat uses the same plus button in an upload-only posture: images keep the durable image path, while text, Markdown, CSV/JSON, and common code files up to 256 KB are inserted into the draft and persist with the message. An adjacent **Web search** capsule is an actual per-chat control: blue means enabled, gray means disabled, and disabling it blocks both public Web search and Web fetch before tool execution. Chat receives no Workspace references, command catalog, Skills, or filesystem authority.

Every Skill row uses the existing `IconSkillOutline16`; official commands use the existing plugin icon. The menu closes on selection, outside pointer, Escape, or when the composer becomes disabled, while preserving native textarea focus behavior.

## Model Experience

### Local draft insertion

#### What the model sees

Nothing at selection time. Choosing a row only edits the local `/name` draft; the command or Skill reaches the model only if the user later sends it through the existing composer flow.

#### Token effect

Opening the menu and selecting a row consumes no model tokens. A later send has the same token effect as typing the slash entry manually.

#### KV Cache effect

The menu does not change system context or model requests, so it has no independent cache effect.

## Known Limitations and Deferred Work

- The menu presents the live catalogs supplied by `ui-conversation`; it does not invent descriptions for providers that supply none.
- Image and Workspace actions remain unavailable when the current Session or model disables the corresponding native capability.
