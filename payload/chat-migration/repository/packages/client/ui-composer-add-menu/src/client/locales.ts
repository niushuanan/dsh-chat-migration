/** `composerAddMenu` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'trigger.add': '添加',
  'menu.chat': '上传文件与图片',
  'menu.work': '命令、插件与技能',
  'section.add': '添加',
  'image.chatTitle': '上传图片',
  'image.workTitle': '图片文件',
  'image.select': '选择要发送的图片',
  'image.unsupported': '当前模型暂不支持图片',
  'file.title': '上传文件',
  'file.description': '文本、Markdown、表格与代码',
  'reference.title': '文件与文件夹',
  'reference.enabled': '从当前工作区引用',
  'reference.disabled': '当前会话不可用',
  'section.catalog': '命令、插件与技能',
  'skill.invoke': '调用 /{name}',
  'catalog.empty': '暂无可用项目',
  'web.enabled': '联网搜索已开启',
  'web.disabled': '联网搜索已关闭',
  'web.label': '联网搜索',
  'web.enableHint': '开启联网搜索',
  'web.disableHint': '关闭联网搜索',
} satisfies Record<string, string>

/** Composer add-menu dictionary key union. */
export type ComposerAddMenuKey = keyof typeof zh

/** English dictionary, checked complete against the Chinese key set. */
export const en = {
  'trigger.add': 'Add',
  'menu.chat': 'Upload files and images',
  'menu.work': 'Commands, plugins, and skills',
  'section.add': 'Add',
  'image.chatTitle': 'Upload image',
  'image.workTitle': 'Image file',
  'image.select': 'Choose images to send',
  'image.unsupported': 'The current model does not support images',
  'file.title': 'Upload file',
  'file.description': 'Text, Markdown, tables, and code',
  'reference.title': 'Files and folders',
  'reference.enabled': 'Reference the current Workspace',
  'reference.disabled': 'Unavailable in this Session',
  'section.catalog': 'Commands, plugins, and skills',
  'skill.invoke': 'Invoke /{name}',
  'catalog.empty': 'No items available',
  'web.enabled': 'Web search enabled',
  'web.disabled': 'Web search disabled',
  'web.label': 'Web search',
  'web.enableHint': 'Enable web search',
  'web.disableHint': 'Disable web search',
} satisfies Record<ComposerAddMenuKey, string>
