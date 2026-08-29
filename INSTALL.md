# 安装与兼容流程

## 直接安装

1. 确认目标是 DSH 源码 checkout 或可写 Profile，并保留现有未提交改动。
2. 对每个插件读取 manifest 中的 sources 与 rows。repository 源按其原相对路径合入源码；profile 源可作为 out-of-tree 包放入目标 Profile 的 packages 目录。
3. 合并 package.json／TypeScript 引用／Web bundle 依赖和 Cordis rows；同 id 的行只合并本插件需要的 name、config 与 disabled，不覆盖其他字段。
4. 复用目标版本已有依赖，缺失依赖按目标仓库的包管理方式安装。
5. 执行所选包的定向构建，并从真实设置或对话入口确认能力出现。

## 冲突或失败兜底

发生冲突或直接安装失败时，安装 AI 可以自行调整文件路径、import、类型、Slot 接口、package manifest 和 Cordis 组装，使 manifest 所描述的用户能力兼容目标 DSH。调整范围必须限制在冲突文件、所选插件及其直接依赖；保留目标版本的新能力与用户数据。每项调整都要写入最终安装报告。无法安全兼容时停止，不留下半安装的启用行，并报告阻塞点与可恢复方式。
