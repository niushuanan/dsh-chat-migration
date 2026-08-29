import type { Context } from '@deepseek-ai/cordis';
/** Cordis companion plugin name. */
export declare const name = "client-ui-plain-chat-invariant";
/** Service required before the companion reserves package ownership. */
export declare const inject: string[];
/** Reserve this package's mounted-composition identity. */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map