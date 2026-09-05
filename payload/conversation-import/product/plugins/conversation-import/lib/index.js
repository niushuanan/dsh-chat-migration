import Schema from "@deepseek-ai/schemastery";
import { Session, SessionId } from "@deepseek-ai/dsh-session";
import { DEFAULT_SESSION_LOG_COMPRESSION_LEVEL, SESSION_LOG_FILENAME, flushLiveSessionLog, readSessionLogText, serializeSessionLog, sessionLogExportDeps, sessionLogZipEntries, sessionLogZipFilename, streamSessionLogZip } from "@deepseek-ai/dsh-session-log-export";
import { createHash } from "node:crypto";
import { AssistantStreamAccumulator, createAssistantMessage, createUserMessage } from "@deepseek-ai/dsh-llm";
import { SESSION_FORMAT_VERSION, SessionId as SessionId$1 } from "@deepseek-ai/dsh-session/types";
import { strFromU8, unzipSync } from "fflate";
//#region src/deepseek-import.ts
/** DeepSeek official-history normalization and native DSH Session materialization. */
/** Rebuild a minimal lossless provider stream for imported assistant content. */
function importedAssistantStream(content, time) {
	const stream = new AssistantStreamAccumulator();
	for (const [index, block] of content.entries()) stream.push({
		time: time + index,
		chunk: block.type === "reasoning" ? {
			type: "reasoning-delta",
			index,
			text: block.text
		} : {
			type: "text-delta",
			index,
			text: block.text
		}
	});
	return stream.snapshot();
}
function record(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function text(value) {
	return typeof value === "string" ? value.trim() : "";
}
function sourceId(value) {
	if (typeof value === "string" || typeof value === "number") return String(value).trim();
	return "";
}
function epochMs(value) {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		const milliseconds = value < 0xe8d4a51000 ? value * 1e3 : value;
		return Number.isSafeInteger(milliseconds) ? milliseconds : Math.round(milliseconds);
	}
	if (typeof value !== "string" || value.trim() === "") return void 0;
	const numeric = Number(value);
	if (Number.isFinite(numeric) && numeric >= 0) return epochMs(numeric);
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
function normalizedTitle(value) {
	const title = text(value).replace(/\s+/gu, " ");
	if (title === "") return "DeepSeek 对话";
	return title.length <= 160 ? title : `${title.slice(0, 159)}…`;
}
function fragmentsOf(message) {
	return Array.isArray(message.fragments) ? message.fragments.map(record).filter((fragment) => fragment !== void 0) : [];
}
function referencesOf(fragments) {
	const sources = /* @__PURE__ */ new Map();
	const accept = (value, fallbackIndex) => {
		const candidate = record(value);
		if (candidate === void 0) return;
		const url = text(candidate.url);
		if (url === "") return;
		const rawIndex = candidate.cite_index;
		const index = typeof rawIndex === "number" && Number.isSafeInteger(rawIndex) && rawIndex >= 0 ? rawIndex : fallbackIndex;
		if (sources.has(index)) return;
		sources.set(index, {
			index,
			url,
			title: text(candidate.title) || url
		});
	};
	for (const fragment of fragments) {
		const type = text(fragment.type).toUpperCase();
		if (type === "SEARCH" || type === "TOOL_SEARCH") {
			if (Array.isArray(fragment.results)) fragment.results.forEach(accept);
			continue;
		}
		if (type === "READ_LINK") accept(fragment, sources.size);
		if (type === "TOOL_OPEN") accept(fragment.result, sources.size);
	}
	return [...sources.values()];
}
function replaceReferences(answer, sources) {
	if (sources.length === 0) return answer;
	const byIndex = new Map(sources.map((source) => [source.index, source]));
	return answer.replace(/\[reference:(\d+)\]/giu, (match, digits) => {
		const source = byIndex.get(Number(digits));
		return source === void 0 ? match : `[来源 ${source.index + 1}](${source.url})`;
	});
}
function normalizeMessage(value, fallbackTime, explicitRole, fallbackModel = "deepseek-chat") {
	const message = record(value);
	if (message === void 0) return void 0;
	const fragments = fragmentsOf(message);
	if (fragments.length === 0) return void 0;
	const roleName = explicitRole?.toUpperCase();
	const role = roleName === "USER" || roleName === void 0 && fragments.some((fragment) => text(fragment.type).toUpperCase() === "REQUEST") ? "user" : roleName === "ASSISTANT" || roleName === void 0 ? "assistant" : void 0;
	if (role === void 0) return void 0;
	const time = epochMs(message.inserted_at) ?? epochMs(message.create_time) ?? fallbackTime;
	if (role === "user") {
		const content = fragments.filter((fragment) => text(fragment.type).toUpperCase() === "REQUEST").map((fragment) => text(fragment.content)).filter(Boolean).join("\n\n");
		return content === "" ? void 0 : {
			role,
			text: content,
			time
		};
	}
	const answer = fragments.filter((fragment) => text(fragment.type).toUpperCase() === "RESPONSE").map((fragment) => text(fragment.content)).filter(Boolean).join("\n\n");
	const reasoning = fragments.filter((fragment) => text(fragment.type).toUpperCase() === "THINK").map((fragment) => text(fragment.content)).filter(Boolean).join("\n\n");
	if (answer === "" && reasoning === "") return void 0;
	return {
		role,
		text: replaceReferences(answer, referencesOf(fragments)),
		...reasoning === "" ? {} : { reasoning },
		model: text(message.model) || fallbackModel,
		time
	};
}
function mappingPath(conversation, mapping) {
	const currentId = sourceId(conversation.current_message_id);
	if (currentId !== "") {
		const path = [];
		const visited = /* @__PURE__ */ new Set();
		let id = currentId;
		while (id !== "" && !visited.has(id)) {
			visited.add(id);
			const node = record(mapping[id]);
			if (node === void 0) break;
			path.push(node);
			id = sourceId(node.parent);
		}
		if (path.length > 0) return path.reverse();
	}
	const path = [];
	const visited = /* @__PURE__ */ new Set();
	let id = record(mapping.root) === void 0 ? Object.keys(mapping).find((key) => record(mapping[key])?.parent === null) ?? "" : "root";
	while (id !== "" && !visited.has(id)) {
		visited.add(id);
		const node = record(mapping[id]);
		if (node === void 0) break;
		path.push(node);
		id = sourceId((Array.isArray(node.children) ? node.children : [])[0]);
	}
	return path;
}
function officialConversation(value) {
	const conversation = record(value);
	const mapping = record(conversation?.mapping);
	if (conversation === void 0 || mapping === void 0) return void 0;
	const id = sourceId(conversation.id);
	if (id === "") return void 0;
	const createdAt = epochMs(conversation.inserted_at) ?? epochMs(conversation.create_time) ?? 0;
	const messages = mappingPath(conversation, mapping).map((node, index) => normalizeMessage(node.message, createdAt + index)).filter((message) => message !== void 0);
	if (messages.length === 0) return void 0;
	const lastMessageTime = messages.at(-1)?.time ?? createdAt;
	return {
		sourceId: id,
		title: normalizedTitle(conversation.title),
		createdAt,
		updatedAt: epochMs(conversation.updated_at) ?? epochMs(conversation.update_time) ?? lastMessageTime,
		messages
	};
}
function rawMessagePath(conversation, messages) {
	const byId = new Map(messages.map((message) => [sourceId(message.message_id), message]));
	let currentId = sourceId(record(conversation.chat_session)?.current_message_id);
	if (currentId === "" || !byId.has(currentId)) {
		const parents = new Set(messages.map((message) => sourceId(message.parent_id)).filter(Boolean));
		currentId = [...messages].filter((message) => !parents.has(sourceId(message.message_id))).sort((left, right) => (epochMs(left.inserted_at) ?? 0) - (epochMs(right.inserted_at) ?? 0)).map((message) => sourceId(message.message_id)).at(-1) ?? "";
	}
	const path = [];
	const visited = /* @__PURE__ */ new Set();
	while (currentId !== "" && !visited.has(currentId)) {
		visited.add(currentId);
		const message = byId.get(currentId);
		if (message === void 0) break;
		path.push(message);
		currentId = sourceId(message.parent_id);
	}
	return path.reverse();
}
function rawConversation(value) {
	const conversation = record(value);
	const session = record(conversation?.chat_session);
	if (conversation === void 0 || session === void 0 || !Array.isArray(conversation.chat_messages)) return void 0;
	const id = sourceId(conversation.id) || sourceId(session.id);
	if (id === "") return void 0;
	const rawMessages = conversation.chat_messages.map(record).filter((message) => message !== void 0 && sourceId(message.message_id) !== "");
	if (rawMessages.length === 0) return void 0;
	const createdAt = epochMs(conversation.create_time) ?? epochMs(session.inserted_at) ?? 0;
	const model = text(session.model_type) || "deepseek-chat";
	const messages = rawMessagePath(conversation, rawMessages).map((message, index) => normalizeMessage(message, createdAt + index, text(message.role), model)).filter((message) => message !== void 0);
	if (messages.length === 0) return void 0;
	return {
		sourceId: id,
		title: normalizedTitle(conversation.title ?? session.title),
		createdAt,
		updatedAt: epochMs(conversation.update_time) ?? epochMs(session.updated_at) ?? messages.at(-1)?.time ?? createdAt,
		messages
	};
}
/** Parse either the official mapping export or the raw DeepSeek API export. */
function parseDeepSeekExportJson(input) {
	let decoded;
	try {
		decoded = JSON.parse(input);
	} catch {
		throw new Error("不是有效的 DeepSeek 导出文件：JSON 无法解析");
	}
	const root = record(decoded);
	const conversations = (Array.isArray(decoded) ? decoded : Array.isArray(root?.conversations) ? root.conversations : Array.isArray(root?.data) ? root.data : []).map((value) => officialConversation(value) ?? rawConversation(value)).filter((conversation) => conversation !== void 0).sort((left, right) => left.createdAt - right.createdAt || left.sourceId.localeCompare(right.sourceId));
	if (conversations.length === 0) throw new Error("不是有效的 DeepSeek 导出文件：没有找到可导入的对话");
	return conversations;
}
/** Decode a JSON file or ZIP containing the official DeepSeek JSON export. */
function parseDeepSeekExportBytes(bytes, filename = "", contentType = "") {
	if (!(filename.toLowerCase().endsWith(".zip") || contentType.toLowerCase().includes("zip") || bytes[0] === 80 && bytes[1] === 75)) return parseDeepSeekExportJson(new TextDecoder().decode(bytes));
	let files;
	try {
		files = unzipSync(bytes);
	} catch {
		throw new Error("不是有效的 DeepSeek 导出文件：ZIP 无法解压");
	}
	const selected = Object.entries(files).filter(([path]) => path.toLowerCase().endsWith(".json") && !path.startsWith("__MACOSX/")).sort(([leftPath, left], [rightPath, right]) => {
		const leftPreferred = /conversation|chat|deepseek/iu.test(leftPath) ? 1 : 0;
		return (/conversation|chat|deepseek/iu.test(rightPath) ? 1 : 0) - leftPreferred || right.byteLength - left.byteLength;
	})[0];
	if (selected === void 0) throw new Error("不是有效的 DeepSeek 导出文件：ZIP 中没有 JSON 对话文件");
	return parseDeepSeekExportJson(strFromU8(selected[1]));
}
function deepSeekImportedSessionId(source) {
	return SessionId$1(`session-deepseek-${createHash("sha256").update(source).digest("hex").slice(0, 24)}`);
}
/** Build the newest-first, write-free conversation picker projection. */
async function previewDeepSeekHistory(persistence, conversations) {
	const existing = new Set((await persistence.list()).map((snapshot) => String(snapshot.header.id)));
	const items = conversations.map((conversation) => ({
		sourceId: conversation.sourceId,
		title: conversation.title,
		createdAt: conversation.createdAt,
		updatedAt: conversation.updatedAt,
		messageCount: conversation.messages.length,
		reasoningCount: conversation.messages.filter((message) => message.role === "assistant" && message.reasoning !== void 0).length,
		imported: existing.has(String(deepSeekImportedSessionId(conversation.sourceId)))
	})).sort((left, right) => right.updatedAt - left.updatedAt || right.createdAt - left.createdAt || left.sourceId.localeCompare(right.sourceId));
	const imported = items.filter((item) => item.imported).length;
	return {
		total: items.length,
		available: items.length - imported,
		imported,
		conversations: items
	};
}
/** Resolve a browser selection against the freshly reparsed source file. */
function selectDeepSeekConversations(conversations, sourceIds) {
	const selected = new Set(sourceIds);
	const known = new Set(conversations.map((conversation) => conversation.sourceId));
	if ([...selected].filter((sourceId) => !known.has(sourceId)).length > 0) throw new Error("所选对话与当前导出文件不匹配，请重新选择文件");
	return conversations.filter((conversation) => selected.has(conversation.sourceId));
}
/** Convert one normalized source conversation into standard DSH history events. */
function buildDeepSeekImportedSession(conversation) {
	const header = {
		version: SESSION_FORMAT_VERSION,
		id: deepSeekImportedSessionId(conversation.sourceId),
		createdAt: conversation.createdAt,
		cwd: process.cwd(),
		agentPreset: "chat",
		isSeeded: false
	};
	const events = [];
	let clock = conversation.createdAt;
	const append = (type, data, time, surface = false) => {
		clock = Math.max(clock, time);
		events.push({
			type,
			seq: events.length,
			time: clock,
			data,
			...surface ? { surfaceOp: "append" } : {}
		});
	};
	append("session/title", {
		title: conversation.title,
		messageSeqs: [],
		source: { kind: "user" }
	}, conversation.createdAt);
	let turn = 0;
	for (let index = 0; index < conversation.messages.length;) {
		const first = conversation.messages[index];
		if (first === void 0) break;
		const user = first.role === "user" ? first : void 0;
		const assistant = first.role === "assistant" ? first : conversation.messages[index + 1]?.role === "assistant" ? conversation.messages[index + 1] : void 0;
		index += user !== void 0 && assistant !== void 0 ? 2 : 1;
		turn += 1;
		const startTime = user?.time ?? assistant?.time ?? conversation.createdAt;
		append("turn/start", { turn }, startTime);
		append("step/start", {
			turn,
			step: 1
		}, startTime);
		if (user !== void 0) append("user/message", createUserMessage({
			content: [{
				type: "text",
				text: user.text
			}],
			source: { kind: "user" }
		}), user.time, true);
		if (assistant !== void 0) {
			const content = [...assistant.reasoning === void 0 ? [] : [{
				type: "reasoning",
				text: assistant.reasoning
			}], ...assistant.text === "" ? [] : [{
				type: "text",
				text: assistant.text
			}]];
			append("assistant/message", {
				turn,
				step: 1,
				stream: importedAssistantStream(content, assistant.time),
				message: createAssistantMessage({
					content,
					source: {
						provider: "deepseek-import",
						model: assistant.model
					}
				})
			}, assistant.time, true);
		}
		const endTime = assistant?.time ?? user?.time ?? startTime;
		append("step/end", {
			turn,
			step: 1
		}, endTime);
		append("turn/end", {
			turn,
			reason: { kind: "completed" }
		}, endTime);
	}
	return {
		header,
		events
	};
}
/** Persist normalized conversations without keeping their complete logs live in Host memory. */
async function importDeepSeekHistory(persistence, conversations, finalize) {
	const existing = new Set((await persistence.list()).map((snapshot) => String(snapshot.header.id)));
	const importedIds = [];
	const errors = [];
	let skipped = 0;
	let failed = 0;
	for (const [index, conversation] of conversations.entries()) {
		const imported = buildDeepSeekImportedSession(conversation);
		if (existing.has(String(imported.header.id))) {
			skipped += 1;
			continue;
		}
		let handle;
		try {
			handle = await persistence.create(imported.header);
			await handle.append(imported.events);
			await handle.flush();
			existing.add(String(imported.header.id));
			importedIds.push(String(imported.header.id));
			try {
				await finalize?.(imported);
			} catch (error) {
				if (errors.length < 5) errors.push(`${conversation.title}：列表索引刷新失败（${error instanceof Error ? error.message : String(error)}）`);
			}
		} catch (error) {
			failed += 1;
			if (errors.length < 5) errors.push(`${conversation.title}：${error instanceof Error ? error.message : String(error)}`);
		} finally {
			await handle?.close();
		}
		if (index % 20 === 19) await new Promise((resolve) => {
			setImmediate(resolve);
		});
	}
	return {
		imported: importedIds.length,
		skipped,
		failed,
		sessionIds: importedIds,
		errors
	};
}
//#endregion
//#region src/index.ts
const name = "session-log-download";
const inject = ["commands"];
/** Stable browser download path retained across the transport migration. */
const SESSION_LOG_EXPORT_PATH = "/api/session.export";
/** Authenticated browser route for official DeepSeek history imports. */
const SESSION_DEEPSEEK_IMPORT_PATH = "/api/session.import.deepseek";
/** Validate Session-log archive configuration. */
const Config = Schema.object({ compressionLevel: Schema.number().step(1).min(0).max(9).default(DEFAULT_SESSION_LOG_COMPRESSION_LEVEL) });
const REQUESTED = {
	kind: "success",
	text: "Session log download requested."
};
/**
* Register the Web-only `/export` command and authenticated ZIP download route.
* @param ctx - Host context carrying the human-command registry.
* @param config - resolved compression policy.
*/
function apply(ctx, config = {}) {
	ctx.effect(() => ctx.commands.register({
		name: "export",
		description: "Download this Session log as a ZIP archive",
		handler: (invocation) => Promise.resolve(invocation.rawInput.trim() === "" ? REQUESTED : {
			kind: "error",
			text: "The Web /export command does not accept a path."
		})
	}), "session-log-download: command");
	ctx.inject(["connection"], (routeCtx) => {
		connectionOf(routeCtx).fetch.register({
			path: SESSION_LOG_EXPORT_PATH,
			methods: ["GET", "HEAD"],
			fetch: async (request) => {
				const response = await sessionLogExportResponse(routeCtx, request, config.compressionLevel ?? DEFAULT_SESSION_LOG_COMPRESSION_LEVEL);
				if (request.method === "GET") return response;
				await response.body?.cancel();
				return new Response(null, {
					status: response.status,
					headers: response.headers
				});
			}
		});
		connectionOf(routeCtx).fetch.register({
			path: SESSION_DEEPSEEK_IMPORT_PATH,
			methods: ["POST"],
			fetch: (request) => deepSeekImportResponse(routeCtx, request)
		});
	});
}
function connectionOf(ctx) {
	return Reflect.get(ctx, "connection");
}
function jsonResponse(body, status = 200) {
	return Response.json(body, {
		status,
		headers: { "cache-control": "no-store" }
	});
}
function parseSelection(value) {
	if (value === null) return void 0;
	if (typeof value !== "string") throw new Error("导入选择无效，请重新选择对话");
	let decoded;
	try {
		decoded = JSON.parse(value);
	} catch {
		throw new Error("导入选择无效，请重新选择对话");
	}
	if (!Array.isArray(decoded) || decoded.some((item) => typeof item !== "string" || item.trim() === "")) throw new Error("导入选择无效，请重新选择对话");
	return [...new Set(decoded)];
}
async function readDeepSeekImportRequest(request) {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.toLowerCase().includes("multipart/form-data")) {
		const form = await request.formData();
		const file = form.get("file");
		if (!(file instanceof Blob)) throw new Error("没有找到 DeepSeek 导出文件");
		const name = Reflect.get(file, "name");
		const selection = form.has("selection") ? parseSelection(form.get("selection")) : void 0;
		return {
			bytes: new Uint8Array(await file.arrayBuffer()),
			filename: typeof name === "string" ? name : "deepseek-export.json",
			contentType: file.type,
			...selection === void 0 ? {} : { selection }
		};
	}
	let filename = request.headers.get("x-dsh-import-filename") ?? "";
	try {
		filename = decodeURIComponent(filename);
	} catch {
		filename = "";
	}
	return {
		bytes: new Uint8Array(await request.arrayBuffer()),
		filename,
		contentType
	};
}
async function deepSeekImportResponse(ctx, request) {
	const persistence = ctx.get("sessionPersistence");
	if (persistence === void 0) return jsonResponse({ error: "当前部署没有启用会话持久化，无法导入历史对话" }, 503);
	try {
		const input = await readDeepSeekImportRequest(request);
		const conversations = parseDeepSeekExportBytes(input.bytes, input.filename, input.contentType);
		const mode = new URL(request.url).searchParams.get("mode");
		if (mode === "preview") return jsonResponse(await previewDeepSeekHistory(persistence, conversations));
		if (mode !== null) throw new Error("无法识别的导入模式");
		const selected = input.selection === void 0 ? conversations : selectDeepSeekConversations(conversations, input.selection);
		const projectionCache = ctx.get("sessionProjectionCache");
		return jsonResponse(await importDeepSeekHistory(persistence, selected, projectionCache === void 0 ? void 0 : async (imported) => {
			await projectionCache.write(Session.create(imported.header.id, imported.events, imported.header));
		}));
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 400);
	}
}
async function sessionLogExportResponse(ctx, request, compressionLevel) {
	const url = new URL(request.url);
	const query = Object.fromEntries(url.searchParams);
	const sessionIdValue = query["sessionId"];
	const descendantsValue = query["includeDescendants"];
	if (sessionIdValue === void 0 || sessionIdValue.length === 0 || descendantsValue !== void 0 && descendantsValue !== "true" && descendantsValue !== "false") return new Response("missing or invalid sessionId query parameter", { status: 400 });
	const sessionId = SessionId(sessionIdValue);
	const deps = sessionLogExportDeps(ctx);
	if (deps.sessionQuery === void 0 || deps.sessionPersistence === void 0 || deps.attachments === void 0) return new Response("session log export is unavailable: missing session-query, session-persistence, or attachments service", { status: 500 });
	const ready = {
		sessionQuery: deps.sessionQuery,
		sessionPersistence: deps.sessionPersistence,
		attachments: deps.attachments,
		sessions: deps.sessions
	};
	let rootContent;
	try {
		await flushLiveSessionLog(deps, sessionId, request.signal);
		rootContent = await readSessionLogText(deps.sessionPersistence, sessionId, request.signal);
		request.signal.throwIfAborted();
	} catch {
		request.signal.throwIfAborted();
		return new Response("session log export failed to read the stored log", { status: 500 });
	}
	if (rootContent === void 0) return new Response("session not found", { status: 404 });
	return new Response(streamSessionLogZip(ready, rootContent, sessionId, descendantsValue === "true", compressionLevel, request.signal), { headers: {
		"content-type": "application/zip",
		"content-disposition": `attachment; filename="${sessionLogZipFilename(sessionId)}"`
	} });
}
//#endregion
export { Config, DEFAULT_SESSION_LOG_COMPRESSION_LEVEL, SESSION_DEEPSEEK_IMPORT_PATH, SESSION_LOG_EXPORT_PATH, SESSION_LOG_FILENAME, apply, buildDeepSeekImportedSession, deepSeekImportedSessionId, flushLiveSessionLog, importDeepSeekHistory, inject, name, parseDeepSeekExportBytes, parseDeepSeekExportJson, previewDeepSeekHistory, readSessionLogText, selectDeepSeekConversations, serializeSessionLog, sessionLogExportDeps, sessionLogZipEntries, sessionLogZipFilename, streamSessionLogZip };
