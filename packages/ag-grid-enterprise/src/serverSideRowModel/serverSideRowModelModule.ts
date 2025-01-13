import type { _ModuleWithApi, _ModuleWithoutApi, _ServerSideRowModelGridApi } from 'ag-grid-community';
import {
    _CsrmSsrmSharedApiModule,
    _SharedRowSelectionModule,
    _SortModule,
    _SsrmInfiniteSharedApiModule,
} from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { LoadingCellRendererModule, SkeletonCellRendererModule } from '../cellRenderers/enterpriseCellRendererModule';
import { SharedPivotModule } from '../pivot/pivotModule';
import { SharedTreeDataModule } from '../treeData/treeDataModule';
import { VERSION } from '../version';
import { BlockUtils } from './blocks/blockUtils';
import { ExpandListener } from './listeners/expandListener';
import { FilterListener } from './listeners/filterListener';
import { ListenerUtils } from './listeners/listenerUtils';
import { SortListener } from './listeners/sortListener';
import { NodeManager } from './nodeManager';
import { ServerSideRowModel } from './serverSideRowModel';
import {
    applyServerSideRowData,
    applyServerSideTransaction,
    applyServerSideTransactionAsync,
    flushServerSideAsyncTransactions,
    getServerSideGroupLevelState,
    getServerSideSelectionState,
    refreshServerSide,
    retryServerSideLoads,
    setServerSideSelectionState,
} from './serverSideRowModelApi';
import { ServerSideExpansionService } from './services/serverSideExpansionService';
import { ServerSideSelectionService } from './services/serverSideSelectionService';
import { SsrmRowChildrenService } from './services/ssrmRowChildrenService';
import { LazyBlockLoadingService } from './stores/lazy/lazyBlockLoadingService';
import { StoreFactory } from './stores/storeFactory';
import { StoreUtils } from './stores/storeUtils';
import { TransactionManager } from './transactionManager';

/**
 * @feature Server-Side Row Model
 */
export const ServerSideRowModelModule: _ModuleWithoutApi = {
    moduleName: 'ServerSideRowModel',
    version: VERSION,
    rowModels: ['serverSide'],
    beans: [
        ServerSideRowModel,
        ExpandListener,
        StoreUtils,
        BlockUtils,
        NodeManager,
        TransactionManager,
        FilterListener,
        StoreFactory,
        ListenerUtils,
        ServerSideSelectionService,
        LazyBlockLoadingService,
        SsrmRowChildrenService,
        ServerSideExpansionService,
        SortListener,
    ],
    dependsOn: [
        EnterpriseCoreModule,
        _SortModule,
        _SharedRowSelectionModule,
        SharedPivotModule,
        SharedTreeDataModule,
        LoadingCellRendererModule,
        SkeletonCellRendererModule,
    ],
};

/**
 * @feature Server-Side Row Model
 */
export const ServerSideRowModelApiModule: _ModuleWithApi<_ServerSideRowModelGridApi<any>> = {
    moduleName: 'ServerSideRowModelApi',
    version: VERSION,
    apiFunctions: {
        getServerSideSelectionState,
        setServerSideSelectionState,
        applyServerSideTransaction,
        applyServerSideTransactionAsync,
        applyServerSideRowData,
        retryServerSideLoads,
        flushServerSideAsyncTransactions,
        refreshServerSide,
        getServerSideGroupLevelState,
    },
    dependsOn: [EnterpriseCoreModule, _CsrmSsrmSharedApiModule, _SsrmInfiniteSharedApiModule],
};
