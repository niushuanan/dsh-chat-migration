# Project Context

## 1. 这个项目是干什么的

`dsh-chat-migration` 是从 Xiaozhuang DSH 主仓单向生成的可安装插件组合。仓库提供可分别安装、启停和导出的“聊天模式”与“导入对话”：前者让用户不绑定工作区直接聊天，后者把 DeepSeek 官方平台导出的 JSON／ZIP 历史迁入 DSH 原生 Session。仓库是发布副本，不是独立开发源；功能代码仍以 `niushuanan/xiaozhuang-dsh` 为准。

## 2. 代码结构是什么

- `payload/chat-mode/repository/`：按主仓相对路径打包的聊天模式及其直接运行依赖。
- `payload/conversation-import/repository/`：按主仓相对路径打包的 DeepSeek 导入器及其直接运行依赖。
- `manifest.json`：插件行、来源目录、主仓来源 commit、文件大小和逐文件 SHA-256。
- `AGENTS.md`、`INSTALL.md`：交给安装 AI 的约束、兼容安装与失败恢复说明。
- `README.md`、`README.en.md`、`docs/`：面向安装者的双语说明和真实产品截图。
- `LICENSE`：发布闭包的 MIT 许可。

## 3. 关键入口在哪里

- `manifest.json`：安装和完整性校验的唯一清单。
- `payload/conversation-import/repository/packages/session-query/session-log-export/`：DeepSeek 历史解析、预览、选择与原生导入。
- `payload/chat-mode/repository/packages/client/ui-plain-chat/`：聊天模式入口。
- `payload/chat-mode/repository/packages/preset/agent-presets/presets/chat/`：聊天模式 Agent preset。
- `INSTALL.md`：将闭包合并到目标 DSH checkout／Profile 的流程。

## 4. 最近改了什么

### 2026-08-29 15:09 - 拆分聊天模式与导入对话两个插件

- 本次任务：同步主仓“小庄的插件”17 项目录，把旧“聊天迁移”单项发布闭包拆成“聊天模式”和“导入对话”两个可独立安装项。
- 改了哪些文件：重新生成 `manifest.json` 与整个 `payload/`；更新中英文 README 和本文件。
- 改了什么：manifest 现在包含 `chat-mode` 和 `conversation-import` 两个插件定义，分别声明 `ui-plain-chat`／`composer-add-menu` 与 `session-log-download` Cordis 行；payload 依插件 ID 分成两个根目录，并从主仓 commit `45e273b8ef` 重新生成源码、构建产物、直接依赖、文件大小和 SHA-256。
- 为什么这样改：主产品已经把聊天和历史导入作为两项独立用户能力，发布仓继续保留一个“聊天迁移”开关会造成目录、安装语义和实际产品不一致，也无法只安装其中一项。
- 影响了哪些模块：只调整插件发布清单、生成闭包和安装说明；不包含用户导出文件、对话、账号、密钥或本机设置，功能实现仍只来自 Xiaozhuang DSH 主仓。
- 验证：逐项核对 manifest 的 1527 个文件路径、字节数和 SHA-256；确认两个插件定义、三个 Cordis 行和主仓 source commit 均准确，闭包不含 Git 元数据、测试、缓存、凭据、Session 或用户设置。

### 2026-08-29 13:52 - 同步导入预览选择与会话渐进展开

- 本次任务：为已有真实发布内容补建项目上下文，并把主仓最新的 DeepSeek 分窗口预览选择能力同步到可安装闭包；同时按完整依赖闭包带入聊天目录当前的 5→10→20 渐进展开行为。
- 改了哪些文件：`PROJECT_CONTEXT.md`、中英文 README、`manifest.json`，以及 `payload/` 内重新生成的 `session-log-export` 和 `ui-workspace` 源码／构建产物。
- 改了什么：插件选择 DeepSeek JSON／ZIP 后先只读解析并列出独立对话窗口，支持搜索、勾选、默认选择新记录、标记已导入项，确认后才写入所选会话；侧栏聊天分组默认显示 5 条并逐次翻倍展开。manifest 重新记录主仓 `286f34870a`、825 个闭包文件及逐文件 SHA-256。
- 为什么这样改：安装者需要在写入前控制迁移范围；发布仓必须由主仓导出器一次生成源码、可运行 `lib/` 和完整性哈希，不能手工拷贝形成第二套实现或漏掉直接依赖。
- 影响了哪些模块：只更新“聊天迁移”插件组合的安装闭包和说明；不包含或修改任何用户导出文件、会话、账号、密钥、本机设置或其他插件。
- 验证：重新计算并逐项核对 manifest 的路径、字节数和 SHA-256；确认闭包无 Git 元数据、测试、缓存、凭据、会话历史和用户设置。主仓对应导入器测试、Workspace 测试、TypeScript、bundle、完整 pre-push typecheck 与真实 3080 路径均已通过。
