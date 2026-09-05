/** Framework-free login recovery for browser windows without an address bar. */

const labels = {
  en: {
    title: 'Reconnect to DSH',
    explanation: 'This window needs to sign in again. Your conversations have not been deleted.',
    instruction: 'Paste the token after ?token= from the current dsh web launch URL.',
    token: 'Launch token',
    submit: 'Reconnect',
  },
  zh: {
    title: '重新连接 DSH',
    explanation: '当前窗口需要重新登录。你的对话记录并未删除。',
    instruction: '请粘贴本次 dsh web 启动链接中 ?token= 后的令牌。',
    token: '启动令牌',
    submit: '重新连接',
  },
} as const

/**
 * Render a same-origin form using the ordinary root token exchange.
 * @param chinese - whether the request prefers Chinese.
 * @returns static HTML containing no request values or authentication secrets.
 */
export function browserLoginPage(chinese: boolean): string {
  const t = labels[chinese ? 'zh' : 'en']
  return `<!doctype html><html lang="${chinese ? 'zh-CN' : 'en'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.title}</title><style>
:root{color-scheme:light dark;font:16px system-ui,sans-serif}body{margin:0;padding:24px;display:grid;min-height:80vh;place-items:center}
main{width:min(100%,440px)}h1{font-size:24px}p{line-height:1.6}label,input,button{display:block;box-sizing:border-box;width:100%}
input,button{font:inherit;padding:12px;border-radius:10px;margin-top:10px}input{border:1px solid #9ca3af}button{border:0;background:#2563eb;color:white;cursor:pointer}
</style></head><body><main><h1>${t.title}</h1><p>${t.explanation}</p><p>${t.instruction}</p>
<form method="get" action="/"><label for="token">${t.token}</label>
<input id="token" name="token" type="password" required autocomplete="off" autocapitalize="none" spellcheck="false">
<button type="submit">${t.submit}</button></form></main></body></html>`
}
