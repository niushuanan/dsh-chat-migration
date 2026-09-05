# 安装与兼容流程

## 直接安装

当前 master 面向基于 `dsh-v0.1.3-alpha.1`、支持 `plugins/` 目录发现的 Xiaozhuang DSH 源码 checkout；下载 Code → Download ZIP 获取本次修复。已有 Release/tag 保持原样。所有产品能力必须保留在各自完整文件夹，不要同时启用旧 Profile 副本。

1. 确认目标是 DSH 源码 checkout 或可写 Profile，并保留现有未提交改动。
2. 对每个插件读取 manifest 中的 sources 与 rows。product 源必须把完整目录保留在 `plugins/<插件 id>`，不得把其中的文件摊入核心目录；repository 源按其原相对路径合入源码；profile 源可作为 out-of-tree 包放入目标 Profile 的 packages 目录。
3. 让目标产品的插件目录发现器按文件夹生成构建入口、Web bundle 依赖和 Cordis rows；同 id 的行只合并本插件需要的 name、config 与 disabled，不覆盖其他字段。移除该插件文件夹后，发现器必须跳过它且核心仍能启动。
4. 复用目标版本已有依赖，缺失依赖按目标仓库的包管理方式安装。
5. 执行所选包的定向构建，并从真实设置或对话入口确认能力出现；再临时移走该文件夹，确认其他插件与核心仍可运行。

## 冲突或失败兜底

发生冲突或直接安装失败时，安装 AI 可以自行调整插件文件夹内的文件路径、import、类型、Slot 接口、package manifest 和 Cordis 组装，使 manifest 所描述的用户能力兼容目标 DSH。核心只允许增加与具体产品无关的中性扩展点；调整范围必须限制在冲突文件、所选插件及其直接依赖，并保留目标版本的新能力与用户数据。每项调整都要写入最终安装报告。无法安全兼容时停止，不留下半安装的启用行，并报告阻塞点与可恢复方式。

## 共享兼容代码

按 manifest.compatibilityPatches 的顺序逐项检查补丁。补丁基于主仓库相邻已发布版本；目标已经具备对应实现时不要重复应用。仅合入缺失的通用接口，不整体替换目标核心包。新设置图标接口以分区 id 匹配，由插件持有注册与释放；移除文件夹不影响其他入口。Host 修改确需重启时先征得用户同意。

`payload/shared/source/` 携带聊天模式、导入器及其 Client／Host 工作区依赖的源码闭包，供目标源码缺失对应依赖时核对和构建；不是另一组产品插件，不得覆盖目标已有更新。保留共享核心依赖，只移除 `plugins/chat-mode` 或 `plugins/conversation-import` 即可分别卸载两项能力。

历史兼容只通过标准读取句柄增加新版文件，不删除、覆盖原始日志或丢弃未知事件。未标记旧 Teamwork 状态的首次迁移需要其拥有者；新版生成后可在移除插件后继续读取。

Safari 历史补丁修复共享 JSON 校验器的引擎文本格式识别，并提供桌面窗口的登录恢复表单、无缓存首页和手动重载提示。按目标已有实现检查后应用；重新构建内联该校验器的 Client 包，包括 session-controller、connection、ui-chat 和 ui-trajectory。必须在用户实际 Safari 桌面窗口打开旧 Agent 回答、展开 Bash／文件读取结果、加载更早记录和子 Agent 报告；仅在 Chrome 测试通过不能代替该验收。禁止通过重新导入、删除日志或跳过助手数据块“修复”显示。
