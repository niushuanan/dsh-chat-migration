# 安装 AI 指令

你正在安装一组从 Xiaozhuang DSH 导出的插件。

1. 先阅读 INSTALL.md 与 manifest.json，再检查目标仓库的 AGENTS.md、当前 commit、目录结构和未提交改动。
2. 只安装 manifest.plugins 中的能力；不得覆盖用户数据、对话历史、凭据、DSH Home 或无关插件。
3. 优先把 payload 中的包按原相对路径合入，并把 manifest 中的 Cordis rows 合并到目标 Web Profile／bundle，不得整体替换目标 patch。
4. 只执行覆盖所选插件的构建、类型检查或真实入口验证。
5. 记录新增文件、修改文件、Cordis 行和所有兼容性调整。

如果目标版本不兼容，遵循 INSTALL.md 的冲突兜底，不得用 reset、checkout 覆盖或删除整个目录解决冲突。
