window.__ModuleLoader__.load({
	id: "@xiaozhuang-dsh/conversation-import",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react = require("react");
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
		//#region \0dsh-css:/private/tmp/dsh-publish-20260905.X1Ok1K/source/plugins/conversation-import/src/client/DeepSeekImportSection.module.css.mjs
		const css$1 = ".z255TG_root{height:100%;min-height:0;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}.z255TG_header{flex:none;padding:0 0 16px}.z255TG_body{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;flex:1;gap:14px;min-height:0;padding:14px 28px 28px;display:flex;overflow:auto}.z255TG_sourceCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:14px;grid-template-columns:44px minmax(0,1fr) max-content;align-items:center;gap:14px;padding:16px 18px;display:grid}.z255TG_sourceIcon{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-2));width:44px;height:44px;color:var(--dsw-alias-brand-primary);border-radius:12px;justify-content:center;align-items:center;display:flex}.z255TG_sourceCopy{flex-direction:column;gap:4px;min-width:0;display:flex}.z255TG_sourceCopy strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:620;overflow:hidden}.z255TG_sourceCopy span,.z255TG_note{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.z255TG_importButton,.z255TG_confirmButton{background:var(--dsw-alias-label-primary);min-width:108px;height:36px;color:var(--dsw-alias-bg-layer-1);cursor:pointer;font:inherit;border:0;border-radius:10px;padding:0 15px;font-size:12px;font-weight:620;transition:opacity .12s,transform .12s}.z255TG_importButton:hover:not(:disabled),.z255TG_confirmButton:hover:not(:disabled){opacity:.86;transform:translateY(-1px)}.z255TG_importButton:disabled,.z255TG_confirmButton:disabled{cursor:default;opacity:.46}.z255TG_importButton:focus-visible,.z255TG_confirmButton:focus-visible,.z255TG_textButton:focus-visible{outline:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);outline-offset:2px}.z255TG_fileInput{opacity:0;pointer-events:none;width:1px;height:1px;position:fixed}.z255TG_steps{gap:2px;margin:0;padding:2px 0;list-style:none;display:grid}.z255TG_steps li{grid-template-columns:28px minmax(0,1fr);gap:10px;padding:10px 4px;display:grid}.z255TG_steps li>span{background:var(--dsw-alias-bg-layer-2);width:24px;height:24px;color:var(--dsw-alias-label-secondary);border-radius:50%;justify-content:center;align-items:center;font-size:11px;display:flex}.z255TG_steps strong{font-size:13px;font-weight:600}.z255TG_steps p{color:var(--dsw-alias-label-secondary);margin:3px 0 0;font-size:12px;line-height:18px}.z255TG_picker{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:16px;flex-direction:column;flex:1;min-height:430px;display:flex;overflow:hidden;box-shadow:0 10px 34px #0000000a}.z255TG_pickerHeading{justify-content:space-between;align-items:flex-start;gap:20px;padding:20px 22px 16px;display:flex}.z255TG_pickerHeading h3{margin:0;font-size:16px;font-weight:650}.z255TG_pickerHeading p{color:var(--dsw-alias-label-secondary);margin:5px 0 0;font-size:12px;line-height:18px}.z255TG_summary{flex-wrap:wrap;justify-content:flex-end;gap:6px;display:flex}.z255TG_summary span{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;padding:5px 9px;font-size:11px}.z255TG_summary .z255TG_summaryAvailable{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);color:var(--dsw-alias-brand-primary)}.z255TG_toolbar{border-block:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 58%, transparent);align-items:center;gap:10px;padding:10px 14px;display:flex}.z255TG_searchBox{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:180px;max-width:340px;height:34px;color:var(--dsw-alias-label-secondary);border-radius:10px;flex:1;align-items:center;gap:8px;padding:0 11px;display:flex}.z255TG_searchBox:focus-within{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-border-l2));box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent)}.z255TG_searchBox input{min-width:0;color:var(--dsw-alias-label-primary);font:inherit;background:0 0;border:0;outline:0;flex:1;font-size:12px}.z255TG_searchBox input::placeholder{color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}.z255TG_matchCount{color:var(--dsw-alias-label-secondary);white-space:nowrap;font-size:11px}.z255TG_textButton{color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;white-space:nowrap;background:0 0;border:0;border-radius:7px;padding:5px 7px;font-size:11px}.z255TG_textButton:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.z255TG_textButton:disabled{cursor:default;opacity:.4}.z255TG_conversationList{overscroll-behavior:contain;scrollbar-gutter:stable;flex:1;min-height:220px;padding:6px 10px;overflow:auto}.z255TG_conversationRow,.z255TG_conversationImported{content-visibility:auto;contain-intrinsic-size:auto 58px;cursor:pointer;border-radius:10px;grid-template-columns:20px minmax(0,1fr) max-content;align-items:center;gap:12px;min-height:58px;padding:8px 10px;display:grid}.z255TG_conversationRow:hover{background:var(--dsw-alias-bg-layer-2)}.z255TG_conversationImported{color:var(--dsw-alias-label-secondary);cursor:default}.z255TG_conversationRow input,.z255TG_conversationImported input{opacity:0;width:1px;height:1px;position:absolute}.z255TG_checkmark{border:1.5px solid var(--dsw-alias-border-l1,var(--dsw-alias-border-l2));background:var(--dsw-alias-bg-layer-1);border-radius:6px;justify-content:center;align-items:center;width:18px;height:18px;display:flex}.z255TG_conversationRow input:checked+.z255TG_checkmark{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary)}.z255TG_conversationRow input:checked+.z255TG_checkmark:after{content:\"\";border:0 solid #fff;border-width:0 0 2px 2px;width:7px;height:4px;transform:translateY(-1px)rotate(-45deg)}.z255TG_conversationRow input:focus-visible+.z255TG_checkmark{outline:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent);outline-offset:2px}.z255TG_conversationImported .z255TG_checkmark{opacity:.45;border-style:dashed}.z255TG_conversationCopy{flex-direction:column;gap:4px;min-width:0;display:flex}.z255TG_conversationCopy strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:590;overflow:hidden}.z255TG_conversationCopy>span{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.z255TG_importedBadge{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;padding:4px 8px;font-size:10px}.z255TG_empty{min-height:180px;color:var(--dsw-alias-label-secondary);justify-content:center;align-items:center;font-size:12px;display:flex}.z255TG_pickerFooter{border-top:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);justify-content:space-between;align-items:center;gap:16px;padding:13px 16px;display:flex;box-shadow:0 -8px 18px #00000005}.z255TG_pickerFooter p{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px}.z255TG_confirmButton{min-width:126px}.z255TG_status,.z255TG_error{white-space:pre-wrap;border-radius:9px;align-items:center;gap:8px;padding:10px 12px;font-size:12px;line-height:18px;display:flex}.z255TG_status{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}.z255TG_error{color:#c53b3b;background:#ef444414}.z255TG_spinner{border:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;flex:none;width:13px;height:13px;animation:.7s linear infinite z255TG_spin}.z255TG_note{margin:0}@keyframes z255TG_spin{to{transform:rotate(360deg)}}@media (width<=760px){.z255TG_sourceCard{grid-template-columns:44px minmax(0,1fr)}.z255TG_importButton{grid-column:1/-1;width:100%}.z255TG_pickerHeading{flex-direction:column}.z255TG_summary{justify-content:flex-start}.z255TG_toolbar{flex-wrap:wrap}.z255TG_searchBox{flex-basis:100%;max-width:none}.z255TG_matchCount{margin-right:auto}}";
		const tagId$1 = "@xiaozhuang-dsh/conversation-import/DeepSeekImportSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@xiaozhuang-dsh/conversation-import";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DeepSeekImportSection_module_css_default = {
			"body": "z255TG_body",
			"checkmark": "z255TG_checkmark",
			"confirmButton": "z255TG_confirmButton",
			"conversationCopy": "z255TG_conversationCopy",
			"conversationImported": "z255TG_conversationImported",
			"conversationList": "z255TG_conversationList",
			"conversationRow": "z255TG_conversationRow",
			"empty": "z255TG_empty",
			"error": "z255TG_error",
			"fileInput": "z255TG_fileInput",
			"header": "z255TG_header",
			"importButton": "z255TG_importButton",
			"importedBadge": "z255TG_importedBadge",
			"matchCount": "z255TG_matchCount",
			"note": "z255TG_note",
			"picker": "z255TG_picker",
			"pickerFooter": "z255TG_pickerFooter",
			"pickerHeading": "z255TG_pickerHeading",
			"root": "z255TG_root",
			"searchBox": "z255TG_searchBox",
			"sourceCard": "z255TG_sourceCard",
			"sourceCopy": "z255TG_sourceCopy",
			"sourceIcon": "z255TG_sourceIcon",
			"spin": "z255TG_spin",
			"spinner": "z255TG_spinner",
			"status": "z255TG_status",
			"steps": "z255TG_steps",
			"summary": "z255TG_summary",
			"summaryAvailable": "z255TG_summaryAvailable",
			"textButton": "z255TG_textButton",
			"toolbar": "z255TG_toolbar"
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
		const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
		function conversationMeta(item) {
			const pieces = [DATE_FORMAT.format(item.updatedAt), `${item.messageCount} 条消息`];
			if (item.reasoningCount > 0) pieces.push(`${item.reasoningCount} 段思考`);
			return pieces.join(" · ");
		}
		/** Native Settings page for previewing and selectively importing DeepSeek history. */
		function DeepSeekImportSection({ previewFile, importSelection, refreshSessions }) {
			const input = (0, react.useRef)(null);
			const [busy, setBusy] = (0, react.useState)();
			const [status, setStatus] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [file, setFile] = (0, react.useState)();
			const [preview, setPreview] = (0, react.useState)();
			const [selected, setSelected] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [query, setQuery] = (0, react.useState)("");
			const choose = (0, react.useCallback)(() => {
				input.current?.click();
			}, []);
			const selectedFile = (0, react.useCallback)(async (nextFile) => {
				if (nextFile === void 0 || busy !== void 0) return;
				setBusy("preview");
				setError("");
				setStatus("正在解析对话窗口，不会写入任何记录…");
				setFile(nextFile);
				setPreview(void 0);
				setSelected(/* @__PURE__ */ new Set());
				setQuery("");
				try {
					const nextPreview = await previewFile(nextFile);
					setPreview(nextPreview);
					setSelected(new Set(nextPreview.conversations.filter((conversation) => !conversation.imported).map((conversation) => conversation.sourceId)));
					setStatus("");
				} catch (caught) {
					setStatus("");
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setBusy(void 0);
				}
			}, [busy, previewFile]);
			const filtered = (0, react.useMemo)(() => {
				const normalized = query.trim().toLocaleLowerCase("zh-CN");
				if (preview === void 0 || normalized === "") return preview?.conversations ?? [];
				return preview.conversations.filter((conversation) => conversation.title.toLocaleLowerCase("zh-CN").includes(normalized));
			}, [preview, query]);
			const availableFiltered = (0, react.useMemo)(() => filtered.filter((conversation) => !conversation.imported), [filtered]);
			const allFilteredSelected = availableFiltered.length > 0 && availableFiltered.every((conversation) => selected.has(conversation.sourceId));
			const toggle = (0, react.useCallback)((sourceId) => {
				setSelected((current) => {
					const next = new Set(current);
					if (next.has(sourceId)) next.delete(sourceId);
					else next.add(sourceId);
					return next;
				});
			}, []);
			const selectFiltered = (0, react.useCallback)(() => {
				setSelected((current) => {
					const next = new Set(current);
					for (const conversation of availableFiltered) next.add(conversation.sourceId);
					return next;
				});
			}, [availableFiltered]);
			const clearSelection = (0, react.useCallback)(() => {
				setSelected(/* @__PURE__ */ new Set());
			}, []);
			const runImport = (0, react.useCallback)(async () => {
				if (file === void 0 || preview === void 0 || selected.size === 0 || busy !== void 0) return;
				const sourceIds = [...selected];
				setBusy("import");
				setError("");
				setStatus(`正在导入所选对话（${sourceIds.length} 个），请保持页面打开…`);
				try {
					const result = await importSelection(file, sourceIds);
					await refreshSessions();
					setStatus(resultLabel(result));
					if (result.errors.length > 0) setError(result.errors.join("\n"));
					if (result.failed === 0) {
						const imported = new Set(sourceIds);
						const conversations = preview.conversations.map((conversation) => imported.has(conversation.sourceId) ? {
							...conversation,
							imported: true
						} : conversation);
						const importedCount = conversations.filter((conversation) => conversation.imported).length;
						setPreview({
							total: conversations.length,
							imported: importedCount,
							available: conversations.length - importedCount,
							conversations
						});
						setSelected(/* @__PURE__ */ new Set());
					}
				} catch (caught) {
					setStatus("");
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setBusy(void 0);
				}
			}, [
				busy,
				file,
				importSelection,
				preview,
				refreshSessions,
				selected
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: DeepSeekImportSection_module_css_default.root,
				"aria-label": "导入对话",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsSectionHeader, {
					className: DeepSeekImportSection_module_css_default.header,
					title: "导入对话",
					description: "先预览 DeepSeek 导出的每个对话窗口，再选择真正需要迁移的内容。"
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
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: file?.name ?? "DeepSeek 历史对话" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: file === void 0 ? "支持官方导出的 JSON，或包含该 JSON 的 ZIP 文件。" : `${sizeLabel(file.size)} · 文件只在当前导入流程中使用` })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: DeepSeekImportSection_module_css_default.importButton,
									disabled: busy !== void 0,
									onClick: choose,
									children: busy === "preview" ? "正在解析…" : file === void 0 ? "选择导出文件" : "重新选择"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: input,
									className: DeepSeekImportSection_module_css_default.fileInput,
									type: "file",
									accept: ".json,.zip,application/json,application/zip",
									"aria-label": "选择 DeepSeek 导出文件",
									onChange: (event) => {
										const nextFile = event.currentTarget.files?.[0];
										event.currentTarget.value = "";
										selectedFile(nextFile);
									}
								})
							]
						}),
						preview === void 0 && busy !== "preview" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ol", {
							className: DeepSeekImportSection_module_css_default.steps,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "1" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "选择 DeepSeek 导出文件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "我的 → 系统设置 → 数据管理 → 导出所有历史对话。" })] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "逐个确认对话窗口" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "解析后可搜索、勾选或批量选择，不会立刻写入。" })] })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "3" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "导入到“聊天”目录" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "保留原始问题、回答、时间和导出中已有的思维过程。" })] })] })
							]
						}),
						preview !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: DeepSeekImportSection_module_css_default.picker,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: DeepSeekImportSection_module_css_default.pickerHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "选择要导入的对话" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "每一行对应 DeepSeek 中的一个独立对话窗口。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: DeepSeekImportSection_module_css_default.summary,
										"aria-label": "解析结果",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [preview.total, " 个对话窗口"] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: DeepSeekImportSection_module_css_default.summaryAvailable,
												children: [preview.available, " 个可导入"]
											}),
											preview.imported > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [preview.imported, " 个已导入"] })
										]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: DeepSeekImportSection_module_css_default.toolbar,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: DeepSeekImportSection_module_css_default.searchBox,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {
												size: 16,
												"aria-hidden": "true"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "search",
												"aria-label": "搜索对话",
												placeholder: "搜索对话标题",
												value: query,
												onChange: (event) => {
													setQuery(event.currentTarget.value);
												}
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: DeepSeekImportSection_module_css_default.matchCount,
											children: [filtered.length, " 条结果"]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: DeepSeekImportSection_module_css_default.textButton,
											disabled: availableFiltered.length === 0 || allFilteredSelected,
											onClick: selectFiltered,
											children: "全选当前结果"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: DeepSeekImportSection_module_css_default.textButton,
											disabled: selected.size === 0,
											onClick: clearSelection,
											children: "清空选择"
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: DeepSeekImportSection_module_css_default.conversationList,
									role: "list",
									"aria-label": "DeepSeek 对话窗口",
									children: [filtered.map((conversation) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: conversation.imported ? DeepSeekImportSection_module_css_default.conversationImported : DeepSeekImportSection_module_css_default.conversationRow,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												"aria-label": `选择 ${conversation.title}`,
												checked: selected.has(conversation.sourceId),
												disabled: conversation.imported || busy !== void 0,
												onChange: () => {
													toggle(conversation.sourceId);
												}
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: DeepSeekImportSection_module_css_default.checkmark,
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: DeepSeekImportSection_module_css_default.conversationCopy,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: conversation.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: conversationMeta(conversation) })]
											}),
											conversation.imported && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: DeepSeekImportSection_module_css_default.importedBadge,
												children: "已导入"
											})
										]
									}, conversation.sourceId)), filtered.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: DeepSeekImportSection_module_css_default.empty,
										children: "没有匹配的对话"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: DeepSeekImportSection_module_css_default.pickerFooter,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: selected.size === 0 ? "请选择至少一个尚未导入的对话" : `已选择 ${selected.size} 个对话` }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: DeepSeekImportSection_module_css_default.confirmButton,
										disabled: selected.size === 0 || busy !== void 0,
										onClick: () => {
											runImport();
										},
										children: busy === "import" ? "正在导入…" : `导入 ${selected.size} 个对话`
									})]
								})
							]
						}),
						status !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: DeepSeekImportSection_module_css_default.status,
							role: "status",
							children: [busy !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: DeepSeekImportSection_module_css_default.spinner }), status]
						}),
						error !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: DeepSeekImportSection_module_css_default.error,
							role: "alert",
							children: error
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: DeepSeekImportSection_module_css_default.note,
							children: "导入内容仅写入本机 DeepSeek Harness；已存在的对话会自动标记并跳过，不会生成副本。"
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
		//#region \0dsh-css:/private/tmp/dsh-publish-20260905.X1Ok1K/source/plugins/conversation-import/src/client/HeaderAction.module.css.mjs
		const css = ".SdbQnW_sessionLogButton{border:1px solid var(--dsw-alias-border-l2);min-width:111px;height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:6px 12px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex}.SdbQnW_sessionLogButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.SdbQnW_sessionLogButton:disabled{color:var(--dsw-alias-label-dimmed);cursor:wait}.SdbQnW_sessionLogButton span,.SdbQnW_sessionLogButton svg{flex:none}.SdbQnW_sessionLogButton span{white-space:nowrap}";
		const tagId = "@xiaozhuang-dsh/conversation-import/HeaderAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@xiaozhuang-dsh/conversation-import";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var HeaderAction_module_css_default = { "sessionLogButton": "SdbQnW_sessionLogButton" };
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
		function rawFileHeaders(file) {
			return {
				"content-type": file.type || (file.name.toLowerCase().endsWith(".zip") ? "application/zip" : "application/json"),
				"x-dsh-import-filename": encodeURIComponent(file.name)
			};
		}
		async function responseBody(response, label) {
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body.error ?? `${label}失败（HTTP ${response.status}）`);
			return body;
		}
		async function previewDeepSeekFile(file) {
			const body = await responseBody(await fetch("/api/session.import.deepseek?mode=preview", {
				method: "POST",
				body: file,
				headers: rawFileHeaders(file)
			}), "解析");
			if (typeof body.total !== "number" || typeof body.available !== "number" || typeof body.imported !== "number" || !Array.isArray(body.conversations)) throw new Error("解析服务返回了无法识别的结果");
			return {
				total: body.total,
				available: body.available,
				imported: body.imported,
				conversations: body.conversations
			};
		}
		async function importDeepSeekSelection(file, sourceIds) {
			const form = new FormData();
			form.append("file", file, file.name);
			form.append("selection", JSON.stringify(sourceIds));
			const body = await responseBody(await fetch("/api/session.import.deepseek", {
				method: "POST",
				body: form
			}), "导入");
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
					previewFile: previewDeepSeekFile,
					importSelection: importDeepSeekSelection,
					refreshSessions: () => sessions.refresh()
				})
			}, DeepSeekImportSection));
			ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
				name: "settings.section.icon",
				id: "conversation-import"
			}, _deepseek_ai_dsh_client_ui_primitives.IconChatOutline16));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map