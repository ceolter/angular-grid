import type { BeanCollection } from '../context/context';
import type { RenderedRowEvent } from '../interfaces/iCallbackParams';
import type { RedrawRowsParams } from '../interfaces/iRedrawRowsParams';
import type { IRowNode } from '../interfaces/iRowNode';

export function redrawRows<TData = any>(beans: BeanCollection, params: RedrawRowsParams<TData> = {}): void {
    const rowNodes = params ? params.rowNodes : undefined;
    beans.frameworkOverrides.wrapIncoming(() => beans.rowRenderer.redrawRows(rowNodes));
}

export function setRowNodeExpanded(
    beans: BeanCollection,
    rowNode: IRowNode,
    expanded: boolean,
    expandParents?: boolean,
    forceSync?: boolean
): void {
    if (rowNode) {
        // expand all parents recursively, except root node.
        if (expandParents && rowNode.parent && rowNode.parent.level !== -1) {
            setRowNodeExpanded(beans, rowNode.parent, expanded, expandParents, forceSync);
        }

        rowNode.setExpanded(expanded, undefined, forceSync);
    }
}

export function getRowNode<TData = any>(beans: BeanCollection, id: string): IRowNode<TData> | undefined {
    return beans.rowModel.getRowNode(id);
}

export function addRenderedRowListener(
    beans: BeanCollection,
    eventName: RenderedRowEvent,
    rowIndex: number,
    callback: (...args: any[]) => any
) {
    beans.rowRenderer.addRenderedRowListener(eventName, rowIndex, callback as any);
}

export function getRenderedNodes<TData = any>(beans: BeanCollection): IRowNode<TData>[] {
    return beans.rowRenderer.getRenderedNodes();
}

export function forEachNode<TData = any>(
    beans: BeanCollection,
    callback: (rowNode: IRowNode<TData>, index: number) => void,
    includeFooterNodes?: boolean
) {
    beans.rowModel.forEachNode(callback, includeFooterNodes);
}

export function getFirstDisplayedRowIndex(beans: BeanCollection): number {
    return beans.rowRenderer.firstRenderedRow;
}

export function getLastDisplayedRowIndex(beans: BeanCollection): number {
    return beans.rowRenderer.lastRenderedRow;
}

export function getDisplayedRowAtIndex<TData = any>(beans: BeanCollection, index: number): IRowNode<TData> | undefined {
    return beans.rowModel.getRow(index);
}

export function getDisplayedRowCount(beans: BeanCollection): number {
    return beans.rowModel.getRowCount();
}
