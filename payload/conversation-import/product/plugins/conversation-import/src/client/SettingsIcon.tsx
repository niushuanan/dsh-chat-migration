/** The import plugin's original message-bubble navigation artwork. */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

export function ImportSettingsIcon({ size, className }: PropsRuntime<'settings.section.icon'>) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M3.25 1.5h9.5A2.75 2.75 0 0 1 15.5 4.25v5A2.75 2.75 0 0 1 12.75 12H8.42l-2.77 2.17a.7.7 0 0 1-1.13-.55V12H3.25A2.75 2.75 0 0 1 .5 9.25v-5A2.75 2.75 0 0 1 3.25 1.5Zm0 1.3A1.45 1.45 0 0 0 1.8 4.25v5a1.45 1.45 0 0 0 1.45 1.45h2.57v1.48l2.15-1.48h4.78a1.45 1.45 0 0 0 1.45-1.45v-5a1.45 1.45 0 0 0-1.45-1.45h-9.5Z" fill="currentColor" />
      <circle cx="5" cy="6.75" r=".75" fill="currentColor" />
      <circle cx="8" cy="6.75" r=".75" fill="currentColor" />
      <circle cx="11" cy="6.75" r=".75" fill="currentColor" />
    </svg>
  )
}
