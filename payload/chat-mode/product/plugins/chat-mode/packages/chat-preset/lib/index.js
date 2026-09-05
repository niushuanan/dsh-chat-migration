import { fileURLToPath } from "node:url";
//#region src/index.ts
/** Host registration for the plain-chat preset bundled by this plugin. */
const inject = ["agentPresets"];
function apply(ctx) {
	const root = fileURLToPath(new URL("../../../presets/", import.meta.url));
	ctx.effect(() => ctx.agentPresets.registerRoot({
		path: root,
		trust: "system"
	}), "chat-mode: plain-chat preset root");
}
//#endregion
export { apply, inject };
