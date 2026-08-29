# dsh-chat-migration

[English](README.en.md) | 中文

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-111111)](https://github.com/niushuanan/xiaozhuang-dsh) [![MIT](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

把 DeepSeek 官方平台导出的全部历史对话迁入 DeepSeek Harness，并用同一个插件开启不绑定工作区、不授予本地执行权限的聊天模式。原始标题、时间顺序、问题、回答和导出中已有的思维过程会映射到原生聊天记录。

<p align="center"><img src="docs/06-chat-import.webp" alt="DeepSeek 历史对话导入设置页" width="800"></p>

<p align="center"><img src="docs/06-pure-chat.webp" alt="无工作区约束的聊天模式" width="800"></p>

## 安装

1. 点击 GitHub 的 **Code → Download ZIP**，下载本仓库。
2. 把 ZIP 交给能够读取并修改目标 DSH 项目的 AI。
3. 对 AI 说：**先阅读 AGENTS.md、INSTALL.md 和 manifest.json，只安装这个插件，并保留现有插件、数据、对话、附件和设置。**
4. 安装后在 **设置 → 小庄的插件** 启用“聊天迁移”；同一个开关会同时启用聊天模式与 **设置 → 导入对话**。

## 使用

1. 在 DeepSeek 官方应用依次进入 **我的 → 系统设置 → 数据管理 → 导出所有历史对话**。
2. 在 DSH 打开 **设置 → 导入对话**，选择官方导出的 JSON 或 ZIP。
3. 等待解析完成，在按独立对话窗口列出的预览中搜索、勾选真正需要迁移的记录；新记录默认选中，已经导入的记录会明确标记且不会生成副本。
4. 确认导入；历史会进入侧栏“聊天”目录，并按原始时间排列。重复导入同一份记录会跳过已有对话。

## 内容

- <code>payload/</code>：从主仓库生成的聊天模式、导入器和直接运行依赖。
- <code>manifest.json</code>：插件组合、Cordis 行、来源 commit 和逐文件 SHA-256。
- <code>INSTALL.md</code>：直接安装、冲突适配、失败恢复和最小验证说明。
- <code>docs/</code>：当前版本的真实产品截图。

本仓库不会包含用户的 DeepSeek 导出文件、对话历史、账号、密钥或本机设置。

## 来源与许可

本仓库是 [Xiaozhuang DSH](https://github.com/niushuanan/xiaozhuang-dsh) 的单向发布副本，不是独立开发源。当前内容同步自主仓库 commit [`286f34870a`](https://github.com/niushuanan/xiaozhuang-dsh/commit/286f34870a70a8d5c3e26157b3aef9a516ce7bd5)。代码采用 [MIT License](LICENSE)。
