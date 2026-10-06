# 安装与兼容流程

当前源码面向 `dsh-v0.2.1-alpha.1` 的 Xiaozhuang DSH 整合版。先读取 manifest.json，再以完整插件目录安装；已有 Release/tag 不代表当前 master。

1. 将 `payload/<id>/product/plugins/<id>` 合入目标项目的 `plugins/<id>`，保留整个目录。不要同时启用旧 Profile 副本，也不要覆盖用户会话、附件、设置或凭据。
2. 使用目标项目的原生插件目录发现器。若目标是原版官方 Harness，先按 manifest.compatibilityPatches 审阅其缺失的通用接口；只合入当前插件需要的补丁部分，不整体替换核心。补丁基于官方 0.2.1-alpha.1，已具备对应接口时跳过。
3. 根 workspace 声明包括 `plugins/*` 和 `plugins/*/packages/*`；CLI 解析清单只增加所安装插件及其自有子包，使用目标项目已有的 workspace 依赖写法，不要求安装其他 Xiaozhuang 插件。
4. 按插件 package.json 复用目标 0.2.1 的依赖、Cordis patch 与 Client 注入服务；构建所选插件，并从真实入口验证它的主要能力。移除对应插件目录后，核心与其他插件仍应可用。
5. Host 修改确需重启时，应先说明影响并获得该用户的授权。历史兼容按插件声明验证已知状态，保留原始日志；不要用未知事件静默丢弃或全量重写规避不兼容。

发生直接安装冲突时，安装 AI 使用 [升级 skill](https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill/) 核对目标接口，调整所选插件及直接依赖。记录变更与真实验收结果；无法安全兼容时报告具体阻塞，不留下半安装的启用行。
