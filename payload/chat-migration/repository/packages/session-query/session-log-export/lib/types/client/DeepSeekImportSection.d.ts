import { type ReactElement } from 'react';
import type { DeepSeekImportResult } from '../deepseek-import-types.ts';
export interface DeepSeekImportSectionInjected {
    readonly importFile: (file: File) => Promise<DeepSeekImportResult>;
    readonly refreshSessions: () => Promise<void>;
}
/** Native Settings page for one-file DeepSeek history migration. */
export declare function DeepSeekImportSection({ importFile, refreshSessions, }: DeepSeekImportSectionInjected): ReactElement;
//# sourceMappingURL=DeepSeekImportSection.d.ts.map