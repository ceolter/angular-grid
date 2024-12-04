import type { _PinnedRowGridApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { getPinnedBottomRow, getPinnedBottomRowCount, getPinnedTopRow, getPinnedTopRowCount } from './pinnedRowApi';
import { PinnedRowModel } from './pinnedRowModel';

/**
 * @feature Rows -> Row Pinning
 * @gridOption pinnedTopRowData, pinnedBottomRowData
 */
export const PinnedRowModule: _ModuleWithApi<_PinnedRowGridApi> = {
    moduleName: 'PinnedRow',
    version: VERSION,
    beans: [PinnedRowModel],
    apiFunctions: {
        getPinnedTopRowCount,
        getPinnedBottomRowCount,
        getPinnedTopRow,
        getPinnedBottomRow,
    },
};
