import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-plain-chat'

/** Cordis companion plugin name. */
export const name = 'client-ui-plain-chat-invariant'
/** Service required before the companion reserves package ownership. */
export const inject = ['invariants']

/** No runtime invariant: the launcher owns no mutable cross-plugin state. */
const install: InvariantInstaller = () => {}

/** Reserve this package's mounted-composition identity. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
