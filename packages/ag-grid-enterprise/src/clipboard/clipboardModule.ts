import type { _ClipboardGridApi, _ModuleWithApi } from 'ag-grid-community';
import { CsvExportModule, HighlightChangesModule, _KeyboardNavigationModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import {
    copySelectedRangeDown,
    copySelectedRangeToClipboard,
    copySelectedRowsToClipboard,
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
} from './clipboardApi';
import { ClipboardService } from './clipboardService';

/**
 * @feature Import & Export -> Clipboard
 */
export const ClipboardModule: _ModuleWithApi<_ClipboardGridApi> = {
    ...baseEnterpriseModule('ClipboardModule'),
    beans: [ClipboardService],
    apiFunctions: {
        copyToClipboard,
        cutToClipboard,
        copySelectedRowsToClipboard,
        copySelectedRangeToClipboard,
        copySelectedRangeDown,
        pasteFromClipboard,
    },
    dependsOn: [EnterpriseCoreModule, CsvExportModule, _KeyboardNavigationModule, HighlightChangesModule],
};
