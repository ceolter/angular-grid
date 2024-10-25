import type { ColumnModel } from '../../columns/columnModel';
import type { VisibleColsService } from '../../columns/visibleColsService';
import type { HorizontalDirection } from '../../constants/direction';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { DragAndDropIcon, DragAndDropService, DraggingEvent } from '../../dragAndDrop/dragAndDropService';
import { DragSourceType } from '../../dragAndDrop/dragAndDropService';
import type { AgColumn } from '../../entities/agColumn';
import type { ColumnEventType } from '../../events';
import type { GridBodyCtrl } from '../../gridBodyComp/gridBodyCtrl';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import { ColumnHighlightPosition } from '../../interfaces/iColumn';
import type { PinnedColumnService } from '../../pinnedColumns/pinnedColumnService';
import { _last } from '../../utils/array';
import { _exists, _missing } from '../../utils/generic';
import type { ColumnMoveService } from '../columnMoveService';
import type { ColumnMoveParams } from '../internalColumnMoveUtils';
import { attemptMoveColumns, getBestColumnMoveIndexFromXPosition, normaliseX } from '../internalColumnMoveUtils';
import type { DropListener } from './bodyDropTarget';

const MOVE_FAIL_THRESHOLD = 7;
const SCROLL_MOVE_WIDTH = 100;
const SCROLL_GAP_NEEDED_BEFORE_MOVE = SCROLL_MOVE_WIDTH / 2;
const SCROLL_ACCELERATION_RATE = 5;
const SCROLL_TIME_INTERVAL = 100;

export class MoveColumnFeature extends BeanStub implements DropListener {
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private colMoves: ColumnMoveService;
    private dragAndDrop: DragAndDropService;
    private ctrlsSvc: CtrlsService;
    private pinnedCols?: PinnedColumnService;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.colMoves = beans.colMoves!;
        this.dragAndDrop = beans.dragAndDrop!;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pinnedCols = beans.pinnedCols;
    }

    private gridBodyCon: GridBodyCtrl;

    private needToMoveLeft = false;
    private needToMoveRight = false;
    private movingIntervalId: number | null;
    private intervalCount: number;

    private pinned: ColumnPinnedType;
    private isCenterContainer: boolean;

    private lastDraggingEvent: DraggingEvent | null;
    private lastHighlightedColumn: { column: AgColumn; position: ColumnHighlightPosition } | null;
    private lastMovedInfo: { columns: AgColumn[]; toIndex: number } | null = null;

    // this counts how long the user has been trying to scroll by dragging and failing,
    // if they fail x amount of times, then the column will get pinned. this is what gives
    // the 'hold and pin' functionality
    private failedMoveAttempts: number;

    constructor(pinned: ColumnPinnedType) {
        super();
        this.pinned = pinned;
        this.isCenterContainer = !_exists(pinned);
    }

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCon = p.gridBodyCtrl;
        });
    }

    public getIconName(): DragAndDropIcon {
        const columns = this.lastDraggingEvent?.dragItem.columns ?? [];

        for (const col of columns) {
            const colPinned = col.getPinned();
            // when the column is lockPinned, only moves within pinned section
            if (col.getColDef().lockPinned) {
                if (colPinned == this.pinned) {
                    return 'move';
                }
                continue;
            }
            // if the column pinned state is the same as the container's, or
            // when `unpinning` a column, set the icon to move
            if (colPinned === this.pinned || !this.pinned) {
                return 'move';
            }

            // moving an unpinned column to a pinned container
            // set the icon to pinned
            if (!colPinned && this.pinned) {
                return 'pinned';
            }
        }

        return 'notAllowed';
    }

    public onDragEnter(draggingEvent: DraggingEvent): void {
        // we do dummy drag, so make sure column appears in the right location when first placed

        const columns = draggingEvent.dragItem.columns as AgColumn[] | undefined;
        const dragCameFromToolPanel = draggingEvent.dragSource.type === DragSourceType.ToolPanel;

        if (dragCameFromToolPanel) {
            // the if statement doesn't work if drag leaves grid, then enters again
            this.setColumnsVisible(columns, true, 'uiColumnDragged');
        } else {
            // restore previous state of visible columns upon re-entering. this means if the user drags
            // a group out, and then drags the group back in, only columns that were originally visible
            // will be visible again. otherwise a group with three columns (but only two visible) could
            // be dragged out, then when it's dragged in again, all three are visible. this stops that.
            const visibleState = draggingEvent.dragItem.visibleState;
            const visibleColumns: AgColumn[] = (columns || []).filter((column) => visibleState![column.getId()]);
            this.setColumnsVisible(visibleColumns, true, 'uiColumnDragged');
        }

        if (!this.gos.get('suppressMoveWhenColumnDragging')) {
            this.attemptToPinColumns(columns, this.pinned);
        }
        this.onDragging(draggingEvent, true, true);
    }

    public onDragging(
        draggingEvent: DraggingEvent | null = this.lastDraggingEvent,
        fromEnter = false,
        fakeEvent = false,
        finished = false
    ): void {
        const isSuppressMoveWhenDragging = this.gos.get('suppressMoveWhenColumnDragging');

        if (finished && !isSuppressMoveWhenDragging) {
            this.finishColumnMoving();
            return;
        }

        this.lastDraggingEvent = draggingEvent;

        // if moving up or down (ie not left or right) then do nothing
        if (!draggingEvent || (!finished && _missing(draggingEvent.hDirection))) {
            return;
        }

        const { pinned, gos, ctrlsSvc } = this;

        const mouseX = normaliseX({
            x: draggingEvent.x,
            pinned,
            gos,
            ctrlsSvc,
        });

        // if the user is dragging into the panel, ie coming from the side panel into the main grid,
        // we don't want to scroll the grid this time, it would appear like the table is jumping
        // each time a column is dragged in.
        if (!fromEnter) {
            this.checkCenterForScrolling(mouseX);
        }

        if (isSuppressMoveWhenDragging) {
            this.handleColumnDragWhileSuppressingMovement(draggingEvent, fromEnter, fakeEvent, mouseX, finished);
        } else {
            this.handleColumnDragWhileAllowingMovement(draggingEvent, fromEnter, fakeEvent, mouseX, finished);
        }
    }

    public onDragLeave(): void {
        this.ensureIntervalCleared();
        this.clearHighlighted();
        this.lastMovedInfo = null;
    }

    public onDragStop(): void {
        this.onDragging(this.lastDraggingEvent!, false, true, true);
        this.ensureIntervalCleared();
        this.lastMovedInfo = null;
    }

    public onDragCancel(): void {
        this.clearHighlighted();
        this.ensureIntervalCleared();
        this.lastMovedInfo = null;
    }

    public setColumnsVisible(columns: AgColumn[] | null | undefined, visible: boolean, source: ColumnEventType) {
        if (!columns) {
            return;
        }

        const allowedCols = columns.filter((c) => !c.getColDef().lockVisible);
        this.colModel.setColsVisible(allowedCols, visible, source);
    }

    private finishColumnMoving(): void {
        this.clearHighlighted();

        if (!this.lastMovedInfo) {
            return;
        }

        const { columns, toIndex } = this.lastMovedInfo;

        this.colMoves.moveColumns(columns, toIndex, 'uiColumnMoved', true);
    }

    private handleColumnDragWhileSuppressingMovement(
        draggingEvent: DraggingEvent,
        fromEnter: boolean,
        fakeEvent: boolean,
        mouseX: number,
        finished: boolean
    ): void {
        const allMovingColumns = this.getAllMovingColumns(draggingEvent, true);

        if (finished) {
            // first we handle pinning, then move columns
            const isAttemptingToPin = this.isAttemptingToPin(allMovingColumns);
            if (isAttemptingToPin) {
                this.attemptToPinColumns(allMovingColumns, undefined, true);
            }

            const { fromLeft, xPosition } = this.getNormalisedXPositionInfo(allMovingColumns, isAttemptingToPin) || {};

            if (fromLeft == null || xPosition == null) {
                this.finishColumnMoving();
                return;
            }

            this.moveColumnsAfterHighlight({
                allMovingColumns,
                xPosition,
                fromEnter,
                fakeEvent,
                fromLeft,
            });
        } else {
            if (!this.dragAndDrop.isDropZoneWithinThisGrid(draggingEvent)) {
                return;
            }
            this.highlightHoveredColumn(allMovingColumns, mouseX);
        }
    }

    private handleColumnDragWhileAllowingMovement(
        draggingEvent: DraggingEvent,
        fromEnter: boolean,
        fakeEvent: boolean,
        mouseX: number,
        finished: boolean
    ): void {
        const allMovingColumns = this.getAllMovingColumns(draggingEvent);
        const fromLeft = this.normaliseDirection(draggingEvent.hDirection!) === 'right';
        const isFromHeader = draggingEvent.dragSource.type === DragSourceType.HeaderCell;

        const params = this.getMoveColumnParams({
            allMovingColumns,
            isFromHeader,
            xPosition: mouseX,
            fromLeft,
            fromEnter,
            fakeEvent,
        });
        const lastMovedInfo = attemptMoveColumns({ ...params, finished });

        if (lastMovedInfo) {
            this.lastMovedInfo = lastMovedInfo;
        }
    }

    private getAllMovingColumns(draggingEvent: DraggingEvent, useSplit: boolean = false): AgColumn[] {
        const dragItem = draggingEvent.dragSource.getDragItem();
        let columns: AgColumn[] | null = null;

        if (useSplit) {
            columns = dragItem.columnsInSplit as AgColumn[];
            if (!columns) {
                columns = dragItem.columns as AgColumn[];
            }
        } else {
            columns = dragItem.columns as AgColumn[];
        }

        // if locked return true only if both col and container are same pin type.
        // double equals (==) here on purpose so that null==undefined is true (for not pinned options)
        // if not pin locked, then always allowed to be in this container
        const conditionCallback = (col: AgColumn) =>
            col.getColDef().lockPinned ? col.getPinned() == this.pinned : true;

        if (!columns) {
            return [];
        }

        return columns.filter(conditionCallback);
    }

    private getMoveColumnParams(params: {
        allMovingColumns: AgColumn[];
        isFromHeader: boolean;
        xPosition: number;
        fromLeft: boolean;
        fromEnter: boolean;
        fakeEvent: boolean;
    }): ColumnMoveParams {
        const { allMovingColumns, isFromHeader, xPosition, fromLeft, fromEnter, fakeEvent } = params;
        const { pinned, gos, colModel, colMoves, visibleCols } = this;

        return {
            allMovingColumns,
            isFromHeader,
            fromLeft,
            xPosition,
            pinned,
            fromEnter,
            fakeEvent,
            gos,
            colModel,
            colMoves,
            visibleCols,
        };
    }

    private findFirstAndLastMovingColumns(allMovingColumns: AgColumn[]): {
        firstMovingCol?: AgColumn;
        lastMovingCol?: AgColumn;
    } {
        const moveLen = allMovingColumns.length;

        let firstMovingCol: AgColumn | undefined;
        let lastMovingCol: AgColumn | undefined;

        for (let i = 0; i <= moveLen; i++) {
            if (!firstMovingCol) {
                const leftCol = allMovingColumns[i];
                if (leftCol.getLeft() != null) {
                    firstMovingCol = leftCol;
                }
            }

            if (!lastMovingCol) {
                const rightCol = allMovingColumns[moveLen - 1 - i];
                if (rightCol.getLeft() != null) {
                    lastMovingCol = rightCol;
                }
            }

            if (firstMovingCol && lastMovingCol) {
                break;
            }
        }

        return { firstMovingCol, lastMovingCol };
    }

    private highlightHoveredColumn(movingColumns: AgColumn[], mouseX: number) {
        const { gos, colModel } = this;
        const isRtl = gos.get('enableRtl');
        const consideredColumns = colModel
            .getCols()
            .filter((col) => col.isVisible() && col.getPinned() === this.pinned);

        let start: number | null = null;
        let width: number | null = null;
        let targetColumn: AgColumn | null = null;

        for (const col of consideredColumns) {
            width = col.getActualWidth();
            start = this.getNormalisedColumnLeft(col, 0, isRtl);

            if (start != null) {
                const end = start + width;

                if (start <= mouseX && end >= mouseX) {
                    targetColumn = col;
                    break;
                }
            }

            start = null;
            width = null;
        }

        if (!targetColumn) {
            // we fall into this condition if no columns are being hover
            // (e.g. hovering an empty area of the column header beyond all columns)
            for (let i = consideredColumns.length - 1; i >= 0; i--) {
                const currentColumn = consideredColumns[i];
                const parent = consideredColumns[i].getParent();
                if (!parent) {
                    targetColumn = currentColumn;
                    break;
                }

                const leafDisplayedCols = parent?.getDisplayedLeafColumns();

                if (leafDisplayedCols.length) {
                    targetColumn = _last(leafDisplayedCols);
                    break;
                }
            }

            if (!targetColumn) {
                return;
            }

            start = this.getNormalisedColumnLeft(targetColumn, 0, isRtl);
            width = targetColumn.getActualWidth();
        } else if (movingColumns.indexOf(targetColumn) !== -1) {
            targetColumn = null;
        }

        if (this.lastHighlightedColumn?.column !== targetColumn) {
            this.clearHighlighted();
        }

        if (targetColumn == null || start == null || width == null) {
            return;
        }

        let position: ColumnHighlightPosition;

        if (mouseX - start < width / 2 !== isRtl) {
            position = ColumnHighlightPosition.Before;
        } else {
            position = ColumnHighlightPosition.After;
        }

        targetColumn.setHighlighted(position);
        this.lastHighlightedColumn = { column: targetColumn, position };
    }

    private getNormalisedXPositionInfo(
        allMovingColumns: AgColumn[],
        isAttemptingToPin: boolean
    ): { fromLeft: boolean; xPosition: number } | undefined {
        const { gos, visibleCols } = this;
        const isRtl = gos.get('enableRtl');

        const { firstMovingCol, column, position } = this.getColumnMoveAndTargetInfo(
            allMovingColumns,
            isAttemptingToPin,
            isRtl
        );

        if (!firstMovingCol || !column || position == null) {
            return;
        }

        const visibleColumns = visibleCols.allCols;
        const movingColIndex = visibleColumns.indexOf(firstMovingCol);
        const targetIndex = visibleColumns.indexOf(column!);
        const isBefore = (position === ColumnHighlightPosition.Before) !== isRtl;
        const fromLeft = movingColIndex < targetIndex || (movingColIndex === targetIndex && !isBefore);
        let diff: number = 0;

        if (isBefore) {
            if (fromLeft) {
                diff -= 1;
            }
        } else {
            if (!fromLeft) {
                diff += 1;
            }
        }

        if (targetIndex + diff === movingColIndex) {
            return;
        }

        const targetColumn = visibleColumns[targetIndex + diff];

        if (!targetColumn) {
            return;
        }

        const xPosition = this.getNormalisedColumnLeft(targetColumn, 20, isRtl)!;

        return { fromLeft, xPosition };
    }

    private getColumnMoveAndTargetInfo(
        allMovingColumns: AgColumn[],
        isAttemptingToPin: boolean,
        isRtl: boolean
    ): {
        firstMovingCol?: AgColumn;
        column?: AgColumn;
        position?: ColumnHighlightPosition;
    } {
        const lastHighlightedColumn: {
            column?: AgColumn;
            position?: ColumnHighlightPosition;
        } = this.lastHighlightedColumn || {};
        const { firstMovingCol, lastMovingCol } = this.findFirstAndLastMovingColumns(allMovingColumns);

        if (!firstMovingCol || !lastMovingCol || lastHighlightedColumn.column || !isAttemptingToPin) {
            return {
                firstMovingCol,
                ...lastHighlightedColumn,
            };
        }

        const pinned = this.getPinDirection();
        const isLeft = pinned === 'left';

        return {
            firstMovingCol,
            position: isLeft ? ColumnHighlightPosition.After : ColumnHighlightPosition.Before,
            column: isLeft !== isRtl ? firstMovingCol : lastMovingCol,
        };
    }

    private normaliseDirection(hDirection: HorizontalDirection): HorizontalDirection {
        if (this.gos.get('enableRtl')) {
            switch (hDirection) {
                case 'left':
                    return 'right';
                case 'right':
                    return 'left';
            }
        }

        return hDirection;
    }

    private getNormalisedColumnLeft(col: AgColumn, padding: number, isRtl: boolean): number | null {
        const { gos, ctrlsSvc } = this;
        const left = col.getLeft();

        if (left == null) {
            return null;
        }

        const width = col.getActualWidth();

        return normaliseX({
            x: isRtl ? left + width - padding : left + padding,
            pinned: col.getPinned(),
            useHeaderRow: isRtl,
            skipScrollPadding: true,
            gos,
            ctrlsSvc,
        });
    }

    private isAttemptingToPin(columns: AgColumn[]) {
        const isMovingHorizontally = this.needToMoveLeft || this.needToMoveRight;
        const isFailedMoreThanThreshold = this.failedMoveAttempts > MOVE_FAIL_THRESHOLD;
        return (
            (isMovingHorizontally && isFailedMoreThanThreshold) ||
            columns.some((col) => col.getPinned() !== this.pinned)
        );
    }

    private moveColumnsAfterHighlight(params: {
        allMovingColumns: AgColumn[];
        xPosition: number;
        fromEnter: boolean;
        fakeEvent: boolean;
        fromLeft: boolean;
    }): void {
        const { allMovingColumns, xPosition, fromEnter, fakeEvent, fromLeft } = params;

        const columnMoveParams = this.getMoveColumnParams({
            allMovingColumns,
            isFromHeader: true,
            xPosition,
            fromLeft,
            fromEnter,
            fakeEvent,
        });
        const { columns, toIndex } = getBestColumnMoveIndexFromXPosition(columnMoveParams) || {};

        if (columns && toIndex != null) {
            this.lastMovedInfo = {
                columns,
                toIndex,
            };
        }

        this.finishColumnMoving();
    }

    private clearHighlighted(): void {
        if (!this.lastHighlightedColumn) {
            return;
        }

        this.lastHighlightedColumn.column.setHighlighted(null);
        this.lastHighlightedColumn = null;
    }

    private checkCenterForScrolling(xAdjustedForScroll: number): void {
        if (!this.isCenterContainer) {
            return;
        }

        // scroll if the mouse has gone outside the grid (or just outside the scrollable part if pinning)
        // putting in 50 buffer, so even if user gets to edge of grid, a scroll will happen
        const centerCtrl = this.ctrlsSvc.get('center');
        const firstVisiblePixel = centerCtrl.getCenterViewportScrollLeft();
        const lastVisiblePixel = firstVisiblePixel + centerCtrl.getCenterWidth();

        if (this.gos.get('enableRtl')) {
            this.needToMoveRight = xAdjustedForScroll < firstVisiblePixel + SCROLL_GAP_NEEDED_BEFORE_MOVE;
            this.needToMoveLeft = xAdjustedForScroll > lastVisiblePixel - SCROLL_GAP_NEEDED_BEFORE_MOVE;
        } else {
            this.needToMoveLeft = xAdjustedForScroll < firstVisiblePixel + SCROLL_GAP_NEEDED_BEFORE_MOVE;
            this.needToMoveRight = xAdjustedForScroll > lastVisiblePixel - SCROLL_GAP_NEEDED_BEFORE_MOVE;
        }

        if (this.needToMoveLeft || this.needToMoveRight) {
            this.ensureIntervalStarted();
        } else {
            this.ensureIntervalCleared();
        }
    }

    private ensureIntervalStarted(): void {
        if (this.movingIntervalId) {
            return;
        }

        this.intervalCount = 0;
        this.failedMoveAttempts = 0;
        this.movingIntervalId = window.setInterval(this.moveInterval.bind(this), SCROLL_TIME_INTERVAL);
        this.dragAndDrop.getDragAndDropImageComponent()?.setIcon(this.needToMoveLeft ? 'left' : 'right', true);
    }

    private ensureIntervalCleared(): void {
        if (!this.movingIntervalId) {
            return;
        }

        window.clearInterval(this.movingIntervalId);
        this.movingIntervalId = null;
        this.failedMoveAttempts = 0;
        this.dragAndDrop.getDragAndDropImageComponent()?.setIcon(this.getIconName());
    }

    private moveInterval(): void {
        // the amounts we move get bigger at each interval, so the speed accelerates, starting a bit slow
        // and getting faster. this is to give smoother user experience. we max at `SCROLL_MOVE_WIDTH` to limit the speed.
        let pixelsToMove: number;
        this.intervalCount++;
        pixelsToMove = 10 + this.intervalCount * SCROLL_ACCELERATION_RATE;
        if (pixelsToMove > SCROLL_MOVE_WIDTH) {
            pixelsToMove = SCROLL_MOVE_WIDTH;
        }

        let pixelsMoved: number | null = null;
        const scrollFeature = this.gridBodyCon.getScrollFeature();

        if (this.needToMoveLeft) {
            pixelsMoved = scrollFeature.scrollHorizontally(-pixelsToMove);
        } else if (this.needToMoveRight) {
            pixelsMoved = scrollFeature.scrollHorizontally(pixelsToMove);
        }

        if (pixelsMoved !== 0) {
            this.onDragging(this.lastDraggingEvent);
            this.failedMoveAttempts = 0;
        } else {
            // we count the failed move attempts. if we fail to move `MOVE_FAIL_THRESHOLD` times, then we pin the column.
            // this is how we achieve pining by dragging the column to the edge of the grid.
            this.failedMoveAttempts++;

            if (this.failedMoveAttempts <= MOVE_FAIL_THRESHOLD + 1) {
                return;
            }

            this.dragAndDrop.getDragAndDropImageComponent()?.setIcon('pinned');

            if (!this.gos.get('suppressMoveWhenColumnDragging')) {
                const columns = this.lastDraggingEvent?.dragItem.columns as AgColumn[] | undefined;
                this.attemptToPinColumns(columns, undefined, true);
            }
        }
    }

    private getPinDirection(): 'left' | 'right' | undefined {
        if (this.needToMoveLeft || this.pinned === 'left') {
            return 'left';
        }

        if (this.needToMoveRight || this.pinned === 'right') {
            return 'right';
        }
    }

    private attemptToPinColumns(
        columns: AgColumn[] | undefined,
        pinned?: ColumnPinnedType,
        fromMoving: boolean = false
    ): number {
        const allowedCols = (columns || []).filter((c) => !c.getColDef().lockPinned);

        if (!allowedCols.length) {
            return 0;
        }

        if (fromMoving) {
            pinned = this.getPinDirection();
        }

        this.pinnedCols?.setColsPinned(allowedCols, pinned, 'uiColumnDragged');

        if (fromMoving) {
            this.dragAndDrop.nudge();
        }

        return allowedCols.length;
    }

    public override destroy(): void {
        super.destroy();

        this.lastDraggingEvent = null;
        this.clearHighlighted();
        this.lastMovedInfo = null;
    }
}
