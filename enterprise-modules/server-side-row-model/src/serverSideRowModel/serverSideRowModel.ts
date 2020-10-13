import {
    _,
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnApi,
    ColumnController,
    ColumnVO,
    Constants,
    Events,
    FilterManager,
    GridApi,
    GridOptionsWrapper,
    IServerSideDatasource,
    IServerSideRowModel,
    Logger,
    LoggerFactory,
    ModelUpdatedEvent,
    NumberSequence,
    PostConstruct,
    PreDestroy,
    Qualifier,
    RowBounds,
    RowDataChangedEvent,
    RowNode,
    RowRenderer,
    SortController,
    IServerSideStore,
    ServerSideTransaction,
    ServerSideTransactionResult,
    ValueCache
} from "@ag-grid-community/core";
import {ClientSideStore} from "./stores/clientSideStore";
import {CacheStore} from "./stores/cacheStore";
import {SortListener} from "./sortListener";

export function cacheFactory(params: StoreParams, parentNode: RowNode): IServerSideStore {
    const oneBlockCache = params.blockSize == null;
    const CacheClass = oneBlockCache ? ClientSideStore : CacheStore;
    return new CacheClass(params, parentNode);
}

export interface StoreParams {
    blockSize?: number;
    sortModel: any;
    filterModel: any;
    maxBlocksInCache?: number;
    lastAccessedSequence: NumberSequence;
    dynamicRowHeight: boolean;
    rowGroupCols: ColumnVO[];
    valueCols: ColumnVO[];
    pivotCols: ColumnVO[];
    pivotMode: boolean;
    datasource?: IServerSideDatasource;
}

interface AsyncTransactionWrapper {
    transaction: ServerSideTransaction;
    callback?: (result: ServerSideTransactionResult) => void;
}

@Bean('rowModel')
export class ServerSideRowModel extends BeanStub implements IServerSideRowModel {

    @Autowired('valueCache') private valueCache: ValueCache;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('filterManager') private filterManager: FilterManager;
    @Autowired('sortController') private sortController: SortController;
    @Autowired('gridApi') private gridApi: GridApi;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('rowRenderer') private rowRenderer: RowRenderer;
    @Autowired('ssrmSortService') private sortListener: SortListener;

    private rootNode: RowNode;
    private datasource: IServerSideDatasource | undefined;

    private storeParams: StoreParams;

    private asyncTransactionsTimeout: number;
    private asyncTransactions: AsyncTransactionWrapper[];

    private logger: Logger;

    // we don't implement as lazy row heights is not supported in this row model
    public ensureRowHeightsValid(): boolean { return false; }

    public start(): void {
        const datasource = this.gridOptionsWrapper.getServerSideDatasource();

        if (datasource) {
            this.setDatasource(datasource!);
        }
    }

    @PreDestroy
    private destroyDatasource(): void {
        if (!this.datasource) { return; }

        if (this.datasource.destroy) {
            this.datasource.destroy();
        }

        this.rowRenderer.datasourceChanged();
        this.datasource = undefined;
    }

    private setBeans(@Qualifier('loggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.create('ServerSideRowModel');
    }

    public applyTransactionAsync(transaction: ServerSideTransaction, callback?: (res: ServerSideTransactionResult) => void): void {
        if (this.asyncTransactionsTimeout==null) {
            this.asyncTransactions = [];
            const waitMillis = this.gridOptionsWrapper.getAsyncTransactionWaitMillis();
            this.asyncTransactionsTimeout = window.setTimeout(() => {
                this.executeAsyncTransactions();
            }, waitMillis);
        }
        this.asyncTransactions.push({ transaction: transaction, callback: callback });
    }

    private executeAsyncTransactions(): void {

        const resultFuncs: (()=>void)[] = [];

        this.asyncTransactions.forEach(txWrapper => {
            this.executeOnStore(txWrapper.transaction.route, cache => {
                const result = cache.applyTransaction(txWrapper.transaction);
                if (txWrapper.callback) {
                    resultFuncs.push(()=>txWrapper.callback(result));
                }
            });
        });

        // do callbacks in next VM turn so it's async
        if (resultFuncs.length > 0) {
            window.setTimeout(() => {
                resultFuncs.forEach(func => func());
            }, 0);
        }

        this.asyncTransactions = null;
        this.asyncTransactionsTimeout = undefined;

        this.valueCache.onDataChanged();
        this.onStoreUpdated();
    }

    public flushAsyncTransactions(): void {
        if (this.asyncTransactionsTimeout!=null) {
            clearTimeout(this.asyncTransactionsTimeout);
            this.executeAsyncTransactions();
        }
    }

    public applyTransaction(transaction: ServerSideTransaction): ServerSideTransactionResult {
        let res: ServerSideTransactionResult = undefined;

        this.executeOnStore(transaction.route, cache => {
            res = cache.applyTransaction(transaction);
        });

        if (res) {
            this.valueCache.onDataChanged();
            this.onStoreUpdated();
        } else {
            return {routeFound: false};
        }
    }

    @PostConstruct
    private addEventListeners(): void {
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_EVERYTHING_CHANGED, this.onColumnEverything.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_STORE_UPDATED, this.onStoreUpdated.bind(this));

        const resetListener = this.resetRootStore.bind(this);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, resetListener);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_CHANGED, resetListener);
        this.addManagedListener(this.eventService, Events.EVENT_FILTER_CHANGED, resetListener);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, resetListener);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, resetListener);
    }

    public setDatasource(datasource: IServerSideDatasource): void {
        this.destroyDatasource();
        this.datasource = datasource;
        this.resetRootStore();
    }

    public isLastRowIndexKnown(): boolean {
        const cache = this.getRootStore();
        if (!cache) { return false; }
        return cache.isLastRowIndexKnown();
    }

    private onColumnEverything(): void {
        // this is a hack for one customer only, so they can suppress the resetting of the columns.
        // The problem the customer had was they were api.setColumnDefs() after the data source came
        // back with data. So this stops the reload from the grid after the data comes back.
        // Once we have "AG-1591 Allow delta changes to columns" fixed, then this hack can be taken out.
        if (this.gridOptionsWrapper.isSuppressEnterpriseResetOnNewColumns()) {
            return;
        }
        // every other customer can continue as normal and have it working!!!

        // if first time, alwasy reset
        if (!this.storeParams) {
            this.resetRootStore();
            return;
        }

        // check if anything pertaining to fetching data has changed, and if it has, reset, but if
        // it has not, don't reset
        const rowGroupColumnVos = this.columnsToValueObjects(this.columnController.getRowGroupColumns());
        const valueColumnVos = this.columnsToValueObjects(this.columnController.getValueColumns());
        const pivotColumnVos = this.columnsToValueObjects(this.columnController.getPivotColumns());

        const sortModelDifferent = !_.jsonEquals(this.storeParams.sortModel, this.sortController.getSortModel());
        const rowGroupDifferent = !_.jsonEquals(this.storeParams.rowGroupCols, rowGroupColumnVos);
        const pivotDifferent = !_.jsonEquals(this.storeParams.pivotCols, pivotColumnVos);
        const valuesDifferent = !_.jsonEquals(this.storeParams.valueCols, valueColumnVos);

        const resetRequired = sortModelDifferent || rowGroupDifferent || pivotDifferent || valuesDifferent;

        if (resetRequired) {
            this.resetRootStore();
        }
    }

    @PreDestroy
    private destroyRootStore(): void {
        if (!this.rootNode || !this.rootNode.childrenCache) { return; }
        this.rootNode.childrenCache = this.destroyBean(this.rootNode.childrenCache);
    }

    public resetRootStore(): void {
        this.destroyRootStore();

        this.rootNode = new RowNode();
        this.rootNode.group = true;
        this.rootNode.level = -1;
        this.createBean(this.rootNode);

        if (this.datasource) {
            this.storeParams = this.createStoreParams();
            this.rootNode.childrenCache = this.createBean(cacheFactory(this.storeParams, this.rootNode));
            this.updateRowIndexesAndBounds();
        }

        // this event: 1) clears selection 2) updates filters 3) shows/hides 'no rows' overlay
        const rowDataChangedEvent: RowDataChangedEvent = {
            type: Events.EVENT_ROW_DATA_CHANGED,
            api: this.gridApi,
            columnApi: this.columnApi
        };
        this.eventService.dispatchEvent(rowDataChangedEvent);

        // this gets the row to render rows (or remove the previously rendered rows, as it's blank to start).
        // important to NOT pass in an event with keepRenderedRows or animate, as we want the renderer
        // to treat the rows as new rows, as it's all new data
        this.dispatchModelUpdated(true);
    }

    public columnsToValueObjects(columns: Column[]): ColumnVO[] {
        return columns.map(col => ({
            id: col.getId(),
            aggFunc: col.getAggFunc(),
            displayName: this.columnController.getDisplayNameForColumn(col, 'model'),
            field: col.getColDef().field
        }) as ColumnVO);
    }

    private createStoreParams(): StoreParams {

        const rowGroupColumnVos = this.columnsToValueObjects(this.columnController.getRowGroupColumns());
        const valueColumnVos = this.columnsToValueObjects(this.columnController.getValueColumns());
        const pivotColumnVos = this.columnsToValueObjects(this.columnController.getPivotColumns());

        const dynamicRowHeight = this.gridOptionsWrapper.isDynamicRowHeight();
        let maxBlocksInCache = this.gridOptionsWrapper.getMaxBlocksInCache();

        if (dynamicRowHeight && maxBlocksInCache as number >= 0) {
            console.warn('ag-Grid: Server Side Row Model does not support Dynamic Row Height and Cache Purging. ' +
                'Either a) remove getRowHeight() callback or b) remove maxBlocksInCache property. Purging has been disabled.');
            maxBlocksInCache = undefined;
        }

        if (maxBlocksInCache as number >= 0 && this.columnController.isAutoRowHeightActive()) {
            console.warn('ag-Grid: Server Side Row Model does not support Auto Row Height and Cache Purging. ' +
                'Either a) remove colDef.autoHeight or b) remove maxBlocksInCache property. Purging has been disabled.');
            maxBlocksInCache = undefined;
        }

        const userProvidedBlockSize = this.gridOptionsWrapper.getCacheBlockSize();

        let blockSize: number;
        if (typeof userProvidedBlockSize == 'number' && userProvidedBlockSize > 0) {
            blockSize = userProvidedBlockSize;
        } else {
            blockSize = ServerSideBlock.DefaultBlockSize;
        }

        const params: StoreParams = {
            // the columns the user has grouped and aggregated by
            valueCols: valueColumnVos,
            rowGroupCols: rowGroupColumnVos,
            pivotCols: pivotColumnVos,
            pivotMode: this.columnController.isPivotMode(),

            // sort and filter model
            filterModel: this.filterManager.getFilterModel(),
            sortModel: this.sortListener.extractSortModel(),

            datasource: this.datasource,
            lastAccessedSequence: new NumberSequence(),
            maxBlocksInCache: maxBlocksInCache,
            blockSize: blockSize,
            // blockSize: blockSize == null ? 100 : blockSize,
            dynamicRowHeight: dynamicRowHeight
        };

        return params;
    }

    public getParams(): StoreParams {
        return this.storeParams;
    }

    private dispatchModelUpdated(reset = false): void {
        const modelUpdatedEvent: ModelUpdatedEvent = {
            type: Events.EVENT_MODEL_UPDATED,
            api: this.gridApi,
            columnApi: this.columnApi,
            animate: !reset,
            keepRenderedRows: !reset,
            newPage: false,
            newData: false
        };
        this.eventService.dispatchEvent(modelUpdatedEvent);
    }

    private onStoreUpdated(): void {
        this.updateRowIndexesAndBounds();
        this.dispatchModelUpdated();
    }

    public onRowHeightChanged(): void {
        this.updateRowIndexesAndBounds();
        this.dispatchModelUpdated();
    }

    public updateRowIndexesAndBounds(): void {
        const cache = this.getRootStore();
        if (!cache) { return; }

        cache.forEachNodeDeep(rowNode => { rowNode.clearRowTop() }, new NumberSequence());
        cache.setDisplayIndexes(new NumberSequence(), {value: 0});
    }

    public getRow(index: number): RowNode | null {
        const cache = this.getRootStore();
        if (!cache) { return null; }
        return cache.getRowUsingDisplayIndex(index);
    }

    public updateSortModel(newSortModel: any): void {
        this.storeParams.sortModel = newSortModel;
    }

    public getRootStore(): IServerSideStore {
        if (this.rootNode && this.rootNode.childrenCache) {
            return (this.rootNode.childrenCache as IServerSideStore);
        } else {
            return undefined;
        }
    }

    public getRowCount(): number {
        const cache = this.getRootStore();
        if (!cache) { return 1; }
        return cache.getDisplayIndexEnd();
    }

    public getTopLevelRowCount(): number {
        const cache = this.getRootStore();
        if (!cache) { return 1; }
        return cache.getRowCount();
    }

    public getTopLevelRowDisplayedIndex(topLevelIndex: number): number {
        const cache = this.getRootStore();
        if (!cache) { return topLevelIndex; }
        return cache.getTopLevelRowDisplayedIndex(topLevelIndex);
    }

    public getRowBounds(index: number): RowBounds {
        const cache = this.getRootStore();
        if (!cache) {
            const rowHeight = this.gridOptionsWrapper.getRowHeightAsNumber();
            return {
                rowTop: 0,
                rowHeight: rowHeight
            };
        }
        return cache.getRowBounds(index);
    }

    public getRowIndexAtPixel(pixel: number): number {
        const cache = this.getRootStore();
        if (pixel<=0 || !cache) { return 0; }
        return cache.getRowIndexAtPixel(pixel);
    }

    public isEmpty(): boolean {
        return false;
    }

    public isRowsToRender(): boolean {
        return this.getRootStore()!=null && this.getRowCount() > 0;
    }

    public getType(): string {
        return Constants.ROW_MODEL_TYPE_SERVER_SIDE;
    }

    public forEachNode(callback: (rowNode: RowNode, index: number) => void): void {
        const cache = this.getRootStore();
        if (!cache) { return; }
        cache.forEachNodeDeep(callback);
    }

    private executeOnStore(route: string[], callback: (cache: IServerSideStore) => void) {
        const rootStore = this.getRootStore();
        if (!rootStore) { return; }

        const storeToExecuteOn = rootStore.getChildStore(route);

        if (storeToExecuteOn) {
            callback(storeToExecuteOn);
        }
    }

    public purgeStore(route: string[] = []): void {
        this.executeOnStore(route, cache => cache.purgeStore());
    }

    public getNodesInRangeForSelection(firstInRange: RowNode, lastInRange: RowNode): RowNode[] {
        if (_.exists(lastInRange) && firstInRange.parent !== lastInRange.parent) {
            return [];
        }
        return (firstInRange.parent!.childrenCache as IServerSideStore)!.getRowNodesInRange(lastInRange, firstInRange);
    }

    public getRowNode(id: string): RowNode | null {
        let result: RowNode | null = null;
        this.forEachNode(rowNode => {
            if (rowNode.id === id) {
                result = rowNode;
            }
            if (rowNode.detailNode && rowNode.detailNode.id === id) {
                result = rowNode.detailNode;
            }
        });
        return result;
    }

    // always returns true - this is used by the
    public isRowPresent(rowNode: RowNode): boolean {
        const foundRowNode = this.getRowNode(rowNode.id);
        return !!foundRowNode;
    }
}
