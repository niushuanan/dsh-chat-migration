window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-plain-chat",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh/packages/client/ui-plain-chat/src/client/ChatAction.module.css.mjs
		const css = ".Bj71Ia_action{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:10px;justify-content:center;align-items:center;gap:8px;font-size:13px;font-weight:500;display:flex}.Bj71Ia_action:hover{background:var(--dsw-alias-interactive-bg-hover)}.Bj71Ia_wide{justify-content:flex-start;width:100%;padding:0 12px}.Bj71Ia_rail{width:36px;padding:0}.Bj71Ia_label{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.Bj71Ia_segment{z-index:1;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border:0;flex:50%;justify-content:center;align-items:center;padding:0;font-size:12px;font-weight:500;transition:color .22s ease-in-out;display:flex;position:relative;overflow:hidden}.Bj71Ia_segment[aria-pressed=true]{color:var(--dsw-alias-label-primary-foreground);font-weight:600}.Bj71Ia_segment[aria-pressed=true]:hover{background:0 0}.Bj71Ia_segmentLabel{white-space:nowrap;max-width:200px;overflow:hidden}";
		const tagId = "@deepseek-ai/dsh-client-ui-plain-chat/ChatAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-plain-chat";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ChatAction_module_css_default = {
			"action": "Bj71Ia_action",
			"label": "Bj71Ia_label",
			"rail": "Bj71Ia_rail",
			"segment": "Bj71Ia_segment",
			"segmentLabel": "Bj71Ia_segmentLabel",
			"wide": "Bj71Ia_wide"
		};
		//#endregion
		//#region src/client/ChatAction.tsx
		/** Render a wide sidebar row or its compact rail action. */
		function ChatAction({ wide, segment, active, startChat, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t("start.label"),
				delayMs: 500,
				disabled: wide,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: segment ? ChatAction_module_css_default.segment : `${ChatAction_module_css_default.action}${wide ? ` ${ChatAction_module_css_default.wide}` : ` ${ChatAction_module_css_default.rail}`}`,
					"aria-label": t("start.label"),
					"aria-pressed": segment ? active === true : void 0,
					onClick: startChat,
					children: [!wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChatOutline16, { size: 18 }), wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: segment ? ChatAction_module_css_default.segmentLabel : ChatAction_module_css_default.label,
						children: t("start")
					})]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale namespace owned by the plain-chat launcher. */
		const NS = "plainChat";
		const zh = {
			start: "聊天模式",
			"start.label": "开始纯聊天"
		};
		const en = {
			start: "Chat mode",
			"start.label": "Start plain chat"
		};
		//#endregion
		//#region src/client/start-chat.ts
		/** Durable preset that identifies a plain-chat Session. */
		const CHAT_AGENT_PRESET = "chat";
		/** Reuse a blank chat or create and compose exactly one replacement. */
		var ChatStarter = class {
			sessions;
			remote;
			creating;
			constructor(sessions, remote) {
				this.sessions = sessions;
				this.remote = remote;
			}
			async createChat() {
				const id = await this.sessions.create();
				const result = await this.remote.agentPresets.select(id, CHAT_AGENT_PRESET);
				if (!result.ok) throw new Error(result.error.message);
				return id;
			}
			/** Open an existing blank chat or coalesce concurrent creation attempts. */
			start() {
				const list = this.sessions.list.getSnapshot();
				const reusable = list.ids.find((id) => {
					const row = list.byId[id];
					return row?.blank === true && row.projectionValues?.agentPreset === "chat";
				});
				if (reusable !== void 0) {
					this.sessions.open(reusable);
					return;
				}
				const pending = this.creating ?? this.createChat();
				if (this.creating === void 0) {
					this.creating = pending;
					pending.finally(() => {
						if (this.creating === pending) this.creating = void 0;
					}).catch(() => void 0);
				}
				pending.then((id) => {
					this.sessions.open(id);
				}, (reason) => {
					console.warn("start chat failed:", reason);
				});
			}
		};
		//#endregion
		//#region src/client/index.ts
		/** Services required by the plain-chat launcher. */
		const inject = [
			"slots",
			"sessions",
			"locale",
			"remote",
			"remote.agentPresets"
		];
		/** Mount the launcher as the Chat half of the sidebar work-mode switch. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-plain-chat: dictionaries");
			const starter = new ChatStarter(ctx.sessions, ctx.remote);
			ctx.slots.inject("sidebar.primary.action", () => ctx.slots.register({
				name: "sidebar.primary.action",
				id: "plain-chat",
				order: -10,
				locale: NS,
				inject: () => ({ startChat: () => {
					starter.start();
				} })
			}, ChatAction));
		}
		//#endregion
		exports.CHAT_AGENT_PRESET = CHAT_AGENT_PRESET;
		exports.ChatAction = ChatAction;
		exports.ChatStarter = ChatStarter;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map