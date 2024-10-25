import { _getClientSideRowModel } from '../api/rowModelApiUtils';
import type { BeanCollection } from '../context/context';
import type { ClientSideRowModelStep } from '../interfaces/iClientSideRowModel';
import type { IRowNode } from '../interfaces/iRowNode';
import type { RowDataTransaction } from '../interfaces/rowDataTransaction';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { _warn } from '../validation/logging';

export function onGroupExpandedOrCollapsed(beans: BeanCollection): void {
    beans.expansionSvc?.onGroupExpandedOrCollapsed();
}

export function refreshClientSideRowModel(beans: BeanCollection, step?: ClientSideRowModelStep): void {
    _getClientSideRowModel(beans)?.refreshModel(step === 'everything' ? 'group' : step);
}

export function isRowDataEmpty(beans: BeanCollection): boolean {
    return _getClientSideRowModel(beans)?.isEmpty() ?? true;
}

export function forEachLeafNode<TData = any>(
    beans: BeanCollection,
    callback: (rowNode: IRowNode<TData>) => void
): void {
    _getClientSideRowModel(beans)?.forEachLeafNode(callback);
}

export function forEachNodeAfterFilter<TData = any>(
    beans: BeanCollection,
    callback: (rowNode: IRowNode<TData>, index: number) => void
): void {
    _getClientSideRowModel(beans)?.forEachNodeAfterFilter(callback);
}

export function forEachNodeAfterFilterAndSort<TData = any>(
    beans: BeanCollection,
    callback: (rowNode: IRowNode<TData>, index: number) => void
): void {
    _getClientSideRowModel(beans)?.forEachNodeAfterFilterAndSort(callback);
}

export function resetRowHeights(beans: BeanCollection): void {
    if (beans.rowAutoHeight?.active) {
        _warn(3);
        return;
    }
    _getClientSideRowModel(beans)?.resetRowHeights();
}

export function applyTransaction<TData = any>(
    beans: BeanCollection,
    rowDataTransaction: RowDataTransaction<TData>
): RowNodeTransaction<TData> | null | undefined {
    return beans.frameworkOverrides.wrapIncoming(() =>
        _getClientSideRowModel(beans)?.updateRowData(rowDataTransaction)
    );
}

export function applyTransactionAsync<TData = any>(
    beans: BeanCollection,
    rowDataTransaction: RowDataTransaction<TData>,
    callback?: (res: RowNodeTransaction<TData>) => void
): void {
    beans.frameworkOverrides.wrapIncoming(() =>
        _getClientSideRowModel(beans)?.batchUpdateRowData(rowDataTransaction, callback)
    );
}

export function flushAsyncTransactions(beans: BeanCollection): void {
    beans.frameworkOverrides.wrapIncoming(() => _getClientSideRowModel(beans)?.flushAsyncTransactions());
}

export function getBestCostNodeSelection<TData = any>(beans: BeanCollection): IRowNode<TData>[] | undefined {
    return beans.selectionSvc?.getBestCostNodeSelection();
}
