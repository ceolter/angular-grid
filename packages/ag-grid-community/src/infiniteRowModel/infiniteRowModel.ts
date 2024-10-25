import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { RowNode } from '../entities/rowNode';
import type { FilterManager } from '../filter/filterManager';
import { _getRowHeightAsNumber, _getRowIdCallback } from '../gridOptionsUtils';
import type { IDatasource } from '../interfaces/iDatasource';
import type { IRowModel, RowBounds, RowModelType } from '../interfaces/iRowModel';
import type { ISelectionService } from '../interfaces/iSelectionService';
import type { RowRenderer } from '../rendering/rowRenderer';
import type { SortService } from '../sort/sortService';
import { _jsonEquals } from '../utils/generic';
import type { InfiniteCacheParams } from './infiniteCache';
import { InfiniteCache } from './infiniteCache';
import type { RowNodeBlockLoader } from './rowNodeBlockLoader';

export class InfiniteRowModel extends BeanStub implements NamedBean, IRowModel {
    beanName = 'rowModel' as const;

    private filterManager?: FilterManager;
    private sortSvc?: SortService;
    private selectionSvc?: ISelectionService;
    private rowRenderer: RowRenderer;
    private rowNodeBlockLoader: RowNodeBlockLoader;

    public wireBeans(beans: BeanCollection): void {
        this.filterManager = beans.filterManager;
        this.sortSvc = beans.sortSvc;
        this.selectionSvc = beans.selectionSvc;
        this.rowRenderer = beans.rowRenderer;
        this.rowNodeBlockLoader = beans.rowNodeBlockLoader!;
    }

    private infiniteCache: InfiniteCache | null | undefined;
    private datasource: IDatasource | null | undefined;
    private rowHeight: number;
    private cacheParams: InfiniteCacheParams;

    public getRowBounds(index: number): RowBounds {
        return {
            rowHeight: this.rowHeight,
            rowTop: this.rowHeight * index,
        };
    }

    // we don't implement as lazy row heights is not supported in this row model
    public ensureRowHeightsValid(): boolean {
        return false;
    }

    public postConstruct(): void {
        if (this.gos.get('rowModelType') !== 'infinite') {
            return;
        }

        this.rowHeight = _getRowHeightAsNumber(this.gos);

        this.addEventListeners();

        this.addDestroyFunc(() => this.destroyCache());
    }

    public start(): void {
        this.setDatasource(this.gos.get('datasource'));
    }

    public override destroy(): void {
        this.destroyDatasource();
        super.destroy();
    }

    private destroyDatasource(): void {
        if (this.datasource) {
            this.destroyBean(this.datasource);
            this.rowRenderer.datasourceChanged();
            this.datasource = null;
        }
    }

    private addEventListeners(): void {
        this.addManagedEventListeners({
            filterChanged: this.onFilterChanged.bind(this),
            sortChanged: this.onSortChanged.bind(this),
            newColumnsLoaded: this.onColumnEverything.bind(this),
            storeUpdated: this.onCacheUpdated.bind(this),
        });

        this.addManagedPropertyListener('datasource', () => this.setDatasource(this.gos.get('datasource')));
        this.addManagedPropertyListener('cacheBlockSize', () => this.resetCache());
        this.addManagedPropertyListener('rowHeight', () => {
            this.rowHeight = _getRowHeightAsNumber(this.gos);
            this.cacheParams.rowHeight = this.rowHeight;
            this.updateRowHeights();
        });
    }

    private onFilterChanged(): void {
        this.reset();
    }

    private onSortChanged(): void {
        this.reset();
    }

    private onColumnEverything(): void {
        let resetRequired;
        // if cache params, we require reset only if sort model has changed. we don't need to check
        // for filter model, as the filter manager will fire an event when columns change that result
        // in the filter changing.
        if (this.cacheParams) {
            resetRequired = this.isSortModelDifferent();
        } else {
            // if no cacheParams, means first time creating the cache, so always create one
            resetRequired = true;
        }
        if (resetRequired) {
            this.reset();
        }
    }

    private isSortModelDifferent(): boolean {
        return !_jsonEquals(this.cacheParams.sortModel, this.sortSvc?.getSortModel() ?? []);
    }

    public getType(): RowModelType {
        return 'infinite';
    }

    public setDatasource(datasource: IDatasource | undefined): void {
        this.destroyDatasource();
        this.datasource = datasource;

        // only reset if we have a valid datasource to working with
        if (datasource) {
            this.reset();
        }
    }

    public isEmpty(): boolean {
        return !this.infiniteCache;
    }

    public isRowsToRender(): boolean {
        return !!this.infiniteCache;
    }

    public getNodesInRangeForSelection(firstInRange: RowNode, lastInRange: RowNode): RowNode[] {
        return this.infiniteCache ? this.infiniteCache.getRowNodesInRange(firstInRange, lastInRange) : [];
    }

    private reset() {
        // important to return here, as the user could be setting filter or sort before
        // data-source is set
        if (!this.datasource) {
            return;
        }

        // if user is providing id's, then this means we can keep the selection between datasource hits,
        // as the rows will keep their unique id's even if, for example, server side sorting or filtering
        // is done.
        const getRowIdFunc = _getRowIdCallback(this.gos);
        const userGeneratingIds = getRowIdFunc != null;

        if (!userGeneratingIds) {
            this.selectionSvc?.reset('rowDataChanged');
        }

        this.resetCache();
    }

    private dispatchModelUpdatedEvent() {
        this.eventSvc.dispatchEvent({
            type: 'modelUpdated',
            // not sure if these should all be false - noticed if after implementing,
            // maybe they should be true?
            newPage: false,
            newPageSize: false,
            newData: false,
            keepRenderedRows: true,
            animate: false,
        });
    }

    private resetCache(): void {
        // if not first time creating a cache, need to destroy the old one
        this.destroyCache();

        this.cacheParams = {
            // the user provided datasource
            datasource: this.datasource,

            // sort and filter model
            filterModel: this.filterManager?.getFilterModel() ?? {},
            sortModel: this.sortSvc?.getSortModel() ?? [],

            rowNodeBlockLoader: this.rowNodeBlockLoader,

            // properties - this way we take a snapshot of them, so if user changes any, they will be
            // used next time we create a new cache, which is generally after a filter or sort change,
            // or a new datasource is set
            initialRowCount: this.gos.get('infiniteInitialRowCount'),
            maxBlocksInCache: this.gos.get('maxBlocksInCache'),
            rowHeight: _getRowHeightAsNumber(this.gos),

            // if user doesn't provide overflow, we use default overflow of 1, so user can scroll past
            // the current page and request first row of next page
            overflowSize: this.gos.get('cacheOverflowSize'),

            // page size needs to be 1 or greater. having it at 1 would be silly, as you would be hitting the
            // server for one page at a time. so the default if not specified is 100.
            blockSize: this.gos.get('cacheBlockSize'),

            // the cache could create this, however it is also used by the pages, so handy to create it
            // here as the settings are also passed to the pages
            lastAccessedSequence: { value: 0 },
        } as InfiniteCacheParams;

        this.infiniteCache = this.createBean(new InfiniteCache(this.cacheParams));

        this.eventSvc.dispatchEventOnce({
            type: 'rowCountReady',
        });

        this.dispatchModelUpdatedEvent();
    }

    private updateRowHeights() {
        this.forEachNode((node) => {
            node.setRowHeight(this.rowHeight);
            node.setRowTop(this.rowHeight * node.rowIndex!);
        });

        this.dispatchModelUpdatedEvent();
    }

    private destroyCache(): void {
        if (this.infiniteCache) {
            this.infiniteCache = this.destroyBean(this.infiniteCache);
        }
    }

    private onCacheUpdated(): void {
        this.dispatchModelUpdatedEvent();
    }

    public getRow(rowIndex: number): RowNode | undefined {
        if (!this.infiniteCache) {
            return undefined;
        }
        if (rowIndex >= this.infiniteCache.getRowCount()) {
            return undefined;
        }
        return this.infiniteCache.getRow(rowIndex);
    }

    public getRowNode(id: string): RowNode | undefined {
        let result: RowNode | undefined;
        this.forEachNode((rowNode) => {
            if (rowNode.id === id) {
                result = rowNode;
            }
        });
        return result;
    }

    public forEachNode(callback: (rowNode: RowNode, index: number) => void): void {
        if (this.infiniteCache) {
            this.infiniteCache.forEachNodeDeep(callback);
        }
    }

    public getTopLevelRowCount(): number {
        return this.getRowCount();
    }

    public getTopLevelRowDisplayedIndex(topLevelIndex: number): number {
        return topLevelIndex;
    }

    public getRowIndexAtPixel(pixel: number): number {
        if (this.rowHeight !== 0) {
            // avoid divide by zero error
            const rowIndexForPixel = Math.floor(pixel / this.rowHeight);
            const lastRowIndex = this.getRowCount() - 1;
            if (rowIndexForPixel > lastRowIndex) {
                return lastRowIndex;
            }
            return rowIndexForPixel;
        }
        return 0;
    }

    public getRowCount(): number {
        return this.infiniteCache ? this.infiniteCache.getRowCount() : 0;
    }

    public isRowPresent(rowNode: RowNode): boolean {
        const foundRowNode = this.getRowNode(rowNode.id!);
        return !!foundRowNode;
    }

    public refreshCache(): void {
        if (this.infiniteCache) {
            this.infiniteCache.refreshCache();
        }
    }

    public purgeCache(): void {
        if (this.infiniteCache) {
            this.infiniteCache.purgeCache();
        }
    }

    // for iRowModel
    public isLastRowIndexKnown(): boolean {
        if (this.infiniteCache) {
            return this.infiniteCache.isLastRowIndexKnown();
        }
        return false;
    }

    public setRowCount(rowCount: number, lastRowIndexKnown?: boolean): void {
        if (this.infiniteCache) {
            this.infiniteCache.setRowCount(rowCount, lastRowIndexKnown);
        }
    }
}
