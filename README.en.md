# dsh-chat-migration

English | [中文](README.md)

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-111111)](https://github.com/niushuanan/xiaozhuang-dsh) [![MIT](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

Migrate the full history exported by the official DeepSeek service into DeepSeek Harness, and enable workspace-free chat mode through the same plugin. Original titles, chronological order, prompts, answers, and exported reasoning are mapped into native chat records.

<p align="center"><img src="docs/06-chat-import.webp" alt="DeepSeek history import Settings page" width="800"></p>

<p align="center"><img src="docs/06-pure-chat.webp" alt="Workspace-free chat mode" width="800"></p>

## Install

1. Use GitHub **Code → Download ZIP** to download this repository.
2. Give the ZIP to an AI that can read and modify the target DSH project.
3. Tell the AI: **Read AGENTS.md, INSTALL.md, and manifest.json first. Install only this plugin and preserve existing plugins, data, conversations, attachments, and settings.**
4. Enable **Chat migration** under **Settings → Xiaozhuang plugins**. Its single switch enables both Chat mode and **Settings → Import conversations**.

## Use

1. In the official DeepSeek app, open **Me → System settings → Data management → Export all conversation history**.
2. In DSH, open **Settings → Import conversations** and select the exported JSON or ZIP.
3. Wait for completion. Imported records appear under Chats in their original chronology. Re-importing the same export skips conversations that already exist.

## Contents

- <code>payload/</code>: generated chat-mode, importer, and direct runtime dependencies from the main repository.
- <code>manifest.json</code>: plugin composition, Cordis rows, source commit, and per-file SHA-256.
- <code>INSTALL.md</code>: direct installation, conflict adaptation, failure recovery, and narrow verification.
- <code>docs/</code>: real product screenshots from this version.

This repository never contains a user's DeepSeek export, conversation history, account, credentials, or local settings.

## Source and license

This repository is a one-way distribution mirror of [Xiaozhuang DSH](https://github.com/niushuanan/xiaozhuang-dsh), not an independent development source. It is synchronized from main-repository commit [`1e8349b1f0`](https://github.com/niushuanan/xiaozhuang-dsh/commit/1e8349b1f0ffdbe7fc98a789bdfad6a1a142a156). Licensed under the [MIT License](LICENSE).
