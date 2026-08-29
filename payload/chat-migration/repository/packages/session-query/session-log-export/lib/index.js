import Schema from "@deepseek-ai/schemastery";
import { Session, SessionId } from "@deepseek-ai/dsh-session";
import { Zip, ZipDeflate, strFromU8, unzipSync } from "fflate";
import { createHash } from "node:crypto";
import { createAssistantMessage, createUserMessage } from "@deepseek-ai/dsh-llm";
import { SESSION_FORMAT_VERSION, SessionId as SessionId$1 } from "@deepseek-ai/dsh-session/types";
//#region lib/types/archive.js
/**
* Host-side session-log download: streams one ZIP archive whose files are the
* sessions' stored artifact text verbatim plus every referenced media object.
* The root artifact sits under its original base name (`session.jsonl`); each
* subagent descendant under `subagents/<id>/<filename>`; each image referenced
* by any included log under `media/<attachmentId>.<ext>` (content-addressed,
* so one archive never duplicates a shared image). No manifest is written —
* every file is byte-identical to the backend's durable artifact or attachment
* store and self-describing through its own header line or media type. Before
* each live session's artifact read, the SessionStore flush barrier makes the
* current in-memory log durable; cold sessions need no barrier. Request abort
* and response-consumer cancellation share one producer signal and terminate
* the active compressor.
* Compression runs on the host with fflate's streaming Zip API, so the archive
* bytes are produced incrementally and the host never holds the whole archive
* in one buffer; production waits for consumer pull whenever the response queue
* reaches its byte high-water mark, so a slow consumer bounds accumulation to
* the fixed 64 KiB response queue plus one synchronous fflate push.
* @module
*/
/** Balanced default used when Session export configuration omits a compression level. */
const DEFAULT_SESSION_LOG_COMPRESSION_LEVEL = 6;
/**
* Resolve the persistence, session-query, and attachment services a log export needs.
* @param ctx - the composed host context.
* @returns the export services (absent when the deployment does not mount them).
*/
function sessionLogExportDeps(ctx) {
	return {
		sessionQuery: ctx.get("sessionQuery"),
		sessionPersistence: ctx.get("sessionPersistence"),
		attachments: ctx.get("attachments"),
		sessions: ctx.get("sessions")
	};
}
/**
* Flush one currently live session through the store's authoritative durability
* barrier immediately before its raw artifact is read. A cold or absent id has
* no in-memory work to flush.
* @param deps - export services, including the optional live-session store.
* @param id - the session whose artifact is about to be read.
* @param signal - optional cancellation observed around the flush barrier.
*/
async function flushLiveSessionLog(deps, id, signal) {
	signal?.throwIfAborted();
	const sessions = deps.sessions;
	if (sessions === void 0) return;
	const session = sessions.get(id);
	if (session === void 0) return;
	await sessions.flush(session);
	signal?.throwIfAborted();
}
/** Zip extension for each accepted raster media type. */
const MEDIA_TYPE_EXTENSIONS = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif"
};
/**
* The zip path for one media object: content-addressed by the opaque
* attachment id so shared images land once and the id in the log maps back to
* the archive entry without a manifest.
* @param ref - the durable reference from a session log.
* @returns the archive path.
*/
function mediaEntryPath(ref) {
	return `media/${String(ref.attachmentId)}.${MEDIA_TYPE_EXTENSIONS[ref.mediaType]}`;
}
/**
* Collect every image reference inside one content array, descending into
* nested tool results the way the live attachment route does.
* @param content - an event content array (or nested tool-result content).
* @param refs - the dedupe map being filled (keyed by attachment id).
*/
function collectImageRefs(content, refs) {
	if (!Array.isArray(content)) return;
	const pending = [];
	for (const item of content) pending.push(item);
	while (pending.length > 0) {
		const value = pending.pop();
		if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
		const block = value;
		if (block.type === "image" && typeof block.attachment === "object" && block.attachment !== null) {
			const ref = block.attachment;
			refs.set(String(ref.attachmentId), ref);
		}
		if (Array.isArray(block.content)) for (const item of block.content) pending.push(item);
	}
}
/**
* Collect every image reference one session event carries, across the same
* carriers the live attachment route scans (direct content, message content,
* inserted messages, and completed assistant chunk blocks).
* @param event - one parsed JSONL event object.
* @param refs - the dedupe map being filled (keyed by attachment id).
*/
function collectEventImageRefs(event, refs) {
	const data = event.data;
	if (typeof data !== "object" || data === null) return;
	const carrier = data;
	collectImageRefs(carrier.content, refs);
	if (carrier.message !== void 0) collectImageRefs(carrier.message.content, refs);
	if (carrier.inserted !== void 0) for (const message of carrier.inserted) collectImageRefs(message.content, refs);
	if (carrier.chunk?.type === "block-end") collectImageRefs([carrier.chunk.block], refs);
}
/**
* Collect the distinct media references one stored artifact text names.
* Lines that fail to parse cannot reference media and are skipped (the
* artifact text itself is exported verbatim regardless).
* @param content - the stored artifact text.
* @returns the dedupe map keyed by attachment id.
*/
function imageRefsInArtifact(content) {
	const refs = /* @__PURE__ */ new Map();
	for (const line of content.split("\n")) {
		if (line === "") continue;
		let event;
		try {
			event = JSON.parse(line);
		} catch {
			continue;
		}
		collectEventImageRefs(event, refs);
	}
	return refs;
}
/**
* One safe zip path segment from an untrusted session id. Session ids are
* host-controlled, but the brand allows any non-empty string, so `../`, dot
* segments, and separator characters are neutralized before they can shape
* archive entries. Distinct ids may collapse onto one segment (id collision
* is impossible for the host-minted UUIDs, so no uniqueness suffix is kept).
* @param id - the raw session id.
* @returns a filesystem-safe single path segment.
*/
function safeSessionIdSegment(id) {
	return id.replace(/[^A-Za-z0-9_-]/g, "_");
}
/**
* The export archive filename for one root session.
* @param sessionId - the root session id (sanitized to one safe path segment).
* @returns the attachment filename for the session's export archive.
*/
function sessionLogZipFilename(sessionId) {
	return `dsh-session-${safeSessionIdSegment(sessionId)}.zip`;
}
/**
* Yield the export entries in zip order: the preloaded root artifact first,
* then every subagent descendant in lineage order (each flushed when live,
* read from the persistence backend right before it is yielded, and dropped
* after the consumer moves on), then every distinct media object referenced by any of
* the included logs (read and verified from the attachment store, one archive
* entry per attachment id). The host holds at most one descendant's artifact
* text and one media object at a time beyond the root.
* @param deps - the mounted export services (the caller answered 500 before this runs).
* @param root - the already-read root artifact (read by the caller so the
* missing-session path can answer cleanly before streaming starts).
* @param sessionId - the root session id.
* @param includeDescendants - whether to include every subagent descendant.
* @param signal - optional cancellation forwarded to lineage, persistence, and attachment reads.
* @returns the export entries in zip order.
*/
async function* sessionLogZipEntries(deps, root, sessionId, includeDescendants, signal) {
	const media = /* @__PURE__ */ new Map();
	const rememberMedia = (content) => {
		for (const [id, ref] of imageRefsInArtifact(content)) media.set(id, ref);
	};
	rememberMedia(root.content);
	yield {
		path: root.filename,
		content: root.content
	};
	if (includeDescendants) {
		const seen = new Set([sessionId]);
		const collect = async function* (nodes) {
			for (const node of nodes) {
				signal?.throwIfAborted();
				const id = node.session.header.id;
				if (seen.has(id)) continue;
				seen.add(id);
				await flushLiveSessionLog(deps, id, signal);
				const raw = await deps.sessionPersistence.readRaw(id, signal);
				signal?.throwIfAborted();
				if (raw === void 0) throw new Error(`subagent "${id}" has no stored log artifact`);
				rememberMedia(raw.content);
				yield {
					path: `subagents/${safeSessionIdSegment(id)}/${raw.filename}`,
					content: raw.content
				};
				yield* collect(node.descendants);
			}
		};
		const lineage = await deps.sessionQuery.traceSession(sessionId, signal);
		signal?.throwIfAborted();
		yield* collect(lineage.descendants);
	}
	for (const ref of media.values()) {
		signal?.throwIfAborted();
		const stored = await deps.attachments.readImage(ref, signal);
		signal?.throwIfAborted();
		yield {
			path: mediaEntryPath(ref),
			data: stored.data
		};
	}
}
/** How many code units of artifact text one zip push carries (bounded encode memory). */
const PUSH_CHUNK_CODE_UNITS = 65536;
/** How many bytes of media one zip push carries (bounded memory; images are already size-capped). */
const PUSH_CHUNK_BYTES = 65536;
/** Byte capacity retained by the response stream before ZIP production waits for pull. */
const RESPONSE_HIGH_WATER_MARK_BYTES = 65536;
/** One producer waiter released only when ReadableStream pull restores capacity. */
var ResponseCapacityGate = class {
	releasePending;
	/**
	* Wait until the response queue has positive byte capacity or cancellation wins.
	* @param controller - response controller whose desired size owns capacity.
	* @param signal - combined request/consumer cancellation.
	*/
	async wait(controller, signal) {
		signal.throwIfAborted();
		if (controller.desiredSize === null || controller.desiredSize > 0) return;
		await new Promise((resolve) => {
			const release = () => {
				this.releasePending = void 0;
				signal.removeEventListener("abort", release);
				resolve();
			};
			this.releasePending = release;
			signal.addEventListener("abort", release, { once: true });
		});
		signal.throwIfAborted();
	}
	/** Release the current producer waiter after a consumer pull. */
	pulled() {
		this.releasePending?.();
	}
};
/**
* Push one media object's bytes into a deflate stream in bounded chunks,
* waiting for consumer capacity between chunks like the artifact path does.
* @param deflate - the zip entry's deflate stream.
* @param data - the stored image bytes.
* @param controller - response queue controller.
* @param capacity - pull-driven response-capacity gate.
* @param signal - cancellation; throws when aborted.
*/
async function pushBinaryChunks(deflate, data, controller, capacity, signal) {
	let offset = 0;
	do {
		signal.throwIfAborted();
		const end = Math.min(offset + PUSH_CHUNK_BYTES, data.byteLength);
		const finalChunk = end >= data.byteLength;
		deflate.push(data.subarray(offset, end), finalChunk);
		offset = end;
		await capacity.wait(controller, signal);
	} while (offset < data.byteLength);
}
/**
* Push one artifact's text into a deflate stream in bounded chunks, never
* splitting a surrogate pair across a chunk boundary (a lone high surrogate
* re-encodes as U+FFFD and would silently corrupt the exported artifact).
* @param deflate - the zip entry's deflate stream.
* @param content - the artifact text verbatim.
* @param controller - response queue controller.
* @param capacity - pull-driven response-capacity gate.
* @param signal - cancellation; throws when aborted.
*/
async function pushArtifactChunks(deflate, content, controller, capacity, signal) {
	const encoder = new TextEncoder();
	let offset = 0;
	let finalChunk;
	do {
		signal.throwIfAborted();
		let end = Math.min(offset + PUSH_CHUNK_CODE_UNITS, content.length);
		if (end < content.length && end - offset > 1) {
			const last = content.charCodeAt(end - 1);
			if (last >= 55296 && last <= 56319) end -= 1;
		}
		finalChunk = end >= content.length;
		deflate.push(encoder.encode(content.slice(offset, end)), finalChunk);
		offset = end;
		await capacity.wait(controller, signal);
	} while (!finalChunk);
}
/**
* Stream one session-log ZIP as a WHATWG ReadableStream. The root artifact is
* read and validated by the caller before this is called (missing root or
* missing services answer cleanly before any byte is produced); each entry is
* then encoded and deflated in bounded chunks as it is produced, so the
* archive bytes arrive incrementally. A descendant that fails to read errors
* the stream (fail-loud, never silent under-export).
* @param deps - the mounted export services (the caller answered 500 before this runs).
* @param root - the already-read root artifact (first zip entry).
* @param sessionId - the root session id.
* @param includeDescendants - whether to include every subagent descendant.
* @param compressionLevel - validated fflate DEFLATE level for every ZIP entry.
* @param signal - request cancellation combined with response-consumer cancellation.
* @returns the zip byte stream.
*/
function streamSessionLogZip(deps, root, sessionId, includeDescendants, compressionLevel, signal) {
	const consumerAbort = new AbortController();
	const producerSignal = AbortSignal.any([signal, consumerAbort.signal]);
	let zip;
	let zipTerminated = false;
	const capacity = new ResponseCapacityGate();
	const terminateZip = () => {
		if (zip === void 0 || zipTerminated) return;
		zipTerminated = true;
		zip.terminate();
	};
	return new ReadableStream({
		start(controller) {
			const archive = new Zip((error, data, final) => {
				/* v8 ignore next 3 -- fflate reports only internal zip failures, unreachable for valid inputs */
				if (error) {
					controller.error(error);
					return;
				}
				/* v8 ignore next -- fflate may emit empty chunks; not controllable from tests */
				if (data.byteLength > 0) controller.enqueue(data);
				if (final) controller.close();
			});
			zip = archive;
			(async () => {
				try {
					for await (const entry of sessionLogZipEntries(deps, root, sessionId, includeDescendants, producerSignal)) {
						const deflate = new ZipDeflate(entry.path, { level: compressionLevel });
						archive.add(deflate);
						if ("content" in entry) await pushArtifactChunks(deflate, entry.content, controller, capacity, producerSignal);
						else await pushBinaryChunks(deflate, entry.data, controller, capacity, producerSignal);
					}
					archive.end();
				} catch (error) {
					/* v8 ignore next -- typed backends reject with Error, and DOMException is one in Node */
					terminateZip();
					controller.error(error instanceof Error ? error : new Error(String(error)));
				}
			})();
		},
		pull() {
			capacity.pulled();
		},
		cancel(reason) {
			consumerAbort.abort(reason instanceof Error ? reason : /* @__PURE__ */ new Error("session log export stream cancelled"));
			terminateZip();
		}
	}, {
		highWaterMark: RESPONSE_HIGH_WATER_MARK_BYTES,
		size: (chunk) => chunk.byteLength
	});
}
//#endregion
//#region lib/types/deepseek-import.js
/** DeepSeek official-history normalization and native DSH Session materialization. */
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
function importedSessionId(source) {
	return SessionId$1(`session-deepseek-${createHash("sha256").update(source).digest("hex").slice(0, 24)}`);
}
/** Convert one normalized source conversation into standard DSH history events. */
function buildDeepSeekImportedSession(conversation) {
	const header = {
		version: SESSION_FORMAT_VERSION,
		id: importedSessionId(conversation.sourceId),
		createdAt: conversation.createdAt,
		cwd: process.cwd(),
		agentPreset: "chat"
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
	const existing = new Set((await persistence.listSnapshots()).map((snapshot) => String(snapshot.header.id)));
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
		try {
			await persistence.create(imported.header);
			await persistence.append(imported.header.id, imported.events);
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
//#region lib/types/index.js
/** Session-log download command and Host-owned streaming route. */
const name = "session-log-download";
const inject = ["commands", "connection"];
/** Stable browser download path retained across the transport migration. */
const SESSION_LOG_EXPORT_PATH = "/api/session.export";
/** Authenticated browser route for official DeepSeek history imports. */
const SESSION_DEEPSEEK_IMPORT_PATH = "/api/session.import.deepseek";
/** Validate Session-log archive configuration. */
const Config = Schema.object({ compressionLevel: Schema.number().step(1).min(0).max(9).default(6) });
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
	connectionOf(ctx).fetch.register({
		path: SESSION_LOG_EXPORT_PATH,
		methods: ["GET", "HEAD"],
		fetch: async (request) => {
			const response = await sessionLogExportResponse(ctx, request, config.compressionLevel ?? 6);
			if (request.method === "GET") return response;
			await response.body?.cancel();
			return new Response(null, {
				status: response.status,
				headers: response.headers
			});
		}
	});
	connectionOf(ctx).fetch.register({
		path: SESSION_DEEPSEEK_IMPORT_PATH,
		methods: ["POST"],
		fetch: (request) => deepSeekImportResponse(ctx, request)
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
async function deepSeekImportResponse(ctx, request) {
	const persistence = ctx.get("sessionPersistence");
	if (persistence === void 0) return jsonResponse({ error: "当前部署没有启用会话持久化，无法导入历史对话" }, 503);
	let filename = request.headers.get("x-dsh-import-filename") ?? "";
	try {
		filename = decodeURIComponent(filename);
	} catch {
		filename = "";
	}
	try {
		const conversations = parseDeepSeekExportBytes(new Uint8Array(await request.arrayBuffer()), filename, request.headers.get("content-type") ?? "");
		const projectionCache = ctx.get("sessionProjectionCache");
		return jsonResponse(await importDeepSeekHistory(persistence, conversations, projectionCache === void 0 ? void 0 : async (imported) => {
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
	if (!deps.sessionPersistence.supportsRawArtifacts) return new Response("session log export is unavailable: the persistence backend does not expose per-session raw artifacts", { status: 501 });
	const ready = {
		sessionQuery: deps.sessionQuery,
		sessionPersistence: deps.sessionPersistence,
		attachments: deps.attachments,
		sessions: deps.sessions
	};
	let root;
	try {
		await flushLiveSessionLog(deps, sessionId, request.signal);
		root = await deps.sessionPersistence.readRaw(sessionId, request.signal);
		request.signal.throwIfAborted();
	} catch {
		request.signal.throwIfAborted();
		return new Response("session log export failed to prepare the stored artifact", { status: 500 });
	}
	if (root === void 0) return new Response("session not found", { status: 404 });
	return new Response(streamSessionLogZip(ready, root, sessionId, descendantsValue === "true", compressionLevel, request.signal), { headers: {
		"content-type": "application/zip",
		"content-disposition": `attachment; filename="${sessionLogZipFilename(sessionId)}"`
	} });
}
//#endregion
export { Config, DEFAULT_SESSION_LOG_COMPRESSION_LEVEL, SESSION_DEEPSEEK_IMPORT_PATH, SESSION_LOG_EXPORT_PATH, apply, buildDeepSeekImportedSession, flushLiveSessionLog, importDeepSeekHistory, inject, name, parseDeepSeekExportBytes, parseDeepSeekExportJson, sessionLogExportDeps, sessionLogZipEntries, sessionLogZipFilename, streamSessionLogZip };
