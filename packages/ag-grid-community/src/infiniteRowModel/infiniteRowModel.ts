import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowNode } from '../entities/rowNode';
import { _getRowHeightAsNumber, _getRowIdCallback } from '../gridOptionsUtils';
import type { IDatasource } from '../interfaces/iDatasource';
import type { IRowModel, RowBounds, RowModelType } from '../interfaces/iRowModel';
import { _jsonEquals } from '../utils/generic';
import type { InfiniteCacheParams } from './infiniteCache';
import { InfiniteCache } from './infiniteCache';

export class InfiniteRowModel extends BeanStub implements NamedBean, IRowModel {
    beanName = 'rowModel' as const;

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

        this.rowHeight = _getRowHeightAsNumber(this.beans);

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
            this.beans.rowRenderer.datasourceChanged();
            this.datasource = null;
        }
    }

    private addEventListeners(): void {
        this.addManagedEventListeners({
            filterChanged: this.reset.bind(this),
            sortChanged: this.reset.bind(this),
            newColumnsLoaded: this.onColumnEverything.bind(this),
            storeUpdated: this.dispatchModelUpdatedEvent.bind(this),
        });

        this.addManagedPropertyListener('datasource', () => this.setDatasource(this.gos.get('datasource')));
        this.addManagedPropertyListener('cacheBlockSize', () => this.resetCache());
        this.addManagedPropertyListener('rowHeight', () => {
            this.rowHeight = _getRowHeightAsNumber(this.beans);
            this.cacheParams.rowHeight = this.rowHeight;
            this.updateRowHeights();
        });
    }

    private onColumnEverything(): void {
        let resetRequired;
        // if cache params, we require reset only if sort model has changed. we don't need to check
        // for filter model, as the filter manager will fire an event when columns change that result
        // in the filter changing.
        if (this.cacheParams) {
            resetRequired = !_jsonEquals(this.cacheParams.sortModel, this.beans.sortSvc?.getSortModel() ?? []);
        } else {
            // if no cacheParams, means first time creating the cache, so always create one
            resetRequired = true;
        }
        if (resetRequired) {
            this.reset();
        }
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
        return this.infiniteCache?.getRowNodesInRange(firstInRange, lastInRange) ?? [];
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
            this.beans.selectionSvc?.reset('rowDataChanged');
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

        const beans = this.beans;
        const { filterManager, sortSvc, rowNodeBlockLoader, eventSvc, gos } = beans;

        this.cacheParams = {
            // the user provided datasource
            datasource: this.datasource,

            // sort and filter model
            filterModel: filterManager?.getFilterModel() ?? {},
            sortModel: sortSvc?.getSortModel() ?? [],

            rowNodeBlockLoader: rowNodeBlockLoader,

            // properties - this way we take a snapshot of them, so if user changes any, they will be
            // used next time we create a new cache, which is generally after a filter or sort change,
            // or a new datasource is set
            initialRowCount: gos.get('infiniteInitialRowCount'),
            maxBlocksInCache: gos.get('maxBlocksInCache'),
            rowHeight: _getRowHeightAsNumber(beans),

            // if user doesn't provide overflow, we use default overflow of 1, so user can scroll past
            // the current page and request first row of next page
            overflowSize: gos.get('cacheOverflowSize'),

            // page size needs to be 1 or greater. having it at 1 would be silly, as you would be hitting the
            // server for one page at a time. so the default if not specified is 100.
            blockSize: gos.get('cacheBlockSize'),

            // the cache could create this, however it is also used by the pages, so handy to create it
            // here as the settings are also passed to the pages
            lastAccessedSequence: { value: 0 },
        } as InfiniteCacheParams;

        this.infiniteCache = this.createBean(new InfiniteCache(this.cacheParams));

        eventSvc.dispatchEventOnce({
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
        this.infiniteCache = this.destroyBean(this.infiniteCache);
    }

    public getRow(rowIndex: number): RowNode | undefined {
        const infiniteCache = this.infiniteCache;
        if (!infiniteCache) {
            return undefined;
        }
        if (rowIndex >= infiniteCache.getRowCount()) {
            return undefined;
        }
        return infiniteCache.getRow(rowIndex);
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
        this.infiniteCache?.forEachNodeDeep(callback);
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
        return !!this.getRowNode(rowNode.id!);
    }

    public refreshCache(): void {
        this.infiniteCache?.refreshCache();
    }

    public purgeCache(): void {
        this.infiniteCache?.purgeCache();
    }

    // for iRowModel
    public isLastRowIndexKnown(): boolean {
        return this.infiniteCache?.isLastRowIndexKnown() ?? false;
    }

    public setRowCount(rowCount: number, lastRowIndexKnown?: boolean): void {
        this.infiniteCache?.setRowCount(rowCount, lastRowIndexKnown);
    }
}
