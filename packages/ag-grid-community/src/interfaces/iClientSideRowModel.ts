import type { GridOptions } from '../entities/gridOptions';
import type { RowHighlightPosition, RowNode } from '../entities/rowNode';
import type { ChangedPath } from '../utils/changedPath';
import type { IRowModel } from './iRowModel';
import type { IRowNode } from './iRowNode';
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

    /** Marks a row as removed. Order of operations is: remove, update, add */
    remove(node: IRowNode<TData>): void;

    /** Marks a row as updated. Order of operations is: remove, update, add */
    update(node: IRowNode<TData>): void;

    /** Marks a row as added. Order of operation is: remove, update, add */
    add(node: IRowNode<TData>): void;
}

export interface RefreshModelParams<TData = any> {
    /** how much of the pipeline to execute */
    step: ClientSideRowModelStage;

    /** The set of changed grid options, if any */
    changedProps?: Set<keyof GridOptions<TData>>;

    /**
     * true if the row data changed, due to a setRowData, immutable row data or a transaction, or an update of the row data.
     */
    rowDataUpdated?: boolean;

    /**
     * Indicates a completely new rowData array is loaded.
     * Is true if user called setRowData() (or a new page in pagination). the grid scrolls back to the top when this is true.
     */
    newData?: boolean;

    /**
     * true if the order of root.allLeafChildren has changed.
     * This can happen if order of root.allLeafChildren is updated or rows are inserted (and not just appended at the end)
     */
    rowNodesOrderChanged?: boolean;

    /**
     * A data structure that holds the affected row nodes, if this was an update and not a full reload.
     */
    changedRowNodes?: IChangedRowNodes<TData>;

    /** The changedPath, if any */
    changedPath?: ChangedPath;

    /**
     * List of transactions being executed for a delta update.
     * To see the affected nodes for a delta update, use `changedRowNodes` instead.
     */
    rowNodeTransactions?: RowNodeTransaction<TData>[];

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
