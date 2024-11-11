import type { _ModuleWithApi, _ModuleWithoutApi, _ServerSideRowModelGridApi } from 'ag-grid-community';
import {
    CommunityFeaturesModule,
    SortModule,
    _CsrmSsrmSharedApiModule,
    _SsrmInfiniteSharedApiModule,
} from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { LoadingCellRendererModule, SkeletonCellRendererModule } from '../cellRenderers/enterpriseCellRendererModule';
import { baseEnterpriseModule } from '../moduleUtils';
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
export const ServerSideRowModelCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ServerSideRowModelCoreModule'),
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
    ],
    dependsOn: [EnterpriseCoreModule],
};

/**
 * @feature Selection -> Row Selection
 * @gridOption rowSelection
 */
export const ServerSideRowModelRowSelectionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ServerSideRowModelRowSelectionModule'),
    rowModels: ['serverSide'],
    beans: [ServerSideSelectionService],
    dependsOn: [ServerSideRowModelCoreModule],
};

/**
 * @feature Row Grouping -> Opening Groups, Tree Data -> Expanding Groups, Master Detail
 */
export const ServerSideRowModelHierarchyModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ServerSideRowModelHierarchyModule'),
    rowModels: ['serverSide'],
    beans: [ServerSideExpansionService],
    dependsOn: [ServerSideRowModelCoreModule],
};

/**
 * @feature Rows -> Row Sorting
 * @colDef sortable, sort, sortIndex
 */
export const ServerSideRowModelSortModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ServerSideRowModelSortModule'),
    rowModels: ['serverSide'],
    beans: [SortListener],
    dependsOn: [ServerSideRowModelCoreModule, SortModule],
};

/**
 * @feature Server-Side Row Model
 */
export const ServerSideRowModelApiModule: _ModuleWithApi<_ServerSideRowModelGridApi<any>> = {
    ...baseEnterpriseModule('ServerSideRowModelApiModule'),
    rowModels: ['serverSide'],
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
    dependsOn: [ServerSideRowModelCoreModule, _CsrmSsrmSharedApiModule, _SsrmInfiniteSharedApiModule],
};

/**
 * @feature Server-Side Row Model
 */
export const ServerSideRowModelModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ServerSideRowModelModule'),
    rowModels: ['serverSide'],
    dependsOn: [
        ServerSideRowModelCoreModule,
        ServerSideRowModelApiModule,
        ServerSideRowModelRowSelectionModule,
        ServerSideRowModelSortModule,
        ServerSideRowModelHierarchyModule,
        LoadingCellRendererModule,
        SkeletonCellRendererModule,
        CommunityFeaturesModule,
    ],
};
