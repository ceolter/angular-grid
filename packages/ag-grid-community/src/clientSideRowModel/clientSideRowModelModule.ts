import type { _ClientSideRowModelGridApi } from '../api/gridApi';
import { CsrmSsrmSharedApiModule } from '../api/sharedApiModule';
import { CommunityDefaultModule } from '../communityDefaultModule';
import { CommunityFeaturesModule } from '../communityFeaturesModule';
import { FilterCoreModule } from '../filter/filterModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { SortModule } from '../sort/sortModule';
import { ClientSideNodeManager } from './clientSideNodeManager';
import { ClientSideRowModel } from './clientSideRowModel';
import {
    applyTransaction,
    applyTransactionAsync,
    flushAsyncTransactions,
    forEachLeafNode,
    forEachNodeAfterFilter,
    forEachNodeAfterFilterAndSort,
    getBestCostNodeSelection,
    isRowDataEmpty,
    onGroupExpandedOrCollapsed,
    refreshClientSideRowModel,
    resetRowHeights,
} from './clientSideRowModelApi';
import { FilterStage } from './filterStage';
import { SortStage } from './sortStage';

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelCoreModule'),
    rowModels: ['clientSide'],
    beans: [ClientSideNodeManager, ClientSideRowModel],
};

/**
 * @feature Rows -> Row Sorting
 * @colDef sortable, sort, sortIndex
 */
export const ClientSideRowModelSortModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelSortModule'),
    rowModels: ['clientSide'],
    beans: [SortStage],
    dependsOn: [ClientSideRowModelCoreModule, SortModule],
};

/**
 * @feature Filtering
 * @gridOption quickFilterText, enableAdvancedFilter, doesExternalFilterPass
 * @colDef filter
 */
export const ClientSideRowModelFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelFilterModule'),
    rowModels: ['clientSide'],
    beans: [FilterStage],
    dependsOn: [FilterCoreModule],
};

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelApiModule: _ModuleWithApi<_ClientSideRowModelGridApi<any>> = {
    ...baseCommunityModule('ClientSideRowModelApiModule'),
    rowModels: ['clientSide'],
    apiFunctions: {
        onGroupExpandedOrCollapsed,
        refreshClientSideRowModel,
        isRowDataEmpty,
        forEachLeafNode,
        forEachNodeAfterFilter,
        forEachNodeAfterFilterAndSort,
        resetRowHeights,
        applyTransaction,
        applyTransactionAsync,
        flushAsyncTransactions,
        getBestCostNodeSelection,
    },
    dependsOn: [ClientSideRowModelCoreModule, CsrmSsrmSharedApiModule],
};

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelDefaultModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelDefaultModule'),
    rowModels: ['clientSide'],
    dependsOn: [ClientSideRowModelCoreModule, ClientSideRowModelSortModule, CommunityDefaultModule],
};

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelModule'),
    rowModels: ['clientSide'],
    dependsOn: [
        ClientSideRowModelCoreModule,
        ClientSideRowModelApiModule,
        ClientSideRowModelSortModule,
        ClientSideRowModelFilterModule,
        CommunityFeaturesModule,
    ],
};
