window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-session-log-export",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/image-export.ts
		const LOGICAL_WIDTH = 1080;
		const PAGE_PADDING = 64;
		const CARD_PADDING_X = 28;
		const CARD_PADDING_Y = 22;
		const CARD_WIDTH = 860;
		const TEXT_FONT = "20px -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
		const META_FONT = "16px -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
		const TITLE_FONT = "600 30px -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
		const LINE_HEIGHT = 32;
		const MAX_CANVAS_DIMENSION = 32e3;
		const MAX_CANVAS_AREA = 48e6;
		function contentText(content) {
			const parts = [];
			for (const candidate of content) {
				if (typeof candidate !== "object" || candidate === null || !("type" in candidate)) continue;
				const block = candidate;
				if (block.type === "text" && typeof block.text === "string") parts.push(block.text);
				else if (block.type === "image") parts.push("【图片】");
			}
			return parts.join("\n").trim();
		}
		function assistantText(blocks) {
			const parts = [];
			for (const candidate of blocks) {
				if (typeof candidate !== "object" || candidate === null || !("kind" in candidate)) continue;
				const block = candidate;
				if (block.kind === "text" && typeof block.text === "string") parts.push(block.text);
				else if (block.kind === "image") parts.push("【图片】");
			}
			return parts.join("\n").trim();
		}
		/** Keep questions and answer text, excluding reasoning, tools, system rows, and telemetry. */
		function extractConversationMessages(snapshot) {
			const messages = [];
			for (const node of snapshot.legacy.nodes) if (node.kind === "user" || node.kind === "steering") {
				const text = contentText(node.content);
				if (text !== "") messages.push({
					role: "user",
					text
				});
			} else if (node.kind === "assistant") {
				const text = assistantText(node.blocks);
				if (text !== "") messages.push({
					role: "assistant",
					text
				});
			}
			const partial = snapshot.legacy.partial === null ? "" : assistantText(snapshot.legacy.partial.blocks);
			if (partial !== "") messages.push({
				role: "assistant",
				text: partial
			});
			return messages;
		}
		function abortIfNeeded(signal) {
			if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new DOMException("Aborted", "AbortError");
		}
		/** Load every older Session page, then return the current Chat target snapshot. */
		async function loadCompleteChatSnapshot(session, source, signal) {
			let lifecycle = session.getSnapshot();
			let stagnantPages = 0;
			while (lifecycle.hasMore) {
				abortIfNeeded(signal);
				const previousCount = source.getSnapshot()?.legacy.nodes.length ?? 0;
				await session.loadOlder();
				lifecycle = session.getSnapshot();
				const nextCount = source.getSnapshot()?.legacy.nodes.length ?? 0;
				stagnantPages = lifecycle.hasMore && nextCount <= previousCount ? stagnantPages + 1 : 0;
				if (stagnantPages >= 2) throw new Error("无法读取完整对话记录，请稍后重试。");
			}
			abortIfNeeded(signal);
			const snapshot = source.getSnapshot();
			if (snapshot === void 0) throw new Error("当前页面无法读取这段对话，请刷新后重试。");
			return snapshot;
		}
		function cleanMarkdown(raw) {
			return raw.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_match, alt) => `【图片${alt === "" ? "" : `：${alt}`}】`).replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, "$1").replace(/^```[^\n]*\n?/gm, "").replace(/```$/gm, "").replace(/^#{1,6}\s+/gm, "").replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\r\n?/g, "\n").trim();
		}
		function wrapText(ctx, raw, maxWidth) {
			const lines = [];
			for (const paragraph of cleanMarkdown(raw).split("\n")) {
				if (paragraph === "") {
					lines.push("");
					continue;
				}
				let line = "";
				for (const char of paragraph) {
					const candidate = line + char;
					if (line !== "" && ctx.measureText(candidate).width > maxWidth) {
						lines.push(line);
						line = char;
					} else line = candidate;
				}
				lines.push(line);
			}
			return lines.length === 0 ? [""] : lines;
		}
		function roundedRect(ctx, x, y, width, height, radius) {
			const r = Math.min(radius, width / 2, height / 2);
			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.arcTo(x + width, y, x + width, y + height, r);
			ctx.arcTo(x + width, y + height, x, y + height, r);
			ctx.arcTo(x, y + height, x, y, r);
			ctx.arcTo(x, y, x + width, y, r);
			ctx.closePath();
		}
		function canvasBlob(canvas) {
			return new Promise((resolve, reject) => {
				canvas.toBlob((blob) => {
					if (blob === null) reject(/* @__PURE__ */ new Error("浏览器无法生成对话图片。"));
					else resolve(blob);
				}, "image/png");
			});
		}
		/** Render a dedicated export sheet so hidden reasoning can never leak through a DOM screenshot. */
		async function renderConversationPng(messages, title, generatedAt = /* @__PURE__ */ new Date()) {
			const measure = document.createElement("canvas").getContext("2d");
			if (measure === null) throw new Error("当前浏览器不支持生成对话图片。");
			measure.font = TEXT_FONT;
			let cursorY = 168;
			const layouts = [];
			for (const message of messages) {
				const lines = wrapText(measure, message.text, CARD_WIDTH - CARD_PADDING_X * 2);
				const height = 80 + lines.length * LINE_HEIGHT;
				const x = message.role === "user" ? LOGICAL_WIDTH - PAGE_PADDING - CARD_WIDTH : PAGE_PADDING;
				layouts.push({
					message,
					lines,
					x,
					y: cursorY,
					height
				});
				cursorY += height + 24;
			}
			const logicalHeight = Math.max(360, cursorY + 40);
			const preferredScale = Math.min(2, globalThis.devicePixelRatio || 1.5);
			const scale = Math.min(preferredScale, MAX_CANVAS_DIMENSION / logicalHeight, Math.sqrt(MAX_CANVAS_AREA / (LOGICAL_WIDTH * logicalHeight)));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.floor(LOGICAL_WIDTH * scale));
			canvas.height = Math.max(1, Math.floor(logicalHeight * scale));
			const ctx = canvas.getContext("2d");
			if (ctx === null) throw new Error("当前浏览器不支持生成对话图片。");
			ctx.scale(scale, scale);
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, LOGICAL_WIDTH, logicalHeight);
			ctx.fillStyle = "#111318";
			ctx.font = TITLE_FONT;
			ctx.fillText(title.trim() === "" ? "对话记录" : title.trim(), PAGE_PADDING, 66, LOGICAL_WIDTH - PAGE_PADDING * 2);
			ctx.fillStyle = "#7b818c";
			ctx.font = META_FONT;
			ctx.fillText(`导出于 ${generatedAt.toLocaleString()}`, PAGE_PADDING, 102);
			ctx.strokeStyle = "#eceef2";
			ctx.beginPath();
			ctx.moveTo(PAGE_PADDING, 128);
			ctx.lineTo(LOGICAL_WIDTH - PAGE_PADDING, 128);
			ctx.stroke();
			if (layouts.length === 0) {
				ctx.fillStyle = "#7b818c";
				ctx.font = TEXT_FONT;
				ctx.fillText("当前对话还没有可导出的问答内容。", PAGE_PADDING, 210);
			}
			for (const layout of layouts) {
				ctx.fillStyle = layout.message.role === "user" ? "#eef5ff" : "#f7f8fa";
				roundedRect(ctx, layout.x, layout.y, CARD_WIDTH, layout.height, 20);
				ctx.fill();
				ctx.fillStyle = layout.message.role === "user" ? "#316ee8" : "#626975";
				ctx.font = META_FONT;
				ctx.fillText(layout.message.role === "user" ? "你" : "助手", layout.x + CARD_PADDING_X, layout.y + CARD_PADDING_Y + 18);
				ctx.fillStyle = "#15171b";
				ctx.font = TEXT_FONT;
				let textY = layout.y + CARD_PADDING_Y + 60;
				for (const line of layout.lines) {
					ctx.fillText(line, layout.x + CARD_PADDING_X, textY);
					textY += LINE_HEIGHT;
				}
			}
			return await canvasBlob(canvas);
		}
		/** Load the complete Chat target and render only its visible human/assistant exchange. */
		async function exportConversationImage(session, source, title, signal) {
			return await renderConversationPng(extractConversationMessages(await loadCompleteChatSnapshot(session, source, signal)), title);
		}
		/** Stable, filesystem-safe PNG name for one exported conversation. */
		function conversationImageFilename(sessionId, title) {
			return `${(title?.trim() || String(sessionId)).replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_").replace(/\s+/g, " ").slice(0, 80) || "conversation"}-conversation.png`;
		}
		//#endregion
		//#region src/client/controller.ts
		/** Browser download state shared by the Session Header button and `/export`. */
		const INITIAL = { bySession: {} };
		/**
		* Collapse an untrusted Session id into the filename convention owned by the host endpoint.
		* @param sessionId - Session whose archive is downloaded.
		* @returns one safe browser download filename.
		*/
		function sessionLogZipFilename(sessionId) {
			return `dsh-session-${String(sessionId).replace(/[^A-Za-z0-9_-]/g, "_")}.zip`;
		}
		/**
		* Hand a Host download URL to the browser download manager.
		* @param url - same-origin Host download URL.
		* @param filename - browser download filename.
		*/
		function downloadUrl(url, filename) {
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = filename;
			anchor.click();
		}
		/** Hand an in-memory export to the browser download manager. */
		function downloadBlob(blob, filename) {
			const url = URL.createObjectURL(blob);
			downloadUrl(url, filename);
			globalThis.setTimeout(() => {
				URL.revokeObjectURL(url);
			}, 0);
		}
		/** Resolve the browser's Host base with the connection carrier's null-origin fallback. */
		function hostBase() {
			const origin = globalThis.location?.origin;
			return origin !== void 0 && origin !== "null" ? origin : "http://dsh.internal";
		}
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** Owns one in-flight browser download per Session and publishes modal state. */
		var SessionLogDownloadController = class {
			fetcher;
			save;
			renderImage;
			saveBlob;
			/** uSES-safe state source shared by every Session-scoped modal contribution. */
			store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(INITIAL);
			active = /* @__PURE__ */ new Map();
			disposed = false;
			/**
			* @param fetcher - HTTP carrier used to read the host-streamed ZIP.
			* @param save - browser save operation.
			*/
			constructor(fetcher = (input, init) => fetch(input, init), save = downloadUrl, renderImage, saveBlob = downloadBlob) {
				this.fetcher = fetcher;
				this.save = save;
				this.renderImage = renderImage;
				this.saveBlob = saveBlob;
			}
			/**
			* Download one Session tree; concurrent gestures for the same Session share one operation.
			* @param sessionId - root Session whose ZIP includes descendants and attachments.
			* @returns after the browser save starts, an error state is published, or a late post-disposal request is ignored.
			*/
			download(sessionId, kind = "archive") {
				const existing = this.active.get(sessionId);
				if (existing !== void 0) return existing.done;
				if (this.disposed) return Promise.resolve();
				const abort = new AbortController();
				const done = this.run(sessionId, kind, abort.signal).finally(() => {
					this.active.delete(sessionId);
				});
				this.active.set(sessionId, {
					abort,
					done
				});
				return done;
			}
			/**
			* Close one Session's dialog without cancelling an in-flight browser download.
			* @param sessionId - Session whose modal closes.
			*/
			dismiss(sessionId) {
				const current = this.store.getSnapshot().bySession[String(sessionId)];
				if (current === void 0 || !current.open) return;
				this.publish(sessionId, {
					...current,
					open: false
				});
			}
			/**
			* Abort active fetches and reach quiescence.
			* @returns after every active operation settles.
			*/
			async dispose() {
				this.disposed = true;
				const active = [...this.active.values()];
				for (const operation of active) operation.abort.abort();
				await Promise.allSettled(active.map((operation) => operation.done));
			}
			async run(sessionId, kind, signal) {
				this.publish(sessionId, {
					kind,
					open: true,
					status: "downloading",
					error: null
				});
				try {
					if (kind === "image") {
						if (this.renderImage === void 0) throw new Error("当前页面无法读取这段对话，请刷新后重试。");
						const rendered = await this.renderImage(sessionId, signal);
						this.saveBlob(rendered.blob, conversationImageFilename(sessionId, rendered.title));
					} else {
						const url = new URL("/api/session.export", hostBase());
						url.searchParams.set("sessionId", sessionId);
						url.searchParams.set("includeDescendants", "true");
						const response = await this.fetcher(url, {
							method: "HEAD",
							signal
						});
						if (!response.ok) {
							const detail = await response.text().catch(() => "");
							throw new Error(`Export failed: HTTP ${response.status}${detail === "" ? "" : ` ${detail}`}`);
						}
						this.save(url.toString(), sessionLogZipFilename(sessionId));
					}
					const open = this.store.getSnapshot().bySession[String(sessionId)]?.open ?? true;
					this.publish(sessionId, {
						kind,
						open,
						status: "success",
						error: null
					});
				} catch (error) {
					if (signal.aborted) return;
					const open = this.store.getSnapshot().bySession[String(sessionId)]?.open ?? true;
					this.publish(sessionId, {
						kind,
						open,
						status: "error",
						error: messageOf(error)
					});
				}
			}
			publish(sessionId, entry) {
				this.store.update((state) => {
					state.bySession = {
						...state.bySession,
						[String(sessionId)]: entry
					};
				});
			}
		};
		//#endregion
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh/packages/session-query/session-log-export/src/client/DeepSeekImportSection.module.css.mjs
		const css$1 = ".m1yPEq_root{height:100%;min-height:0;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}.m1yPEq_header{flex:none;padding:22px 28px 16px}.m1yPEq_header h2{margin:0;font-size:20px;font-weight:650}.m1yPEq_header p{color:var(--dsw-alias-label-secondary);margin:6px 0 0;font-size:13px;line-height:20px}.m1yPEq_body{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;flex:1;gap:16px;min-height:0;padding:10px 28px 28px;display:flex;overflow:auto}.m1yPEq_sourceCard{background:var(--dsw-alias-bg-layer-2);border-radius:14px;grid-template-columns:44px minmax(0,1fr) max-content;align-items:center;gap:14px;padding:18px;display:grid}.m1yPEq_sourceIcon{background:var(--dsw-alias-bg-layer-1);width:44px;height:44px;color:var(--dsw-alias-brand-primary);border-radius:12px;justify-content:center;align-items:center;display:flex}.m1yPEq_sourceCopy{flex-direction:column;gap:4px;min-width:0;display:flex}.m1yPEq_sourceCopy strong{font-size:14px;font-weight:620}.m1yPEq_sourceCopy span,.m1yPEq_note{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.m1yPEq_importButton{background:var(--dsw-alias-label-primary);min-width:108px;height:34px;color:var(--dsw-alias-bg-layer-1);cursor:pointer;font:inherit;border:0;border-radius:9px;padding:0 14px;font-size:12px;font-weight:600}.m1yPEq_importButton:hover:not(:disabled){opacity:.86}.m1yPEq_importButton:disabled{cursor:default;opacity:.52}.m1yPEq_importButton:focus-visible{outline:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);outline-offset:2px}.m1yPEq_fileInput{opacity:0;pointer-events:none;width:1px;height:1px;position:fixed}.m1yPEq_steps{gap:2px;margin:0;padding:0;list-style:none;display:grid}.m1yPEq_steps li{grid-template-columns:28px minmax(0,1fr);gap:10px;padding:10px 4px;display:grid}.m1yPEq_steps li>span{background:var(--dsw-alias-bg-layer-2);width:24px;height:24px;color:var(--dsw-alias-label-secondary);border-radius:50%;justify-content:center;align-items:center;font-size:11px;display:flex}.m1yPEq_steps strong{font-size:13px;font-weight:600}.m1yPEq_steps p{color:var(--dsw-alias-label-secondary);margin:3px 0 0;font-size:12px;line-height:18px}.m1yPEq_fileMeta,.m1yPEq_status,.m1yPEq_error{white-space:pre-wrap;border-radius:9px;align-items:center;gap:8px;padding:10px 12px;font-size:12px;line-height:18px;display:flex}.m1yPEq_fileMeta{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);justify-content:space-between}.m1yPEq_status{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}.m1yPEq_error{color:#c53b3b;background:#ef444414}.m1yPEq_spinner{border:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;flex:none;width:13px;height:13px;animation:.7s linear infinite m1yPEq_spin}.m1yPEq_note{margin:2px 0 0}@keyframes m1yPEq_spin{to{transform:rotate(360deg)}}@media (width<=720px){.m1yPEq_sourceCard{grid-template-columns:44px minmax(0,1fr)}.m1yPEq_importButton{grid-column:1/-1;width:100%}}";
		const tagId$1 = "@deepseek-ai/dsh-session-log-export/DeepSeekImportSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-session-log-export";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DeepSeekImportSection_module_css_default = {
			"body": "m1yPEq_body",
			"error": "m1yPEq_error",
			"fileInput": "m1yPEq_fileInput",
			"fileMeta": "m1yPEq_fileMeta",
			"header": "m1yPEq_header",
			"importButton": "m1yPEq_importButton",
			"note": "m1yPEq_note",
			"root": "m1yPEq_root",
			"sourceCard": "m1yPEq_sourceCard",
			"sourceCopy": "m1yPEq_sourceCopy",
			"sourceIcon": "m1yPEq_sourceIcon",
			"spin": "m1yPEq_spin",
			"spinner": "m1yPEq_spinner",
			"status": "m1yPEq_status",
			"steps": "m1yPEq_steps"
		};
		//#endregion
		//#region src/client/DeepSeekImportSection.tsx
		function sizeLabel(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
			return `${(bytes / 1048576).toFixed(1)} MB`;
		}
		function resultLabel(result) {
			const pieces = [`已导入 ${result.imported} 个对话`];
			if (result.skipped > 0) pieces.push(`跳过 ${result.skipped} 个已存在对话`);
			if (result.failed > 0) pieces.push(`${result.failed} 个导入失败`);
			return `${pieces.join("，")}。`;
		}
		/** Native Settings page for one-file DeepSeek history migration. */
		function DeepSeekImportSection({ importFile, refreshSessions }) {
			const input = (0, react.useRef)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [selected, setSelected] = (0, react.useState)();
			const choose = (0, react.useCallback)(() => {
				input.current?.click();
			}, []);
			const selectedFile = (0, react.useCallback)(async (file) => {
				if (file === void 0 || busy) return;
				setBusy(true);
				setError("");
				setSelected({
					name: file.name,
					size: file.size
				});
				setStatus("正在解析并写入历史对话，请保持页面打开…");
				try {
					const result = await importFile(file);
					await refreshSessions();
					setStatus(resultLabel(result));
					if (result.errors.length > 0) setError(result.errors.join("\n"));
				} catch (caught) {
					setStatus("");
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setBusy(false);
				}
			}, [
				busy,
				importFile,
				refreshSessions
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: DeepSeekImportSection_module_css_default.root,
				"aria-label": "导入对话",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("header", {
					className: DeepSeekImportSection_module_css_default.header,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: "导入对话" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "把 DeepSeek 官方平台导出的历史记录，原生迁移到 DeepSeek Harness。" })] })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: DeepSeekImportSection_module_css_default.body,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: DeepSeekImportSection_module_css_default.sourceCard,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: DeepSeekImportSection_module_css_default.sourceIcon,
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChatOutline16, { size: 20 })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: DeepSeekImportSection_module_css_default.sourceCopy,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "DeepSeek 历史对话" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "支持官方导出的 JSON，或包含该 JSON 的 ZIP 文件。" })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: DeepSeekImportSection_module_css_default.importButton,
									disabled: busy,
									onClick: choose,
									children: busy ? "正在导入…" : "选择导出文件"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: input,
									className: DeepSeekImportSection_module_css_default.fileInput,
									type: "file",
									accept: ".json,.zip,application/json,application/zip",
									"aria-label": "选择 DeepSeek 导出文件",
									onChange: (event) => {
										const file = event.currentTarget.files?.[0];
										event.currentTarget.value = "";
										selectedFile(file);
									}
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ol", {
							className: DeepSeekImportSection_module_css_default.steps,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "1" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "在 DeepSeek 导出" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "我的 → 系统设置 → 数据管理 → 导出所有历史对话。" })] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "在这里选择文件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "导入会保留原始问题、回答、时间和导出中已有的思维过程。" })] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "3" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "继续正常使用" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "导入结果会进入“聊天”目录，并按原对话时间排列。" })] })] })
							]
						}),
						selected !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: DeepSeekImportSection_module_css_default.fileMeta,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: selected.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: sizeLabel(selected.size) })]
						}),
						status !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: DeepSeekImportSection_module_css_default.status,
							role: "status",
							children: [busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: DeepSeekImportSection_module_css_default.spinner }), status]
						}),
						error !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: DeepSeekImportSection_module_css_default.error,
							role: "alert",
							children: error
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: DeepSeekImportSection_module_css_default.note,
							children: "重复导入同一份记录会自动跳过已有对话，不会生成副本。当前仅兼容 DeepSeek 官方平台。"
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/Dialog.tsx
		/**
		* Modal shared by the Session Header button and this browser's `/export` command.
		* @param props - Session runtime, bound controller state, actions, and localized copy.
		* @returns the modal portal contribution.
		*/
		function SessionLogDownloadDialog({ sessionId, useSessionLogDownload, dismiss, t }) {
			const entry = useSessionLogDownload((state) => state.bySession[String(sessionId)]);
			const status = entry?.status;
			const image = entry?.kind === "image";
			const open = entry?.open === true;
			const error = status === "error" ? entry?.error || t("dialog.commandFailed") : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: () => {
					dismiss(sessionId);
				},
				title: status === "downloading" ? t(image ? "dialog.imagePreparingTitle" : "dialog.preparingTitle") : status === "success" ? t(image ? "dialog.imageSuccessTitle" : "dialog.successTitle") : t(image ? "dialog.imageErrorTitle" : "dialog.errorTitle"),
				description: status === "downloading" ? t(image ? "dialog.imagePreparingDescription" : "dialog.preparingDescription") : status === "success" ? t(image ? "dialog.imageSuccessDescription" : "dialog.successDescription") : error ?? t("dialog.commandFailed"),
				closeLabel: t("dialog.close"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					onClick: () => {
						dismiss(sessionId);
					},
					children: t("dialog.close")
				})
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh/packages/session-query/session-log-export/src/client/HeaderAction.module.css.mjs
		const css = ".Oqh6Va_sessionLogButton{border:1px solid var(--dsw-alias-border-l2);min-width:111px;height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:6px 12px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex}.Oqh6Va_sessionLogButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.Oqh6Va_sessionLogButton:disabled{color:var(--dsw-alias-label-dimmed);cursor:wait}.Oqh6Va_sessionLogButton span,.Oqh6Va_sessionLogButton svg{flex:none}.Oqh6Va_sessionLogButton span{white-space:nowrap}";
		const tagId = "@deepseek-ai/dsh-session-log-export/HeaderAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-session-log-export";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var HeaderAction_module_css_default = { "sessionLogButton": "Oqh6Va_sessionLogButton" };
		//#endregion
		//#region src/client/HeaderAction.tsx
		/**
		* Render the Session Header export capsule and its shared result dialog.
		* @param props - Session runtime, download controller, and localized dialog copy.
		* @returns the persistent Header action and Session-scoped dialog.
		*/
		function SessionLogDownloadHeaderAction(props) {
			const { sessionId, useSessionLogDownload, request, t } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const busy = useSessionLogDownload((state) => state.bySession[String(sessionId)])?.status === "downloading";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				portal: true,
				align: "end",
				compact: true,
				items: [{
					id: "archive",
					label: t("action.archive")
				}, {
					id: "image",
					label: t("action.image")
				}],
				onClose: () => {
					setOpen(false);
				},
				onSelect: (id) => {
					setOpen(false);
					request(sessionId, id);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: HeaderAction_module_css_default.sessionLogButton,
					disabled: busy,
					"aria-busy": busy,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => {
						setOpen((value) => !value);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("action.label") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutline16, { size: 12 })]
				})
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionLogDownloadDialog, { ...props })] });
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale namespace owned by Session export browser feedback. */
		const NS = "session-log-download";
		/** Simplified-Chinese Session export strings. */
		const zh = {
			"action.label": "导出对话",
			"action.archive": "导出文本记录",
			"action.image": "导出对话图片",
			"dialog.preparingTitle": "正在导出 Session",
			"dialog.preparingDescription": "正在准备包含当前 Session、子 Session 和附件的 ZIP 文件。",
			"dialog.successTitle": "Session 导出已开始下载",
			"dialog.successDescription": "浏览器正在下载 Session ZIP 文件。",
			"dialog.errorTitle": "Session 导出失败",
			"dialog.close": "关闭",
			"dialog.commandFailed": "无法启动 Session 导出。",
			"dialog.imagePreparingTitle": "正在生成对话图片",
			"dialog.imagePreparingDescription": "正在读取完整对话，并整理为一张不含思考过程的长图。",
			"dialog.imageSuccessTitle": "对话图片已开始下载",
			"dialog.imageSuccessDescription": "浏览器正在下载完整对话长图。",
			"dialog.imageErrorTitle": "对话图片生成失败"
		};
		/** English Session export strings. */
		const en = {
			"action.label": "Export",
			"action.archive": "Export text record",
			"action.image": "Export conversation image",
			"dialog.preparingTitle": "Exporting Session",
			"dialog.preparingDescription": "Preparing a ZIP containing this Session, its sub-Sessions, and attachments.",
			"dialog.successTitle": "Session download started",
			"dialog.successDescription": "The browser is downloading the Session ZIP.",
			"dialog.errorTitle": "Session export failed",
			"dialog.close": "Close",
			"dialog.commandFailed": "Could not start the Session export.",
			"dialog.imagePreparingTitle": "Creating conversation image",
			"dialog.imagePreparingDescription": "Loading the complete conversation and creating one long image without reasoning details.",
			"dialog.imageSuccessTitle": "Conversation image download started",
			"dialog.imageSuccessDescription": "The browser is downloading the complete conversation image.",
			"dialog.imageErrorTitle": "Could not create conversation image"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"sessions",
			"uiConversation"
		];
		async function importDeepSeekFile(file) {
			const response = await fetch("/api/session.import.deepseek", {
				method: "POST",
				body: file,
				headers: {
					"content-type": file.type || (file.name.toLowerCase().endsWith(".zip") ? "application/zip" : "application/json"),
					"x-dsh-import-filename": encodeURIComponent(file.name)
				}
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body.error ?? `导入失败（HTTP ${response.status}）`);
			if (typeof body.imported !== "number" || typeof body.skipped !== "number" || typeof body.failed !== "number") throw new Error("导入服务返回了无法识别的结果");
			return {
				imported: body.imported,
				skipped: body.skipped,
				failed: body.failed,
				sessionIds: Array.isArray(body.sessionIds) ? body.sessionIds.filter((id) => typeof id === "string") : [],
				errors: Array.isArray(body.errors) ? body.errors.filter((error) => typeof error === "string") : []
			};
		}
		/**
		* Provide the download controller and mount its modal into the Session Header.
		* @param ctx - browser context carrying slots and locale services.
		*/
		function apply(ctx) {
			const sessions = ctx.get("sessions");
			const controller = new SessionLogDownloadController(void 0, void 0, async (sessionId, signal) => {
				const binding = sessions.binding(sessionId);
				if (binding === void 0) throw new Error("当前对话尚未加载，请刷新后重试。");
				const title = sessions.list.getSnapshot().byId[sessionId]?.displayTitle;
				const source = ctx.uiConversation.binding(binding).target("chat");
				const blob = await exportConversationImage(binding.session, source, title ?? "对话记录", signal);
				return title === void 0 ? { blob } : {
					blob,
					title
				};
			});
			ctx.provide("sessionLogDownload", controller);
			ctx.effect(() => async () => {
				await controller.dispose();
			}, "session-log-download: browser download lifecycle");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "session-log-download: browser dictionaries");
			ctx.on("command/executed", (sessionId, commandName, result) => {
				if (commandName === "export" && result.kind === "success") controller.download(sessionId);
			});
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "session-log-download",
				locale: NS,
				inject: () => ({
					hooks: { sessionLogDownload: controller.store },
					request: (sessionId, kind) => controller.download(sessionId, kind),
					dismiss: (sessionId) => {
						controller.dismiss(sessionId);
					}
				})
			}, SessionLogDownloadHeaderAction));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "conversation-import",
				order: 5,
				label: () => "导入对话",
				inject: () => ({
					importFile: importDeepSeekFile,
					refreshSessions: () => sessions.refresh()
				})
			}, DeepSeekImportSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map