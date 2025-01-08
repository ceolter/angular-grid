import type { _InfiniteRowModelGridApi } from '../api/gridApi';
import { SsrmInfiniteSharedApiModule } from '../api/sharedApiModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { InfiniteRowModel } from './infiniteRowModel';
import { getInfiniteRowCount, purgeInfiniteCache, refreshInfiniteCache } from './infiniteRowModelApi';
import { RowNodeBlockLoader } from './rowNodeBlockLoader';

/**
 * @internal
 */
const InfiniteRowModelCoreModule: _ModuleWithoutApi = {
    moduleName: 'InfiniteRowModelCore',
    version: VERSION,
    rowModels: ['infinite'],
    beans: [InfiniteRowModel, RowNodeBlockLoader],
};

/**
 * @feature Infinite Row Model
 */
export const InfiniteRowModelModule: _ModuleWithApi<_InfiniteRowModelGridApi> = {
    moduleName: 'InfiniteRowModel',
    version: VERSION,
    apiFunctions: {
        refreshInfiniteCache,
        purgeInfiniteCache,
        getInfiniteRowCount,
    },
    dependsOn: [InfiniteRowModelCoreModule, SsrmInfiniteSharedApiModule],
};
