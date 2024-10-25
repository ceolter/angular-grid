import type { BeanCollection } from '../context/context';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { RowPinnedType } from '../interfaces/iRowNode';
import type { RowPosition } from '../interfaces/iRowPosition';
import type { CellCtrl } from '../rendering/cell/cellCtrl';
import { _exists } from '../utils/generic';
import type { AgColumn } from './agColumn';
import type { RowNode } from './rowNode';

export function _createCellId(cellPosition: CellPosition): string {
    const { rowIndex, rowPinned, column } = cellPosition;
    return `${rowIndex}.${rowPinned == null ? 'null' : rowPinned}.${column.getId()}`;
}

export function _areCellsEqual(cellA: CellPosition, cellB: CellPosition): boolean {
    const colsMatch = cellA.column === cellB.column;
    const floatingMatch = cellA.rowPinned === cellB.rowPinned;
    const indexMatch = cellA.rowIndex === cellB.rowIndex;
    return colsMatch && floatingMatch && indexMatch;
}

// tests if this row selection is before the other row selection
export function _isRowBefore(rowA: RowPosition, rowB: RowPosition): boolean {
    switch (rowA.rowPinned) {
        case 'top':
            // we we are floating top, and other isn't, then we are always before
            if (rowB.rowPinned !== 'top') {
                return true;
            }
            break;
        case 'bottom':
            // if we are floating bottom, and the other isn't, then we are never before
            if (rowB.rowPinned !== 'bottom') {
                return false;
            }
            break;
        default:
            // if we are not floating, but the other one is floating...
            if (_exists(rowB.rowPinned)) {
                return rowB.rowPinned !== 'top';
            }
            break;
    }
    return rowA.rowIndex < rowB.rowIndex;
}

export function _isSameRow(rowA: RowPosition | undefined, rowB: RowPosition | undefined): boolean {
    // if both missing
    if (!rowA && !rowB) {
        return true;
    }
    // if only one missing
    if ((rowA && !rowB) || (!rowA && rowB)) {
        return false;
    }
    // otherwise compare (use == to compare rowPinned because it can be null or undefined)
    return rowA!.rowIndex === rowB!.rowIndex && rowA!.rowPinned == rowB!.rowPinned;
}

export function _getFirstRow(beans: BeanCollection): RowPosition | null {
    let rowIndex = 0;
    let rowPinned: RowPinnedType;

    const { pinnedRowModel, rowModel, pageBounds } = beans;

    if (pinnedRowModel?.getPinnedTopRowCount()) {
        rowPinned = 'top';
    } else if (rowModel.getRowCount()) {
        rowPinned = null;
        rowIndex = pageBounds.getFirstRow();
    } else if (pinnedRowModel?.getPinnedBottomRowCount()) {
        rowPinned = 'bottom';
    }

    return rowPinned === undefined ? null : { rowIndex, rowPinned };
}

export function _getLastRow(beans: BeanCollection): RowPosition | null {
    let rowIndex;
    let rowPinned: RowPinnedType = null;

    const { pinnedRowModel, pageBounds } = beans;

    const pinnedBottomCount = pinnedRowModel?.getPinnedBottomRowCount();
    const pinnedTopCount = pinnedRowModel?.getPinnedTopRowCount();

    if (pinnedBottomCount) {
        rowPinned = 'bottom';
        rowIndex = pinnedBottomCount - 1;
    } else if (beans.rowModel.getRowCount()) {
        rowPinned = null;
        rowIndex = pageBounds.getLastRow();
    } else if (pinnedTopCount) {
        rowPinned = 'top';
        rowIndex = pinnedTopCount - 1;
    }

    return rowIndex === undefined ? null : { rowIndex, rowPinned };
}

export function _getRowNode(beans: BeanCollection, gridRow: RowPosition): RowNode | undefined {
    switch (gridRow.rowPinned) {
        case 'top':
            return beans.pinnedRowModel?.getPinnedTopRow(gridRow.rowIndex);
        case 'bottom':
            return beans.pinnedRowModel?.getPinnedBottomRow(gridRow.rowIndex);
        default:
            return beans.rowModel.getRow(gridRow.rowIndex);
    }
}

export function _getCellByPosition(beans: BeanCollection, cellPosition: CellPosition): CellCtrl | null {
    const rowCtrl = beans.rowRenderer.getRowByPosition(cellPosition);
    if (!rowCtrl) {
        return null;
    }

    return rowCtrl.getCellCtrl(cellPosition.column as AgColumn);
}
