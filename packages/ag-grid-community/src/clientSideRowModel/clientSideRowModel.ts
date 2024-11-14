import type { ColumnModel } from '../columns/columnModel';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { GridOptions } from '../entities/gridOptions';
import type { RowHighlightPosition } from '../entities/rowNode';
import { ROW_ID_PREFIX_ROW_GROUP, RowNode } from '../entities/rowNode';
import type { CssVariablesChanged, FilterChangedEvent } from '../events';
import { _getGroupSelectsDescendants, _getRowHeightForNode, _isAnimateRows, _isDomLayout } from '../gridOptionsUtils';
import type { IClientSideNodeManager } from '../interfaces/iClientSideNodeManager';
import type {
    ClientSideRowModelStage,
    IClientSideRowModel,
    RefreshModelParams,
} from '../interfaces/iClientSideRowModel';
import type { RowBounds, RowModelType } from '../interfaces/iRowModel';
import type { IRowNodeStage } from '../interfaces/iRowNodeStage';
import type { RowDataTransaction } from '../interfaces/rowDataTransaction';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { _EmptyArray, _last, _removeFromArray } from '../utils/array';
import { ChangedPath } from '../utils/changedPath';
import { _debounce } from '../utils/function';
import { _warn } from '../validation/logging';
import type { ValueCache } from '../valueService/valueCache';
import { ChangedRowNodes } from './changedRowNodes';
import { updateRowNodeAfterFilter } from './filterStage';
import { updateRowNodeAfterSort } from './sortStage';

enum RecursionType {
    Normal,
    AfterFilter,
    AfterFilterAndSort,
    PivotNodes,
}

interface ClientSideRowModelRootNode extends RowNode {
    childrenAfterGroup: RowNode[] | null;
}

interface ClientSideRowModelRowNode extends RowNode {
    sourceRowIndex: number;
}

export interface BatchTransactionItem<TData = any> {
    rowDataTransaction: RowDataTransaction<TData>;
    callback: ((res: RowNodeTransaction<TData>) => void) | undefined;
}

export interface RowNodeMap {
    [id: string]: RowNode;
}

export class ClientSideRowModel extends BeanStub implements IClientSideRowModel, NamedBean {
    beanName = 'rowModel' as const;

    private colModel: ColumnModel;
    private valueCache?: ValueCache;

    // standard stages
    private filterStage?: IRowNodeStage;
    private sortStage?: IRowNodeStage;
    private flattenStage?: IRowNodeStage<RowNode[]>;

    // enterprise stages
    private groupStage?: IRowNodeStage;
    private aggStage?: IRowNodeStage;
    private pivotStage?: IRowNodeStage;
    private filterAggStage?: IRowNodeStage;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.valueCache = beans.valueCache;

        this.filterStage = beans.filterStage;
        this.sortStage = beans.sortStage;
        this.flattenStage = beans.flattenStage;

        this.groupStage = beans.groupStage;
        this.aggStage = beans.aggStage;
        this.pivotStage = beans.pivotStage;
        this.filterAggStage = beans.filterAggStage;
    }

    private onRowHeightChanged_debounced = _debounce(this, this.onRowHeightChanged.bind(this), 100);

    // top most node of the tree. the children are the user provided data.
    public rootNode: RowNode | null = null;

    private rowsToDisplay: RowNode[] = []; // the rows mapped to rows to display
    private nodeManager: IClientSideNodeManager<any>;
    private rowDataTransactionBatch: BatchTransactionItem[] | null;
    private lastHighlightedRow: RowNode | null;
    private applyAsyncTransactionsTimeout: number | undefined;
    /** Has the start method been called */
    private started: boolean = false;
    /** E.g. data has been set into the node manager already */
    private pendingChangedRowNodesBeforeStart: ChangedRowNodes | null = null;
    /**
     * This is to prevent refresh model being called when it's already being called.
     * E.g. the group stage can trigger initial state filter model to be applied. This fires onFilterChanged,
     * which then triggers the listener here that calls refresh model again but at the filter stage
     * (which is about to be run by the original call).
     */
    private isRefreshingModel: boolean = false;
    private rowNodesCountReady: boolean = false;
    private rowCountReady: boolean = false;
    private orderedStages: IRowNodeStage[];

    public postConstruct(): void {
        this.orderedStages = [
            this.groupStage,
            this.filterStage,
            this.pivotStage,
            this.aggStage,
            this.sortStage,
            this.filterAggStage,
            this.flattenStage,
        ].filter((stage) => !!stage) as IRowNodeStage[];
        const refreshEverythingFunc = this.refreshModel.bind(this, { step: 'group' });
        const refreshEverythingAfterColsChangedFunc = this.refreshModel.bind(this, {
            step: 'group', // after cols change, row grouping (the first stage) could of changed
            afterColumnsChanged: true,
            keepRenderedRows: true,
            // we want animations cos sorting or filtering could be applied
            animate: !this.gos.get('suppressAnimationFrame'),
        });

        this.addManagedEventListeners({
            newColumnsLoaded: refreshEverythingAfterColsChangedFunc,
            columnRowGroupChanged: refreshEverythingFunc,
            columnValueChanged: this.onValueChanged.bind(this),
            columnPivotChanged: this.refreshModel.bind(this, { step: 'pivot' }),
            filterChanged: this.onFilterChanged.bind(this),
            sortChanged: this.onSortChanged.bind(this),
            columnPivotModeChanged: refreshEverythingFunc,
            gridStylesChanged: this.onGridStylesChanges.bind(this),
            gridReady: this.onGridReady.bind(this),
        });

        // doesn't need done if doing full reset
        // Property listeners which call `refreshModel` at different stages
        this.addPropertyListeners();

        const rootNode = new RowNode(this.beans);
        this.rootNode = rootNode;
        this.nodeManager = this.getNodeManagerToUse();
        this.nodeManager.activate(rootNode);
    }

    private getNodeManagerToUse(): IClientSideNodeManager<any> {
        const { gos, beans } = this;

        const treeData = gos.get('treeData');
        const childrenField = gos.get('treeDataChildrenField');

        const isTree = childrenField || treeData;

        let nodeManager: IClientSideNodeManager<any> | undefined;
        if (isTree) {
            nodeManager = childrenField ? beans.csrmChildrenTreeNodeSvc : beans.csrmPathTreeNodeSvc;
        }

        if (!nodeManager) {
            nodeManager = beans.csrmNodeSvc!;
        }

        return nodeManager;
    }

    private addPropertyListeners() {
        // Omitted Properties
        //
        // We do not act reactively on all functional properties, as it's possible the application is React and
        // has not memoised the property and it's getting set every render.
        //
        // ** LIST OF NON REACTIVE, NO ARGUMENT
        //
        // getDataPath, getRowId -- these are called once for each Node when the Node is created.
        //                       -- these are immutable Node properties (ie a Node ID cannot be changed)
        //
        // isRowMaster           -- called when masterDetail is true and the Node is created or the property was changed
        //
        // getRowHeight - this is called once when Node is created, if a new getRowHeight function is provided,
        //              - we do not revisit the heights of each node.
        //
        // pivotDefaultExpanded - relevant for initial pivot column creation, no impact on existing pivot columns.
        //
        // deltaSort - this changes the type of algorithm used only, it doesn't change the sort order. so no point
        //           - in doing the sort again as the same result will be got. the new Prop will be used next time we sort.
        //
        // ** LIST OF NON REACTIVE, SOME ARGUMENT
        // ** For these, they could be reactive, but not convinced the business argument is strong enough,
        // ** so leaving as non-reactive for now, and see if anyone complains.
        //
        // processPivotResultColDef, processPivotResultColGroupDef
        //                       - there is an argument for having these reactive, that if the application changes
        //                       - these props, we should re-create the Pivot Columns, however it's highly unlikely
        //                       - the application would change these functions, far more likely the functions were
        //                       - non memoised correctly.

        const allProps: (keyof GridOptions)[] = [
            'rowData',
            'treeData',
            'treeDataChildrenField',
            ...this.orderedStages.flatMap(({ refreshProps }) => [...refreshProps]),
        ];

        this.addManagedPropertyListeners(allProps, (params) => {
            const properties = params.changeSet?.properties;
            if (properties) {
                this.refreshModel({ step: 'nothing', changedProps: new Set(properties) });
            }
        });

        this.addManagedPropertyListener('rowHeight', () => this.resetRowHeights());
    }

    public start(): void {
        this.started = true;
        const changedRowNodes = this.pendingChangedRowNodesBeforeStart;
        if (changedRowNodes) {
            this.pendingChangedRowNodesBeforeStart = null;
            this.refreshModel({ step: 'group', changedRowNodes });
        } else {
            this.setInitialData();
        }
    }

    private setInitialData(): void {
        const rowData = this.gos.get('rowData');
        if (rowData) {
            this.refreshModel({ step: 'nothing', changedProps: new Set(['rowData']) });
        }
    }

    public ensureRowHeightsValid(
        startPixel: number,
        endPixel: number,
        startLimitIndex: number,
        endLimitIndex: number
    ): boolean {
        let atLeastOneChange: boolean;
        let res = false;

        // we do this multiple times as changing the row heights can also change the first and last rows,
        // so the first pass can make lots of rows smaller, which means the second pass we end up changing
        // more rows.
        do {
            atLeastOneChange = false;

            const rowAtStartPixel = this.getRowIndexAtPixel(startPixel);
            const rowAtEndPixel = this.getRowIndexAtPixel(endPixel);

            // keep check to current page if doing pagination
            const firstRow = Math.max(rowAtStartPixel, startLimitIndex);
            const lastRow = Math.min(rowAtEndPixel, endLimitIndex);

            for (let rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
                const rowNode = this.getRow(rowIndex);
                if (rowNode.rowHeightEstimated) {
                    const rowHeight = _getRowHeightForNode(this.beans, rowNode);
                    rowNode.setRowHeight(rowHeight.height);
                    atLeastOneChange = true;
                    res = true;
                }
            }

            if (atLeastOneChange) {
                this.setRowTopAndRowIndex();
            }
        } while (atLeastOneChange);

        return res;
    }

    private onPropChange(properties: (keyof GridOptions)[]): RefreshModelParams | null {
        const changedProps = new Set(properties);
        const params: RefreshModelParams = { step: 'nothing', changedProps };
        this.refreshModel(params);
        return params;
    }

    private setRowTopAndRowIndex(): Set<string> {
        const { beans } = this;
        const defaultRowHeight = beans.environment.getDefaultRowHeight();
        let nextRowTop = 0;

        // mapping displayed rows is not needed for this method, however it's used in
        // clearRowTopAndRowIndex(), and given we are looping through this.rowsToDisplay here,
        // we create the map here for performance reasons, so we don't loop a second time
        // in clearRowTopAndRowIndex()
        const displayedRowsMapped = new Set<string>();

        // we don't estimate if doing fullHeight or autoHeight, as all rows get rendered all the time
        // with these two layouts.
        const allowEstimate = _isDomLayout(this.gos, 'normal');

        const rowsToDisplay = this.rowsToDisplay;
        for (let i = 0, len = rowsToDisplay.length; i < len; ++i) {
            const rowNode = rowsToDisplay[i];

            if (rowNode.id != null) {
                displayedRowsMapped.add(rowNode.id);
            }

            if (rowNode.rowHeight == null) {
                const rowHeight = _getRowHeightForNode(beans, rowNode, allowEstimate, defaultRowHeight);
                rowNode.setRowHeight(rowHeight.height, rowHeight.estimated);
            }

            rowNode.setRowTop(nextRowTop);
            rowNode.setRowIndex(i);
            nextRowTop += rowNode.rowHeight!;
        }

        return displayedRowsMapped;
    }

    private clearRowTopAndRowIndex(changedPath: ChangedPath, displayedRowsMapped: Set<string>): void {
        const changedPathActive = changedPath.active;

        const clearIfNotDisplayed = (rowNode: RowNode) => {
            if (rowNode && rowNode.id != null && !displayedRowsMapped.has(rowNode.id)) {
                rowNode.clearRowTopAndRowIndex();
            }
        };

        const recurse = (rowNode: RowNode | null) => {
            if (rowNode === null) {
                return;
            }

            clearIfNotDisplayed(rowNode);
            clearIfNotDisplayed(rowNode.detailNode);
            clearIfNotDisplayed(rowNode.sibling);

            if (rowNode.hasChildren()) {
                if (rowNode.childrenAfterGroup) {
                    // if a changedPath is active, it means we are here because of a transaction update or
                    // a change detection. neither of these impacts the open/closed state of groups. so if
                    // a group is not open this time, it was not open last time. so we know all closed groups
                    // already have their top positions cleared. so there is no need to traverse all the way
                    // when changedPath is active and the rowNode is not expanded.
                    const isRootNode = rowNode.level == -1; // we need to give special consideration for root node,
                    // as expanded=undefined for root node
                    const skipChildren = changedPathActive && !isRootNode && !rowNode.expanded;
                    if (!skipChildren) {
                        rowNode.childrenAfterGroup.forEach(recurse);
                    }
                }
            }
        };

        recurse(this.rootNode);
    }

    // returns false if row was moved, otherwise true
    public ensureRowsAtPixel(rowNodes: RowNode[], pixel: number, increment: number = 0): boolean {
        const indexAtPixelNow = this.getRowIndexAtPixel(pixel);
        const rowNodeAtPixelNow = this.getRow(indexAtPixelNow);
        const animate = !this.gos.get('suppressAnimationFrame');

        if (rowNodeAtPixelNow === rowNodes[0]) {
            return false;
        }

        const rootNode = this.rootNode;
        const allLeafChildren = rootNode?.allLeafChildren;
        if (!allLeafChildren) {
            return false;
        }

        // TODO: this implementation is currently quite inefficient and it could be optimized to run in O(n) in a single pass

        rowNodes.forEach((rowNode) => {
            _removeFromArray(allLeafChildren, rowNode);
        });

        rowNodes.forEach((rowNode, idx) => {
            allLeafChildren.splice(Math.max(indexAtPixelNow + increment, 0) + idx, 0, rowNode);
        });

        rowNodes.forEach((rowNode: ClientSideRowModelRowNode, index) => {
            rowNode.sourceRowIndex = index;
        });

        const changedRowNodes = new ChangedRowNodes(rootNode, false);

        // We assume the order changed and we don't need to check if it really did
        changedRowNodes.rowsOrderChanged = true;

        // TODO: This could be optimized by properly building the right ChangedPath but it would require extensive testing
        // for this reason we force ChangedPath to run a full DFS.
        changedRowNodes.changedPath.active = false;

        this.refreshModel({
            step: 'group',
            keepRenderedRows: true,
            animate,
            changedRowNodes,
        });

        return true;
    }

    public highlightRowAtPixel(rowNode: RowNode | null, pixel?: number): void {
        const indexAtPixelNow = pixel != null ? this.getRowIndexAtPixel(pixel) : null;
        const rowNodeAtPixelNow = indexAtPixelNow != null ? this.getRow(indexAtPixelNow) : null;

        if (!rowNodeAtPixelNow || !rowNode || pixel == null) {
            this.clearHighlightedRow();
            return;
        }

        const highlight = this.getHighlightPosition(pixel, rowNodeAtPixelNow);
        const isSamePosition = this.isHighlightingCurrentPosition(rowNode, rowNodeAtPixelNow, highlight);
        const isDifferentNode = this.lastHighlightedRow != null && this.lastHighlightedRow !== rowNodeAtPixelNow;

        if (isSamePosition || isDifferentNode) {
            this.clearHighlightedRow();
            if (isSamePosition) {
                return;
            }
        }

        this.setRowNodeHighlighted(rowNodeAtPixelNow, highlight);
        this.lastHighlightedRow = rowNodeAtPixelNow;
    }

    private setRowNodeHighlighted(rowNode: RowNode, highlighted: RowHighlightPosition | null): void {
        if (rowNode.highlighted !== highlighted) {
            rowNode.highlighted = highlighted;
            rowNode.dispatchRowEvent('rowHighlightChanged');
        }
    }

    public getHighlightPosition(pixel: number, rowNode?: RowNode): RowHighlightPosition {
        if (!rowNode) {
            const index = this.getRowIndexAtPixel(pixel);
            rowNode = this.getRow(index || 0);

            if (!rowNode) {
                return 'Below';
            }
        }

        const { rowTop, rowHeight } = rowNode;

        return pixel - rowTop! < rowHeight! / 2 ? 'Above' : 'Below';
    }

    public getLastHighlightedRowNode(): RowNode | null {
        return this.lastHighlightedRow;
    }

    private isHighlightingCurrentPosition(
        movingRowNode: RowNode,
        hoveredRowNode: RowNode,
        highlightPosition: RowHighlightPosition
    ): boolean {
        if (movingRowNode === hoveredRowNode) {
            return true;
        }

        const diff = highlightPosition === 'Above' ? -1 : 1;

        if (this.getRow(hoveredRowNode.rowIndex! + diff) === movingRowNode) {
            return true;
        }

        return false;
    }

    private clearHighlightedRow(): void {
        if (this.lastHighlightedRow) {
            this.setRowNodeHighlighted(this.lastHighlightedRow, null);
            this.lastHighlightedRow = null;
        }
    }

    public isLastRowIndexKnown(): boolean {
        return true;
    }

    public getRowCount(): number {
        if (this.rowsToDisplay) {
            return this.rowsToDisplay.length;
        }

        return 0;
    }

    /**
     * Returns the number of rows with level === 1
     */
    public getTopLevelRowCount(): number {
        const rootNode = this.rootNode;
        if (!rootNode) {
            return 0;
        }

        if (this.rowsToDisplay.length === 0) {
            return 0;
        }

        // exception to func comment, if showing root node, then we return that
        const showingRootNode = this.rowsToDisplay && this.rowsToDisplay[0] === rootNode;
        if (showingRootNode) {
            return 1;
        }

        const filteredChildren = rootNode.childrenAfterAggFilter;
        const totalFooterInc = rootNode.sibling ? 1 : 0;
        return (filteredChildren ? filteredChildren.length : 0) + totalFooterInc;
    }

    /**
     * Get the row display index by the top level index
     * top level index is the index of rows with level === 1
     */
    public getTopLevelRowDisplayedIndex(topLevelIndex: number): number {
        const { rootNode, rowsToDisplay } = this;
        const showingRootNode = !rootNode || !rowsToDisplay.length || rowsToDisplay[0] === rootNode;

        // exception to function comment, if showing footer node (level === -1) return 0.
        if (showingRootNode) {
            return topLevelIndex;
        }

        const { childrenAfterSort } = rootNode;

        const getDefaultIndex = (adjustedIndex: number) => {
            let rowNode = childrenAfterSort![adjustedIndex];

            if (this.gos.get('groupHideOpenParents')) {
                // if hideOpenParents, then get lowest displayed descendent
                while (rowNode.expanded && rowNode.childrenAfterSort && rowNode.childrenAfterSort.length > 0) {
                    rowNode = rowNode.childrenAfterSort[0];
                }
            }

            return rowNode.rowIndex!;
        };

        const { footerSvc } = this.beans;
        if (footerSvc) {
            return footerSvc.getTopDisplayIndex(rowsToDisplay, topLevelIndex, childrenAfterSort!, getDefaultIndex);
        } else {
            return getDefaultIndex(topLevelIndex);
        }
    }

    public getRowBounds(index: number): RowBounds | null {
        const rowNode = this.rowsToDisplay[index];

        if (rowNode) {
            return {
                rowTop: rowNode.rowTop!,
                rowHeight: rowNode.rowHeight!,
            };
        }

        return null;
    }

    public onRowGroupOpened(): void {
        const animate = _isAnimateRows(this.gos);
        this.refreshModel({ step: 'map', keepRenderedRows: true, animate: animate });
    }

    private onFilterChanged(event: FilterChangedEvent): void {
        if (event.afterDataChange) {
            return;
        }
        const animate = _isAnimateRows(this.gos);
        const primaryOrQuickFilterChanged = event.columns.length === 0 || event.columns.some((col) => col.isPrimary());
        const step: ClientSideRowModelStage = primaryOrQuickFilterChanged ? 'filter' : 'filter_aggregates';
        this.refreshModel({ step: step, keepRenderedRows: true, animate: animate });
    }

    private onSortChanged(): void {
        const animate = _isAnimateRows(this.gos);
        this.refreshModel({
            step: 'sort',
            keepRenderedRows: true,
            animate: animate,
        });
    }

    public getType(): RowModelType {
        return 'clientSide';
    }

    private onValueChanged(): void {
        this.refreshModel({ step: this.colModel.isPivotActive() ? 'pivot' : 'aggregate' });
    }

    private isSuppressModelUpdateAfterUpdateTransaction(params: RefreshModelParams): boolean {
        if (!this.gos.get('suppressModelUpdateAfterUpdateTransaction')) {
            return false;
        }

        const rowNodeTransactions = params.changedRowNodes?.rowNodeTransactions;

        if (!rowNodeTransactions) {
            return false;
        }

        const transWithAddsOrDeletes = rowNodeTransactions.some(
            (tx) => (tx.add != null && tx.add.length > 0) || (tx.remove != null && tx.remove.length > 0)
        );

        // return true if we are only doing update transactions
        const transactionsContainUpdatesOnly = !transWithAddsOrDeletes;
        return transactionsContainUpdatesOnly;
    }

    public refreshModel(params: RefreshModelParams): void {
        const rootNode = this.rootNode;
        if (!rootNode) {
            return; // Destroyed
        }

        const gos = this.gos;
        const changedProps = params.changedProps;

        const rowDataChanged = changedProps?.has('rowData');
        const treeDataChanged = changedProps?.has('treeData');
        const treeDataChildrenFieldChanged = changedProps?.has('treeDataChildrenField');

        let nodeManager = this.nodeManager;
        const newNodeManager = this.getNodeManagerToUse();

        const reset =
            nodeManager !== newNodeManager ||
            treeDataChildrenFieldChanged ||
            (treeDataChanged && !gos.get('treeDataChildrenField'));

        let newRowData: any[] | null | undefined;

        if (treeDataChanged) {
            params.step = 'group';
        }

        if (reset || rowDataChanged) {
            newRowData = gos.get('rowData');

            if (newRowData != null && !Array.isArray(newRowData)) {
                newRowData = null;
                _warn(1);
            }
        }

        if (reset && !rowDataChanged) {
            // No new rowData was passed, so to include user executed transaction we need to extract
            // the row data from the node manager as it might be different from the original rowData
            newRowData = nodeManager?.extractRowData() ?? newRowData;
        }

        if (nodeManager !== newNodeManager) {
            nodeManager?.deactivate();
            nodeManager = newNodeManager;
            this.nodeManager = nodeManager;
            nodeManager.activate(rootNode);
        }

        if (reset) {
            nodeManager.activate(rootNode);
        }

        if (newRowData) {
            const immutable =
                !reset &&
                this.started &&
                !this.isEmpty() &&
                newRowData.length > 0 &&
                gos.exists('getRowId') &&
                // this property is a backwards compatibility property, for those who want
                // the old behaviour of Row IDs but NOT Immutable Data.
                !gos.get('resetRowDataOnUpdate');

            if (immutable) {
                params.keepRenderedRows = true;
                params.animate = !this.gos.get('suppressAnimationFrame');
                const changedRowNodes = new ChangedRowNodes(rootNode, false);

                if (this.nodeManager.setImmutableRowData(changedRowNodes, newRowData)) {
                    params.step = 'group';
                    params.changedRowNodes = changedRowNodes;
                }
            } else {
                const changedRowNodes = new ChangedRowNodes(rootNode, true);

                params.step = 'group';
                params.changedRowNodes = changedRowNodes;

                // no need to invalidate cache, as the cache is stored on the rowNode,
                // so new rowNodes means the cache is wiped anyway.

                // - clears selection, done before we set row data to ensure it isn't readded via `selectionSvc.syncInOldRowNode`
                this.beans.selectionSvc?.reset('rowDataChanged');

                this.rowNodesCountReady = true;
                this.nodeManager.setNewRowData(changedRowNodes, newRowData);
            }
        }

        if (changedProps && params.step === 'nothing') {
            for (const { refreshProps, step } of this.orderedStages) {
                for (const prop of changedProps) {
                    if (refreshProps.has(prop)) {
                        params.step = step;
                        break;
                    }
                }
            }
            if (params.step === 'nothing') {
                return; // Nothing to do.
            }
        }

        // this goes through the pipeline of stages. what's in my head is similar
        // to the diagram on this page:
        // http://commons.apache.org/sandbox/commons-pipeline/pipeline_basics.html
        // however we want to keep the results of each stage, hence we manually call
        // each step rather than have them chain each other.

        // fallthrough in below switch is on purpose,
        // eg if STEP_FILTER, then all steps below this
        // step get done
        // let start: number;
        // console.log('======= start =======');

        this.nodeManager.refreshModel(params);

        this.eventSvc.dispatchEvent({ type: 'beforeRefreshModel', params, started: this.started });

        const changedRowNodes = params.changedRowNodes;
        if (!this.started) {
            if (changedRowNodes) {
                this.pendingChangedRowNodesBeforeStart = changedRowNodes;
            }
            return; // Not yet started
        }

        if (params.changedRowNodes) {
            this.eventSvc.dispatchEvent({ type: 'rowDataUpdated' });
        }

        if (
            this.isRefreshingModel ||
            this.colModel.changeEventsDispatching ||
            this.isSuppressModelUpdateAfterUpdateTransaction(params)
        ) {
            return;
        }

        this.isRefreshingModel = true;

        let changedPath = changedRowNodes?.changedPath;
        if (!changedPath) {
            changedPath = new ChangedPath(false, rootNode);
            changedPath.active = false; // No changedRowNodes means we consider all paths as changed
        }

        switch (params.step) {
            case 'group':
                this.doRowGrouping(changedRowNodes, changedPath, !!params.afterColumnsChanged);
            /* eslint-disable no-fallthrough */
            case 'filter':
                this.doFilter(changedPath);
            case 'pivot':
                this.doPivot(changedPath);
            case 'aggregate': // depends on agg fields
                this.doAggregate(changedPath);
            case 'filter_aggregates':
                this.doFilterAggregates(changedPath);
            case 'sort':
                this.doSort(changedRowNodes, changedPath);
            case 'map':
                this.doRowsToDisplay();
            /* eslint-enable no-fallthrough */
        }

        // set all row tops to null, then set row tops on all visible rows. if we don't
        // do this, then the algorithm below only sets row tops, old row tops from old rows
        // will still lie around
        const displayedNodesMapped = this.setRowTopAndRowIndex();
        this.clearRowTopAndRowIndex(changedPath, displayedNodesMapped);

        this.isRefreshingModel = false;

        this.eventSvc.dispatchEvent({
            type: 'modelUpdated',
            animate: params.animate,
            keepRenderedRows: params.keepRenderedRows,
            newData: params.changedRowNodes?.newData ?? false,
            newPage: false,
            keepUndoRedoStack: params.keepUndoRedoStack,
        });
    }

    public isEmpty(): boolean {
        return !this.rootNode?.allLeafChildren?.length || !this.colModel?.ready;
    }

    public isRowsToRender(): boolean {
        return this.rowsToDisplay.length > 0;
    }

    public getNodesInRangeForSelection(firstInRange: RowNode, lastInRange: RowNode): RowNode[] {
        let started = false;
        let finished = false;

        const result: RowNode[] = [];

        const groupsSelectChildren = _getGroupSelectsDescendants(this.gos);

        this.forEachNodeAfterFilterAndSort((rowNode) => {
            // range has been closed, skip till end
            if (finished) {
                return;
            }

            if (started) {
                if (rowNode === lastInRange || rowNode === firstInRange) {
                    // check if this is the last node we're going to be adding
                    finished = true;

                    // if the final node was a group node, and we're doing groupSelectsChildren
                    // make the exception to select all of it's descendants too
                    if (rowNode.group && groupsSelectChildren) {
                        result.push(...rowNode.allLeafChildren!);
                        return;
                    }
                }
            }

            if (!started) {
                if (rowNode !== lastInRange && rowNode !== firstInRange) {
                    // still haven't hit a boundary node, keep searching
                    return;
                }
                started = true;
            }

            // only select leaf nodes if groupsSelectChildren
            const includeThisNode = !rowNode.group || !groupsSelectChildren;
            if (includeThisNode) {
                result.push(rowNode);
                return;
            }
        });

        return result;
    }

    public getTopLevelNodes(): RowNode[] | null {
        return this.rootNode?.childrenAfterGroup ?? null;
    }

    public getRow(index: number): RowNode {
        return this.rowsToDisplay[index];
    }

    public isRowPresent(rowNode: RowNode): boolean {
        return this.rowsToDisplay.indexOf(rowNode) >= 0;
    }

    public getRowIndexAtPixel(pixelToMatch: number): number {
        const rowsToDisplay = this.rowsToDisplay;
        if (this.isEmpty() || rowsToDisplay.length === 0) {
            return -1;
        }

        // do binary search of tree
        // http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
        let bottomPointer = 0;
        let topPointer = rowsToDisplay.length - 1;

        // quick check, if the pixel is out of bounds, then return last row
        if (pixelToMatch <= 0) {
            // if pixel is less than or equal zero, it's always the first row
            return 0;
        }
        const lastNode = _last(rowsToDisplay);
        if (lastNode.rowTop! <= pixelToMatch) {
            return rowsToDisplay.length - 1;
        }

        let oldBottomPointer = -1;
        let oldTopPointer = -1;

        while (true) {
            const midPointer = Math.floor((bottomPointer + topPointer) / 2);
            const currentRowNode = rowsToDisplay[midPointer];

            if (this.isRowInPixel(currentRowNode, pixelToMatch)) {
                return midPointer;
            }

            if (currentRowNode.rowTop! < pixelToMatch) {
                bottomPointer = midPointer + 1;
            } else if (currentRowNode.rowTop! > pixelToMatch) {
                topPointer = midPointer - 1;
            }

            // infinite loops happen when there is space between rows. this can happen
            // when Auto Height is active, cos we re-calculate row tops asynchronously
            // when row heights change, which can temporarily result in gaps between rows.
            const caughtInInfiniteLoop = oldBottomPointer === bottomPointer && oldTopPointer === topPointer;
            if (caughtInInfiniteLoop) {
                return midPointer;
            }

            oldBottomPointer = bottomPointer;
            oldTopPointer = topPointer;
        }
    }

    private isRowInPixel(rowNode: RowNode, pixelToMatch: number): boolean {
        const topPixel = rowNode.rowTop;
        const bottomPixel = rowNode.rowTop! + rowNode.rowHeight!;
        const pixelInRow = topPixel! <= pixelToMatch && bottomPixel > pixelToMatch;
        return pixelInRow;
    }

    public forEachLeafNode(callback: (node: RowNode, index: number) => void): void {
        this.rootNode?.allLeafChildren?.forEach((rowNode, index) => callback(rowNode, index));
    }

    public forEachNode(callback: (node: RowNode, index: number) => void, includeFooterNodes: boolean = false): void {
        this.recursivelyWalkNodesAndCallback({
            nodes: [...(this.rootNode?.childrenAfterGroup || [])],
            callback,
            recursionType: RecursionType.Normal,
            index: 0,
            includeFooterNodes,
        });
    }

    public forEachNodeAfterFilter(
        callback: (node: RowNode, index: number) => void,
        includeFooterNodes: boolean = false
    ): void {
        this.recursivelyWalkNodesAndCallback({
            nodes: [...(this.rootNode?.childrenAfterAggFilter || [])],
            callback,
            recursionType: RecursionType.AfterFilter,
            index: 0,
            includeFooterNodes,
        });
    }

    public forEachNodeAfterFilterAndSort(
        callback: (node: RowNode, index: number) => void,
        includeFooterNodes: boolean = false
    ): void {
        this.recursivelyWalkNodesAndCallback({
            nodes: [...(this.rootNode?.childrenAfterSort || [])],
            callback,
            recursionType: RecursionType.AfterFilterAndSort,
            index: 0,
            includeFooterNodes,
        });
    }

    public forEachPivotNode(
        callback: (node: RowNode, index: number) => void,
        includeFooterNodes: boolean = false
    ): void {
        const rootNode = this.rootNode;
        if (rootNode) {
            this.recursivelyWalkNodesAndCallback({
                nodes: [rootNode],
                callback,
                recursionType: RecursionType.PivotNodes,
                index: 0,
                includeFooterNodes,
            });
        }
    }

    // iterates through each item in memory, and calls the callback function
    // nodes - the rowNodes to traverse
    // callback - the user provided callback
    // recursion type - need this to know what child nodes to recurse, eg if looking at all nodes, or filtered notes etc
    // index - works similar to the index in forEach in javascript's array function
    private recursivelyWalkNodesAndCallback(params: {
        nodes: RowNode[];
        callback: (node: RowNode, index: number) => void;
        recursionType: RecursionType;
        index: number;
        includeFooterNodes: boolean;
    }): number {
        const { nodes, callback, recursionType, includeFooterNodes } = params;
        let { index } = params;

        const { footerSvc } = this.beans;

        footerSvc?.addNodes(params, nodes, callback, includeFooterNodes, this.rootNode, 'top');

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            callback(node, index++);
            // go to the next level if it is a group
            if (node.hasChildren() && !node.footer) {
                // depending on the recursion type, we pick a difference set of children
                let nodeChildren: RowNode[] | null = null;
                switch (recursionType) {
                    case RecursionType.Normal:
                        nodeChildren = node.childrenAfterGroup;
                        break;
                    case RecursionType.AfterFilter:
                        nodeChildren = node.childrenAfterAggFilter;
                        break;
                    case RecursionType.AfterFilterAndSort:
                        nodeChildren = node.childrenAfterSort;
                        break;
                    case RecursionType.PivotNodes:
                        // for pivot, we don't go below leafGroup levels
                        nodeChildren = !node.leafGroup ? node.childrenAfterSort : null;
                        break;
                }
                if (nodeChildren) {
                    index = this.recursivelyWalkNodesAndCallback({
                        nodes: [...nodeChildren],
                        callback,
                        recursionType,
                        index,
                        includeFooterNodes,
                    });
                }
            }
        }
        footerSvc?.addNodes(params, nodes, callback, includeFooterNodes, this.rootNode, 'bottom');
        return index;
    }

    // it's possible to recompute the aggregate without doing the other parts
    // + api.refreshClientSideRowModel('aggregate')
    public doAggregate(changedPath?: ChangedPath): void {
        const rootNode = this.rootNode;
        if (rootNode) {
            this.aggStage?.execute({ rowNode: rootNode, changedPath });
        }
    }

    private doFilterAggregates(changedPath: ChangedPath): void {
        const rootNode = this.rootNode!;
        if (this.filterAggStage) {
            this.filterAggStage.execute({ rowNode: rootNode, changedPath });
        } else {
            // If filterAggStage is undefined, then so is the grouping stage, so all children should be on the rootNode.
            rootNode.childrenAfterAggFilter = rootNode.childrenAfterFilter;
        }
    }

    private doSort(changedRowNodes: ChangedRowNodes | null | undefined, changedPath: ChangedPath) {
        const { groupHideOpenParentsSvc } = this.beans;
        if (this.sortStage) {
            this.sortStage.execute({
                rowNode: this.rootNode!,
                changedRowNodes,
                changedPath,
            });
        } else {
            changedPath.forEachChangedNodeDepthFirst((rowNode) => {
                // this needs to run before sorting
                groupHideOpenParentsSvc?.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterAggFilter, true);

                rowNode.childrenAfterSort = rowNode.childrenAfterAggFilter!.slice(0);

                updateRowNodeAfterSort(rowNode);
            });
        }

        // this needs to run after sorting
        groupHideOpenParentsSvc?.updateGroupDataForHideOpenParents(changedPath);
    }

    private doRowGrouping(
        changedRowNodes: ChangedRowNodes | null | undefined,
        changedPath: ChangedPath,
        afterColumnsChanged: boolean
    ) {
        const treeData = this.nodeManager.treeData;
        const rootNode: ClientSideRowModelRootNode = this.rootNode!;
        if (!treeData) {
            const groupStage = this.groupStage;
            if (groupStage) {
                const rowNodesOrderChanged =
                    !!changedRowNodes && (changedRowNodes.rowsInserted || changedRowNodes.rowsOrderChanged);
                groupStage.execute({
                    rowNode: rootNode,
                    changedPath,
                    changedRowNodes,
                    rowNodeTransactions: changedRowNodes?.rowNodeTransactions,
                    rowNodesOrderChanged,
                    afterColumnsChanged,
                });
            } else {
                const sibling: ClientSideRowModelRootNode = rootNode.sibling;
                rootNode.childrenAfterGroup = rootNode.allLeafChildren;
                if (sibling) {
                    sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
                }
                rootNode.updateHasChildren();
            }
        }

        if (this.rowNodesCountReady) {
            // only if row data has been set
            this.rowCountReady = true;
            this.eventSvc.dispatchEventOnce({ type: 'rowCountReady' });
        }
    }

    private doFilter(changedPath: ChangedPath) {
        if (this.filterStage) {
            this.filterStage.execute({ rowNode: this.rootNode!, changedPath });
        } else {
            changedPath.forEachChangedNodeDepthFirst((rowNode) => {
                rowNode.childrenAfterFilter = rowNode.childrenAfterGroup;

                updateRowNodeAfterFilter(rowNode);
            }, true);
        }
    }

    private doPivot(changedPath: ChangedPath) {
        this.pivotStage?.execute({ rowNode: this.rootNode!, changedPath });
    }

    public getRowNode(id: string): RowNode | undefined {
        // although id is typed a string, this could be called by the user, and they could have passed a number
        const idIsGroup = typeof id == 'string' && id.indexOf(ROW_ID_PREFIX_ROW_GROUP) == 0;

        if (idIsGroup) {
            // only one users complained about getRowNode not working for groups, after years of
            // this working for normal rows. so have done quick implementation. if users complain
            // about performance, then GroupStage should store / manage created groups in a map,
            // which is a chunk of work.
            let res: RowNode | undefined = undefined;
            this.forEachNode((node) => {
                if (node.id === id) {
                    res = node;
                }
            });
            return res;
        }

        return this.nodeManager.getRowNode(id);
    }

    public applyTransactionAsync(
        rowDataTransaction: RowDataTransaction,
        callback?: (res: RowNodeTransaction) => void
    ): void {
        if (this.applyAsyncTransactionsTimeout == null) {
            this.rowDataTransactionBatch = [];
            const waitMillis = this.gos.get('asyncTransactionWaitMillis');
            this.applyAsyncTransactionsTimeout = window.setTimeout(() => {
                if (this.isAlive()) {
                    // Handle case where grid is destroyed before timeout is triggered
                    this.executeBatchUpdateRowData();
                }
            }, waitMillis);
        }
        this.rowDataTransactionBatch!.push({ rowDataTransaction: rowDataTransaction, callback });
    }

    public flushAsyncTransactions(): void {
        if (this.applyAsyncTransactionsTimeout != null) {
            clearTimeout(this.applyAsyncTransactionsTimeout);
            this.executeBatchUpdateRowData();
        }
    }

    private executeBatchUpdateRowData(): void {
        const rootNode = this.rootNode;
        const rowDataTransactionBatch = this.rowDataTransactionBatch;
        if (!rootNode) {
            return; // Destroyed
        }

        this.valueCache?.onDataChanged();

        const callbackFuncsBound: ((...args: any[]) => any)[] = [];

        const changedRowNodes = new ChangedRowNodes(rootNode, false);

        if (rowDataTransactionBatch) {
            for (let i = 0, len = rowDataTransactionBatch.length; i < len; i++) {
                const tranItem = rowDataTransactionBatch[i];
                const rowNodeTransaction = this.nodeManager.applyTransaction(
                    changedRowNodes,
                    tranItem.rowDataTransaction
                );
                if (tranItem.callback) {
                    callbackFuncsBound.push(tranItem.callback.bind(null, rowNodeTransaction));
                }
            }
        }

        if (changedRowNodes.hasChanges() || changedRowNodes.rowNodeTransactions?.length) {
            this.commitTransactions(changedRowNodes);
        }

        // do callbacks in next VM turn so it's async
        if (callbackFuncsBound.length > 0) {
            window.setTimeout(() => {
                for (let i = 0, len = callbackFuncsBound.length; i < len; i++) {
                    callbackFuncsBound[i]();
                }
            }, 0);
        }

        const transactions = changedRowNodes.rowNodeTransactions;
        if (transactions?.length) {
            this.eventSvc.dispatchEvent({
                type: 'asyncTransactionsFlushed',
                results: transactions,
            });
        }

        this.rowDataTransactionBatch = null;
        this.applyAsyncTransactionsTimeout = undefined;
    }

    /**
     * Used to apply transaction changes.
     * Called by gridApi & rowDragFeature
     */
    public applyTransaction(rowDataTran: RowDataTransaction): RowNodeTransaction | null {
        const rootNode = this.rootNode;
        if (!rootNode) {
            return null; // Destroyed
        }

        this.valueCache?.onDataChanged();

        this.rowNodesCountReady = true;
        const changedRowNodes = new ChangedRowNodes(rootNode, false);
        const rowNodeTransaction = this.nodeManager.applyTransaction(changedRowNodes, rowDataTran);

        this.commitTransactions(changedRowNodes);

        return rowNodeTransaction;
    }

    /**
     * Common to:
     * - executeBatchUpdateRowData (batch transactions)
     * - updateRowData (single transaction)
     * - setImmutableRowData (generated transaction)
     *
     * @param rowNodeTrans - the transactions to apply
     * @param orderChanged - whether the order of the rows has changed, either via generated transaction or user provided addIndex
     */
    private commitTransactions(changedRowNodes: ChangedRowNodes): void {
        this.refreshModel({
            step: 'group',
            keepRenderedRows: true,
            animate: !this.gos.get('suppressAnimationFrame'),
            changedRowNodes,
        });
    }

    private doRowsToDisplay() {
        const { flattenStage, rootNode } = this;
        let rowsToDisplay: RowNode[];
        if (flattenStage) {
            rowsToDisplay = flattenStage.execute({ rowNode: rootNode! });
        } else {
            rowsToDisplay = rootNode!.childrenAfterSort ?? [];
            for (const row of rowsToDisplay) {
                row.setUiLevel(0);
            }
        }
        this.rowsToDisplay = rowsToDisplay;
    }

    public onRowHeightChanged(): void {
        this.refreshModel({
            step: 'map',
            keepRenderedRows: true,
            keepUndoRedoStack: true,
        });
    }

    /** This method is debounced. It is used for row auto-height. If we don't debounce,
     * then the Row Models will end up recalculating each row position
     * for each row height change and result in the Row Renderer laying out rows.
     * This is particularly bad if using print layout, and showing eg 1,000 rows,
     * each row will change it's height, causing Row Model to update 1,000 times.
     */
    public onRowHeightChangedDebounced(): void {
        this.onRowHeightChanged_debounced();
    }

    public resetRowHeights(): void {
        const rootNode = this.rootNode;
        if (!rootNode) {
            return;
        }

        const atLeastOne = this.resetRowHeightsForAllRowNodes();

        rootNode.setRowHeight(rootNode.rowHeight, true);
        if (rootNode.sibling) {
            rootNode.sibling.setRowHeight(rootNode.sibling.rowHeight, true);
        }

        // when pivotMode but pivot not active, root node is displayed on its own
        // because it's only ever displayed alone, refreshing the model (onRowHeightChanged) is not required
        if (atLeastOne) {
            this.onRowHeightChanged();
        }
    }

    private resetRowHeightsForAllRowNodes(): boolean {
        let atLeastOne = false;
        this.forEachNode((rowNode) => {
            rowNode.setRowHeight(rowNode.rowHeight, true);
            // we keep the height each row is at, however we set estimated=true rather than clear the height.
            // this means the grid will not reset the row heights back to defaults, rather it will re-calc
            // the height for each row as the row is displayed. otherwise the scroll will jump when heights are reset.
            const detailNode = rowNode.detailNode;
            if (detailNode) {
                detailNode.setRowHeight(detailNode.rowHeight, true);
            }

            if (rowNode.sibling) {
                rowNode.sibling.setRowHeight(rowNode.sibling.rowHeight, true);
            }
            atLeastOne = true;
        });

        return atLeastOne;
    }

    private onGridStylesChanges(e: CssVariablesChanged) {
        if (e.rowHeightChanged) {
            if (this.beans.rowAutoHeight?.active) {
                return;
            }

            this.resetRowHeights();
        }
    }

    private onGridReady(): void {
        if (!this.started) {
            // App can start using API to add transactions, so need to add data into the node manager if not started
            this.setInitialData();
        }
    }

    public isRowDataLoaded(): boolean {
        return this.rowCountReady;
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.clearHighlightedRow();
        this.started = false;
        this.rootNode = null;
        this.nodeManager = null!;
        this.rowDataTransactionBatch = null;
        this.lastHighlightedRow = null;
        this.orderedStages = _EmptyArray;
        this.rowsToDisplay = _EmptyArray;
    }
}
