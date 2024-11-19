import type { ColKey } from '../columns/columnModel';
import type { HorizontalDirection } from '../constants/direction';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { DragSource } from '../dragAndDrop/dragAndDropService';
import { DragSourceType } from '../dragAndDrop/dragAndDropService';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import { isColumnGroup } from '../entities/agColumnGroup';
import type { ColDef } from '../entities/colDef';
import type { ColumnEventType } from '../events';
import type { Column, ColumnPinnedType } from '../interfaces/iColumn';
import type { DragItem } from '../interfaces/iDragItem';
import { _last, _moveInArray, _removeFromArray } from '../utils/array';
import { _warn } from '../validation/logging';
import { BodyDropTarget } from './columnDrag/bodyDropTarget';
import { doesMovePassMarryChildren } from './columnMoveUtils';
import { attemptMoveColumns, normaliseX, setColumnsMoving } from './internalColumnMoveUtils';

enum Direction {
    LEFT = -1,
    NONE = 0,
    RIGHT = 1,
}
export class ColumnMoveService extends BeanStub implements NamedBean {
    beanName = 'colMoves' as const;

    public moveColumnByIndex(fromIndex: number, toIndex: number, source: ColumnEventType): void {
        const gridColumns = this.beans.colModel.getCols();
        if (!gridColumns) {
            return;
        }

        const column = gridColumns[fromIndex];
        this.moveColumns([column], toIndex, source);
    }

    public moveColumns(
        columnsToMoveKeys: ColKey[],
        toIndex: number,
        source: ColumnEventType,
        finished: boolean = true
    ): void {
        const { colModel, colAnimation, visibleCols, eventSvc } = this.beans;
        const gridColumns = colModel.getCols();
        if (!gridColumns) {
            return;
        }

        if (toIndex > gridColumns.length - columnsToMoveKeys.length) {
            // Trying to insert in invalid position
            _warn(30, { toIndex });
            return;
        }

        colAnimation?.start();
        // we want to pull all the columns out first and put them into an ordered list
        const movedColumns = colModel.getColsForKeys(columnsToMoveKeys);

        if (this.doesMovePassRules(movedColumns, toIndex)) {
            _moveInArray(colModel.getCols(), movedColumns, toIndex);
            visibleCols.refresh(source);
            eventSvc.dispatchEvent({
                type: 'columnMoved',
                columns: movedColumns,
                column: movedColumns.length === 1 ? movedColumns[0] : null,
                toIndex,
                finished,
                source,
            });
        }

        colAnimation?.finish();
    }

    private doesMovePassRules(columnsToMove: AgColumn[], toIndex: number): boolean {
        // make a copy of what the grid columns would look like after the move
        const proposedColumnOrder = this.getProposedColumnOrder(columnsToMove, toIndex);
        return this.doesOrderPassRules(proposedColumnOrder);
    }

    public doesOrderPassRules(gridOrder: AgColumn[]) {
        const { colModel, gos } = this.beans;
        if (!doesMovePassMarryChildren(gridOrder, colModel.getColTree())) {
            return false;
        }

        const doesMovePassLockedPositions = (proposedColumnOrder: AgColumn[]) => {
            const lockPositionToPlacement = (position: ColDef['lockPosition']) => {
                if (!position) {
                    return Direction.NONE;
                }
                return position === 'left' || position === true ? Direction.LEFT : Direction.RIGHT;
            };

            const isRtl = gos.get('enableRtl');
            let lastPlacement = isRtl ? Direction.RIGHT : Direction.LEFT;
            let rulePassed = true;
            proposedColumnOrder.forEach((col) => {
                const placement = lockPositionToPlacement(col.getColDef().lockPosition);
                if (isRtl) {
                    if (placement > lastPlacement) {
                        // If placement goes up, we're not in the correct order
                        rulePassed = false;
                    }
                } else {
                    if (placement < lastPlacement) {
                        // If placement goes down, we're not in the correct order
                        rulePassed = false;
                    }
                }
                lastPlacement = placement;
            });

            return rulePassed;
        };

        if (!doesMovePassLockedPositions(gridOrder)) {
            return false;
        }
        return true;
    }

    public getProposedColumnOrder(columnsToMove: AgColumn[], toIndex: number): AgColumn[] {
        const gridColumns = this.beans.colModel.getCols();
        const proposedColumnOrder = gridColumns.slice();
        _moveInArray(proposedColumnOrder, columnsToMove as AgColumn[], toIndex);
        return proposedColumnOrder;
    }

    public createBodyDropTarget(pinned: ColumnPinnedType, dropContainer: HTMLElement): BodyDropTarget {
        return new BodyDropTarget(pinned, dropContainer);
    }

    public moveHeader(
        hDirection: HorizontalDirection,
        eGui: HTMLElement,
        column: AgColumn | AgColumnGroup,
        pinned: ColumnPinnedType,
        bean: BeanStub
    ): void {
        const { ctrlsSvc, gos, colModel, visibleCols, focusSvc } = this.beans;
        const rect = eGui.getBoundingClientRect();
        const left = rect.left;
        const isGroup = isColumnGroup(column);
        const width = isGroup ? rect.width : column.getActualWidth();
        const isLeft = (hDirection === 'left') !== gos.get('enableRtl');

        const xPosition = normaliseX({
            x: isLeft ? left - 20 : left + width + 20,
            pinned,
            fromKeyboard: true,
            gos,
            ctrlsSvc,
        });
        const headerPosition = focusSvc.focusedHeader;

        attemptMoveColumns({
            allMovingColumns: isGroup ? column.getLeafColumns() : [column],
            isFromHeader: true,
            fromLeft: hDirection === 'right',
            xPosition,
            pinned,
            fromEnter: false,
            fakeEvent: false,
            gos,
            colModel,
            colMoves: this,
            visibleCols,
            finished: true,
        });

        let targetColumn: AgColumn;
        if (isGroup) {
            const displayedLeafColumns = column.getDisplayedLeafColumns();
            targetColumn = isLeft ? displayedLeafColumns[0] : _last(displayedLeafColumns);
        } else {
            targetColumn = column;
        }

        ctrlsSvc.getScrollFeature().ensureColumnVisible(targetColumn, 'auto');

        if ((!bean.isAlive() || gos.get('ensureDomOrder')) && headerPosition) {
            let restoreFocusColumn: AgColumn | AgColumnGroup | undefined;
            if (isGroup) {
                const groupId = column.getGroupId();
                const leafCols = column.getLeafColumns();
                if (!leafCols.length) {
                    return;
                }
                const parent = leafCols[0].getParent();
                if (!parent) {
                    return;
                }

                restoreFocusColumn = findGroupWidthId(parent, groupId);
            } else {
                restoreFocusColumn = column;
            }
            if (restoreFocusColumn) {
                focusSvc.focusHeaderPosition({
                    headerPosition: {
                        ...headerPosition,
                        column: restoreFocusColumn,
                    },
                });
            }
        }
    }

    public setDragSourceForHeader(
        eSource: HTMLElement,
        column: AgColumn | AgColumnGroup,
        displayName: string | null
    ): DragSource {
        const { gos, colModel, dragAndDrop, visibleCols } = this.beans;
        let hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
        const isGroup = isColumnGroup(column);
        const columns = isGroup ? column.getProvidedColumnGroup().getLeafColumns() : [column];
        const getDragItem = isGroup
            ? () => createDragItemForGroup(column, visibleCols.allCols)
            : () => createDragItem(column);
        const dragSource: DragSource = {
            type: DragSourceType.HeaderCell,
            eElement: eSource,
            getDefaultIconName: () => (hideColumnOnExit ? 'hide' : 'notAllowed'),
            getDragItem,
            dragItemName: displayName,
            onDragStarted: () => {
                hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
                setColumnsMoving(columns, true);
            },
            onDragStopped: () => setColumnsMoving(columns, false),
            onDragCancelled: () => setColumnsMoving(columns, false),
            onGridEnter: (dragItem) => {
                if (hideColumnOnExit) {
                    const { columns = [], visibleState } = dragItem ?? {};
                    const hasVisibleState = isGroup
                        ? (col: Column) => !visibleState || visibleState[col.getColId()]
                        : () => true;
                    const unlockedColumns = columns.filter(
                        (col) => !col.getColDef().lockVisible && hasVisibleState(col)
                    );
                    colModel.setColsVisible(unlockedColumns as AgColumn[], true, 'uiColumnMoved');
                }
            },
            onGridExit: (dragItem) => {
                if (hideColumnOnExit) {
                    const unlockedColumns = dragItem?.columns?.filter((col) => !col.getColDef().lockVisible) || [];
                    colModel.setColsVisible(unlockedColumns as AgColumn[], false, 'uiColumnMoved');
                }
            },
        };

        dragAndDrop!.addDragSource(dragSource, true);

        return dragSource;
    }
}

function findGroupWidthId(columnGroup: AgColumnGroup | null, id: any): AgColumnGroup | undefined {
    while (columnGroup) {
        if (columnGroup.getGroupId() === id) {
            return columnGroup;
        }
        columnGroup = columnGroup.getParent();
    }

    return undefined;
}

function createDragItem(column: AgColumn): DragItem {
    const visibleState: { [key: string]: boolean } = {};
    visibleState[column.getId()] = column.isVisible();

    return {
        columns: [column],
        visibleState: visibleState,
    };
}

// when moving the columns, we want to move all the columns (contained within the DragItem) in this group in one go,
// and in the order they are currently in the screen.
function createDragItemForGroup(columnGroup: AgColumnGroup, allCols: AgColumn[]): DragItem {
    const allColumnsOriginalOrder = columnGroup.getProvidedColumnGroup().getLeafColumns();

    // capture visible state, used when re-entering grid to dictate which columns should be visible
    const visibleState: { [key: string]: boolean } = {};
    allColumnsOriginalOrder.forEach((column) => (visibleState[column.getId()] = column.isVisible()));

    const allColumnsCurrentOrder: AgColumn[] = [];
    allCols.forEach((column) => {
        if (allColumnsOriginalOrder.indexOf(column) >= 0) {
            allColumnsCurrentOrder.push(column);
            _removeFromArray(allColumnsOriginalOrder, column);
        }
    });

    // we are left with non-visible columns, stick these in at the end
    allColumnsOriginalOrder.forEach((column) => allColumnsCurrentOrder.push(column));

    const columnsInSplit: AgColumn[] = [];
    const columnGroupColumns = columnGroup.getLeafColumns();

    for (const col of allColumnsCurrentOrder) {
        if (columnGroupColumns.indexOf(col) !== -1) {
            columnsInSplit.push(col);
        }
    }

    // create and return dragItem
    return {
        columns: allColumnsCurrentOrder,
        columnsInSplit,
        visibleState: visibleState,
    };
}
