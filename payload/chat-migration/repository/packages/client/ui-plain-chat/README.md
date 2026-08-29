---
description: "Browser sidebar launcher for the shipped plain-chat agent preset."
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-plain-chat

English | [中文](README.zh.md)

## Summary

Adds a compact `Chat mode` action to the official sidebar footer. It reuses an existing blank Session already composed with the shipped `chat` preset, or creates one Session, selects that preset, and opens it. Repeated clicks while creation is in flight share the same operation.

## Model Experience

The UI package itself is not model-facing. The separate shipped `chat` preset provides the plain conversational persona and mounts no tools.
