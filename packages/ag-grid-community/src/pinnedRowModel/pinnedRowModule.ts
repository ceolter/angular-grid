import type { _PinnedRowGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { getPinnedBottomRow, getPinnedBottomRowCount, getPinnedTopRow, getPinnedTopRowCount } from './pinnedRowApi';
import { PinnedRowModel } from './pinnedRowModel';

/**
 * @feature Rows -> Row Pinning
 * @gridOption pinnedTopRowData, pinnedBottomRowData
 */
export const PinnedRowModule: _ModuleWithApi<_PinnedRowGridApi> = {
    ...baseCommunityModule('PinnedRowModule'),
    beans: [PinnedRowModel],
    apiFunctions: {
        getPinnedTopRowCount,
        getPinnedBottomRowCount,
        getPinnedTopRow,
        getPinnedBottomRow,
    },
};
