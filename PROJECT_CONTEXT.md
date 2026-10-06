# Project Context

## 这个项目是干什么的

`dsh-chat-migration` 是 Xiaozhuang DSH 的单向原生插件分发副本。唯一开发源是主仓库，当前目标 Harness 0.2.1-alpha.1。

## 代码结构是什么

- `payload/<id>/product/plugins/<id>/`：自有源码、Cordis patch、必要资源和构建产物。
- `payload/shared/`：针对官方 0.2.1 的通用接口补丁，安装 AI 只合入缺失的相关部分。
- `manifest.json`、`README*.md`、`INSTALL.md`、`AGENTS.md`：版本、组合与安装说明。
- `docs/`：保留真实产品截图；`tests/payload.test.mjs` 检查发布文件、大小、组装入口及版本。

## 关键入口在哪里

插件 `package.json` 与 `cordis.patch.yml` 声明目录安装与 Host/Client 入口；manifest 列出所包含插件、原生行和兼容补丁。

## 最近改了什么

### 2026-10-07 - 与主仓 0.2.1 适配同步

- 本次任务：从已推送的主仓源码同步全部相关独立插件版本。
- 改了哪些文件：payload、manifest、双语 README、INSTALL、发布包定向检查及本文件。
- 改了什么：同步 chat-mode, conversation-import 的当前原生版本，将旧宿主补丁更新为官方 0.2.1 基线，保留现有截图和安装目录结构。
- 为什么这样改：独立仓库必须与本地实际运行的最新主仓插件一致，避免使用旧接口或旧 Profile 副本。
- 影响了哪些模块：仅所选插件的分发源码、运行资源与安装说明；不带入用户数据、依赖目录或测试输出。
- 验证：主仓已验证组合运行；本仓验证所有交付文件存在与大小、原生版本和入口，并检查编译后 JavaScript 语法。未进行哈希值对比。

## 之前的项目记录

# Project Context

## 1. 这个项目是干什么的

`dsh-chat-migration` 是从 Xiaozhuang DSH 主仓单向生成的可安装插件组合。仓库提供可分别安装、启停和导出的“聊天模式”与“导入对话”：前者让用户不绑定工作区直接聊天，后者把 DeepSeek 官方平台导出的 JSON／ZIP 历史迁入 DSH 原生 Session。仓库是发布副本，不是独立开发源；功能代码仍以 `niushuanan/xiaozhuang-dsh` 为准。

## 2. 代码结构是什么

- `payload/chat-mode/product/plugins/chat-mode/`：聊天模式的完整原生插件文件夹。
- `payload/conversation-import/product/plugins/conversation-import/`：DeepSeek 导入器的完整原生插件文件夹。
- `payload/shared/source/` 与 `payload/shared/*.patch`：所需共享源码和按序检查的中性兼容补丁，不是可独立卸载的产品插件。
- `manifest.json`：插件行、来源目录、主仓来源 commit、文件大小和逐文件 SHA-256。
- `AGENTS.md`、`INSTALL.md`：交给安装 AI 的约束、兼容安装与失败恢复说明。
- `README.md`、`README.en.md`、`docs/`：面向安装者的双语说明和真实产品截图。
- `LICENSE`：发布闭包的 MIT 许可。

## 3. 关键入口在哪里

- `manifest.json`：安装和完整性校验的唯一清单。
- `payload/conversation-import/product/plugins/conversation-import/`：DeepSeek 历史解析、预览、选择与原生导入。
- `payload/chat-mode/product/plugins/chat-mode/packages/ui-plain-chat/`：聊天模式入口。
- `payload/chat-mode/product/plugins/chat-mode/packages/chat-preset/`：聊天模式 Agent preset。
- `INSTALL.md`：将闭包合并到目标 DSH checkout／Profile 的流程。

## 4. 最近改了什么

### 2026-09-05 15:56 - 桌面重新打开自动恢复登录

- 本次任务：从已推送的主仓提交同步 Safari 桌面冷启动登录修复。
- 改了哪些文件：Connection 共享源码与 README、`payload/shared/desktop-login-reopen.patch`、`manifest.json`、双语 README、`INSTALL.md` 和本文件。
- 改了什么：只做一次站内文档导航以使用已保存的有效登录；缺失或失效登录停在表单。发布源引用和文件清单同步更新，完整插件文件夹与截图保持不动。
- 为什么这样改：Safari 桌面首次请求可能遗漏已保存的 Strict cookie，导致每次重开误要求令牌；站内导航能够恢复，不能以放松认证或改写历史解决。
- 影响了哪些模块：只影响共享 Connection 登录入口，不含用户数据、凭据或配置。第 1–3 节已复核，结构与入口保持不变。
- 验证：5 个共享文件来自已推送的主仓提交；2 个源码补丁实际应用后逐字节匹配主仓。主产品 24 项定向测试通过，实际 Safari 连续两次退出重开均无需输入令牌，原回答及工具结果可读。未比较摘要值。

### 2026-09-05 - Safari Agent 历史与桌面重连

- 本次任务：从已推送的主仓提交同步实际受影响的历史读取器和 Connection 共享代码，不从未提交工作区生成。
- 改了哪些文件：`payload/shared/source/packages/util/values/`、`payload/shared/source/packages/client/connection/`、`payload/shared/safari-agent-history.patch`、`manifest.json`、双语 README、`INSTALL.md` 和本文件。
- 改了什么：保留原生容器校验，改用当前引擎的函数表示；同步同源登录恢复，补丁包含无缓存首页及显式重载提示。更新源码引用、安装验证路径和发布清单，保留原插件文件夹和截图。
- 为什么这样改：WebKit 的原生函数文本含换行，写死 V8 单行格式会让正常助手数据块被拒绝，造成问答和工具结果不显示。不能通过改写原始日志解决。
- 影响了哪些模块：共享 JSON 读取、桌面登录和页面刷新提示；不包含用户会话、导出文件、密钥或设置，也不改变插件独立卸载方式。项目用途、结构和关键入口已按现有原生文件夹布局复核。
- 验证：10 个共享源码／说明文件直接从已推送主仓生成；6 个补丁源码在相邻版本上实际应用后逐字节匹配主仓。主产品已通过 63 项定向测试及实际 Safari 的回答、工具结果、旧分页、子 Agent、导入聊天和重启验收；本副本保留两个原生插件及两张产品截图。不执行摘要值对比。

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
