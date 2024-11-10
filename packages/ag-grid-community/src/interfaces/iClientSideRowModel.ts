import type { GridOptions } from '../entities/gridOptions';
import type { RowHighlightPosition, RowNode } from '../entities/rowNode';
import type { ChangedPath } from '../utils/changedPath';
import type { IRowModel } from './iRowModel';
import type { RowDataTransaction } from './rowDataTransaction';
import type { RowNodeTransaction } from './rowNodeTransaction';

// Type exposed to user
export type ClientSideRowModelStep =
    | 'everything'
    | 'group'
    | 'filter'
    | 'sort'
    | 'map'
    | 'aggregate'
    | 'filter_aggregates'
    | 'pivot'
    | 'nothing';

// Internal type - without `everything`
export type ClientSideRowModelStage =
    | 'group'
    | 'filter'
    | 'sort'
    | 'map'
    | 'aggregate'
    | 'filter_aggregates'
    | 'pivot'
    | 'nothing';

export interface IClientSideRowModel<TData = any> extends IRowModel {
    /** The root row containing all the rows */
    readonly rootNode: RowNode | null;

    onRowGroupOpened(): void;
    updateRowData(rowDataTran: RowDataTransaction<TData>): RowNodeTransaction<TData> | null;
    refreshModel(params: RefreshModelParams): void;
    forEachLeafNode(callback: (node: RowNode, index: number) => void): void;
    forEachNodeAfterFilter(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    forEachNodeAfterFilterAndSort(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    forEachPivotNode(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    resetRowHeights(): void;
    onRowHeightChanged(): void;
    onRowHeightChangedDebounced(): void;
    batchUpdateRowData(
        rowDataTransaction: RowDataTransaction<TData>,
        callback?: (res: RowNodeTransaction<TData>) => void
    ): void;
    flushAsyncTransactions(): void;
    doAggregate(changedPath?: ChangedPath): void;
    getTopLevelNodes(): RowNode[] | null;
    ensureRowsAtPixel(rowNode: RowNode[], pixel: number, increment: number): boolean;
    highlightRowAtPixel(rowNode: RowNode | null, pixel?: number): void;
    getHighlightPosition(pixel: number, rowNode?: RowNode): RowHighlightPosition;
    getLastHighlightedRowNode(): RowNode | null;
    isRowDataLoaded(): boolean;
}

export interface IChangedRowNodes<TData = any> {
    /** The CSRM rootNode */
    readonly rootNode: RowNode<TData>;

    /** The list of transactions that are being executed. */
    rowNodeTransactions: RowNodeTransaction<TData>[] | null;

    /** The ChangedPath containing the changed parent nodes in DFS order. */
    readonly changedPath: ChangedPath;

    /**
     * The set of removed nodes.
     * Mutually exclusive, if a node is here, it cannot be in the updates map.
     */
    readonly removals: ReadonlySet<RowNode<TData>>;

    /**
     * Map of row nodes that have been updated.
     * The value is true if the row node is a new node. is false if it was just updated.
     */
    readonly updates: ReadonlyMap<RowNode<TData>, boolean>;

    /** true if rows were inserted in the middle of something else and not just appended or removed. */
    readonly rowsInserted: boolean;

    /** true if the order of root.allLeafChildren has changed. */
    readonly rowsOrderChanged: boolean;
}

export interface RefreshModelParams<TData = any> {
    /** how much of the pipeline to execute */
    step: ClientSideRowModelStage;

    /** The set of changed grid options, if any */
    changedProps?: Set<keyof GridOptions<TData>>;

    /**
     * Indicates a completely new rowData array is loaded.
     * Is true if user called setRowData() (or a new page in pagination). the grid scrolls back to the top when this is true.
     */
    newData?: boolean;

    /**
     * A data structure that holds the affected row nodes, if this was an update and not a full reload.
     */
    changedRowNodes?: IChangedRowNodes<TData>;

    /** The changedPath, if any */
    changedPath?: ChangedPath;

    /**
     * if NOT new data, then this flag tells grid to check if rows already
     * exist for the nodes (matching by node id) and reuses the row if it does.
     */
    keepRenderedRows?: boolean;

    /**
     * if true, rows that are kept are animated to the new position
     */
    animate?: boolean;

    /** true if this update is due to columns changing, ie no rows were changed */
    afterColumnsChanged?: boolean;

    /** true if all we did is changed row height, data still the same, no need to clear the undo/redo stacks */
    keepUndoRedoStack?: boolean;
}
