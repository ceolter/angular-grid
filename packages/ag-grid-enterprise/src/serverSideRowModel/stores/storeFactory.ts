import type {
    BeanCollection,
    ColumnModel,
    FuncColsService,
    GetServerSideGroupLevelParamsParams,
    NamedBean,
    RowAutoHeightService,
    RowNode,
    ServerSideGroupLevelParams,
    WithoutGridCommon,
} from 'ag-grid-community';
import { BeanStub, _warn } from 'ag-grid-community';

import type { SSRMParams } from '../serverSideRowModel';
import { LazyStore } from './lazy/lazyStore';

export class StoreFactory extends BeanStub implements NamedBean {
    beanName = 'ssrmStoreFactory' as const;

    private columnModel: ColumnModel;
    private funcColsService: FuncColsService;
    private rowAutoHeightService?: RowAutoHeightService;

    public wireBeans(beans: BeanCollection) {
        this.columnModel = beans.columnModel;
        this.funcColsService = beans.funcColsService;
        this.rowAutoHeightService = beans.rowAutoHeightService;
    }

    public createStore(ssrmParams: SSRMParams, parentNode: RowNode): LazyStore {
        const storeParams = this.getStoreParams(ssrmParams, parentNode);

        return new LazyStore(ssrmParams, storeParams, parentNode);
    }

    private getStoreParams(ssrmParams: SSRMParams, parentNode: RowNode): ServerSideGroupLevelParams {
        const userStoreParams = this.getLevelSpecificParams(parentNode);

        // if user provided overrideParams, we take infiniteScroll from there if it exists
        const cacheBlockSize = this.getBlockSize(userStoreParams);
        const maxBlocksInCache = this.getMaxBlocksInCache(ssrmParams, userStoreParams);

        const storeParams: ServerSideGroupLevelParams = {
            cacheBlockSize,
            maxBlocksInCache,
        };

        return storeParams;
    }

    private getMaxBlocksInCache(
        ssrmParams: SSRMParams,
        userStoreParams?: ServerSideGroupLevelParams
    ): number | undefined {
        const maxBlocksInCache =
            userStoreParams && userStoreParams.maxBlocksInCache != null
                ? userStoreParams.maxBlocksInCache
                : this.gos.get('maxBlocksInCache');

        const maxBlocksActive = maxBlocksInCache != null && maxBlocksInCache >= 0;

        if (!maxBlocksActive) {
            return;
        }

        if (ssrmParams.dynamicRowHeight) {
            _warn(203);
            return;
        }

        if (this.rowAutoHeightService?.active) {
            _warn(204);
            return undefined;
        }

        return maxBlocksInCache;
    }

    private getBlockSize(userStoreParams?: ServerSideGroupLevelParams): number | undefined {
        const blockSize =
            userStoreParams && userStoreParams.cacheBlockSize != null
                ? userStoreParams.cacheBlockSize
                : this.gos.get('cacheBlockSize');

        if (blockSize != null && blockSize > 0) {
            return blockSize;
        } else {
            return 100;
        }
    }

    private getLevelSpecificParams(parentNode: RowNode): ServerSideGroupLevelParams | undefined {
        const callback = this.gos.getCallback('getServerSideGroupLevelParams');
        if (!callback) {
            return undefined;
        }

        const params: WithoutGridCommon<GetServerSideGroupLevelParamsParams> = {
            level: parentNode.level + 1,
            parentRowNode: parentNode.level >= 0 ? parentNode : undefined,
            rowGroupColumns: this.funcColsService.rowGroupCols,
            pivotColumns: this.funcColsService.pivotCols,
            pivotMode: this.columnModel.isPivotMode(),
        };

        const res = callback(params);

        return res;
    }
}
