import type { BeanCollection, ColDef, ColGroupDef, Column } from 'ag-grid-community';

export function isPivotMode(beans: BeanCollection): boolean {
    return beans.colModel.isPivotMode();
}

export function getPivotResultColumn<TValue = any, TData = any>(
    beans: BeanCollection,
    pivotKeys: string[],
    valueColKey: string | ColDef<TData, TValue> | Column<TValue>
): Column<TValue> | null {
    return beans.pivotResultCols?.lookupPivotResultCol(pivotKeys, valueColKey) ?? null;
}

export function setValueColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.setValueColumns(colKeys, 'api');
}

export function getValueColumns(beans: BeanCollection): Column[] {
    return beans.funcColsSvc.valueCols;
}

export function removeValueColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.removeValueColumns(colKeys, 'api');
}

export function addValueColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.addValueColumns(colKeys, 'api');
}

export function setPivotColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.setPivotColumns(colKeys, 'api');
}

export function removePivotColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.removePivotColumns(colKeys, 'api');
}

export function addPivotColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.addPivotColumns(colKeys, 'api');
}

export function getPivotColumns(beans: BeanCollection): Column[] {
    return beans.funcColsSvc.pivotCols;
}

export function setPivotResultColumns(beans: BeanCollection, colDefs: (ColDef | ColGroupDef)[] | null): void {
    beans.pivotResultCols?.setPivotResultCols(colDefs, 'api');
}

export function getPivotResultColumns(beans: BeanCollection): Column[] | null {
    const pivotResultCols = beans.pivotResultCols?.getPivotResultCols();
    return pivotResultCols ? pivotResultCols.list : null;
}
