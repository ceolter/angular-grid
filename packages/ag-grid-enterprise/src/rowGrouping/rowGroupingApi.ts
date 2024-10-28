import type { BeanCollection, ColDef, Column } from 'ag-grid-community';

import type { RowGroupColsSvc } from './rowGroupColsSvc';

export function setRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.rowGroupColsSvc?.setColumns(colKeys, 'api');
}

export function removeRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.rowGroupColsSvc?.removeColumns(colKeys, 'api');
}

export function addRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.rowGroupColsSvc?.addColumns(colKeys, 'api');
}

export function moveRowGroupColumn(beans: BeanCollection, fromIndex: number, toIndex: number): void {
    (beans.rowGroupColsSvc as RowGroupColsSvc)?.moveColumn?.(fromIndex, toIndex, 'api');
}

export function getRowGroupColumns(beans: BeanCollection): Column[] {
    return beans.rowGroupColsSvc?.columns ?? [];
}
