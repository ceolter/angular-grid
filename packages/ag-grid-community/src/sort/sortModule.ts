import type { _SortGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { RowNodeSorter } from './rowNodeSorter';
import { onSortChanged } from './sortApi';
import { SortIndicatorComp } from './sortIndicatorComp';
import { SortService } from './sortService';

/**
 * @feature Rows -> Row Sorting
 * @colDef sortable, sort, sortIndex
 */
export const SortModule: _ModuleWithApi<_SortGridApi> = {
    ...baseCommunityModule('Sort'),
    beans: [SortService, RowNodeSorter],
    apiFunctions: {
        onSortChanged,
    },
    userComponents: {
        agSortIndicator: SortIndicatorComp,
    },
    icons: {
        // show on column header when column is sorted ascending
        sortAscending: 'asc',
        // show on column header when column is sorted descending
        sortDescending: 'desc',
        // show on column header when column has no sort, only when enabled with gridOptions.unSortIcon=true
        sortUnSort: 'none',
    },
};
