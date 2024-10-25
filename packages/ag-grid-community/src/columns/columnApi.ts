import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef, ColGroupDef, HeaderLocation } from '../entities/colDef';
import type { Column, ColumnPinnedType } from '../interfaces/iColumn';
import type { ApplyColumnStateParams, ColumnState } from './columnStateService';

export function getColumnDef<TValue = any, TData = any>(
    beans: BeanCollection,
    key: string | Column<TValue>
): ColDef<TData, TValue> | null {
    const column = beans.colModel.getColDefCol(key);
    if (column) {
        return column.getColDef();
    }
    return null;
}

export function getColumnDefs<TData = any>(beans: BeanCollection): (ColDef<TData> | ColGroupDef<TData>)[] | undefined {
    return beans.colModel.getColumnDefs();
}

export function getDisplayNameForColumn(beans: BeanCollection, column: Column, location: HeaderLocation): string {
    return beans.colNames.getDisplayNameForColumn(column as AgColumn, location) || '';
}

export function getColumn<TValue = any, TData = any>(
    beans: BeanCollection,
    key: string | ColDef<TData, TValue> | Column<TValue>
): Column<TValue> | null {
    return beans.colModel.getColDefCol(key);
}

export function getColumns(beans: BeanCollection): Column[] | null {
    return beans.colModel.getColDefCols();
}

export function applyColumnState(beans: BeanCollection, params: ApplyColumnStateParams): boolean {
    return beans.colState.applyColumnState(params, 'api');
}

export function getColumnState(beans: BeanCollection): ColumnState[] {
    return beans.colState.getColumnState();
}

export function resetColumnState(beans: BeanCollection): void {
    beans.colState.resetColumnState('api');
}

export function isPinning(beans: BeanCollection): boolean {
    return beans.visibleCols.isPinningLeft() || beans.visibleCols.isPinningRight();
}

export function isPinningLeft(beans: BeanCollection): boolean {
    return beans.visibleCols.isPinningLeft();
}

export function isPinningRight(beans: BeanCollection): boolean {
    return beans.visibleCols.isPinningRight();
}

export function getDisplayedColAfter(beans: BeanCollection, col: Column): Column | null {
    return beans.visibleCols.getColAfter(col as AgColumn);
}

export function getDisplayedColBefore(beans: BeanCollection, col: Column): Column | null {
    return beans.visibleCols.getColBefore(col as AgColumn);
}

export function setColumnsVisible(beans: BeanCollection, keys: (string | Column)[], visible: boolean): void {
    beans.colModel.setColsVisible(keys as (string | AgColumn)[], visible, 'api');
}

export function setColumnsPinned(
    beans: BeanCollection,
    keys: (string | ColDef | Column)[],
    pinned: ColumnPinnedType
): void {
    beans.pinnedCols?.setColsPinned(keys, pinned, 'api');
}

export function getAllGridColumns(beans: BeanCollection): Column[] {
    return beans.colModel.getCols();
}

export function getDisplayedLeftColumns(beans: BeanCollection): Column[] {
    return beans.visibleCols.leftCols;
}

export function getDisplayedCenterColumns(beans: BeanCollection): Column[] {
    return beans.visibleCols.centerCols;
}

export function getDisplayedRightColumns(beans: BeanCollection): Column[] {
    return beans.visibleCols.rightCols;
}

export function getAllDisplayedColumns(beans: BeanCollection): Column[] {
    return beans.visibleCols.allCols;
}

export function getAllDisplayedVirtualColumns(beans: BeanCollection): Column[] {
    return beans.colViewport.getViewportColumns();
}
