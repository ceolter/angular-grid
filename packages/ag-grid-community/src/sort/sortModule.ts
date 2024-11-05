import type { _SortGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { RowNodeSorter } from './rowNodeSorter';
import { onSortChanged } from './sortApi';
import { SortIndicatorComp } from './sortIndicatorComp';
import { SortService } from './sortService';

/**
 * @feature Rows -> Row Sorting
 * @colDef sortable, sort, sortIndex
 */
export const SortCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SortCoreModule'),
    beans: [SortService, RowNodeSorter],
};

/**
 * @feature Rows -> Row Sorting
 */
export const SortIndicatorCompModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SortIndicatorCompModule'),
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
    dependsOn: [SortCoreModule],
};

/**
 * @feature Rows -> Row Sorting
 */
export const SortApiModule: _ModuleWithApi<_SortGridApi> = {
    ...baseCommunityModule('SortApiModule'),
    apiFunctions: {
        onSortChanged,
    },
    dependsOn: [SortCoreModule],
};

/**
 * @feature Rows -> Row Sorting
 */
export const SortModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SortModule'),
    dependsOn: [SortApiModule, SortIndicatorCompModule],
};
