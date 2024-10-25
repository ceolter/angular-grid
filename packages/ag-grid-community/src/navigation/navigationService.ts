import type { VisibleColsService } from '../columns/visibleColsService';
import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import { _getCellByPosition, _getRowNode, _isRowBefore } from '../entities/positionUtils';
import type { FocusService } from '../focusService';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import { _isGroupRowsSticky } from '../gridOptionsUtils';
import type { IRangeService } from '../interfaces/IRangeService';
import type { NavigateToNextCellParams, TabToNextCellParams } from '../interfaces/iCallbackParams';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { IRowModel } from '../interfaces/iRowModel';
import type { RowPosition } from '../interfaces/iRowPosition';
import type { PageBoundsService } from '../pagination/pageBoundsService';
import type { PinnedRowModel } from '../pinnedRowModel/pinnedRowModel';
import { CellCtrl } from '../rendering/cell/cellCtrl';
import { RowCtrl } from '../rendering/row/rowCtrl';
import type { RowRenderer } from '../rendering/rowRenderer';
import { _last } from '../utils/array';
import { _throttle } from '../utils/function';
import { _exists, _missing } from '../utils/generic';
import type { CellNavigationService } from './cellNavigationService';

interface NavigateParams {
    /** The rowIndex to vertically scroll to. */
    scrollIndex: number;
    /** The position to put scroll index. */
    scrollType: 'top' | 'bottom' | null;
    /**  The column to horizontally scroll to. */
    scrollColumn: AgColumn | null;
    /** For page up/down, we want to scroll to one row/column but focus another (ie. scrollRow could be stub). */
    focusIndex: number;
    focusColumn: AgColumn;
    isAsync?: boolean;
}

export class NavigationService extends BeanStub implements NamedBean {
    beanName = 'navigation' as const;

    private pageBounds: PageBoundsService;
    private focusSvc: FocusService;
    private visibleCols: VisibleColsService;
    private rowModel: IRowModel;
    private ctrlsSvc: CtrlsService;
    private rowRenderer: RowRenderer;
    private cellNavigation: CellNavigationService;
    private pinnedRowModel?: PinnedRowModel;
    private rangeSvc?: IRangeService;

    public wireBeans(beans: BeanCollection): void {
        this.pageBounds = beans.pageBounds;
        this.focusSvc = beans.focusSvc;
        this.visibleCols = beans.visibleCols;
        this.rowModel = beans.rowModel;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.rowRenderer = beans.rowRenderer;
        this.cellNavigation = beans.cellNavigation!;
        this.pinnedRowModel = beans.pinnedRowModel;
        this.rangeSvc = beans.rangeSvc;
    }

    private gridBodyCon: GridBodyCtrl;

    constructor() {
        super();
        this.onPageDown = _throttle(this.onPageDown, 100);
        this.onPageUp = _throttle(this.onPageUp, 100);
    }

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCon = p.gridBodyCtrl;
        });
    }

    public handlePageScrollingKey(event: KeyboardEvent, fromFullWidth = false): boolean {
        const key = event.key;
        const alt = event.altKey;
        const ctrl = event.ctrlKey || event.metaKey;
        const rangeServiceShouldHandleShift = !!this.rangeSvc && event.shiftKey;

        // home and end can be processed without knowing the currently selected cell, this can occur for full width rows.
        const currentCell: CellPosition | null = this.beans.mouseEventSvc.getCellPositionForEvent(event);

        let processed = false;

        switch (key) {
            case KeyCode.PAGE_HOME:
            case KeyCode.PAGE_END:
                // handle home and end when ctrl & alt are NOT pressed
                if (!ctrl && !alt) {
                    this.onHomeOrEndKey(key);
                    processed = true;
                }
                break;
            case KeyCode.LEFT:
            case KeyCode.RIGHT:
            case KeyCode.UP:
            case KeyCode.DOWN:
                if (!currentCell) {
                    return false;
                }
                // handle when ctrl is pressed only, if shift is pressed
                // it will be handled by the rangeService
                if (ctrl && !alt && !rangeServiceShouldHandleShift) {
                    this.onCtrlUpDownLeftRight(key, currentCell);
                    processed = true;
                }
                break;
            case KeyCode.PAGE_DOWN:
            case KeyCode.PAGE_UP:
                // handle page up and page down when ctrl & alt are NOT pressed
                if (!ctrl && !alt) {
                    processed = this.handlePageUpDown(key, currentCell, fromFullWidth);
                }
                break;
        }

        if (processed) {
            event.preventDefault();
        }

        return processed;
    }

    private handlePageUpDown(key: string, currentCell: CellPosition | null, fromFullWidth: boolean): boolean {
        if (fromFullWidth) {
            currentCell = this.focusSvc.getFocusedCell();
        }

        if (!currentCell) {
            return false;
        }

        if (key === KeyCode.PAGE_UP) {
            this.onPageUp(currentCell);
        } else {
            this.onPageDown(currentCell);
        }

        return true;
    }

    private navigateTo(navigateParams: NavigateParams): void {
        const { scrollIndex, scrollType, scrollColumn, focusIndex, focusColumn } = navigateParams;

        if (_exists(scrollColumn) && !scrollColumn.isPinned()) {
            this.gridBodyCon.getScrollFeature().ensureColumnVisible(scrollColumn);
        }

        if (_exists(scrollIndex)) {
            this.gridBodyCon.getScrollFeature().ensureIndexVisible(scrollIndex, scrollType);
        }

        // setFocusedCell relies on the browser default focus behavior to scroll the focused cell into view,
        // however, this behavior will cause the cell border to be cut off, or if we have sticky rows, the
        // cell will be completely hidden, so we call ensureIndexVisible without a position to guarantee
        // minimal scroll to get the row into view.
        if (!navigateParams.isAsync) {
            this.gridBodyCon.getScrollFeature().ensureIndexVisible(focusIndex);
        }

        // if we don't do this, the range will be left on the last cell, which will leave the last focused cell
        // highlighted.
        this.focusSvc.setFocusedCell({
            rowIndex: focusIndex,
            column: focusColumn,
            rowPinned: null,
            forceBrowserFocus: true,
        });

        this.rangeSvc?.setRangeToCell({ rowIndex: focusIndex, rowPinned: null, column: focusColumn });
    }

    // this method is throttled, see the `constructor`
    private onPageDown(gridCell: CellPosition): void {
        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const scrollPosition = gridBodyCon.getScrollFeature().getVScrollPosition();
        const pixelsInOnePage = this.getViewportHeight();

        const pagingPixelOffset = this.pageBounds.getPixelOffset();

        const currentPageBottomPixel = scrollPosition.top + pixelsInOnePage;
        const currentPageBottomRow = this.rowModel.getRowIndexAtPixel(currentPageBottomPixel + pagingPixelOffset);

        if (this.beans.rowAutoHeight?.active) {
            this.navigateToNextPageWithAutoHeight(gridCell, currentPageBottomRow);
        } else {
            this.navigateToNextPage(gridCell, currentPageBottomRow);
        }
    }

    // this method is throttled, see the `constructor`
    private onPageUp(gridCell: CellPosition): void {
        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const scrollPosition = gridBodyCon.getScrollFeature().getVScrollPosition();

        const pagingPixelOffset = this.pageBounds.getPixelOffset();

        const currentPageTopPixel = scrollPosition.top;
        const currentPageTopRow = this.rowModel.getRowIndexAtPixel(currentPageTopPixel + pagingPixelOffset);

        if (this.beans.rowAutoHeight?.active) {
            this.navigateToNextPageWithAutoHeight(gridCell, currentPageTopRow, true);
        } else {
            this.navigateToNextPage(gridCell, currentPageTopRow, true);
        }
    }

    private navigateToNextPage(gridCell: CellPosition, scrollIndex: number, up: boolean = false): void {
        const pixelsInOnePage = this.getViewportHeight();
        const firstRow = this.pageBounds.getFirstRow();
        const lastRow = this.pageBounds.getLastRow();
        const pagingPixelOffset = this.pageBounds.getPixelOffset();
        const currentRowNode = this.rowModel.getRow(gridCell.rowIndex);

        const rowPixelDiff = up
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              currentRowNode?.rowHeight! - pixelsInOnePage - pagingPixelOffset
            : pixelsInOnePage - pagingPixelOffset;

        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const nextCellPixel = currentRowNode?.rowTop! + rowPixelDiff;

        let focusIndex = this.rowModel.getRowIndexAtPixel(nextCellPixel + pagingPixelOffset);

        if (focusIndex === gridCell.rowIndex) {
            const diff = up ? -1 : 1;
            scrollIndex = focusIndex = gridCell.rowIndex + diff;
        }

        let scrollType: 'top' | 'bottom';

        if (up) {
            scrollType = 'bottom';
            if (focusIndex < firstRow) {
                focusIndex = firstRow;
            }
            if (scrollIndex < firstRow) {
                scrollIndex = firstRow;
            }
        } else {
            scrollType = 'top';
            if (focusIndex > lastRow) {
                focusIndex = lastRow;
            }
            if (scrollIndex > lastRow) {
                scrollIndex = lastRow;
            }
        }

        if (this.isRowTallerThanView(focusIndex)) {
            scrollIndex = focusIndex;
            scrollType = 'top';
        }

        this.navigateTo({
            scrollIndex,
            scrollType,
            scrollColumn: null,
            focusIndex,
            focusColumn: gridCell.column as AgColumn,
        });
    }

    private navigateToNextPageWithAutoHeight(gridCell: CellPosition, scrollIndex: number, up: boolean = false): void {
        // because autoHeight will calculate the height of rows after scroll
        // first we scroll towards the required point, then we add a small
        // delay to allow the height to be recalculated, check which index
        // should be focused and then finally navigate to that index.
        // TODO: we should probably have an event fired once to scrollbar has
        // settled and all rowHeights have been calculated instead of relying
        // on a setTimeout of 50ms.
        this.navigateTo({
            scrollIndex: scrollIndex,
            scrollType: up ? 'bottom' : 'top',
            scrollColumn: null,
            focusIndex: scrollIndex,
            focusColumn: gridCell.column as AgColumn,
        });
        setTimeout(() => {
            const focusIndex = this.getNextFocusIndexForAutoHeight(gridCell, up);

            this.navigateTo({
                scrollIndex: scrollIndex,
                scrollType: up ? 'bottom' : 'top',
                scrollColumn: null,
                focusIndex: focusIndex,
                focusColumn: gridCell.column as AgColumn,
                isAsync: true,
            });
        }, 50);
    }

    private getNextFocusIndexForAutoHeight(gridCell: CellPosition, up: boolean = false): number {
        const step = up ? -1 : 1;
        const pixelsInOnePage = this.getViewportHeight();
        const lastRowIndex = this.pageBounds.getLastRow();

        let pixelSum = 0;
        let currentIndex = gridCell.rowIndex;

        while (currentIndex >= 0 && currentIndex <= lastRowIndex) {
            const currentCell = this.rowModel.getRow(currentIndex);

            if (currentCell) {
                const currentCellHeight = currentCell.rowHeight ?? 0;

                if (pixelSum + currentCellHeight > pixelsInOnePage) {
                    break;
                }
                pixelSum += currentCellHeight;
            }

            currentIndex += step;
        }

        return Math.max(0, Math.min(currentIndex, lastRowIndex));
    }

    private getViewportHeight(): number {
        const scrollPosition = this.ctrlsSvc.getGridBodyCtrl().getScrollFeature().getVScrollPosition();
        const scrollbarWidth = this.beans.scrollVisibleSvc.getScrollbarWidth();
        let pixelsInOnePage = scrollPosition.bottom - scrollPosition.top;

        if (this.ctrlsSvc.get('center').isHorizontalScrollShowing()) {
            pixelsInOnePage -= scrollbarWidth;
        }

        return pixelsInOnePage;
    }

    private isRowTallerThanView(rowIndex: number): boolean {
        const rowNode = this.rowModel.getRow(rowIndex);
        if (!rowNode) {
            return false;
        }

        const rowHeight = rowNode.rowHeight;

        if (typeof rowHeight !== 'number') {
            return false;
        }

        return rowHeight > this.getViewportHeight();
    }

    private onCtrlUpDownLeftRight(key: string, gridCell: CellPosition): void {
        const cellToFocus = this.cellNavigation.getNextCellToFocus(key, gridCell, true)!;
        const { rowIndex } = cellToFocus;
        const column = cellToFocus.column as AgColumn;

        this.navigateTo({
            scrollIndex: rowIndex,
            scrollType: null,
            scrollColumn: column,
            focusIndex: rowIndex,
            focusColumn: column,
        });
    }

    // home brings focus to top left cell, end brings focus to bottom right, grid scrolled to bring
    // same cell into view (which means either scroll all the way up, or all the way down).
    private onHomeOrEndKey(key: string): void {
        const homeKey = key === KeyCode.PAGE_HOME;
        const allColumns: AgColumn[] = this.visibleCols.allCols;
        const columnToSelect = homeKey ? allColumns[0] : _last(allColumns);
        const scrollIndex = homeKey ? this.pageBounds.getFirstRow() : this.pageBounds.getLastRow();

        this.navigateTo({
            scrollIndex: scrollIndex,
            scrollType: null,
            scrollColumn: columnToSelect,
            focusIndex: scrollIndex,
            focusColumn: columnToSelect,
        });
    }

    // result of keyboard event
    public onTabKeyDown(previous: CellCtrl | RowCtrl, keyboardEvent: KeyboardEvent): void {
        const backwards = keyboardEvent.shiftKey;
        const movedToNextCell = this.tabToNextCellCommon(previous, backwards, keyboardEvent);

        if (movedToNextCell !== false) {
            // only prevent default if we found a cell. so if user is on last cell and hits tab, then we default
            // to the normal tabbing so user can exit the grid.
            if (movedToNextCell) {
                keyboardEvent.preventDefault();
            } else if (movedToNextCell === null) {
                // want to let browser handle, however some of the containers prevent browser focus
                this.focusSvc.allowFocusForNextGridCoreContainer(backwards);
            }
            return;
        }

        // if we didn't move to next cell, then need to tab out of the cells, ie to the header (if going
        // backwards)
        if (backwards) {
            const { rowIndex, rowPinned } = previous.getRowPosition();
            const firstRow = rowPinned ? rowIndex === 0 : rowIndex === this.pageBounds.getFirstRow();
            if (firstRow) {
                if (this.gos.get('headerHeight') === 0 || this.focusSvc.isHeaderFocusSuppressed()) {
                    this.focusSvc.focusNextGridCoreContainer(true, true);
                } else {
                    keyboardEvent.preventDefault();
                    this.focusSvc.focusPreviousFromFirstCell(keyboardEvent);
                }
            }
        } else {
            // if the case it's a popup editor, the focus is on the editor and not the previous cell.
            // in order for the tab navigation to work, we need to focus the browser back onto the
            // previous cell.
            if (previous instanceof CellCtrl) {
                previous.focusCell(true);
            }

            if (
                (!backwards && this.focusSvc.focusOverlay(false)) ||
                this.focusSvc.focusNextGridCoreContainer(backwards)
            ) {
                keyboardEvent.preventDefault();
            }
        }
    }

    // comes from API
    public tabToNextCell(backwards: boolean, event?: KeyboardEvent): boolean {
        const focusedCell = this.focusSvc.getFocusedCell();
        // if no focus, then cannot navigate
        if (!focusedCell) {
            return false;
        }

        let cellOrRow: CellCtrl | RowCtrl | null = _getCellByPosition(this.beans, focusedCell);

        // if cell is not rendered, means user has scrolled away from the cell
        // or that the focusedCell is a Full Width Row
        if (!cellOrRow) {
            cellOrRow = this.rowRenderer.getRowByPosition(focusedCell);
            if (!cellOrRow || !cellOrRow.isFullWidth()) {
                return false;
            }
        }

        return !!this.tabToNextCellCommon(cellOrRow, backwards, event);
    }

    private tabToNextCellCommon(
        previous: CellCtrl | RowCtrl,
        backwards: boolean,
        event?: KeyboardEvent
    ): boolean | null {
        let editing = previous.isEditing();

        // if cell is not editing, there is still chance row is editing if it's Full Row Editing
        if (!editing && previous instanceof CellCtrl) {
            const cell = previous as CellCtrl;
            const row = cell.getRowCtrl();
            if (row) {
                editing = row.isEditing();
            }
        }

        let res: boolean | null;

        if (editing) {
            // if we are editing, we know it's not a Full Width Row (RowComp)
            if (this.gos.get('editType') === 'fullRow') {
                res = this.moveToNextEditingRow(previous as CellCtrl, backwards, event);
            } else {
                res = this.moveToNextEditingCell(previous as CellCtrl, backwards, event);
            }
        } else {
            res = this.moveToNextCellNotEditing(previous, backwards);
        }

        if (res === null) {
            return res;
        }

        // if a cell wasn't found, it's possible that focus was moved to the header
        return res || !!this.focusSvc.getFocusedHeader();
    }

    // returns null if no navigation should be performed
    private moveToNextEditingCell(
        previousCell: CellCtrl,
        backwards: boolean,
        event: KeyboardEvent | null = null
    ): boolean | null {
        const previousPos = previousCell.getCellPosition();

        // before we stop editing, we need to focus the cell element
        // so the grid doesn't detect that focus has left the grid
        previousCell.getGui().focus();

        // need to do this before getting next cell to edit, in case the next cell
        // has editable function (eg colDef.editable=func() ) and it depends on the
        // result of this cell, so need to save updates from the first edit, in case
        // the value is referenced in the function.
        previousCell.stopEditing();

        // find the next cell to start editing
        const nextCell = this.findNextCellToFocusOn(previousPos, backwards, true) as CellCtrl | false;
        if (nextCell === false) {
            return null;
        }
        if (nextCell == null) {
            return false;
        }

        // only prevent default if we found a cell. so if user is on last cell and hits tab, then we default
        // to the normal tabbing so user can exit the grid.
        nextCell.startEditing(null, true, event);
        nextCell.focusCell(false);
        return true;
    }

    // returns null if no navigation should be performed
    private moveToNextEditingRow(
        previousCell: CellCtrl,
        backwards: boolean,
        event: KeyboardEvent | null = null
    ): boolean | null {
        const previousPos = previousCell.getCellPosition();

        // find the next cell to start editing
        const nextCell = this.findNextCellToFocusOn(previousPos, backwards, true) as CellCtrl | false;
        if (nextCell === false) {
            return null;
        }
        if (nextCell == null) {
            return false;
        }

        const nextPos = nextCell.getCellPosition();

        const previousEditable = this.isCellEditable(previousPos);
        const nextEditable = this.isCellEditable(nextPos);

        const rowsMatch =
            nextPos && previousPos.rowIndex === nextPos.rowIndex && previousPos.rowPinned === nextPos.rowPinned;

        if (previousEditable) {
            previousCell.setFocusOutOnEditor();
        }

        if (!rowsMatch) {
            const pRow = previousCell.getRowCtrl();
            pRow!.stopEditing();

            const nRow = nextCell.getRowCtrl();
            nRow!.startRowEditing(undefined, undefined, event);
        }

        if (nextEditable) {
            nextCell.setFocusInOnEditor();
            nextCell.focusCell();
        } else {
            nextCell.focusCell(true);
        }

        return true;
    }

    // returns null if no navigation should be performed
    private moveToNextCellNotEditing(previousCell: CellCtrl | RowCtrl, backwards: boolean): boolean | null {
        const displayedColumns = this.visibleCols.allCols;
        let cellPos: CellPosition;

        if (previousCell instanceof RowCtrl) {
            cellPos = {
                ...previousCell.getRowPosition(),
                column: backwards ? displayedColumns[0] : _last(displayedColumns),
            };
        } else {
            cellPos = previousCell.getCellPosition();
        }
        // find the next cell to start editing
        const nextCell = this.findNextCellToFocusOn(cellPos, backwards, false);

        // only prevent default if we found a cell. so if user is on last cell and hits tab, then we default
        // to the normal tabbing so user can exit the grid.
        if (nextCell === false) {
            return null;
        }
        if (nextCell instanceof CellCtrl) {
            nextCell.focusCell(true);
        } else if (nextCell) {
            return this.tryToFocusFullWidthRow(nextCell.getRowPosition(), backwards);
        }

        return _exists(nextCell);
    }

    /**
     * called by the cell, when tab is pressed while editing.
     * @return: RenderedCell when navigation successful, false if navigation should not be performed, otherwise null
     */
    private findNextCellToFocusOn(
        previousPosition: CellPosition,
        backwards: boolean,
        startEditing: boolean
    ): CellCtrl | RowCtrl | null | false {
        let nextPosition: CellPosition | null | undefined = previousPosition;

        while (true) {
            if (previousPosition !== nextPosition) {
                previousPosition = nextPosition;
            }

            if (!backwards) {
                nextPosition = this.getLastCellOfColSpan(nextPosition);
            }
            nextPosition = this.cellNavigation.getNextTabbedCell(nextPosition, backwards);

            // allow user to override what cell to go to next
            const userFunc = this.gos.getCallback('tabToNextCell');

            if (_exists(userFunc)) {
                const params: WithoutGridCommon<TabToNextCellParams> = {
                    backwards: backwards,
                    editing: startEditing,
                    previousCellPosition: previousPosition,
                    nextCellPosition: nextPosition ? nextPosition : null,
                };
                const userResult = userFunc(params);
                if (userResult === true) {
                    nextPosition = previousPosition;
                } else if (userResult === false) {
                    return false;
                } else {
                    nextPosition = {
                        rowIndex: userResult.rowIndex,
                        column: userResult.column,
                        rowPinned: userResult.rowPinned,
                    } as CellPosition;
                }
            }

            // if no 'next cell', means we have got to last cell of grid, so nothing to move to,
            // so bottom right cell going forwards, or top left going backwards
            if (!nextPosition) {
                return null;
            }

            if (nextPosition.rowIndex < 0) {
                const headerLen = this.focusSvc.getHeaderRowCount();

                this.focusSvc.focusHeaderPosition({
                    headerPosition: {
                        headerRowIndex: headerLen + nextPosition.rowIndex,
                        column: nextPosition.column,
                    },
                    fromCell: true,
                });

                return null;
            }

            // if editing, but cell not editable, skip cell. we do this before we do all of
            // the 'ensure index visible' and 'flush all frames', otherwise if we are skipping
            // a bunch of cells (eg 10 rows) then all the work on ensuring cell visible is useless
            // (except for the last one) which causes grid to stall for a while.
            // note - for full row edit, we do focus non-editable cells, as the row stays in edit mode.
            const fullRowEdit = this.gos.get('editType') === 'fullRow';
            if (startEditing && !fullRowEdit) {
                const cellIsEditable = this.isCellEditable(nextPosition);
                if (!cellIsEditable) {
                    continue;
                }
            }

            this.ensureCellVisible(nextPosition);

            // we have to call this after ensureColumnVisible - otherwise it could be a virtual column
            // or row that is not currently in view, hence the renderedCell would not exist
            const nextCell = _getCellByPosition(this.beans, nextPosition);

            // if next cell is fullWidth row, then no rendered cell,
            // as fullWidth rows have no cells, so we skip it
            if (!nextCell) {
                const row = this.rowRenderer.getRowByPosition(nextPosition);
                if (!row || !row.isFullWidth() || startEditing) {
                    continue;
                }
                return row;
            }

            if (nextCell.isSuppressNavigable()) {
                continue;
            }

            // by default, when we click a cell, it gets selected into a range, so to keep keyboard navigation
            // consistent, we set into range here also.
            this.rangeSvc?.setRangeToCell(nextPosition);

            // we successfully tabbed onto a grid cell, so return true
            return nextCell;
        }
    }

    private isCellEditable(cell: CellPosition): boolean {
        const rowNode = this.lookupRowNodeForCell(cell);

        if (rowNode) {
            return cell.column.isCellEditable(rowNode);
        }

        return false;
    }

    private lookupRowNodeForCell(cell: CellPosition) {
        if (cell.rowPinned === 'top') {
            return this.pinnedRowModel?.getPinnedTopRow(cell.rowIndex);
        }

        if (cell.rowPinned === 'bottom') {
            return this.pinnedRowModel?.getPinnedBottomRow(cell.rowIndex);
        }

        return this.rowModel.getRow(cell.rowIndex);
    }

    // we use index for rows, but column object for columns, as the next column (by index) might not
    // be visible (header grouping) so it's not reliable, so using the column object instead.
    public navigateToNextCell(
        event: KeyboardEvent | null,
        key: string,
        currentCell: CellPosition,
        allowUserOverride: boolean
    ) {
        // we keep searching for a next cell until we find one. this is how the group rows get skipped
        let nextCell: CellPosition | null = currentCell;
        let hitEdgeOfGrid = false;

        while (nextCell && (nextCell === currentCell || !this.isValidNavigateCell(nextCell))) {
            // if the current cell is spanning across multiple columns, we need to move
            // our current position to be the last cell on the right before finding the
            // the next target.
            if (this.gos.get('enableRtl')) {
                if (key === KeyCode.LEFT) {
                    nextCell = this.getLastCellOfColSpan(nextCell);
                }
            } else if (key === KeyCode.RIGHT) {
                nextCell = this.getLastCellOfColSpan(nextCell);
            }

            nextCell = this.cellNavigation.getNextCellToFocus(key, nextCell);

            // eg if going down, and nextCell=undefined, means we are gone past the last row
            hitEdgeOfGrid = _missing(nextCell);
        }

        if (hitEdgeOfGrid && event && event.key === KeyCode.UP) {
            nextCell = {
                rowIndex: -1,
                rowPinned: null,
                column: currentCell.column,
            };
        }

        // allow user to override what cell to go to next. when doing normal cell navigation (with keys)
        // we allow this, however if processing 'enter after edit' we don't allow override
        if (allowUserOverride) {
            const userFunc = this.gos.getCallback('navigateToNextCell');
            if (_exists(userFunc)) {
                const params: WithoutGridCommon<NavigateToNextCellParams> = {
                    key: key,
                    previousCellPosition: currentCell,
                    nextCellPosition: nextCell ? nextCell : null,
                    event: event,
                };
                const userCell = userFunc(params);
                if (_exists(userCell)) {
                    nextCell = {
                        rowPinned: userCell.rowPinned,
                        rowIndex: userCell.rowIndex,
                        column: userCell.column,
                    } as CellPosition;
                } else {
                    nextCell = null;
                }
            }
        }

        // no next cell means we have reached a grid boundary, eg left, right, top or bottom of grid
        if (!nextCell) {
            return;
        }

        if (nextCell.rowIndex < 0) {
            const headerLen = this.focusSvc.getHeaderRowCount();

            this.focusSvc.focusHeaderPosition({
                headerPosition: { headerRowIndex: headerLen + nextCell.rowIndex, column: currentCell.column },
                event: event || undefined,
                fromCell: true,
            });

            return;
        }

        // in case we have col spanning we get the cellComp and use it to get the
        // position. This was we always focus the first cell inside the spanning.
        const normalisedPosition = this.getNormalisedPosition(nextCell);
        if (normalisedPosition) {
            this.focusPosition(normalisedPosition);
        } else {
            this.tryToFocusFullWidthRow(nextCell);
        }
    }

    private getNormalisedPosition(cellPosition: CellPosition): CellPosition | null {
        // ensureCellVisible first, to make sure cell at position is rendered.
        this.ensureCellVisible(cellPosition);

        const cellCtrl = _getCellByPosition(this.beans, cellPosition);

        // not guaranteed to have a cellComp when using the SSRM as blocks are loading.
        if (!cellCtrl) {
            return null;
        }

        cellPosition = cellCtrl.getCellPosition();
        // we call this again, as nextCell can be different to it's previous value due to Column Spanning
        // (ie if cursor moving from right to left, and cell is spanning columns, then nextCell was the
        // last column in the group, however now it's the first column in the group). if we didn't do
        // ensureCellVisible again, then we could only be showing the last portion (last column) of the
        // merged cells.
        this.ensureCellVisible(cellPosition);

        return cellPosition;
    }

    public tryToFocusFullWidthRow(position: CellPosition | RowPosition, backwards?: boolean): boolean {
        const displayedColumns = this.visibleCols.allCols;
        const rowComp = this.rowRenderer.getRowByPosition(position);
        if (!rowComp || !rowComp.isFullWidth()) {
            return false;
        }

        const currentCellFocused = this.focusSvc.getFocusedCell();

        const cellPosition: CellPosition = {
            rowIndex: position.rowIndex,
            rowPinned: position.rowPinned,
            column: (position as CellPosition).column || (backwards ? _last(displayedColumns) : displayedColumns[0]),
        };

        this.focusPosition(cellPosition);

        const fromBelow =
            backwards == null
                ? currentCellFocused != null && _isRowBefore(cellPosition, currentCellFocused)
                : backwards;

        this.eventSvc.dispatchEvent({
            type: 'fullWidthRowFocused',
            rowIndex: cellPosition.rowIndex,
            rowPinned: cellPosition.rowPinned,
            column: cellPosition.column,
            isFullWidthCell: true,
            fromBelow,
        });

        return true;
    }

    private focusPosition(cellPosition: CellPosition) {
        this.focusSvc.setFocusedCell({
            rowIndex: cellPosition.rowIndex,
            column: cellPosition.column,
            rowPinned: cellPosition.rowPinned,
            forceBrowserFocus: true,
        });

        this.rangeSvc?.setRangeToCell(cellPosition);
    }

    private isValidNavigateCell(cell: CellPosition): boolean {
        const rowNode = _getRowNode(this.beans, cell);

        // we do not allow focusing on detail rows and full width rows
        return !!rowNode;
    }

    private getLastCellOfColSpan(cell: CellPosition): CellPosition {
        const cellCtrl = _getCellByPosition(this.beans, cell);

        if (!cellCtrl) {
            return cell;
        }

        const colSpanningList = cellCtrl.getColSpanningList();

        if (colSpanningList.length === 1) {
            return cell;
        }

        return {
            rowIndex: cell.rowIndex,
            column: _last(colSpanningList),
            rowPinned: cell.rowPinned,
        };
    }

    public ensureCellVisible(gridCell: CellPosition): void {
        const isGroupStickyEnabled = _isGroupRowsSticky(this.gos);

        const rowNode = this.rowModel.getRow(gridCell.rowIndex);
        // sticky rows are always visible, so the grid shouldn't scroll to focus them.
        const skipScrollToRow = isGroupStickyEnabled && rowNode?.sticky;

        // this scrolls the row into view
        if (!skipScrollToRow && _missing(gridCell.rowPinned)) {
            this.gridBodyCon.getScrollFeature().ensureIndexVisible(gridCell.rowIndex);
        }

        if (!gridCell.column.isPinned()) {
            this.gridBodyCon.getScrollFeature().ensureColumnVisible(gridCell.column);
        }
    }
}
