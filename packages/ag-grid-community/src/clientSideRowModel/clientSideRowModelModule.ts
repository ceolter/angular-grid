import type { _ClientSideRowModelGridApi } from '../api/gridApi';
import { CsrmSsrmSharedApiModule } from '../api/sharedApiModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { SortModule } from '../sort/sortModule';
import { VERSION } from '../version';
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
    moduleName: 'ClientSideRowModel',
    version: VERSION,
    rowModels: ['clientSide'],
    beans: [ClientSideNodeManager, ClientSideRowModel, SortStage],
    dependsOn: [SortModule],
};

/**
 * @feature Client-Side Row Model
 */
export const ClientSideRowModelApiModule: _ModuleWithApi<_ClientSideRowModelGridApi<any>> = {
    moduleName: 'ClientSideRowModelApi',
    version: VERSION,
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
