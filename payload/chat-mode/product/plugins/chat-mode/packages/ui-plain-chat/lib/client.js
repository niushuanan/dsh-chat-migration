window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-plain-chat",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:/private/tmp/dsh-publish-20260905.X1Ok1K/source/plugins/chat-mode/packages/ui-plain-chat/src/client/ChatAction.module.css.mjs
		const css = ".PCPe_a_modeSwitch{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);background:var(--dsw-alias-bg-layer-1);border-radius:999px;flex:none;align-items:stretch;height:38px;margin:0 2px 8px;display:flex;position:relative;overflow:hidden}.PCPe_a_modeThumb{border-radius:inherit;background:var(--dsw-alias-button-primary-fill);pointer-events:none;width:50%;transition:transform .22s ease-in-out;position:absolute;inset:0 auto 0 0}.PCPe_a_modeThumb[data-position=left]{transform:translate(0)}.PCPe_a_modeThumb[data-position=right]{transform:translate(100%)}.PCPe_a_segment{z-index:1;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border:0;flex:50%;justify-content:center;align-items:center;padding:0;font-size:12px;font-weight:500;transition:color .22s ease-in-out;display:flex;position:relative;overflow:hidden}.PCPe_a_segment[aria-pressed=true]{color:var(--dsw-alias-label-primary-foreground);font-weight:600}.PCPe_a_segment[aria-pressed=true]:hover{background:0 0}.PCPe_a_segmentLabel{white-space:nowrap;max-width:200px;overflow:hidden}.PCPe_a_collapsed{background:0 0;border:0;flex-direction:column;gap:12px;width:36px;height:auto;margin:0 0 12px}.PCPe_a_collapsed .PCPe_a_segment{width:36px;height:36px;color:var(--dsw-alias-label-primary);border-radius:12px;flex:none;transition:none}.PCPe_a_collapsed .PCPe_a_segment:hover{background:var(--dsw-alias-interactive-bg-hover)}.PCPe_a_collapsed .PCPe_a_segment[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:0 0}.PCPe_a_collapsed .PCPe_a_segmentLabel{max-width:0}";
		const tagId = "@deepseek-ai/dsh-client-ui-plain-chat/ChatAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-plain-chat";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ChatAction_module_css_default = {
			"collapsed": "PCPe_a_collapsed",
			"modeSwitch": "PCPe_a_modeSwitch",
			"modeThumb": "PCPe_a_modeThumb",
			"segment": "PCPe_a_segment",
			"segmentLabel": "PCPe_a_segmentLabel"
		};
		//#endregion
		//#region src/client/ChatAction.tsx
		/** Own the complete two-mode switch while this plugin is installed. */
		function ChatAction({ wide, label, ariaLabel, startSession, startChat, sessions, t }) {
			const subscribe = (0, react.useCallback)((listener) => sessions.subscribe(listener), [sessions]);
			const getSnapshot = (0, react.useCallback)(() => sessions.getSnapshot(), [sessions]);
			const state = (0, react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
			const sessionId = state.current;
			const chatActive = sessionId !== void 0 && state.byId[sessionId]?.projectionValues?.agentPreset === "chat";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${ChatAction_module_css_default.modeSwitch}${wide ? "" : ` ${ChatAction_module_css_default.collapsed}`}`,
				role: "group",
				children: [
					wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ChatAction_module_css_default.modeThumb,
						"aria-hidden": "true",
						"data-position": chatActive ? "right" : "left"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: ariaLabel,
						delayMs: 500,
						disabled: wide,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ChatAction_module_css_default.segment,
							"aria-label": ariaLabel,
							"aria-pressed": !chatActive,
							onClick: startSession,
							children: [!wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutline16, { size: 18 }), wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatAction_module_css_default.segmentLabel,
								children: t("mode.agent") || label
							})]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t("start.label"),
						delayMs: 500,
						disabled: wide,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ChatAction_module_css_default.segment,
							"aria-label": t("start.label"),
							"aria-pressed": chatActive,
							onClick: startChat,
							children: [!wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChatOutline16, { size: 18 }), wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatAction_module_css_default.segmentLabel,
								children: t("start")
							})]
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale namespace owned by the plain-chat launcher. */
		const NS = "plainChat";
		const zh = {
			start: "聊天模式",
			"start.label": "开始纯聊天",
			"mode.agent": "Agentic Coding",
			placeholder: "输入消息",
			group: "聊天",
			"session.new": "新聊天",
			"session.new.aria": "新建聊天"
		};
		const en = {
			start: "Chat mode",
			"start.label": "Start plain chat",
			"mode.agent": "Agentic Coding",
			placeholder: "Send a message",
			group: "Chats",
			"session.new": "New Chat",
			"session.new.aria": "New Chat"
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
			"remote.agentPresets",
			"conversationPresentation",
			"uiWorkspace"
		];
		/** Mount the launcher as the Chat half of the sidebar work-mode switch. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-plain-chat: dictionaries");
			const starter = new ChatStarter(ctx.sessions, ctx.remote);
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.conversationPresentation.register({
				id: "plain-chat",
				matches: (session) => session.projectionValues?.agentPreset === CHAT_AGENT_PRESET,
				present: () => ({
					hideHeroConfiguration: true,
					hideComposerModes: true,
					hideAuxiliaryPanes: true,
					placeholder: t("placeholder")
				})
			}), "ui-plain-chat: conversation presentation");
			ctx.effect(() => ctx.uiWorkspace.registerSessionGroup({
				id: "plain-chat",
				order: -100,
				label: () => t("group"),
				matches: (session) => session?.projectionValues?.agentPreset === CHAT_AGENT_PRESET,
				start: () => {
					starter.start();
				},
				renderIcon: () => (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChatOutline16),
				newSessionLabel: () => t("session.new"),
				newSessionAriaLabel: () => t("session.new.aria")
			}), "ui-plain-chat: sidebar Session group");
			ctx.slots.inject("sidebar.primary.action", () => ctx.slots.register({
				name: "sidebar.primary.action",
				locale: NS,
				inject: () => ({
					startChat: () => {
						starter.start();
					},
					sessions: ctx.sessions.list
				})
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