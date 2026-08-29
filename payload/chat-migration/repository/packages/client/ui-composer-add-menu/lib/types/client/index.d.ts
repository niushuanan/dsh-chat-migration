import type { ClientContext } from '@deepseek-ai/dsh-api-session-controller/client';
import { type ComposerAddMenuKey } from './locales.ts';
export { ComposerAddMenu } from './ComposerAddMenu.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Composer attachment and capability directory copy. */
        composerAddMenu: ComposerAddMenuKey;
    }
}
export declare const inject: string[];
/** Occupy the native composer add seat with the unified one-layer directory. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map