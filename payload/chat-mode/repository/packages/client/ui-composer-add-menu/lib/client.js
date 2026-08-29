window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-composer-add-menu",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh/packages/client/ui-composer-add-menu/src/client/ComposerAddMenu.module.css.mjs
		const css = ".xl1nXW_root{flex:none;align-items:center;gap:8px;display:flex;position:relative}.xl1nXW_trigger{background:var(--dsw-specific-selector);width:28px;height:28px;color:var(--dsw-alias-label-primary);cursor:pointer;border:0;border-radius:999px;place-items:center;padding:0;transition:background-color .14s;display:grid}.xl1nXW_trigger:hover:not(:disabled),.xl1nXW_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover-solid)}.xl1nXW_trigger:focus-visible{outline:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent);outline-offset:2px}.xl1nXW_trigger:disabled{opacity:.5;cursor:default}.xl1nXW_web{border:1px solid var(--dsw-alias-border-l2);height:28px;color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border-radius:999px;justify-content:center;align-items:center;gap:5px;padding:0 11px;font-size:12px;line-height:1;transition:border-color .14s,color .14s,background-color .14s;display:inline-flex}.xl1nXW_web[aria-pressed=true]{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 58%, transparent);color:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}.xl1nXW_web:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.xl1nXW_web:focus-visible{outline:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 34%, transparent);outline-offset:2px}.xl1nXW_web:disabled{opacity:.5;cursor:default}.xl1nXW_menu{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);z-index:40;border:1px solid color-mix(in srgb, var(--dsw-alias-label-tertiary) 15%, transparent);background:var(--dsw-alias-bg-layer-1);border-radius:14px;flex-direction:column;width:360px;max-height:min(430px,100vh - 140px);padding:6px;display:flex;position:absolute;bottom:calc(100% + 10px);left:0;overflow:hidden;box-shadow:0 12px 32px #0f172a1c,0 2px 8px #0f172a0d}.xl1nXW_section{color:var(--dsw-alias-label-caption);flex:none;padding:7px 9px 4px;font-size:10px;font-weight:500;line-height:16px}.xl1nXW_divided{border-top:1px solid var(--dsw-alias-border-l2);margin-top:4px;padding-top:9px}.xl1nXW_scroll{overscroll-behavior:contain;scrollbar-width:thin;min-height:0;overflow:hidden auto}.xl1nXW_item{width:100%;min-height:38px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:0;border-radius:9px;grid-template-columns:20px max-content minmax(0,1fr);align-items:center;gap:8px;padding:6px 9px;display:grid}.xl1nXW_item:hover:not(:disabled),.xl1nXW_item:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:0}.xl1nXW_item:focus-visible{box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent)}.xl1nXW_item:disabled{cursor:default;opacity:.45}.xl1nXW_icon{width:20px;height:20px;color:var(--dsw-alias-label-secondary);place-items:center;display:grid}.xl1nXW_icon svg{width:16px;height:16px}.xl1nXW_title{white-space:nowrap;font-size:13px;font-weight:500;line-height:19px}.xl1nXW_description{min-width:0;color:var(--dsw-alias-label-caption);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.xl1nXW_empty{color:var(--dsw-alias-label-caption);padding:8px 9px 10px 37px;font-size:11px;line-height:18px}.xl1nXW_file{display:none}@media (width<=520px){.xl1nXW_menu{width:min(360px,100vw - 32px)}.xl1nXW_item{grid-template-columns:20px minmax(0,1fr)}.xl1nXW_description{display:none}}@media (prefers-reduced-motion:reduce){.xl1nXW_trigger,.xl1nXW_web{transition:none}}";
		const tagId = "@deepseek-ai/dsh-composer-add-menu/ComposerAddMenu.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-composer-add-menu";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ComposerAddMenu_module_css_default = {
			"description": "xl1nXW_description",
			"divided": "xl1nXW_divided",
			"empty": "xl1nXW_empty",
			"file": "xl1nXW_file",
			"icon": "xl1nXW_icon",
			"item": "xl1nXW_item",
			"menu": "xl1nXW_menu",
			"root": "xl1nXW_root",
			"scroll": "xl1nXW_scroll",
			"section": "xl1nXW_section",
			"title": "xl1nXW_title",
			"trigger": "xl1nXW_trigger",
			"web": "xl1nXW_web"
		};
		//#endregion
		//#region src/client/ComposerAddMenu.tsx
		/** One-layer native add directory over the conversation owner's live catalogs. */
		function ComposerAddMenu(props) {
			const { mode, t, webSearchEnabled, disabled, commandMenuOpen, canAddImages, imageMediaTypes, commandItems, slashItems, canReferenceFiles, onToggleCommandMenu, onToggleReferenceMenu, onInsertSlashItem, onAddImages, onAddTextFiles, onSetWebSearchEnabled, focusInput } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const imageInputRef = (0, react.useRef)(null);
			const textInputRef = (0, react.useRef)(null);
			const menuId = (0, react.useId)();
			(0, react.useEffect)(() => {
				if (!open) return void 0;
				const outside = (event) => {
					if (!rootRef.current?.contains(event.target)) setOpen(false);
				};
				const keyboard = (event) => {
					if (event.key !== "Escape") return;
					setOpen(false);
					focusInput();
				};
				document.addEventListener("pointerdown", outside);
				document.addEventListener("keydown", keyboard);
				return () => {
					document.removeEventListener("pointerdown", outside);
					document.removeEventListener("keydown", keyboard);
				};
			}, [focusInput, open]);
			(0, react.useEffect)(() => {
				if (disabled) setOpen(false);
			}, [disabled]);
			const toggle = () => {
				if (commandMenuOpen) onToggleCommandMenu();
				setOpen((value) => !value);
			};
			const keepFocus = (event) => {
				event.preventDefault();
				focusInput();
			};
			const chooseReference = () => {
				setOpen(false);
				onToggleReferenceMenu();
				focusInput();
			};
			const chooseSlash = (name) => {
				setOpen(false);
				onInsertSlashItem(name);
			};
			const imageChanged = (event) => {
				const files = [...event.currentTarget.files ?? []];
				if (files.length > 0) onAddImages(files);
				event.currentTarget.value = "";
			};
			const textChanged = (event) => {
				const files = [...event.currentTarget.files ?? []];
				if (files.length > 0) onAddTextFiles(files);
				event.currentTarget.value = "";
			};
			const officialNames = new Set(commandItems.map((item) => item.name));
			const skillItems = slashItems.filter((name) => !officialNames.has(name));
			const accept = imageMediaTypes.length > 0 ? imageMediaTypes.join(",") : "image/*";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ComposerAddMenu_module_css_default.root,
				ref: rootRef,
				"data-composer-add-menu": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t("trigger.add"),
						side: "top",
						delayMs: 500,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ComposerAddMenu_module_css_default.trigger,
							"aria-label": t("trigger.add"),
							"aria-haspopup": "menu",
							"aria-expanded": open,
							"aria-controls": open ? menuId : void 0,
							disabled,
							onMouseDown: keepFocus,
							onClick: toggle,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 })
						})
					}),
					mode === "chat" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t(webSearchEnabled ? "web.disableHint" : "web.enableHint"),
						side: "top",
						delayMs: 500,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ComposerAddMenu_module_css_default.web,
							"aria-label": t(webSearchEnabled ? "web.enabled" : "web.disabled"),
							"aria-pressed": webSearchEnabled,
							disabled,
							onMouseDown: keepFocus,
							onClick: () => {
								onSetWebSearchEnabled(!webSearchEnabled);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("web.label") })]
						})
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: imageInputRef,
						className: ComposerAddMenu_module_css_default.file,
						type: "file",
						accept,
						multiple: true,
						tabIndex: -1,
						"aria-hidden": "true",
						onChange: imageChanged
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: textInputRef,
						className: ComposerAddMenu_module_css_default.file,
						type: "file",
						accept: "text/*,.md,.markdown,.csv,.json,.yaml,.yml,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.sql,.log",
						multiple: true,
						tabIndex: -1,
						"aria-hidden": "true",
						onChange: textChanged
					}),
					open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ComposerAddMenu_module_css_default.menu,
						id: menuId,
						role: "menu",
						"aria-label": t(mode === "chat" ? "menu.chat" : "menu.work"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ComposerAddMenu_module_css_default.section,
								role: "presentation",
								children: t("section.add")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ComposerAddMenu_module_css_default.item,
								role: "menuitem",
								disabled: !canAddImages,
								onClick: () => {
									imageInputRef.current?.click();
									setOpen(false);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.icon,
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPaperclipOutline16, {})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.title,
										children: t(mode === "chat" ? "image.chatTitle" : "image.workTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.description,
										children: t(canAddImages ? "image.select" : "image.unsupported")
									})
								]
							}),
							mode === "chat" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ComposerAddMenu_module_css_default.item,
								role: "menuitem",
								onClick: () => {
									textInputRef.current?.click();
									setOpen(false);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.icon,
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.title,
										children: t("file.title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ComposerAddMenu_module_css_default.description,
										children: t("file.description")
									})
								]
							}) : null,
							mode === "work" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ComposerAddMenu_module_css_default.item,
									role: "menuitem",
									disabled: !canReferenceFiles,
									onClick: chooseReference,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: ComposerAddMenu_module_css_default.icon,
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: ComposerAddMenu_module_css_default.title,
											children: t("reference.title")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: ComposerAddMenu_module_css_default.description,
											children: t(canReferenceFiles ? "reference.enabled" : "reference.disabled")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: `${ComposerAddMenu_module_css_default.section} ${ComposerAddMenu_module_css_default.divided}`,
									role: "presentation",
									children: t("section.catalog")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: ComposerAddMenu_module_css_default.scroll,
									children: [
										commandItems.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: ComposerAddMenu_module_css_default.item,
											role: "menuitem",
											onClick: () => {
												chooseSlash(item.name);
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.icon,
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCordisPluginOutline14, { size: 16 })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.title,
													children: item.name
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.description,
													children: item.description
												})
											]
										}, `command:${item.name}`)),
										skillItems.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: ComposerAddMenu_module_css_default.item,
											role: "menuitem",
											onClick: () => {
												chooseSlash(name);
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.icon,
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, {})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.title,
													children: name
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerAddMenu_module_css_default.description,
													children: t("skill.invoke", { name })
												})
											]
										}, `skill:${name}`)),
										commandItems.length === 0 && skillItems.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: ComposerAddMenu_module_css_default.empty,
											children: t("catalog.empty")
										}) : null
									]
								})
							] }) : null
						]
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `composerAddMenu` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"trigger.add": "添加",
			"menu.chat": "上传文件与图片",
			"menu.work": "命令、插件与技能",
			"section.add": "添加",
			"image.chatTitle": "上传图片",
			"image.workTitle": "图片文件",
			"image.select": "选择要发送的图片",
			"image.unsupported": "当前模型暂不支持图片",
			"file.title": "上传文件",
			"file.description": "文本、Markdown、表格与代码",
			"reference.title": "文件与文件夹",
			"reference.enabled": "从当前工作区引用",
			"reference.disabled": "当前会话不可用",
			"section.catalog": "命令、插件与技能",
			"skill.invoke": "调用 /{name}",
			"catalog.empty": "暂无可用项目",
			"web.enabled": "联网搜索已开启",
			"web.disabled": "联网搜索已关闭",
			"web.label": "联网搜索",
			"web.enableHint": "开启联网搜索",
			"web.disableHint": "关闭联网搜索"
		};
		/** English dictionary, checked complete against the Chinese key set. */
		const en = {
			"trigger.add": "Add",
			"menu.chat": "Upload files and images",
			"menu.work": "Commands, plugins, and skills",
			"section.add": "Add",
			"image.chatTitle": "Upload image",
			"image.workTitle": "Image file",
			"image.select": "Choose images to send",
			"image.unsupported": "The current model does not support images",
			"file.title": "Upload file",
			"file.description": "Text, Markdown, tables, and code",
			"reference.title": "Files and folders",
			"reference.enabled": "Reference the current Workspace",
			"reference.disabled": "Unavailable in this Session",
			"section.catalog": "Commands, plugins, and skills",
			"skill.invoke": "Invoke /{name}",
			"catalog.empty": "No items available",
			"web.enabled": "Web search enabled",
			"web.disabled": "Web search disabled",
			"web.label": "Web search",
			"web.enableHint": "Enable web search",
			"web.disableHint": "Disable web search"
		};
		//#endregion
		//#region src/client/index.ts
		const NS = "composerAddMenu";
		const inject = ["slots", "locale"];
		/** Occupy the native composer add seat with the unified one-layer directory. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "composer-add-menu: dictionaries");
			ctx.slots.inject("conversation.input.add", () => ctx.slots.register({
				name: "conversation.input.add",
				priority: -10,
				locale: NS
			}, ComposerAddMenu));
		}
		//#endregion
		exports.ComposerAddMenu = ComposerAddMenu;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map