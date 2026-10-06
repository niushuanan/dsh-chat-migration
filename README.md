# dsh-chat-migration

当前 master 面向 Harness **0.2.1-alpha.1**，已使用 [dsh-plugin-upgrade-skill](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/) 完成原生插件适配。下载当前分支获得本次源码更新；既有 Release 保持各自原版本。

[English](README.en.md) | 中文

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-111111)](https://github.com/niushuanan/xiaozhuang-dsh) [![MIT](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

本组合仓库提供两个可独立安装、启停和导出的原生插件：“聊天模式”用于不绑定工作区、不授予本地执行权限地直接聊天；“导入对话”用于把 DeepSeek 官方平台导出的历史迁入 DeepSeek Harness。原始标题、时间顺序、问题、回答和导出中已有的思维过程会映射到原生聊天记录。

<p align="center"><img src="docs/06-chat-import.webp" alt="DeepSeek 历史对话导入设置页" width="800"></p>

<p align="center"><img src="docs/06-pure-chat.webp" alt="无工作区约束的聊天模式" width="800"></p>

当前 master 按原生插件文件夹发布，设置入口保留插件自有的原设计图标；删除对应插件文件夹即可卸载。共享兼容补丁和安装检查见 [INSTALL.md](INSTALL.md)。

共享历史读取器支持 Safari 桌面窗口的原生 JSON 表示，避免合法 Agent 回答和工具结果被误判后停止显示。重新打开桌面窗口时自动恢复仍有效的已保存登录，不要求反复填写启动令牌。安装验收需在实际使用的浏览器中打开旧回答、展开工具结果并加载更早记录，不能仅凭会话标题或 Chrome 验证认定历史完整。

## 安装

1. 点击 GitHub 的 **Code → Download ZIP**，下载本仓库。
2. 把 ZIP 交给能够读取并修改目标 DSH 项目的 AI。
3. 对 AI 说：**先阅读 AGENTS.md、INSTALL.md 和 manifest.json，只安装这个插件，并保留现有插件、数据、对话、附件和设置。**
4. 安装后在 **设置 → 小庄的插件** 分别启用“聊天模式”和“导入对话”。只需要其中一项时，安装 AI 也可以按 `manifest.json` 只安装对应插件。

## 使用

1. 在 DeepSeek 官方应用依次进入 **我的 → 系统设置 → 数据管理 → 导出所有历史对话**。
2. 在 DSH 打开 **设置 → 导入对话**，选择官方导出的 JSON 或 ZIP。
3. 等待解析完成，在按独立对话窗口列出的预览中搜索、勾选真正需要迁移的记录；新记录默认选中，已经导入的记录会明确标记且不会生成副本。
4. 确认导入；历史会进入侧栏“聊天”目录，并按原始时间排列。重复导入同一份记录会跳过已有对话。

## 内容

- <code>payload/chat-mode/</code>：从主仓库生成的聊天模式及其直接运行依赖。
- <code>payload/conversation-import/</code>：从主仓库生成的 DeepSeek 导入器及其直接运行依赖。
- <code>manifest.json</code>：两个独立插件、Cordis 行、来源 commit 和逐文件 SHA-256。
- <code>INSTALL.md</code>：直接安装、冲突适配、失败恢复和最小验证说明。
- <code>docs/</code>：当前版本的真实产品截图。

本仓库不会包含用户的 DeepSeek 导出文件、对话历史、账号、密钥或本机设置。

## 来源与许可

本仓库是 [Xiaozhuang DSH](https://github.com/niushuanan/xiaozhuang-dsh) 的单向发布副本，不是独立开发源。当前内容同步自主仓库 commit [`198c2edb37`](https://github.com/niushuanan/xiaozhuang-dsh/commit/198c2edb37c4dcf1c3844831e946a57ed7259e8e)。代码采用 [MIT License](LICENSE)。
