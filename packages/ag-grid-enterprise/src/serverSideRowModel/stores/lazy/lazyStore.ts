import type {
    AgColumn,
    BeanCollection,
    FuncColsService,
    IRowNode,
    ISelectionService,
    IServerSideStore,
    IsApplyServerSideTransactionParams,
    LoadSuccessParams,
    RowBounds,
    RowNode,
    ServerSideGroupLevelParams,
    ServerSideGroupLevelState,
    ServerSideTransaction,
    ServerSideTransactionResult,
    StoreRefreshAfterParams,
    WithoutGridCommon,
} from 'ag-grid-community';
import {
    BeanStub,
    ServerSideTransactionResultStatus,
    _createRowNodeFooter,
    _destroyRowNodeFooter,
    _getGroupTotalRowCallback,
    _getRowHeightAsNumber,
    _getRowIdCallback,
    _warn,
} from 'ag-grid-community';

import type { BlockUtils } from '../../blocks/blockUtils';
import type { SSRMParams } from '../../serverSideRowModel';
import type { StoreUtils } from '../storeUtils';
import { LazyCache } from './lazyCache';

export class LazyStore extends BeanStub implements IServerSideStore {
    private blockUtils: BlockUtils;
    private storeUtils: StoreUtils;
    private selectionService?: ISelectionService;
    private funcColsService: FuncColsService;

    public wireBeans(beans: BeanCollection) {
        this.blockUtils = beans.ssrmBlockUtils as BlockUtils;
        this.storeUtils = beans.ssrmStoreUtils as StoreUtils;
        this.selectionService = beans.selectionService;
        this.funcColsService = beans.funcColsService;
    }

    // display indexes
    private displayIndexStart: number | undefined;
    private displayIndexEnd: number | undefined;

    // group positioning
    private topPx: number;
    private heightPx: number;

    // group details
    private readonly level: number;
    private readonly group: boolean;
    private readonly leafGroup: boolean;
    private readonly ssrmParams: SSRMParams;
    private readonly storeParams: ServerSideGroupLevelParams;
    private readonly parentRowNode: RowNode;
    private groupField: string | undefined;
    private rowGroupColumn: AgColumn;

    private idSequence = { value: 0 };
    private cache: LazyCache;
    private info: any;

    constructor(ssrmParams: SSRMParams, storeParams: ServerSideGroupLevelParams, parentRowNode: RowNode) {
        super();
        this.ssrmParams = ssrmParams;
        this.parentRowNode = parentRowNode;
        this.storeParams = storeParams;
        this.level = parentRowNode.level + 1;
        this.group = ssrmParams.rowGroupCols ? this.level < ssrmParams.rowGroupCols.length : false;
        this.leafGroup = ssrmParams.rowGroupCols ? this.level === ssrmParams.rowGroupCols.length - 1 : false;
        this.info = {};
    }

    public postConstruct() {
        let numberOfRows = 1;
        if (this.level === 0) {
            numberOfRows = this.storeUtils.getServerSideInitialRowCount() ?? 1;

            this.eventService.dispatchEventOnce({
                type: 'rowCountReady',
            });
        }
        this.cache = this.createManagedBean(new LazyCache(this, numberOfRows, false, this.storeParams));

        const usingTreeData = this.gos.get('treeData');

        if (!usingTreeData && this.group) {
            const groupColVo = this.ssrmParams.rowGroupCols[this.level];
            this.groupField = groupColVo.field!;
            this.rowGroupColumn = this.funcColsService.rowGroupCols[this.level];
        }
    }

    public override destroy(): void {
        this.displayIndexStart = undefined;
        this.displayIndexEnd = undefined;
        this.destroyBean(this.cache);
        super.destroy();
    }

    /**
     * Given a server response, ingest the rows outside of the data source lifecycle.
     *
     * @param rowDataParams the server response containing the rows to ingest
     * @param startRow the index to start ingesting rows
     * @param expectedRows the expected number of rows in the response (used to determine if the last row index is known)
     */
    applyRowData(rowDataParams: LoadSuccessParams, startRow: number, expectedRows: number) {
        this.cache.onLoadSuccess(startRow, expectedRows, rowDataParams);
    }

    /**
     * Applies a given transaction to the data set within this store
     *
     * @param transaction an object containing delta instructions determining the changes to apply to this store
     * @returns an object determining the status of this transaction and effected nodes
     */
    applyTransaction(transaction: ServerSideTransaction): ServerSideTransactionResult {
        const idFunc = _getRowIdCallback(this.gos);
        if (!idFunc) {
            _warn(206);
            return {
                status: ServerSideTransactionResultStatus.Cancelled,
            };
        }

        const applyCallback = this.gos.getCallback('isApplyServerSideTransaction');
        if (applyCallback) {
            const params: WithoutGridCommon<IsApplyServerSideTransactionParams> = {
                transaction: transaction,
                parentNode: this.parentRowNode,
                groupLevelInfo: this.info,
            };
            const apply = applyCallback(params);
            if (!apply) {
                return { status: ServerSideTransactionResultStatus.Cancelled };
            }
        }

        // needs checked before transactions are applied, as rows won't be contiguous immediately
        // after
        const allRowsLoaded = this.cache.isStoreFullyLoaded();

        let updatedNodes: RowNode[] | undefined = undefined;
        if (transaction.update?.length) {
            updatedNodes = this.cache.updateRowNodes(transaction.update);
        }

        let insertedNodes: RowNode[] | undefined = undefined;
        if (transaction.add?.length) {
            let addIndex = transaction.addIndex;
            if (addIndex != null && addIndex < 0) {
                addIndex = undefined;
            }
            insertedNodes = this.cache.insertRowNodes(transaction.add, addIndex);
        }

        let removedNodes: RowNode[] | undefined = undefined;
        if (transaction.remove?.length) {
            const allIdsToRemove = transaction.remove.map((data) =>
                idFunc({ level: this.level, parentKeys: this.parentRowNode.getRoute() ?? [], data })
            );
            const allUniqueIdsToRemove = [...new Set(allIdsToRemove)];
            removedNodes = this.cache.removeRowNodes(allUniqueIdsToRemove);
        }

        const isClientSideSortingEnabled = this.gos.get('serverSideEnableClientSideSort');

        const isUpdateOrAdd = updatedNodes?.length || insertedNodes?.length;
        const isClientSideSort = allRowsLoaded && isClientSideSortingEnabled;
        if (isClientSideSort && isUpdateOrAdd) {
            // if client side sorting, we need to sort the rows after the transaction
            this.cache.clientSideSortRows();
        }

        this.updateSelectionAfterTransaction(updatedNodes, removedNodes);
        return {
            status: ServerSideTransactionResultStatus.Applied,
            update: updatedNodes,
            add: insertedNodes,
            remove: removedNodes,
        };
    }

    private updateSelectionAfterTransaction(updatedNodes?: RowNode[], removedNodes?: RowNode[]) {
        if (!this.selectionService) {
            return;
        }
        const nodesToDeselect: RowNode[] = [];
        updatedNodes?.forEach((node) => {
            if (node.isSelected() && !node.selectable) {
                nodesToDeselect.push(node);
            }
        });

        removedNodes?.forEach((node) => {
            if (node.isSelected()) {
                nodesToDeselect.push(node);
            }
        });

        if (nodesToDeselect.length) {
            this.selectionService.setNodesSelected({
                newValue: false,
                clearSelection: false,
                nodes: nodesToDeselect,
                source: 'rowDataChanged',
            });
        }
    }

    /**
     * Clear the display indexes, used for fading rows out when stores are not being destroyed
     */
    clearDisplayIndexes(): void {
        this.displayIndexStart = undefined;
        this.displayIndexEnd = undefined;
        this.cache.getNodes().forEach((lazyNode) => this.blockUtils.clearDisplayIndex(lazyNode.node));

        if (this.parentRowNode.sibling) {
            this.blockUtils.clearDisplayIndex(this.parentRowNode.sibling);
        }
        this.cache.clearDisplayIndexes();
    }

    /**
     * @returns an index representing the last sequentially displayed row in the grid for this store
     */
    getDisplayIndexStart(): number | undefined {
        return this.displayIndexStart;
    }

    /**
     * @returns the index representing one after the last sequentially displayed row in the grid for this store
     */
    getDisplayIndexEnd(): number | undefined {
        return this.displayIndexEnd;
    }

    /**
     * @returns the virtual size of this store
     */
    getRowCount(): number {
        if (this.parentRowNode.sibling) {
            return this.cache.getRowCount() + 1;
        }
        return this.cache.getRowCount();
    }

    /**
     * Sets the current row count of the store, and whether the last row index is known
     */
    setRowCount(rowCount: number, isLastRowIndexKnown?: boolean): void {
        this.cache.setRowCount(rowCount, isLastRowIndexKnown);
    }

    /**
     * Given a display index, returns whether that row is within this store or a child store of this store
     *
     * @param displayIndex the visible index of a row
     * @returns whether or not the row exists within this store
     */
    isDisplayIndexInStore(displayIndex: number): boolean {
        if (this.cache.getRowCount() === 0) return false;

        return this.displayIndexStart! <= displayIndex && displayIndex < this.getDisplayIndexEnd()!;
    }

    /**
     * Recursively sets up the display indexes and top position of every node belonging to this store.
     *
     * Called after a row height changes, or a store updated event.
     *
     * @param displayIndexSeq the number sequence for generating the display index of each row
     * @param nextRowTop an object containing the next row top value intended to be modified by ref per row
     */
    setDisplayIndexes(displayIndexSeq: { value: number }, nextRowTop: { value: number }, uiLevel: number): void {
        this.displayIndexStart = displayIndexSeq.value;
        this.topPx = nextRowTop.value;

        const footerNode =
            this.parentRowNode.level > -1 && _getGroupTotalRowCallback(this.gos)({ node: this.parentRowNode });
        if (!footerNode) {
            _destroyRowNodeFooter(this.parentRowNode);
        }

        if (footerNode === 'top') {
            _createRowNodeFooter(this.parentRowNode, this.beans);
            this.blockUtils.setDisplayIndex(this.parentRowNode.sibling, displayIndexSeq, nextRowTop, uiLevel);
        }

        // delegate to the store to set the row display indexes
        this.cache.setDisplayIndexes(displayIndexSeq, nextRowTop, uiLevel);

        if (footerNode === 'bottom') {
            _createRowNodeFooter(this.parentRowNode, this.beans);
            this.blockUtils.setDisplayIndex(this.parentRowNode.sibling, displayIndexSeq, nextRowTop, uiLevel);
        }

        this.displayIndexEnd = displayIndexSeq.value;
        this.heightPx = nextRowTop.value - this.topPx;
    }

    /**
     * Recursively applies a provided function to every node
     *
     * For the purpose of exclusively server side filtered stores, this is the same as getNodes().forEachDeepAfterFilterAndSort
     */
    forEachStoreDeep(callback: (store: LazyStore, index: number) => void, sequence = { value: 0 }): void {
        callback(this, sequence.value++);
        this.cache.getNodes().forEach((lazyNode) => {
            const childCache = lazyNode.node.childStore as LazyStore | undefined;
            if (childCache) {
                childCache.forEachStoreDeep(callback, sequence);
            }
        });
    }

    /**
     * Recursively applies a provided function to every node
     *
     * For the purpose of exclusively server side filtered stores, this is the same as getNodes().forEachDeepAfterFilterAndSort
     */
    forEachNodeDeep(callback: (rowNode: RowNode<any>, index: number) => void, sequence = { value: 0 }): void {
        this.cache.getNodes().forEach((lazyNode) => {
            callback(lazyNode.node, sequence.value++);
            const childCache = lazyNode.node.childStore as LazyStore | undefined;
            if (childCache) {
                childCache.forEachNodeDeep(callback, sequence);
            }
        });
    }

    /**
     * Recursively applies a provided function to every node
     *
     * For the purpose of exclusively server side filtered stores, this is the same as getNodes().forEachDeep
     */
    forEachNodeDeepAfterFilterAndSort(
        callback: (rowNode: RowNode<any>, index: number) => void,
        sequence = { value: 0 },
        includeFooterNodes = false
    ): void {
        const footerNode =
            this.parentRowNode.level > -1 && _getGroupTotalRowCallback(this.gos)({ node: this.parentRowNode });
        if (footerNode === 'top') {
            callback(this.parentRowNode.sibling, sequence.value++);
        }

        const orderedNodes = this.cache.getOrderedNodeMap();
        for (const lazyNode of Object.values(orderedNodes)) {
            callback(lazyNode.node, sequence.value++);
            const childCache = lazyNode.node.childStore as LazyStore | undefined;
            if (childCache) {
                childCache.forEachNodeDeepAfterFilterAndSort(callback, sequence, includeFooterNodes);
            }
        }

        if (footerNode === 'bottom') {
            callback(this.parentRowNode.sibling, sequence.value++);
        }
    }

    /**
     * Removes the failed status from all nodes, and marks them as stub to encourage reloading
     */
    retryLoads(): void {
        this.cache.getNodes().forEach(({ node }) => {
            if (node.failedLoad) {
                node.failedLoad = false;
                node.__needsRefreshWhenVisible = true;
                node.stub = true;
            }
        });
        this.forEachChildStoreShallow((store) => store.retryLoads());
        this.fireStoreUpdatedEvent();
    }

    /**
     * Given a display index, returns the row at that location.
     *
     * @param displayRowIndex the displayed index within the grid to search for
     * @returns the row node if the display index falls within the store, if it didn't exist this will create a new stub to return
     */
    getRowUsingDisplayIndex(displayRowIndex: number): IRowNode<any> | undefined {
        if (this.parentRowNode.sibling && displayRowIndex === this.parentRowNode.sibling.rowIndex) {
            return this.parentRowNode.sibling;
        }
        return this.cache.getRowByDisplayIndex(displayRowIndex);
    }

    /**
     * Given a display index, returns the row top and height for the row at that index.
     *
     * @param displayIndex the display index of the node
     * @returns an object containing the rowTop and rowHeight of the node at the given displayIndex
     */
    getRowBounds(displayIndex: number): RowBounds | null {
        if (!this.isDisplayIndexInStore(displayIndex)) {
            return null;
        }

        const thisNode = this.cache.getNodeCachedByDisplayIndex(displayIndex);
        if (thisNode) {
            const boundsFromRow = this.blockUtils.extractRowBounds(thisNode, displayIndex);
            if (boundsFromRow) {
                return boundsFromRow;
            }
        }

        const { previousNode, nextNode } = this.cache.getSurroundingNodesByDisplayIndex(displayIndex) ?? {};

        // previous node may equal, or catch via detail node or child of group
        if (previousNode) {
            const boundsFromRow = this.blockUtils.extractRowBounds(previousNode.node, displayIndex);
            if (boundsFromRow != null) {
                return boundsFromRow;
            }
        }

        const defaultRowHeight = _getRowHeightAsNumber(this.gos);
        // if node after this, can calculate backwards (and ignore detail/grouping)
        if (nextNode) {
            const numberOfRowDiff = (nextNode.node.rowIndex! - displayIndex) * defaultRowHeight;
            return {
                rowTop: nextNode.node.rowTop! - numberOfRowDiff,
                rowHeight: defaultRowHeight,
            };
        }

        // otherwise calculate from end of store
        const lastTop = this.topPx + this.heightPx;
        const numberOfRowDiff = (this.getDisplayIndexEnd()! - displayIndex) * defaultRowHeight;
        return {
            rowTop: lastTop - numberOfRowDiff,
            rowHeight: defaultRowHeight,
        };
    }

    /**
     * Given a vertical pixel, determines whether this store contains a row at that pixel
     *
     * @param pixel a vertical pixel position from the grid
     * @returns whether that pixel points to a virtual space belonging to this store
     */
    isPixelInRange(pixel: number): boolean {
        return pixel >= this.topPx && pixel < this.topPx + this.heightPx;
    }

    /**
     * Given a vertical pixel, returns the row existing at that pixel location
     *
     * @param pixel a vertical pixel position from the grid
     * @returns the display index at the given pixel location
     */
    getRowIndexAtPixel(pixel: number): number | null {
        if (pixel < this.topPx) {
            return this.getDisplayIndexStart()!;
        }

        if (pixel >= this.topPx + this.heightPx) {
            return this.getDisplayIndexEnd()! - 1;
        }

        if (
            this.parentRowNode.sibling &&
            pixel > this.parentRowNode.sibling.rowTop! &&
            pixel < this.parentRowNode.sibling.rowTop! + this.parentRowNode.sibling.rowHeight!
        ) {
            return this.parentRowNode.sibling.rowIndex!;
        }

        let distToPreviousNodeTop: number = Number.MAX_SAFE_INTEGER;
        let previousNode: RowNode | null = null;
        let distToNextNodeTop: number = Number.MAX_SAFE_INTEGER;
        let nextNode: RowNode | null = null;

        this.cache.getNodes().forEach(({ node }) => {
            const distBetween = Math.abs(pixel - node.rowTop!);

            // previous node
            if (node.rowTop! < pixel) {
                if (distBetween < distToPreviousNodeTop) {
                    distToPreviousNodeTop = distBetween;
                    previousNode = node;
                }
                return;
            }
            // next node
            if (distBetween < distToNextNodeTop) {
                distToNextNodeTop = distBetween;
                nextNode = node;
            }
        });

        // cast these back as typescript doesn't understand the forEach above
        previousNode = previousNode as RowNode | null;
        nextNode = nextNode as RowNode | null;

        // previous node may equal, or catch via detail node or child of group
        if (previousNode) {
            const indexOfRow = this.blockUtils.getIndexAtPixel(previousNode, pixel);
            if (indexOfRow != null) {
                return indexOfRow;
            }
        }

        const defaultRowHeight = _getRowHeightAsNumber(this.gos);
        // if node after this, can calculate backwards (and ignore detail/grouping)
        if (nextNode) {
            const nextTop = nextNode.rowTop!;
            const numberOfRowDiff = Math.ceil((nextTop - pixel) / defaultRowHeight);
            return nextNode.rowIndex! - numberOfRowDiff;
        }

        // otherwise calculate from end of store
        const nextTop = this.topPx + this.heightPx;
        const numberOfRowDiff = Math.floor((nextTop - pixel) / defaultRowHeight);
        return this.getDisplayIndexEnd()! - numberOfRowDiff;
    }

    /**
     * Given a path of group keys, returns the child store for that group.
     *
     * @param keys the grouping path to the desired store
     * @returns the child store for the given keys, or null if not found
     */
    getChildStore(keys: string[]): LazyStore | null {
        return this.storeUtils.getChildStore(keys, this, (key: string) => {
            const lazyNode = this.cache.getNodes().find((lazyNode) => lazyNode.node.key == key);
            if (!lazyNode) {
                return null;
            }
            return lazyNode.node;
        });
    }

    /**
     * Executes a provided callback on each child store belonging to this store
     *
     * @param cb the callback to execute
     */
    private forEachChildStoreShallow(cb: (store: LazyStore) => void) {
        this.cache.getNodes().forEach(({ node }) => {
            if (node.childStore) {
                cb(node.childStore as LazyStore);
            }
        });
    }

    /**
     * Executes after a change to sorting, determines recursively whether this store or a child requires refreshed.
     *
     * If a purge refresh occurs, the row count is preserved.
     *
     * @param params a set of properties pertaining to the sort changes
     */
    refreshAfterSort(params: StoreRefreshAfterParams) {
        const serverSortsAllLevels = this.storeUtils.isServerSideSortAllLevels();
        if (
            serverSortsAllLevels ||
            this.storeUtils.isServerRefreshNeeded(this.parentRowNode, this.ssrmParams.rowGroupCols, params)
        ) {
            const allRowsLoaded = this.cache.isStoreFullyLoaded();
            const isClientSideSortingEnabled = this.gos.get('serverSideEnableClientSideSort');

            const isClientSideSort = allRowsLoaded && isClientSideSortingEnabled;
            if (!isClientSideSort) {
                // if last row index was known, add a row back for lazy loading.
                const oldCount = this.cache.getRowCount();
                const lastKnown = this.cache.isLastRowIndexKnown();
                this.destroyBean(this.cache);
                this.cache = this.createManagedBean(new LazyCache(this, oldCount, lastKnown, this.storeParams));
                return;
            }

            // client side sorting only handles one level, so allow it to pass through
            // to recursive sort.
            this.cache.clientSideSortRows();
        }

        // call refreshAfterSort on children, as we did not purge.
        // if we did purge, no need to do this as all children were destroyed
        this.forEachChildStoreShallow((store) => store.refreshAfterSort(params));
    }

    /**
     * Executes after a change to filtering, determines recursively whether this store or a child requires refreshed.
     *
     * If a refresh occurs, the row count is reset.
     *
     * @param params a set of properties pertaining to the filter changes
     */
    refreshAfterFilter(params: StoreRefreshAfterParams) {
        const serverFiltersAllLevels = !this.storeUtils.isServerSideOnlyRefreshFilteredGroups();
        if (
            serverFiltersAllLevels ||
            this.storeUtils.isServerRefreshNeeded(this.parentRowNode, this.ssrmParams.rowGroupCols, params)
        ) {
            this.refreshStore(true);
            return;
        }

        // call refreshAfterFilter on children, as we did not purge.
        // if we did purge, no need to do this as all children were destroyed
        this.forEachChildStoreShallow((store) => store.refreshAfterFilter(params));
    }

    /**
     * Marks all existing nodes as requiring reloaded, and triggers a load check
     *
     * @param purge whether to remove all nodes and data in favour of stub nodes
     */
    refreshStore(purge: boolean) {
        if (purge) {
            this.destroyBean(this.cache);
            this.cache = this.createManagedBean(new LazyCache(this, 1, false, this.storeParams));
            this.fireStoreUpdatedEvent();
            return;
        }

        this.cache.markNodesForRefresh();
    }

    /**
     * Used for pagination, given a local/store index, returns the display index of that row
     *
     * @param topLevelIndex the store index of a row
     * @returns the display index for the given store index
     */
    getTopLevelRowDisplayedIndex(topLevelIndex: number): number {
        const displayIndex = this.cache.getDisplayIndexFromStoreIndex(topLevelIndex);
        return displayIndex ?? topLevelIndex;
    }

    /**
     * Used for pagination to determine if the last page is known, and for aria to determine if the last grid row is known
     *
     * @returns whether the last index of this store is known, or if lazy loading still required
     */
    isLastRowIndexKnown(): boolean {
        return this.cache.isLastRowIndexKnown();
    }

    /**
     * Used by the selection service to select a range of nodes
     *
     * @param firstInRange the first node in the range to find
     * @param lastInRange the last node in the range to find
     * @returns a range of nodes between firstInRange and lastInRange inclusive
     */
    getRowNodesInRange(firstInRange: RowNode<any>, lastInRange: RowNode<any>): RowNode<any>[] {
        return this.cache
            .getNodes()
            .filter(({ node }) => {
                return node.rowIndex! >= firstInRange.rowIndex! && node.rowIndex! <= lastInRange.rowIndex!;
            })
            .map(({ node }) => node);
    }

    /**
     * Mutates a given array to add this stores state, and recursively add all the children store states.
     *
     * @param result a mutable results array
     */
    addStoreStates(result: ServerSideGroupLevelState[]) {
        result.push({
            route: this.parentRowNode.getRoute() ?? [],
            rowCount: this.getRowCount(),
            lastRowIndexKnown: this.isLastRowIndexKnown(),
            info: this.info,
            maxBlocksInCache: this.storeParams.maxBlocksInCache,
            cacheBlockSize: this.storeParams.cacheBlockSize,
        });
        this.forEachChildStoreShallow((childStore) => childStore.addStoreStates(result));
    }

    public getIdSequence(): { value: number } {
        return this.idSequence;
    }

    public getParentNode() {
        return this.parentRowNode;
    }

    public getRowDetails() {
        return {
            field: this.groupField!,
            group: this.group,
            leafGroup: this.leafGroup,
            level: this.level,
            parent: this.parentRowNode,
            rowGroupColumn: this.rowGroupColumn,
        };
    }

    public getSsrmParams() {
        return this.ssrmParams;
    }

    public setStoreInfo(info: any) {
        if (info) {
            Object.assign(this.info, info);
        }
    }

    // gets called 1) row count changed 2) cache purged
    public fireStoreUpdatedEvent(): void {
        // this results in row model firing ModelUpdated.
        // server side row model also updates the row indexes first
        this.eventService.dispatchEvent({
            type: 'storeUpdated',
        });
    }

    // gets called when row data updated, and no more refreshing needed
    public fireRefreshFinishedEvent(): void {
        this.eventService.dispatchEvent({
            type: 'storeRefreshed',
            route: this.parentRowNode.getRoute(),
        });
    }

    public getBlockStates() {
        return this.cache.getBlockStates();
    }

    public getStoreBounds() {
        return {
            topPx: this.topPx,
            heightPx: this.heightPx,
        };
    }

    public getCache() {
        return this.cache;
    }
}
