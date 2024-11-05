import type { _InfiniteRowModelGridApi } from '../api/gridApi';
import { SsrmInfiniteSharedApiModule } from '../api/sharedApiModule';
import { CommunityFeaturesModule } from '../communityFeaturesModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { InfiniteRowModel } from './infiniteRowModel';
import { getInfiniteRowCount, purgeInfiniteCache, refreshInfiniteCache } from './infiniteRowModelApi';
import { RowNodeBlockLoader } from './rowNodeBlockLoader';

/**
 * @feature Infinite Row Model
 */
export const InfiniteRowModelCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('InfiniteRowModelCoreModule'),
    rowModels: ['infinite'],
    beans: [InfiniteRowModel, RowNodeBlockLoader],
    dependsOn: [],
};

/**
 * @feature Infinite Row Model
 */
export const InfiniteRowModelApiModule: _ModuleWithApi<_InfiniteRowModelGridApi> = {
    ...baseCommunityModule('InfiniteRowModelApiModule'),
    rowModels: ['infinite'],
    apiFunctions: {
        refreshInfiniteCache,
        purgeInfiniteCache,
        getInfiniteRowCount,
    },
    dependsOn: [InfiniteRowModelCoreModule, SsrmInfiniteSharedApiModule],
};

/**
 * @feature Infinite Row Model
 */
export const InfiniteRowModelModule: _ModuleWithoutApi = {
    ...baseCommunityModule('InfiniteRowModelModule'),
    rowModels: ['infinite'],
    dependsOn: [InfiniteRowModelCoreModule, InfiniteRowModelApiModule, CommunityFeaturesModule],
};
