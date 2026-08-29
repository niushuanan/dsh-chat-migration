/** Locale namespace owned by Session export browser feedback. */
export declare const NS = "session-log-download";
/** Simplified-Chinese Session export strings. */
export declare const zh: {
    readonly 'action.label': "导出对话";
    readonly 'action.archive': "导出文本记录";
    readonly 'action.image': "导出对话图片";
    readonly 'dialog.preparingTitle': "正在导出 Session";
    readonly 'dialog.preparingDescription': "正在准备包含当前 Session、子 Session 和附件的 ZIP 文件。";
    readonly 'dialog.successTitle': "Session 导出已开始下载";
    readonly 'dialog.successDescription': "浏览器正在下载 Session ZIP 文件。";
    readonly 'dialog.errorTitle': "Session 导出失败";
    readonly 'dialog.close': "关闭";
    readonly 'dialog.commandFailed': "无法启动 Session 导出。";
    readonly 'dialog.imagePreparingTitle': "正在生成对话图片";
    readonly 'dialog.imagePreparingDescription': "正在读取完整对话，并整理为一张不含思考过程的长图。";
    readonly 'dialog.imageSuccessTitle': "对话图片已开始下载";
    readonly 'dialog.imageSuccessDescription': "浏览器正在下载完整对话长图。";
    readonly 'dialog.imageErrorTitle': "对话图片生成失败";
};
/** English Session export strings. */
export declare const en: Record<keyof typeof zh, string>;
/** Stable locale keys consumed by the shared modal. */
export type SessionLogDownloadKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map