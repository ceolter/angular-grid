import type { _SortGridApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { RowNodeSorter } from './rowNodeSorter';
import { onSortChanged } from './sortApi';
import { SortIndicatorComp } from './sortIndicatorComp';
import { SortService } from './sortService';

/**
 * @feature Rows -> Row Sorting
 * @colDef sortable, sort, sortIndex
 */
export const SortModule: _ModuleWithApi<_SortGridApi> = {
    moduleName: 'Sort',
    version: VERSION,
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
