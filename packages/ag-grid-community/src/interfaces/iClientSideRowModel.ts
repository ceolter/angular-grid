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

export interface RefreshModelParams<TData = any> {
    // how much of the pipeline to execute
    step: ClientSideRowModelStage;

    // The set of changed grid options, if any
    changedProps?: Set<keyof GridOptions<TData>>;

    // The changedPath, if any
    changedPath?: ChangedPath;

    // if NOT new data, then this flag tells grid to check if rows already
    // exist for the nodes (matching by node id) and reuses the row if it does.
    keepRenderedRows?: boolean;

    // if true, rows that are kept are animated to the new position
    animate?: boolean;

    // if doing delta updates, this has the changes that were done
    rowNodeTransactions?: RowNodeTransaction<TData>[];

    // true if the order of root.allLeafChildren has changed.
    // This can happen if order of root.allLeafChildren is updated or rows are inserted (and not just appended at the end)
    rowNodesOrderChanged?: boolean;

    // true if user called setRowData() (or a new page in pagination). the grid scrolls
    // back to the top when this is true.
    newData?: boolean;

    // true if the row data changed, due to a setRowData, immutable row data or a transaction.
    rowDataUpdated?: boolean;

    // true if this update is due to columns changing, ie no rows were changed
    afterColumnsChanged?: boolean;

    // true if all we did is changed row height, data still the same, no need to clear the undo/redo stacks
    keepUndoRedoStack?: boolean;
}
