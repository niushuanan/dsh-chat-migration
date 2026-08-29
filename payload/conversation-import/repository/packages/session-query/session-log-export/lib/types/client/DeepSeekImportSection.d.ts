import { type ReactElement } from 'react';
import type { DeepSeekImportPreview, DeepSeekImportResult } from '../deepseek-import-types.ts';
export interface DeepSeekImportSectionInjected {
    readonly previewFile: (file: File) => Promise<DeepSeekImportPreview>;
    readonly importSelection: (file: File, sourceIds: readonly string[]) => Promise<DeepSeekImportResult>;
    readonly refreshSessions: () => Promise<void>;
}
/** Native Settings page for previewing and selectively importing DeepSeek history. */
export declare function DeepSeekImportSection({ previewFile, importSelection, refreshSessions, }: DeepSeekImportSectionInjected): ReactElement;
//# sourceMappingURL=DeepSeekImportSection.d.ts.map