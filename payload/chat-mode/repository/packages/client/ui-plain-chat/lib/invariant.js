//#region lib/types/invariant.js
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-plain-chat";
/** Cordis companion plugin name. */
const name = "client-ui-plain-chat-invariant";
/** Service required before the companion reserves package ownership. */
const inject = ["invariants"];
/** No runtime invariant: the launcher owns no mutable cross-plugin state. */
const install = () => {};
/** Reserve this package's mounted-composition identity. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
