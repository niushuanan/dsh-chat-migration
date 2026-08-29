window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-sidebar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh/packages/client/ui-sidebar/src/client/SidebarRoot.module.css.mjs
		const css = "._4VV_oa_root{--dsh-sidebar-inline-padding:12px;height:100%;padding:6px var(--dsh-sidebar-inline-padding);box-sizing:border-box;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex-direction:column;font-size:14px;display:flex}._4VV_oa_root._4VV_oa_collapsed{padding:18px 10px 6px}._4VV_oa_root._4VV_oa_quietBars{--dsh-scrollbar-thumb:transparent;--dsh-scrollbar-thumb-hover:transparent}._4VV_oa_fading>*{opacity:0;transition:opacity .15s var(--ds-ease-in-out)}._4VV_oa_wide{animation:_4VV_oa_wide-in .2s var(--ds-ease-in-out)}@keyframes _4VV_oa_wide-in{0%{opacity:0}}._4VV_oa_railIn ._4VV_oa_iconButton,._4VV_oa_railIn ._4VV_oa_newSession,._4VV_oa_railIn ._4VV_oa_regionArea{animation:_4VV_oa_rail-in .15s var(--ds-ease-in-out) backwards}._4VV_oa_railIn ._4VV_oa_footArea{animation:_4VV_oa_rail-fade-in .15s var(--ds-ease-in-out) backwards}@keyframes _4VV_oa_rail-in{0%{opacity:0;transform:translate(49px)}}@keyframes _4VV_oa_rail-fade-in{0%{opacity:0}}._4VV_oa_logoRow{box-sizing:border-box;flex:none;justify-content:flex-end;align-items:center;gap:8px;height:60px;margin-bottom:8px;padding:8px 0 8px 4px;display:flex;overflow:hidden}._4VV_oa_collapsed ._4VV_oa_logoRow{justify-content:flex-start;height:36px;margin-bottom:12px;padding:0}._4VV_oa_brand{min-width:0;color:inherit;cursor:pointer;background:0 0;border:none;flex:1;align-items:center;padding:0;display:inline-flex;overflow:hidden}._4VV_oa_brandIdentity{align-items:center;gap:8px;min-width:0;height:24px;display:inline-flex}._4VV_oa_brandMark{flex:none;justify-content:center;align-items:center;display:inline-flex}._4VV_oa_brandName{letter-spacing:.04em;align-items:center;gap:6px;min-width:0;height:24px;font-size:18px;font-weight:600;line-height:24px;display:inline-flex}._4VV_oa_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}._4VV_oa_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}._4VV_oa_collapsed ._4VV_oa_iconButton{width:36px;height:36px}._4VV_oa_collapsed ._4VV_oa_toggle ._4VV_oa_panelIcon{display:none}._4VV_oa_collapsed ._4VV_oa_toggle:hover ._4VV_oa_panelIcon{display:inline}._4VV_oa_collapsed ._4VV_oa_toggle:hover ._4VV_oa_railMark{display:none}._4VV_oa_railMark{justify-content:center;align-items:center;display:inline-flex}._4VV_oa_collapsed ._4VV_oa_iconButton{color:var(--dsw-alias-label-primary)}._4VV_oa_newSession{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);height:38px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:12px;flex:none;justify-content:center;align-items:center;gap:6px;margin:0 2px 8px;padding:8px 16px;font-size:14px;font-weight:500;line-height:22px;display:flex;overflow:hidden}._4VV_oa_newSession:hover{background:var(--dsw-alias-button-floating-hover)}._4VV_oa_collapsed ._4VV_oa_newSession{background:0 0;border-color:#0000;align-self:flex-start;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}._4VV_oa_collapsed ._4VV_oa_newSession:hover{background:var(--dsw-alias-interactive-bg-hover)}._4VV_oa_newSessionLabel{white-space:nowrap;max-width:200px;overflow:hidden}._4VV_oa_collapsed ._4VV_oa_newSessionLabel{max-width:0}._4VV_oa_modeSwitch{box-sizing:border-box;border:1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);background:var(--dsw-alias-bg-layer-1);border-radius:999px;flex:none;align-items:stretch;height:38px;margin:0 2px 8px;display:flex;position:relative;overflow:hidden}._4VV_oa_modeThumb{border-radius:inherit;background:var(--dsw-alias-button-primary-fill);pointer-events:none;width:50%;transition:transform .22s ease-in-out;position:absolute;inset:0 auto 0 0}._4VV_oa_modeThumb[data-position=left]{transform:translate(0)}._4VV_oa_modeThumb[data-position=right]{transform:translate(100%)}._4VV_oa_modeSegment{z-index:1;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border:0;flex:50%;justify-content:center;align-items:center;padding:0;font-size:12px;font-weight:500;transition:color .22s ease-in-out;display:flex;position:relative;overflow:hidden}._4VV_oa_modeSegment[aria-pressed=true]{color:var(--dsw-alias-label-primary-foreground);font-weight:600}._4VV_oa_modeSegment[aria-pressed=true]:hover{background:0 0}._4VV_oa_modeLabel{white-space:nowrap;max-width:200px;overflow:hidden}._4VV_oa_collapsed ._4VV_oa_modeSwitch{background:0 0;border:0;flex-direction:column;gap:12px;width:36px;height:auto;margin:0 0 12px}._4VV_oa_collapsed ._4VV_oa_modeThumb{display:none}._4VV_oa_collapsed ._4VV_oa_modeSegment{width:36px;height:36px;color:var(--dsw-alias-label-primary);border-radius:12px;flex:none;transition:none}._4VV_oa_collapsed ._4VV_oa_modeSegment:hover{background:var(--dsw-alias-interactive-bg-hover)}._4VV_oa_collapsed ._4VV_oa_modeSegment[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:0 0}._4VV_oa_collapsed ._4VV_oa_modeLabel{max-width:0}._4VV_oa_regionArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-sidebar-inline-padding));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:hidden}._4VV_oa_collapsed ._4VV_oa_regionArea{margin-left:0;margin-right:0;padding-left:0}._4VV_oa_footArea{flex-direction:column;flex:none;display:flex}._4VV_oa_settingsArea,._4VV_oa_footerActions{flex:none;width:100%;min-width:0}._4VV_oa_footerActions{display:flex}._4VV_oa_collapsed ._4VV_oa_footArea{align-items:center}._4VV_oa_collapsed ._4VV_oa_settingsArea,._4VV_oa_collapsed ._4VV_oa_footerActions{justify-content:center;width:auto;display:flex}@media (prefers-reduced-motion:reduce){._4VV_oa_wide,._4VV_oa_fading>*,._4VV_oa_railIn ._4VV_oa_iconButton,._4VV_oa_railIn ._4VV_oa_newSession,._4VV_oa_railIn ._4VV_oa_footArea,._4VV_oa_railIn ._4VV_oa_regionArea{transition:none;animation:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-sidebar";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SidebarRoot_module_css_default = {
			"brand": "_4VV_oa_brand",
			"brandIdentity": "_4VV_oa_brandIdentity",
			"brandMark": "_4VV_oa_brandMark",
			"brandName": "_4VV_oa_brandName",
			"collapsed": "_4VV_oa_collapsed",
			"fading": "_4VV_oa_fading",
			"footArea": "_4VV_oa_footArea",
			"footerActions": "_4VV_oa_footerActions",
			"iconButton": "_4VV_oa_iconButton",
			"logoRow": "_4VV_oa_logoRow",
			"modeLabel": "_4VV_oa_modeLabel",
			"modeSegment": "_4VV_oa_modeSegment",
			"modeSwitch": "_4VV_oa_modeSwitch",
			"modeThumb": "_4VV_oa_modeThumb",
			"newSession": "_4VV_oa_newSession",
			"newSessionLabel": "_4VV_oa_newSessionLabel",
			"panelIcon": "_4VV_oa_panelIcon",
			"quietBars": "_4VV_oa_quietBars",
			"rail-fade-in": "_4VV_oa_rail-fade-in",
			"rail-in": "_4VV_oa_rail-in",
			"railIn": "_4VV_oa_railIn",
			"railMark": "_4VV_oa_railMark",
			"regionArea": "_4VV_oa_regionArea",
			"root": "_4VV_oa_root",
			"settingsArea": "_4VV_oa_settingsArea",
			"toggle": "_4VV_oa_toggle",
			"wide": "_4VV_oa_wide",
			"wide-in": "_4VV_oa_wide-in"
		};
		//#endregion
		//#region lib/types/client/SidebarRoot.js
		/**
		* Sidebar shell: column geometry only. Collapse is a slide plus crossfade:
		* content freezes at its expanded width (inline style) and fades out in place
		* while the sliding column (AppFrame grid tracks) clips it — nothing reflows
		* mid-slide. At settle the wide-only content unmounts and the four upper
		* controls enter the 56px rail from the same horizontal offset (one icon each,
		* same top-down order) on one fade that ends with the slide. The bottom-pinned
		* settings control only fades. The workspace/session browsing region between
		* the New Session button and the foot is the `sidebar.workspaces` registrant's,
		* and the foot holds `sidebar.settings` plus `sidebar.footer.action`; the shell
		* hands them the wide flag (plus an expand request callback for the browser).
		*
		* The column also owns whether the scroll regions nested in it draw a
		* scrollbar at all: the shell tracks the pointer and rebinds ui-theme's
		* scrollbar indirection away while it is elsewhere, so a list the user is not
		* pointing at carries no bar.
		*/
		/** Wide-content unmount delay; matches the 150ms wide-content fade-out. */
		const COLLAPSE_SETTLE_MS = 150;
		/**
		* How long the column's scrollbars stay drawn after the pointer leaves it.
		* The bar is a pointer affordance here, and hiding it on the leave event
		* itself makes it blink out while the pointer is only crossing the column's
		* edge — on the way to the conversation, or around a portalled menu.
		*/
		const SCROLLBAR_LINGER_MS = 2e3;
		/**
		* Render the sidebar column shell.
		* @param props - composed slot props (runtime share + injected callbacks, contract/slots.ts).
		* @returns the sidebar element tree.
		*/
		function SidebarRoot({ collapsed, width, useSessions, startSession, toggleSidebar, t, renderSlot }) {
			const chatActive = useSessions((state) => {
				if (state.current === void 0) return false;
				return (state.byId[state.current]?.projectionValues)?.agentPreset === "chat";
			});
			const [settled, setSettled] = (0, react.useState)(collapsed);
			(0, react.useEffect)(() => {
				if (!collapsed) {
					setSettled(false);
					return;
				}
				const timer = window.setTimeout(() => {
					setSettled(true);
				}, COLLAPSE_SETTLE_MS);
				return () => {
					window.clearTimeout(timer);
				};
			}, [collapsed]);
			const wide = !collapsed || !settled;
			const lastWideWidth = (0, react.useRef)(width);
			if (!collapsed) lastWideWidth.current = width;
			const everWide = (0, react.useRef)(!collapsed);
			if (!collapsed) everWide.current = true;
			const column = (0, react.useRef)(null);
			const [pointerInside, setPointerInside] = (0, react.useState)(false);
			const lingerTimer = (0, react.useRef)(void 0);
			const armLinger = () => {
				if (lingerTimer.current !== void 0) return;
				lingerTimer.current = window.setTimeout(() => {
					lingerTimer.current = void 0;
					setPointerInside(false);
				}, SCROLLBAR_LINGER_MS);
			};
			const cancelLinger = () => {
				window.clearTimeout(lingerTimer.current);
				lingerTimer.current = void 0;
			};
			(0, react.useEffect)(() => {
				if (!pointerInside) return;
				const onMove = (event) => {
					const rect = column.current?.getBoundingClientRect();
					/* v8 ignore next -- the listener only exists while the column is mounted and revealed. */
					if (rect === void 0) return;
					if (event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom) cancelLinger();
					else armLinger();
				};
				document.addEventListener("pointermove", onMove);
				return () => {
					document.removeEventListener("pointermove", onMove);
					cancelLinger();
				};
			}, [pointerInside]);
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: column,
				className: clsx(SidebarRoot_module_css_default.root, !wide && SidebarRoot_module_css_default.collapsed, !wide && everWide.current && SidebarRoot_module_css_default.railIn, collapsed && wide && SidebarRoot_module_css_default.fading, !pointerInside && SidebarRoot_module_css_default.quietBars),
				style: wide ? { width: collapsed ? lastWideWidth.current : width } : void 0,
				onPointerEnter: () => {
					cancelLinger();
					setPointerInside(true);
				},
				onPointerLeave: () => {
					armLinger();
				},
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: SidebarRoot_module_css_default.logoRow,
						children: [wide && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: clsx(SidebarRoot_module_css_default.brand, SidebarRoot_module_css_default.wide),
							"aria-label": t("session.new.label"),
							onClick: () => {
								startSession();
							},
							children: (0, react_jsx_runtime.jsxs)("span", {
								className: SidebarRoot_module_css_default.brandIdentity,
								"aria-hidden": "true",
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: SidebarRoot_module_css_default.brandMark,
									children: renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FishLogo, { size: 24 }) })
								}), (0, react_jsx_runtime.jsx)("span", {
									className: SidebarRoot_module_css_default.brandName,
									children: renderSlot("sidebar.brand.name", {}, { fallback: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.BrandWordmark, { includeMark: false }) })
								})]
							})
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: collapsed ? t("toggle.open") : t("toggle.collapse"),
							delayMs: 500,
							children: (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: clsx(SidebarRoot_module_css_default.iconButton, SidebarRoot_module_css_default.toggle),
								"aria-label": collapsed ? t("toggle.open") : t("toggle.collapse"),
								onClick: () => {
									toggleSidebar();
								},
								children: [!wide && (0, react_jsx_runtime.jsx)("span", {
									className: SidebarRoot_module_css_default.railMark,
									"aria-hidden": "true",
									children: renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FishLogo, { size: 24 }) })
								}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutline16, {
									className: SidebarRoot_module_css_default.panelIcon,
									size: wide ? 16 : 18
								})]
							})
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: SidebarRoot_module_css_default.modeSwitch,
						role: "group",
						"aria-label": t("mode.switch"),
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: SidebarRoot_module_css_default.modeThumb,
								"aria-hidden": "true",
								"data-position": chatActive ? "right" : "left"
							}),
							(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: t("session.new.label"),
								delayMs: 500,
								disabled: wide,
								children: (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: clsx(SidebarRoot_module_css_default.modeSegment, !chatActive && SidebarRoot_module_css_default.modeSegmentActive),
									"aria-label": t("session.new.label"),
									"aria-pressed": !chatActive,
									onClick: () => {
										startSession();
									},
									children: [!wide && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutline16, { size: 18 }), wide && (0, react_jsx_runtime.jsx)("span", {
										className: SidebarRoot_module_css_default.modeLabel,
										children: t("mode.agent")
									})]
								})
							}),
							renderSlot("sidebar.primary.action", wide ? {
								wide: true,
								segment: true,
								active: chatActive
							} : { wide: false })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: SidebarRoot_module_css_default.regionArea,
						children: renderSlot("sidebar.workspaces", {
							wide,
							expandSidebar: () => {
								if (collapsed) toggleSidebar();
							}
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: SidebarRoot_module_css_default.footArea,
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: SidebarRoot_module_css_default.footerActions,
							children: renderSlot("sidebar.footer.action", { wide })
						}), (0, react_jsx_runtime.jsx)("div", {
							className: SidebarRoot_module_css_default.settingsArea,
							children: renderSlot("sidebar.settings", { wide })
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `sidebar` namespace dictionaries: shell controls (brand row, New Session, fold toggle). */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"session.new": "开始工作",
			"session.new.label": "开始工作",
			"mode.switch": "工作模式",
			"mode.agent": "Agentic Coding",
			"toggle.open": "打开侧边栏",
			"toggle.collapse": "收起侧边栏"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"session.new": "Start work",
			"session.new.label": "Start work",
			"mode.switch": "Work mode",
			"mode.agent": "Agentic Coding",
			"toggle.open": "Open sidebar",
			"toggle.collapse": "Collapse sidebar"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin (shell controls copy). */
		const NS = "sidebar";
		/** Services required by the sidebar plugin. */
		const inject = [
			"slots",
			"layout",
			"uiWorkspace",
			"locale"
		];
		/** Registers the sidebar shell and its service callbacks.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			const workspaceNavigation = ctx.get("uiWorkspace");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-sidebar: dictionaries");
			const injectProps = () => ({
				startSession: (workspaceId) => {
					workspaceNavigation.startSession(workspaceId);
				},
				toggleSidebar: () => {
					ctx.layout.toggleSidebar();
				}
			});
			ctx.effect(() => ctx.slots.register({
				name: "sidebar",
				locale: NS,
				children: {
					"sidebar.brand.mark": {
						kind: "single",
						scope: "root"
					},
					"sidebar.brand.name": {
						kind: "single",
						scope: "root"
					},
					"sidebar.primary.action": {
						kind: "list",
						scope: "root"
					},
					"sidebar.workspaces": {
						kind: "single",
						scope: "root"
					},
					"sidebar.settings": {
						kind: "single",
						scope: "root"
					},
					"sidebar.footer.action": {
						kind: "list",
						scope: "root"
					}
				},
				inject: injectProps
			}, SidebarRoot), "ui-sidebar: slot registration");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map