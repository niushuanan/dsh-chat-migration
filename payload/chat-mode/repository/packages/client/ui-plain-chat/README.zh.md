---
description: "用于启动内置纯聊天 Agent 预设的浏览器侧边栏入口。"
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-plain-chat

[English](README.md) | 中文

## 概要

在官方侧边栏底部增加精简的“聊天模式”入口。若已有使用内置 `chat` 预设的空白会话，则直接复用；否则只创建一个会话，选中该预设后打开。创建尚未完成时的重复点击会共用同一次操作。

## 模型体验

UI 包本身不影响模型。独立的内置 `chat` 预设提供纯对话角色，并且不挂载任何工具。
