import type { RefreshModelParams } from '../clientSideRowModel/refreshModelState';
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

    refreshAfterRowGroupOpened(keepRenderedRows: boolean): void;
    refreshModel(params: RefreshModelParams): void;
    applyTransaction(rowDataTran: RowDataTransaction<TData>): RowNodeTransaction<TData> | null;
    applyTransactionAsync(
        rowDataTransaction: RowDataTransaction<TData>,
        callback?: (res: RowNodeTransaction<TData>) => void
    ): void;
    flushAsyncTransactions(): void;
    forEachLeafNode(callback: (node: RowNode, index: number) => void): void;
    forEachNodeAfterFilter(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    forEachNodeAfterFilterAndSort(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    forEachPivotNode(callback: (node: RowNode, index: number) => void, includeFooterNodes?: boolean): void;
    resetRowHeights(): void;
    onRowHeightChanged(): void;
    onRowHeightChangedDebounced(): void;
    doAggregate(changedPath?: ChangedPath): void;
    getTopLevelNodes(): RowNode[] | null;
    ensureRowsAtPixel(rowNode: RowNode[], pixel: number, increment: number): boolean;
    highlightRowAtPixel(rowNode: RowNode | null, pixel?: number): void;
    getHighlightPosition(pixel: number, rowNode?: RowNode): RowHighlightPosition;
    getLastHighlightedRowNode(): RowNode | null;
    isRowDataLoaded(): boolean;
}
