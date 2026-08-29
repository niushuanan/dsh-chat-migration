//#region lib/types/invariant.js
const PACKAGE_NAME = "@deepseek-ai/dsh-composer-add-menu";
const name = "composer-add-menu-invariant";
const inject = ["invariants"];
const install = () => {};
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
