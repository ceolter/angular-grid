import type { BeanCollection } from '../context/context';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { Column, ColumnGroup } from '../interfaces/iColumn';
import type { RowPinnedType } from '../interfaces/iRowNode';

export function getFocusedCell(beans: BeanCollection): CellPosition | null {
    return beans.focusSvc.getFocusedCell();
}

export function clearFocusedCell(beans: BeanCollection): void {
    return beans.focusSvc.clearFocusedCell();
}

export function setFocusedCell(
    beans: BeanCollection,
    rowIndex: number,
    colKey: string | Column,
    rowPinned?: RowPinnedType
) {
    beans.focusSvc.setFocusedCell({ rowIndex, column: colKey, rowPinned, forceBrowserFocus: true });
}

export function tabToNextCell(beans: BeanCollection, event?: KeyboardEvent): boolean {
    return beans.navigation?.tabToNextCell(false, event) ?? false;
}

export function tabToPreviousCell(beans: BeanCollection, event?: KeyboardEvent): boolean {
    return beans.navigation?.tabToNextCell(true, event) ?? false;
}

export function setFocusedHeader(
    beans: BeanCollection,
    colKey: string | Column | ColumnGroup,
    floatingFilter: boolean = false
): void {
    const headerPosition = beans.headerNavigation?.getHeaderPositionForColumn(colKey, floatingFilter);

    if (!headerPosition) {
        return;
    }

    beans.focusSvc.focusHeaderPosition({ headerPosition });
}
