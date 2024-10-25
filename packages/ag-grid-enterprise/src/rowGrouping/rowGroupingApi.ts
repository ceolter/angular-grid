import type { BeanCollection, ColDef, ColGroupDef, Column, IAggFunc } from 'ag-grid-community';

export function addAggFuncs(beans: BeanCollection, aggFuncs: { [key: string]: IAggFunc }): void {
    if (beans.aggFuncSvc) {
        beans.aggFuncSvc.addAggFuncs(aggFuncs);
    }
}

export function clearAggFuncs(beans: BeanCollection): void {
    if (beans.aggFuncSvc) {
        beans.aggFuncSvc.clear();
    }
}

export function setColumnAggFunc(
    beans: BeanCollection,
    key: string | ColDef | Column,
    aggFunc: string | IAggFunc | null | undefined
): void {
    beans.funcColsSvc.setColumnAggFunc(key, aggFunc, 'api');
}

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

export function setRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.setRowGroupColumns(colKeys, 'api');
}

export function removeRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.removeRowGroupColumns(colKeys, 'api');
}

export function addRowGroupColumns(beans: BeanCollection, colKeys: (string | ColDef | Column)[]): void {
    beans.funcColsSvc.addRowGroupColumns(colKeys, 'api');
}

export function moveRowGroupColumn(beans: BeanCollection, fromIndex: number, toIndex: number): void {
    beans.funcColsSvc.moveRowGroupColumn(fromIndex, toIndex, 'api');
}

export function getRowGroupColumns(beans: BeanCollection): Column[] {
    return beans.funcColsSvc.rowGroupCols;
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
