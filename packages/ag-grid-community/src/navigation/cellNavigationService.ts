import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import { _isGroupRowsSticky } from '../gridOptionsUtils';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { IRowNode } from '../interfaces/iRowNode';
import type { RowPosition } from '../interfaces/iRowPosition';
import type { RowCtrl } from '../rendering/row/rowCtrl';
import { _last } from '../utils/array';
import { _missing } from '../utils/generic';
import { _warn } from '../validation/logging';

export class CellNavigationService extends BeanStub implements NamedBean {
    beanName = 'cellNavigation' as const;

    // returns null if no cell to focus on, ie at the end of the grid
    public getNextCellToFocus(
        key: string,
        focusedCell: CellPosition,
        ctrlPressed: boolean = false
    ): CellPosition | null {
        if (ctrlPressed) {
            return this.getNextCellToFocusWithCtrlPressed(key, focusedCell);
        }

        return this.getNextCellToFocusWithoutCtrlPressed(key, focusedCell);
    }

    private getNextCellToFocusWithCtrlPressed(key: string, focusedCell: CellPosition): CellPosition | null {
        const upKey = key === KeyCode.UP;
        const downKey = key === KeyCode.DOWN;
        const leftKey = key === KeyCode.LEFT;

        let column: AgColumn;
        let rowIndex: number;

        const { pageBounds, gos, visibleCols } = this.beans;
        if (upKey || downKey) {
            rowIndex = upKey ? pageBounds.getFirstRow() : pageBounds.getLastRow();
            column = focusedCell.column as AgColumn;
        } else {
            const allColumns = visibleCols.allCols;
            const isRtl = gos.get('enableRtl');
            rowIndex = focusedCell.rowIndex;
            column = leftKey !== isRtl ? allColumns[0] : _last(allColumns);
        }

        return {
            rowIndex,
            rowPinned: null,
            column,
        };
    }

    private getNextCellToFocusWithoutCtrlPressed(key: string, focusedCell: CellPosition): CellPosition | null {
        // starting with the provided cell, we keep moving until we find a cell we can
        // focus on.
        let pointer: CellPosition | null = focusedCell;
        let finished = false;

        // finished will be true when either:
        // a) cell found that we can focus on
        // b) run out of cells (ie the method returns null)
        while (!finished) {
            switch (key) {
                case KeyCode.UP:
                    pointer = this.getCellAbove(pointer);
                    break;
                case KeyCode.DOWN:
                    pointer = this.getCellBelow(pointer);
                    break;
                case KeyCode.RIGHT:
                    pointer = this.gos.get('enableRtl') ? this.getCellToLeft(pointer) : this.getCellToRight(pointer);
                    break;
                case KeyCode.LEFT:
                    pointer = this.gos.get('enableRtl') ? this.getCellToRight(pointer) : this.getCellToLeft(pointer);
                    break;
                default:
                    pointer = null;
                    // unknown key, do nothing
                    _warn(8, { key });
                    break;
            }

            if (pointer) {
                finished = this.isCellGoodToFocusOn(pointer);
            } else {
                finished = true;
            }
        }

        return pointer;
    }

    private isCellGoodToFocusOn(gridCell: CellPosition): boolean {
        const column = gridCell.column as AgColumn;
        let rowNode: RowNode | undefined;
        const { pinnedRowModel, rowModel } = this.beans;

        switch (gridCell.rowPinned) {
            case 'top':
                rowNode = pinnedRowModel?.getPinnedTopRow(gridCell.rowIndex);
                break;
            case 'bottom':
                rowNode = pinnedRowModel?.getPinnedBottomRow(gridCell.rowIndex);
                break;
            default:
                rowNode = rowModel.getRow(gridCell.rowIndex);
                break;
        }

        if (!rowNode) {
            return false;
        }

        const suppressNavigable = this.isSuppressNavigable(column, rowNode);
        return !suppressNavigable;
    }

    private getCellToLeft(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) {
            return null;
        }

        const colToLeft = this.beans.visibleCols.getColBefore(lastCell.column as AgColumn);
        if (!colToLeft) {
            return null;
        }

        return {
            rowIndex: lastCell.rowIndex,
            column: colToLeft,
            rowPinned: lastCell.rowPinned,
        } as CellPosition;
    }

    private getCellToRight(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) {
            return null;
        }

        const colToRight = this.beans.visibleCols.getColAfter(lastCell.column as AgColumn);
        // if already on right, do nothing
        if (!colToRight) {
            return null;
        }

        return {
            rowIndex: lastCell.rowIndex,
            column: colToRight,
            rowPinned: lastCell.rowPinned,
        } as CellPosition;
    }

    public getRowBelow(rowPosition: RowPosition): RowPosition | null {
        // if already on top row, do nothing
        const index = rowPosition.rowIndex;
        const pinned = rowPosition.rowPinned;
        let ignoreSticky = false;
        const { pageBounds, pinnedRowModel, rowModel } = this.beans;
        if (this.isLastRowInContainer(rowPosition)) {
            switch (pinned) {
                case 'bottom':
                    // never any rows after pinned bottom
                    return null;
                case 'top':
                    // if on last row of pinned top, then next row is main body (if rows exist),
                    // otherwise it's the pinned bottom
                    if (rowModel.isRowsToRender()) {
                        return { rowIndex: pageBounds.getFirstRow(), rowPinned: null } as RowPosition;
                    }

                    if (pinnedRowModel?.isRowsToRender('bottom')) {
                        return { rowIndex: 0, rowPinned: 'bottom' } as RowPosition;
                    }

                    return null;
                default:
                    // if in the main body, then try pinned bottom, otherwise return nothing
                    if (pinnedRowModel?.isRowsToRender('bottom')) {
                        return { rowIndex: 0, rowPinned: 'bottom' } as RowPosition;
                    }
                    return null;
            }
        } else if (pinned) {
            // if more pinned rows, should always navigate there
            ignoreSticky = true;
        }

        const rowNode = rowModel.getRow(rowPosition.rowIndex);
        const nextStickyPosition = ignoreSticky ? undefined : this.getNextStickyPosition(rowNode);

        if (nextStickyPosition) {
            return nextStickyPosition;
        }

        return { rowIndex: index + 1, rowPinned: pinned } as RowPosition;
    }

    private getNextStickyPosition(rowNode?: RowNode, up?: boolean): RowPosition | undefined {
        const { gos, rowRenderer } = this.beans;
        if (!_isGroupRowsSticky(gos) || !rowNode || !rowNode.sticky) {
            return;
        }

        const isTopCtrls = rowRenderer
            .getStickyTopRowCtrls()
            .some((ctrl) => ctrl.rowNode.rowIndex === rowNode.rowIndex);

        let stickyRowCtrls: RowCtrl[] = [];
        if (isTopCtrls) {
            stickyRowCtrls = [...rowRenderer.getStickyTopRowCtrls()].sort(
                (a, b) => a.rowNode.rowIndex! - b.rowNode.rowIndex!
            );
        } else {
            stickyRowCtrls = [...rowRenderer.getStickyBottomRowCtrls()].sort(
                (a, b) => b.rowNode.rowIndex! - a.rowNode.rowIndex!
            );
        }

        const diff = up ? -1 : 1;
        const idx = stickyRowCtrls.findIndex((ctrl) => ctrl.rowNode.rowIndex === rowNode.rowIndex);
        const nextCtrl = stickyRowCtrls[idx + diff];

        if (nextCtrl) {
            return { rowIndex: nextCtrl.rowNode.rowIndex!, rowPinned: null };
        }
    }

    private getCellBelow(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) {
            return null;
        }

        const rowBelow = this.getRowBelow(lastCell);
        if (rowBelow) {
            return {
                rowIndex: rowBelow.rowIndex,
                column: lastCell.column,
                rowPinned: rowBelow.rowPinned,
            } as CellPosition;
        }

        return null;
    }

    private isLastRowInContainer(rowPosition: RowPosition): boolean {
        const pinned = rowPosition.rowPinned;
        const index = rowPosition.rowIndex;

        const { pinnedRowModel, pageBounds } = this.beans;

        if (pinned === 'top') {
            const lastTopIndex = pinnedRowModel?.getPinnedTopRowCount() ?? 0 - 1;
            return lastTopIndex <= index;
        }

        if (pinned === 'bottom') {
            const lastBottomIndex = pinnedRowModel?.getPinnedBottomRowCount() ?? 0 - 1;
            return lastBottomIndex <= index;
        }

        const lastBodyIndex = pageBounds.getLastRow();
        return lastBodyIndex <= index;
    }

    public getRowAbove(rowPosition: RowPosition): RowPosition | null {
        // if already on top row, do nothing
        const index = rowPosition.rowIndex;
        const pinned = rowPosition.rowPinned;
        const { pageBounds, pinnedRowModel, rowModel } = this.beans;
        const isFirstRow = pinned ? index === 0 : index === pageBounds.getFirstRow();
        let ignoreSticky = false;

        const getLastFloatingTopRow = (): RowPosition => {
            const lastFloatingRow = pinnedRowModel?.getPinnedTopRowCount() ?? 0 - 1;

            return { rowIndex: lastFloatingRow, rowPinned: 'top' } as RowPosition;
        };

        // if already on top row, do nothing
        if (isFirstRow) {
            if (pinned === 'top') {
                return null;
            }

            if (!pinned) {
                if (pinnedRowModel?.isRowsToRender('top')) {
                    return getLastFloatingTopRow();
                }
                return null;
            }

            // last floating bottom
            if (rowModel.isRowsToRender()) {
                const lastBodyRow = pageBounds.getLastRow();
                return { rowIndex: lastBodyRow, rowPinned: null } as RowPosition;
            }

            if (pinnedRowModel?.isRowsToRender('top')) {
                return getLastFloatingTopRow();
            }

            return null;
        } else if (pinned) {
            // if more pinned rows, should always navigate there
            ignoreSticky = true;
        }

        const rowNode = rowModel.getRow(rowPosition.rowIndex);
        const nextStickyPosition = ignoreSticky ? undefined : this.getNextStickyPosition(rowNode, true);

        if (nextStickyPosition) {
            return nextStickyPosition;
        }

        return { rowIndex: index - 1, rowPinned: pinned } as RowPosition;
    }

    private getCellAbove(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) {
            return null;
        }

        const rowAbove = this.getRowAbove({ rowIndex: lastCell.rowIndex, rowPinned: lastCell.rowPinned });

        if (rowAbove) {
            return {
                rowIndex: rowAbove.rowIndex,
                column: lastCell.column,
                rowPinned: rowAbove.rowPinned,
            } as CellPosition;
        }

        return null;
    }

    public getNextTabbedCell(gridCell: CellPosition, backwards: boolean): CellPosition | null {
        if (backwards) {
            return this.getNextTabbedCellBackwards(gridCell);
        }

        return this.getNextTabbedCellForwards(gridCell);
    }

    public getNextTabbedCellForwards(gridCell: CellPosition): CellPosition | null {
        const { visibleCols, pagination } = this.beans;
        const displayedColumns = visibleCols.allCols;

        let newRowIndex: number | null = gridCell.rowIndex;
        let newFloating: string | null | undefined = gridCell.rowPinned;

        // move along to the next cell
        let newColumn = visibleCols.getColAfter(gridCell.column as AgColumn);

        // check if end of the row, and if so, go forward a row
        if (!newColumn) {
            newColumn = displayedColumns[0];

            const rowBelow = this.getRowBelow(gridCell);
            if (_missing(rowBelow)) {
                return null;
            }

            // If we are tabbing and there is a paging panel present, tabbing should go
            // to the paging panel instead of loading the next page.
            if (!rowBelow.rowPinned && !(pagination?.isRowInPage(rowBelow) ?? true)) {
                return null;
            }

            newRowIndex = rowBelow ? rowBelow.rowIndex : null;
            newFloating = rowBelow ? rowBelow.rowPinned : null;
        }

        return { rowIndex: newRowIndex, column: newColumn, rowPinned: newFloating } as CellPosition;
    }

    public getNextTabbedCellBackwards(gridCell: CellPosition): CellPosition | null {
        const { visibleCols, pagination } = this.beans;
        const displayedColumns = visibleCols.allCols;

        let newRowIndex: number | null = gridCell.rowIndex;
        let newFloating: string | null | undefined = gridCell.rowPinned;

        // move along to the next cell
        let newColumn = visibleCols.getColBefore(gridCell.column as AgColumn);

        // check if end of the row, and if so, go forward a row
        if (!newColumn) {
            newColumn = _last(displayedColumns);

            const rowAbove = this.getRowAbove({ rowIndex: gridCell.rowIndex, rowPinned: gridCell.rowPinned });

            if (_missing(rowAbove)) {
                return null;
            }

            // If we are tabbing and there is a paging panel present, tabbing should go
            // to the paging panel instead of loading the next page.
            if (!rowAbove.rowPinned && !(pagination?.isRowInPage(rowAbove) ?? true)) {
                return null;
            }

            newRowIndex = rowAbove ? rowAbove.rowIndex : null;
            newFloating = rowAbove ? rowAbove.rowPinned : null;
        }

        return { rowIndex: newRowIndex, column: newColumn, rowPinned: newFloating } as CellPosition;
    }

    public isSuppressNavigable(column: AgColumn, rowNode: IRowNode): boolean {
        const { suppressNavigable } = column.colDef;
        // if boolean set, then just use it
        if (typeof suppressNavigable === 'boolean') {
            return suppressNavigable;
        }

        // if function, then call the function to find out
        if (typeof suppressNavigable === 'function') {
            const params = column.createColumnFunctionCallbackParams(rowNode);
            const userFunc = suppressNavigable;
            return userFunc(params);
        }

        return false;
    }
}
