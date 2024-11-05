import type { _ClipboardGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { CellFlashModule, KeyboardNavigationCoreModule } from 'ag-grid-community';
import { CsvExportModule } from 'ag-grid-community';

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
export const ClipboardCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ClipboardCoreModule'),
    beans: [ClipboardService],
    dependsOn: [EnterpriseCoreModule, CsvExportModule, KeyboardNavigationCoreModule, CellFlashModule],
};

/**
 * @feature Import & Export -> Clipboard
 */
export const ClipboardApiModule: _ModuleWithApi<_ClipboardGridApi> = {
    ...baseEnterpriseModule('ClipboardApiModule'),
    apiFunctions: {
        copyToClipboard,
        cutToClipboard,
        copySelectedRowsToClipboard,
        copySelectedRangeToClipboard,
        copySelectedRangeDown,
        pasteFromClipboard,
    },
    dependsOn: [ClipboardCoreModule],
};

/**
 * @feature Import & Export -> Clipboard
 */
export const ClipboardModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ClipboardModule'),
    dependsOn: [ClipboardCoreModule, ClipboardApiModule],
};
