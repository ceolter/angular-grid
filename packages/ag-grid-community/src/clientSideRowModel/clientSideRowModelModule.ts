import type { _ClientSideRowModelGridApi } from '../api/gridApi';
import { CsrmSsrmSharedApiModule } from '../api/sharedApiModule';
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
import { SortStage } from './sortStage';

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelModule'),
    rowModels: ['clientSide'],
    beans: [ClientSideNodeManager, ClientSideRowModel, SortStage],
    dependsOn: [SortModule],
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
    dependsOn: [CsrmSsrmSharedApiModule],
};
