import type {
    BeanCollection,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    LoadSuccessParams,
    NamedBean,
    RowNode,
    RowRenderer,
} from 'ag-grid-community';
import { BeanStub, _getMaxConcurrentDatasourceRequests } from 'ag-grid-community';

import type { ServerSideRowModel } from '../../serverSideRowModel';
import type { LazyCache } from './lazyCache';
import type { LazyStore } from './lazyStore';

export class LazyBlockLoadingService extends BeanStub implements NamedBean {
    beanName = 'lazyBlockLoadingSvc' as const;

    private outboundRequests: number = 0;
    private maxOutboundRequests: number | undefined;

    private rowRenderer: RowRenderer;
    private rowModel: ServerSideRowModel;

    public wireBeans(beans: BeanCollection) {
        this.rowRenderer = beans.rowRenderer;
        this.rowModel = beans.rowModel as ServerSideRowModel;
    }

    // a map of caches to loading nodes
    private cacheLoadingNodesMap: Map<LazyCache, Set<number>> = new Map();

    // if a check is queued to happen this cycle
    private isCheckQueued = false;

    // this is cached for blockLoadDebounce
    private nextBlockToLoad?: { cache: LazyCache; index: number } = undefined;
    private loaderTimeout?: number;

    public postConstruct() {
        this.maxOutboundRequests = _getMaxConcurrentDatasourceRequests(this.gos);
    }

    public subscribe(cache: LazyCache) {
        this.cacheLoadingNodesMap.set(cache, new Set());
    }

    public unsubscribe(cache: LazyCache) {
        this.cacheLoadingNodesMap.delete(cache);
    }

    /**
     * Queues a microtask to check if any blocks need to be loaded.
     */
    public queueLoadCheck() {
        if (this.isCheckQueued) {
            return;
        }
        this.isCheckQueued = true;
        window.queueMicrotask(() => {
            this.queueLoadAction();
            this.isCheckQueued = false;
        });
    }

    private onLoadComplete(): void {
        this.outboundRequests -= 1;
        this.queueLoadCheck();
    }

    private hasAvailableLoadBandwidth() {
        if (this.maxOutboundRequests === undefined) {
            return true;
        }
        return this.outboundRequests < this.maxOutboundRequests;
    }

    private queueLoadAction() {
        const nextBlockToLoad = this.getBlockToLoad();
        if (!nextBlockToLoad) {
            return;
        }

        // for blockLoadDebounceMillis, if the next block to load is the same as the last block to load, ignore
        // otherwise cancel existing timeout and requeue
        const isSameBlock =
            this.nextBlockToLoad &&
            this.nextBlockToLoad.cache === nextBlockToLoad.cache &&
            this.nextBlockToLoad.index === nextBlockToLoad.index;
        if (isSameBlock) {
            return;
        }

        if (!this.nextBlockToLoad || !isSameBlock) {
            this.nextBlockToLoad = nextBlockToLoad;
            window.clearTimeout(this.loaderTimeout);

            const startRow = Number(this.nextBlockToLoad.index);
            const cache = this.nextBlockToLoad.cache;
            const endRow = nextBlockToLoad.index + nextBlockToLoad.cache.getBlockSize();
            this.loaderTimeout = window.setTimeout(() => {
                if (!cache.isAlive()) {
                    return;
                }
                this.loaderTimeout = undefined;
                this.attemptLoad(cache, startRow, endRow);
                this.nextBlockToLoad = undefined;
            }, this.gos.get('blockLoadDebounceMillis'));
        }
    }

    private attemptLoad(cache: LazyCache, start: number, end: number) {
        const hasBandwidth = this.hasAvailableLoadBandwidth();
        // too many loads already, ignore the request as a successful request will requeue itself anyway
        if (!hasBandwidth) {
            return;
        }

        this.executeLoad(cache, start, end);

        // requeue a load action before waiting for a response, this is to enable
        // more than one block to load simultaneously due to maxConcurrentDatasourceRequests
        this.queueLoadCheck();
    }

    private executeLoad(cache: LazyCache, startRow: number, endRow: number) {
        const ssrmParams = cache.getSsrmParams();
        const request: IServerSideGetRowsRequest = {
            startRow,
            endRow,
            rowGroupCols: ssrmParams.rowGroupCols,
            valueCols: ssrmParams.valueCols,
            pivotCols: ssrmParams.pivotCols,
            pivotMode: ssrmParams.pivotMode,
            groupKeys: (cache as any).store.getParentNode().getRoute() ?? [],
            filterModel: ssrmParams.filterModel,
            sortModel: ssrmParams.sortModel,
        };

        const loadingNodes = this.cacheLoadingNodesMap.get(cache)!;
        const removeNodesFromLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                loadingNodes.delete(startRow + i);
            }
        };

        const addNodesToLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                loadingNodes.add(startRow + i);
            }
        };

        const success = (params: LoadSuccessParams) => {
            this.onLoadComplete();
            cache.onLoadSuccess(startRow, endRow - startRow, params);
            removeNodesFromLoadingMap();
        };

        const fail = () => {
            this.onLoadComplete();
            cache.onLoadFailed(startRow, endRow - startRow);
            removeNodesFromLoadingMap();
        };

        const params: IServerSideGetRowsParams = this.gos.addGridCommonParams({
            request,
            success,
            fail,
            parentNode: (cache as any).store.getParentNode(),
        });

        addNodesToLoadingMap();
        this.outboundRequests += 1;
        cache.getSsrmParams().datasource?.getRows(params);
    }

    private getBlockToLoad() {
        const firstRowInViewport = this.rowRenderer.getFirstVirtualRenderedRow();
        const lastRowInViewport = this.rowRenderer.getLastVirtualRenderedRow();

        // quick look-up for priority rows needing loading in viewport.
        for (let i = firstRowInViewport; i <= lastRowInViewport; i++) {
            const row = this.rowModel.getRow(i);
            if (!row) {
                continue;
            }

            const store = row.parent?.childStore as LazyStore | undefined;
            if (!store) {
                continue;
            }

            const cache: LazyCache = store.getCache();
            const lazyNode = cache.getNodes().getBy('node', row);
            if (!lazyNode) {
                continue;
            }

            const loadingNodes = this.cacheLoadingNodesMap.get(cache);
            if (loadingNodes?.has(lazyNode.index)) {
                continue;
            }

            if (row.__needsRefreshWhenVisible || (row.stub && !row.failedLoad)) {
                return {
                    cache: cache,
                    index: cache.getBlockStartIndex(lazyNode.index),
                };
            }
        }

        let cacheToRefresh: LazyCache | null = null;
        let nodeToRefresh: RowNode | null = null;
        let nodeToRefreshDist: number = Number.MAX_SAFE_INTEGER;

        for (const cache of this.cacheLoadingNodesMap.keys()) {
            const nodesToRefresh = cache.getNodesToRefresh();
            nodesToRefresh.forEach((node) => {
                if (node.rowIndex == null) {
                    nodeToRefresh = node;
                    cacheToRefresh = cache;
                    return;
                }

                const lazyNode = cache.getNodes().getBy('node', node);
                if (!lazyNode) {
                    return;
                }

                const loadingNodes = this.cacheLoadingNodesMap.get(cache);
                if (loadingNodes?.has(lazyNode.index)) {
                    return;
                }

                const distToViewportTop = Math.abs(firstRowInViewport - node.rowIndex);
                const distToViewportBottom = Math.abs(node.rowIndex - lastRowInViewport);
                if (distToViewportTop < nodeToRefreshDist) {
                    nodeToRefresh = node;
                    nodeToRefreshDist = distToViewportTop;
                    cacheToRefresh = cache;
                }

                if (distToViewportBottom < nodeToRefreshDist) {
                    nodeToRefresh = node;
                    nodeToRefreshDist = distToViewportBottom;
                    cacheToRefresh = cache;
                }
            });
        }

        if (!cacheToRefresh) {
            return undefined;
        }

        const lazyCache = cacheToRefresh as LazyCache;

        const lazyIndex = lazyCache.getNodes().getBy('node', nodeToRefresh)?.index;
        return lazyIndex == null
            ? undefined
            : {
                  cache: lazyCache,
                  index: lazyCache.getBlockStartIndex(lazyIndex),
              };
    }

    public isRowLoading(cache: LazyCache, index: number) {
        return this.cacheLoadingNodesMap.get(cache)?.has(index) ?? false;
    }
}
