import { clientBundle } from '../../packages/client/tsdown.client.ts'

export default clientBundle(
  '@xiaozhuang-dsh/conversation-import',
  ['src/index.ts', 'src/invariant.ts'],
  { hostPhase: true },
)
