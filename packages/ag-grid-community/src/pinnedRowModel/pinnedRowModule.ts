import type { _PinnedRowGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { getPinnedBottomRow, getPinnedBottomRowCount, getPinnedTopRow, getPinnedTopRowCount } from './pinnedRowApi';
import { PinnedRowModel } from './pinnedRowModel';

/**
 * @feature Rows -> Row Pinning
 * @gridOption pinnedTopRowData, pinnedBottomRowData
 */
export const PinnedRowCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('PinnedRowCoreModule'),
    beans: [PinnedRowModel],
};

/**
 * @feature Rows -> Row Pinning
 */
export const PinnedRowApiModule: _ModuleWithApi<_PinnedRowGridApi> = {
    ...baseCommunityModule('PinnedRowApiModule'),
    apiFunctions: {
        getPinnedTopRowCount,
        getPinnedBottomRowCount,
        getPinnedTopRow,
        getPinnedBottomRow,
    },
    dependsOn: [PinnedRowCoreModule],
};

/**
 * @feature Rows -> Row Pinning
 */
export const PinnedRowModule: _ModuleWithoutApi = {
    ...baseCommunityModule('PinnedRowModule'),
    dependsOn: [PinnedRowApiModule],
};
