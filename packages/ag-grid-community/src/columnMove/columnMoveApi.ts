import type { BeanCollection } from '../context/context';
import type { ColDef } from '../entities/colDef';
import type { Column } from '../interfaces/iColumn';

export function moveColumnByIndex(beans: BeanCollection, fromIndex: number, toIndex: number): void {
    beans.colMoves?.moveColumnByIndex(fromIndex, toIndex, 'api');
}

export function moveColumns(beans: BeanCollection, columnsToMoveKeys: (string | ColDef | Column)[], toIndex: number) {
    beans.colMoves?.moveColumns(columnsToMoveKeys, toIndex, 'api');
}
