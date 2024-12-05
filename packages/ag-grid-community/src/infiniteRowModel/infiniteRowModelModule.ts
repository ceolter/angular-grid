import type { _InfiniteRowModelGridApi } from '../api/gridApi';
import { SsrmInfiniteSharedApiModule } from '../api/sharedApiModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { InfiniteRowModel } from './infiniteRowModel';
import { getInfiniteRowCount, purgeInfiniteCache, refreshInfiniteCache } from './infiniteRowModelApi';
import { RowNodeBlockLoader } from './rowNodeBlockLoader';

/**
 * @feature Infinite Row Model
 */
export const InfiniteRowModelModule: _ModuleWithApi<_InfiniteRowModelGridApi> = {
    moduleName: 'InfiniteRowModel',
    version: VERSION,
    rowModels: ['infinite'],
    apiFunctions: {
        refreshInfiniteCache,
        purgeInfiniteCache,
        getInfiniteRowCount,
    },
    beans: [InfiniteRowModel, RowNodeBlockLoader],
    dependsOn: [SsrmInfiniteSharedApiModule],
};
