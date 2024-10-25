import type { AgColumn, BeanCollection, ColumnChooserParams, IContextMenuParams, RowNode } from 'ag-grid-community';

import type { ColumnChooserFactory } from './columnChooserFactory';

export function showContextMenu(beans: BeanCollection, params?: IContextMenuParams) {
    const { contextMenuSvc } = beans;
    if (!contextMenuSvc) {
        return;
    }
    const { rowNode, column, value, x, y } = params || {};
    let { x: clientX, y: clientY } = contextMenuSvc.getContextMenuPosition(rowNode as RowNode, column as AgColumn);

    if (x != null) {
        clientX = x;
    }

    if (y != null) {
        clientY = y;
    }

    contextMenuSvc.showContextMenu({
        mouseEvent: new MouseEvent('mousedown', { clientX, clientY }),
        rowNode,
        column,
        value,
    });
}

export function showColumnChooser(beans: BeanCollection, params?: ColumnChooserParams): void {
    (beans.columnChooserFactory as ColumnChooserFactory)?.showColumnChooser({ chooserParams: params });
}

export function hideColumnChooser(beans: BeanCollection): void {
    (beans.columnChooserFactory as ColumnChooserFactory)?.hideActiveColumnChooser();
}
