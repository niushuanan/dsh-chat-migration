---
description: "Web 原生对话迁移：DeepSeek 历史导入与会话日志 ZIP 导出。"
kind: "package-reference"
---

# @deepseek-ai/dsh-session-log-export

[English](README.md) | 中文

## 概述

设置入口保留原有聊天图标，由本插件注册并随插件一起移除。

`dsh-session-log-export` 统一负责 Web 产品里的对话迁移。用户可在**设置 → 导入对话**选择 DeepSeek 官方导出的 JSON 或 ZIP，先预览每个独立对话窗口，再搜索、勾选真正要导入的内容；导入后保留原始对话顺序、标题、时间、问题、回答和导出中已有的思维过程。原有 `Session log` 操作和 `/export` 命令则继续把 DSH 会话树（包含子会话与附件）下载为 ZIP。设置与用法在前，随后说明实现细节。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

当 Web bundle 需要让用户把对话迁入或迁出 DSH 时使用本包。它需要 Connection、命令注册表、Session 查询与持久化以及附件服务。挂载插件后，可以打开**设置 → 导入对话**选择 DeepSeek 导出文件，也可以点击 Session Header 中的 `Session log` 或输入 `/export` 下载 `dsh-session-<id>.zip`。

### 何时选择

为需要原生用户级对话导入和导出的 Web 部署选择它。导入写入标准 DSH Session 事件，使用普通 Session 持久化即可；导出仍要求持久化后端保存逐会话原始产物（随附 JSONL 后端支持明文与 zstd；不支持 SQLite 导出）。需要程序化或 Host 路径导出时避免使用：导出目标仍由浏览器管理。

### 组合

```yaml
- id: session-log-download
  name: '@deepseek-ai/dsh-session-log-export'
```

Web bundle 将本包与 Connection、`dsh-commands`、`dsh-client-ui-commands` 和 `dsh-client-ui-conversation` 一起挂载。

### 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `compressionLevel` | `6` | 每个 ZIP 条目的 DEFLATE 级别，范围为 0 到 9。 |

### 命令约定

| 输入 | 结果 |
|---|---|
| `/export` | 记录一组用户命令生命周期；提交命令的浏览器下载 `GET /api/session.export?sessionId=<id>&includeDescendants=true` |
| `/export <path>` | 错误；浏览器下载通过浏览器的普通下载行为选择目标位置 |

### 预期行为

DeepSeek 导入接受官方 `.json`，或包含该 JSON 的 `.zip`。选中文件后先只解析预览，不写入 Session；预览按 DeepSeek 对话窗口逐行展示标题、时间、消息数和思维过程数，并支持搜索、全选当前结果和清空选择。已导入的来源会保留在列表中并标记为不可重复选择，尚未导入的窗口默认全选；用户确认后，浏览器把同一文件与来源 ID 清单交给 Host，Host 会再次解析并只写入精确匹配的对话。

官方 mapping 结构和 DeepSeek 原始 API 导出结构都会被归一化；重新生成的分支只保留当前选中分支，`THINK` 片段映射为原生 reasoning，存在来源 URL 时把引用标记转换成链接，导入会话统一使用 `chat` preset。系统逐个写入会话，前端在完成并刷新原生 Session 列表前保持等待状态；重复导入同一批来源 ID 会跳过已经存在的会话，不重写、不生成副本。

弹窗报告三个阶段：准备中、开始下载或失败。关闭弹窗不会取消正在进行的下载，该操作随后完成时弹窗也不会重新打开。每个会话同时只允许一项下载，重复操作共用该任务。导出包含实时会话的最新事件：Host 端点在读取前会 flush 活动的根会话，因此斜杠命令触发的 ZIP 会包含启动下载的 `command/run` 与 `command/done` 事件对；冷持久化会话不需要 flush。

### 失败

当 ZIP 流式传输开始前的预检失败时——例如 Host 端点不可达或配置错误——弹窗显示准备阶段错误。浏览器接受 GET 后发生的子会话或附件读取失败由浏览器下载管理器报告，不通过弹窗报告。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

本节解释本包如何接线导出控制，并指出实现它的代码位置；可观察行为已在[使用本包](#use-this-package)中完整说明。

### 设计拆分

本包有两个半包。Host 半包（[`src/index.ts`](src/index.ts)）注册 `/export` 命令，并向 Connection 贡献经过认证的精确路由：`GET`/`HEAD /api/session.export` 与 `POST /api/session.import.deepseek`；后者同时支持只读预览、带来源 ID 选择的确认导入和兼容旧调用方的整包导入。[`src/archive.ts`](src/archive.ts) 构建有界 ZIP 流，[`src/deepseek-import.ts`](src/deepseek-import.ts) 则生成预览、校验用户选择、把导出内容归一化为原生 Session 事件并刷新持久化投影索引。浏览器半包（[`src/client/index.ts`](src/client/index.ts)）保留当前选择的 `File`、提供共享下载控制器、注册导入设置页，并在确认导入后刷新 Session 列表。

### 下载流程

两条入口都会对 `GET /api/session.export?...` 发出 `HEAD` 预检，然后把 GET URL 交给浏览器下载管理器，JavaScript 不缓冲 ZIP。一个控制器按会话持有一项进行中的下载，把并发操作折叠进该任务，并在插件释放时取消预检。弹窗状态存放在按会话键控的快照存储中，因此按钮与命令按会话共享一个弹窗。

Host 路由是业务拥有的精确 Fetch contribution。Connection 应用 Host/Origin 与浏览器会话检查并桥接流式 `Response`；本包拥有查询校验、活动会话 flush、原始产物与附件读取、ZIP 生成和 HTTP 状态语义。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当包级约定不够用时阅读以下页面。它们从 Web 控制逐步进入 Host 端点与周围的命令和会话表面。

- [dsh-client-connection](../../packages/client/connection/README.zh.md)——Host 端点使用的认证 Fetch 路由载体。
- [命令子系统参考](../../docs/subsystems/commands.zh.md)——`/export` 命令注册的用户命令注册表。
- [dsh-client-ui-commands](../../packages/client/ui-commands/README.zh.md)——渲染并确认 `/export` 的浏览器命令表面。
- [会话查询包映射](../../packages/session/README.zh.md)——本包所属的检索能力家族。

-----

<a id="model-experience"></a>
## 模型体验

### 用户 `/export` 控制

#### 模型看到什么

无。`/export` 留在用户命令平面，ZIP 下载不会进入模型历史。

#### Token 影响

为零。该命令不创建模型轮次。

#### KV Cache 影响

无。仅日志命令生命周期与浏览器下载不会改变派生请求前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制说明本包何时不合适，或何时需要特别的运维注意。它们是当前包约束，不是任务积压。

- **要求逐会话原始产物后端**——下载端点需要带逐会话原始产物的持久化后端；随附 JSONL 后端支持明文与 zstd，不支持 SQLite 导出。
- **浏览器下载，而非 Host 路径写入**——目标位置由浏览器选择；不会返回 Host 路径或原生文件夹操作。
- **预检只报告流式传输前的失败**——浏览器接受 GET 后发生的子会话或附件读取失败由浏览器下载管理器报告，不通过弹窗报告。
- **目前只导入 DeepSeek**——导入页当前只接受 DeepSeek 官方历史导出；其他 Chatbot 结构会明确拒绝，不做猜测性写入。
- **只能恢复导出文件实际包含的数据**——问题、回答、时间、思维过程与链接引用会在存在时映射；DeepSeek 导出未包含的二进制附件无法凭空还原。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

本开发备注是维护者的工作上下文：开放设计问题与尚未决定的探索方向。它明确不具权威性——已交付的行为、限制与既定理由以上文、包代码和相关页面为准。

#### 未来：浏览器之外的导出目标

下载刻意限定在浏览器范围；Host 路径或原生文件夹导出需要新的端点约定，并决定 ZIP 的落盘位置。

</details>
