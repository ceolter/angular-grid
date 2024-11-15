import type { ColumnModel } from './columns/columnModel';
import type { VisibleColsService } from './columns/visibleColsService';
import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { AgColumn } from './entities/agColumn';
import type { AgColumnGroup } from './entities/agColumnGroup';
import { _areCellsEqual, _getFirstRow, _getLastRow } from './entities/positionUtils';
import type { RowNode } from './entities/rowNode';
import type { CellFocusedParams, CommonCellFocusParams } from './events';
import type { FilterManager } from './filter/filterManager';
import { _getActiveDomElement, _getDomData } from './gridOptionsUtils';
import { DOM_DATA_KEY_HEADER_CTRL } from './headerRendering/cells/abstractCell/abstractHeaderCellCtrl';
import type { HeaderCellCtrl } from './headerRendering/cells/column/headerCellCtrl';
import { getFocusHeaderRowCount } from './headerRendering/headerUtils';
import type { NavigateToNextHeaderParams, TabToNextHeaderParams } from './interfaces/iCallbackParams';
import type { CellPosition } from './interfaces/iCellPosition';
import type { WithoutGridCommon } from './interfaces/iCommon';
import type { HeaderPosition } from './interfaces/iHeaderPosition';
import type { RowPinnedType } from './interfaces/iRowNode';
import { getHeaderIndexToFocus } from './navigation/headerNavigationService';
import type { HeaderNavigationService } from './navigation/headerNavigationService';
import type { NavigationService } from './navigation/navigationService';
import type { OverlayService } from './rendering/overlays/overlayService';
import { DOM_DATA_KEY_ROW_CTRL } from './rendering/row/rowCtrl';
import type { RowRenderer } from './rendering/rowRenderer';
import { _last } from './utils/array';
import {
    _focusInto,
    _focusNextGridCoreContainer,
    _isCellFocusSuppressed,
    _isHeaderFocusSuppressed,
    _registerKeyboardFocusEvents,
} from './utils/focus';
import { _makeNull } from './utils/generic';

export class FocusService extends BeanStub implements NamedBean {
    beanName = 'focusSvc' as const;

    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private headerNavigation?: HeaderNavigationService;
    private rowRenderer: RowRenderer;
    private navigation?: NavigationService;
    private filterManager?: FilterManager;
    private overlays?: OverlayService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.headerNavigation = beans.headerNavigation;
        this.rowRenderer = beans.rowRenderer;
        this.navigation = beans.navigation;
        this.filterManager = beans.filterManager;
        this.overlays = beans.overlays;
    }

    private focusedCellPosition: CellPosition | null;
    private restoredFocusedCellPosition: CellPosition | null;
    private focusedHeaderPosition: HeaderPosition | null;
    /** the column that had focus before it moved into the advanced filter */
    private advancedFilterFocusColumn: AgColumn | undefined;

    private awaitRestoreFocusedCell: boolean;

    public postConstruct(): void {
        const clearFocusedCellListener = this.clearFocusedCell.bind(this);

        this.addManagedEventListeners({
            columnPivotModeChanged: clearFocusedCellListener,
            newColumnsLoaded: this.onColumnEverythingChanged.bind(this),
            columnGroupOpened: clearFocusedCellListener,
            columnRowGroupChanged: clearFocusedCellListener,
        });

        this.addDestroyFunc(_registerKeyboardFocusEvents(this.beans));
    }

    public onColumnEverythingChanged(): void {
        // if the columns change, check and see if this column still exists. if it does, then
        // we can keep the focused cell. if it doesn't, then we need to drop the focused cell.
        if (!this.focusedCellPosition) {
            return;
        }

        const col = this.focusedCellPosition.column;
        const colFromColumnModel = this.colModel.getCol(col.getId());

        if (col !== colFromColumnModel) {
            this.clearFocusedCell();
        }
    }

    // we check if the browser is focusing something, and if it is, and
    // it's the cell we think is focused, then return the cell. so this
    // methods returns the cell if a) we think it has focus and b) the
    // browser thinks it has focus. this then returns nothing if we
    // first focus a cell, then second click outside the grid, as then the
    // grid cell will still be focused as far as the grid is concerned,
    // however the browser focus will have moved somewhere else.
    public getFocusCellToUseAfterRefresh(): CellPosition | null {
        if (this.gos.get('suppressFocusAfterRefresh') || !this.focusedCellPosition) {
            return null;
        }

        // we check that the browser is actually focusing on the grid, if it is not, then
        // we have nothing to worry about. we check for ROW data, as this covers both focused Rows (for Full Width Rows)
        // and Cells (covers cells as cells live in rows)
        if (this.isDomDataMissingInHierarchy(_getActiveDomElement(this.beans), DOM_DATA_KEY_ROW_CTRL)) {
            return null;
        }

        return this.focusedCellPosition;
    }

    public getFocusHeaderToUseAfterRefresh(): HeaderPosition | null {
        if (this.gos.get('suppressFocusAfterRefresh') || !this.focusedHeaderPosition) {
            return null;
        }

        // we check that the browser is actually focusing on the grid, if it is not, then
        // we have nothing to worry about
        if (this.isDomDataMissingInHierarchy(_getActiveDomElement(this.beans), DOM_DATA_KEY_HEADER_CTRL)) {
            return null;
        }

        return this.focusedHeaderPosition;
    }

    private isDomDataMissingInHierarchy(eBrowserCell: Node | null, key: string): boolean {
        let ePointer = eBrowserCell;

        while (ePointer) {
            const data = _getDomData(this.gos, ePointer, key);

            if (data) {
                return false;
            }

            ePointer = ePointer.parentNode;
        }

        return true;
    }

    public getFocusedCell(): CellPosition | null {
        return this.focusedCellPosition;
    }

    public shouldRestoreFocus(cell: CellPosition): boolean {
        if (this.isCellRestoreFocused(cell)) {
            setTimeout(() => {
                // Clear the restore focused cell position after the timeout to avoid
                // the cell being focused again and stealing focus from another part of the app.
                this.restoredFocusedCellPosition = null;
            }, 0);
            return true;
        }
        return false;
    }

    public clearRestoreFocus(): void {
        this.restoredFocusedCellPosition = null;
        this.awaitRestoreFocusedCell = false;
    }

    public restoreFocusedCell(cellPosition: CellPosition, setFocusCallback: () => void): void {
        this.awaitRestoreFocusedCell = true;

        // this should be done asynchronously to work with React Renderers.
        setTimeout(() => {
            // if the cell has lost focus (react events are async), we don't want to restore
            if (!this.awaitRestoreFocusedCell) {
                return;
            }
            this.setRestoreFocusedCell(cellPosition);

            setFocusCallback();
        });
    }

    private isCellRestoreFocused(cellPosition: CellPosition): boolean {
        if (this.restoredFocusedCellPosition == null) {
            return false;
        }

        return _areCellsEqual(cellPosition, this.restoredFocusedCellPosition);
    }

    public setRestoreFocusedCell(cellPosition: CellPosition): void {
        if (this.beans.frameworkOverrides.renderingEngine === 'react') {
            // The restoredFocusedCellPosition is used in the React Rendering engine as we have to be able
            // to support restoring focus after an async rendering.
            this.restoredFocusedCellPosition = cellPosition;
        }
    }

    private getFocusEventParams(focusedCellPosition: CellPosition): CommonCellFocusParams {
        const { rowIndex, rowPinned, column } = focusedCellPosition;

        const params: CommonCellFocusParams = {
            rowIndex: rowIndex,
            rowPinned: rowPinned,
            column: column,
            isFullWidthCell: false,
        };

        const rowCtrl = this.rowRenderer.getRowByPosition({ rowIndex, rowPinned });

        if (rowCtrl) {
            params.isFullWidthCell = rowCtrl.isFullWidth();
        }

        return params;
    }

    public clearFocusedCell(): void {
        this.restoredFocusedCellPosition = null;
        if (this.focusedCellPosition == null) {
            return;
        }

        const focusEventParams = this.getFocusEventParams(this.focusedCellPosition);

        this.focusedCellPosition = null;

        this.eventSvc.dispatchEvent({
            type: 'cellFocusCleared',
            ...focusEventParams,
        });
    }

    public setFocusedCell(params: CellFocusedParams): void {
        const { column, rowIndex, rowPinned, forceBrowserFocus = false, preventScrollOnBrowserFocus = false } = params;

        const gridColumn = this.colModel.getCol(column!);

        // if column doesn't exist, then blank the focused cell and return. this can happen when user sets new columns,
        // and the focused cell is in a column that no longer exists. after columns change, the grid refreshes and tries
        // to re-focus the focused cell.
        if (!gridColumn) {
            this.focusedCellPosition = null;
            return;
        }

        this.focusedCellPosition = {
            rowIndex: rowIndex!,
            rowPinned: _makeNull(rowPinned),
            column: gridColumn,
        };

        this.eventSvc.dispatchEvent({
            type: 'cellFocused',
            ...this.getFocusEventParams(this.focusedCellPosition),
            forceBrowserFocus,
            preventScrollOnBrowserFocus,
        });
    }

    public isCellFocused(cellPosition: CellPosition): boolean {
        if (this.focusedCellPosition == null) {
            return false;
        }

        return _areCellsEqual(cellPosition, this.focusedCellPosition);
    }

    public isRowNodeFocused(rowNode: RowNode): boolean {
        return this.isRowFocused(rowNode.rowIndex!, rowNode.rowPinned);
    }

    public isHeaderWrapperFocused(headerCtrl: HeaderCellCtrl): boolean {
        if (this.focusedHeaderPosition == null) {
            return false;
        }

        const {
            column,
            rowCtrl: { rowIndex: headerRowIndex, pinned },
        } = headerCtrl;

        const { column: focusedColumn, headerRowIndex: focusedHeaderRowIndex } = this.focusedHeaderPosition;

        return (
            column === focusedColumn && headerRowIndex === focusedHeaderRowIndex && pinned == focusedColumn.getPinned()
        );
    }

    public clearFocusedHeader(): void {
        this.focusedHeaderPosition = null;
    }

    public getFocusedHeader(): HeaderPosition | null {
        return this.focusedHeaderPosition;
    }

    public setFocusedHeader(headerRowIndex: number, column: AgColumnGroup | AgColumn): void {
        this.focusedHeaderPosition = { headerRowIndex, column };
    }

    public focusHeaderPosition(params: {
        headerPosition: HeaderPosition | null;
        direction?: 'Before' | 'After' | null;
        fromTab?: boolean;
        allowUserOverride?: boolean;
        event?: KeyboardEvent;
        fromCell?: boolean;
        rowWithoutSpanValue?: number;
    }): boolean {
        if (_isHeaderFocusSuppressed(this.beans)) {
            return false;
        }

        const { direction, fromTab, allowUserOverride, event, fromCell, rowWithoutSpanValue } = params;
        let { headerPosition } = params;

        if (fromCell && this.filterManager?.isAdvFilterHeaderActive()) {
            return this.focusAdvancedFilter(headerPosition);
        }

        if (allowUserOverride) {
            const currentPosition = this.getFocusedHeader();
            const headerRowCount = getFocusHeaderRowCount(this.beans);

            if (fromTab) {
                const userFunc = this.gos.getCallback('tabToNextHeader');
                if (userFunc) {
                    headerPosition = this.getHeaderPositionFromUserFunc({
                        userFunc,
                        direction,
                        currentPosition,
                        headerPosition,
                        headerRowCount,
                    });
                }
            } else {
                const userFunc = this.gos.getCallback('navigateToNextHeader');
                if (userFunc && event) {
                    const params: WithoutGridCommon<NavigateToNextHeaderParams> = {
                        key: event.key,
                        previousHeaderPosition: currentPosition,
                        nextHeaderPosition: headerPosition,
                        headerRowCount,
                        event,
                    };
                    headerPosition = userFunc(params);
                }
            }
        }

        if (!headerPosition) {
            return false;
        }

        return this.focusProvidedHeaderPosition({
            headerPosition,
            direction,
            event,
            fromCell,
            rowWithoutSpanValue,
        });
    }

    public focusHeaderPositionFromUserFunc(params: {
        userFunc: (params: WithoutGridCommon<TabToNextHeaderParams>) => boolean | HeaderPosition;
        headerPosition: HeaderPosition | null;
        direction?: 'Before' | 'After' | null;
        event?: KeyboardEvent;
    }): boolean {
        if (_isHeaderFocusSuppressed(this.beans)) {
            return false;
        }
        const { userFunc, headerPosition, direction, event } = params;
        const currentPosition = this.getFocusedHeader();
        const headerRowCount = getFocusHeaderRowCount(this.beans);
        const newHeaderPosition = this.getHeaderPositionFromUserFunc({
            userFunc,
            direction,
            currentPosition,
            headerPosition,
            headerRowCount,
        });
        return (
            !!newHeaderPosition &&
            this.focusProvidedHeaderPosition({
                headerPosition: newHeaderPosition,
                direction,
                event,
            })
        );
    }

    private getHeaderPositionFromUserFunc(params: {
        userFunc: (params: WithoutGridCommon<TabToNextHeaderParams>) => boolean | HeaderPosition;
        direction?: 'Before' | 'After' | null;
        currentPosition: HeaderPosition | null;
        headerPosition: HeaderPosition | null;
        headerRowCount: number;
    }): HeaderPosition | null {
        const { userFunc, direction, currentPosition, headerPosition, headerRowCount } = params;
        const userFuncParams: WithoutGridCommon<TabToNextHeaderParams> = {
            backwards: direction === 'Before',
            previousHeaderPosition: currentPosition,
            nextHeaderPosition: headerPosition,
            headerRowCount,
        };
        const userResult = userFunc(userFuncParams);
        if (userResult === true) {
            return currentPosition;
        }
        if (userResult === false) {
            return null;
        }
        return userResult;
    }

    private focusProvidedHeaderPosition(params: {
        headerPosition: HeaderPosition;
        direction?: 'Before' | 'After' | null;
        event?: KeyboardEvent;
        fromCell?: boolean;
        rowWithoutSpanValue?: number;
    }): boolean {
        const { headerPosition, direction, fromCell, rowWithoutSpanValue, event } = params;
        const { column, headerRowIndex } = headerPosition;

        if (headerRowIndex === -1) {
            if (this.filterManager?.isAdvFilterHeaderActive()) {
                return this.focusAdvancedFilter(headerPosition);
            }
            return this.focusGridView(column as AgColumn);
        }

        this.headerNavigation?.scrollToColumn(column as AgColumn, direction);

        const headerRowContainerCtrl = this.beans.ctrlsSvc.getHeaderRowContainerCtrl(column.getPinned());

        // this will automatically call the setFocusedHeader method above
        const focusSuccess =
            headerRowContainerCtrl?.focusHeader(headerPosition.headerRowIndex, column as AgColumn, event) || false;

        if (focusSuccess && (rowWithoutSpanValue != null || fromCell)) {
            this.headerNavigation?.setCurrentHeaderRowWithoutSpan(rowWithoutSpanValue ?? -1);
        }

        return focusSuccess;
    }

    public focusFirstHeader(): boolean {
        if (this.overlays?.isExclusive() && this.focusOverlay()) {
            return true;
        }

        let firstColumn: AgColumn | AgColumnGroup = this.visibleCols.allCols[0];
        if (!firstColumn) {
            return false;
        }

        const { colGroupSvc } = this.beans;
        if (colGroupSvc && firstColumn.getParent()) {
            firstColumn = colGroupSvc.getColGroupAtLevel(firstColumn, 0)!;
        }

        const headerPosition = getHeaderIndexToFocus(firstColumn, 0);

        return this.focusHeaderPosition({
            headerPosition,
            rowWithoutSpanValue: 0,
        });
    }

    public focusLastHeader(event?: KeyboardEvent): boolean {
        if (this.overlays?.isExclusive() && this.focusOverlay(true)) {
            return true;
        }

        const headerRowIndex = getFocusHeaderRowCount(this.beans) - 1;
        const column = _last(this.visibleCols.allCols);

        return this.focusHeaderPosition({
            headerPosition: { headerRowIndex, column },
            rowWithoutSpanValue: -1,
            event,
        });
    }

    public focusPreviousFromFirstCell(event?: KeyboardEvent): boolean {
        if (this.filterManager?.isAdvFilterHeaderActive()) {
            return this.focusAdvancedFilter(null);
        }
        return this.focusLastHeader(event);
    }

    public isAnyCellFocused(): boolean {
        return !!this.focusedCellPosition;
    }

    public isRowFocused(rowIndex: number, rowPinnedType: RowPinnedType): boolean {
        if (this.focusedCellPosition == null) {
            return false;
        }

        return (
            this.focusedCellPosition.rowIndex === rowIndex &&
            this.focusedCellPosition.rowPinned === _makeNull(rowPinnedType)
        );
    }

    public focusOverlay(backwards?: boolean): boolean {
        const overlayGui = this.overlays?.isVisible() && this.overlays.getOverlayWrapper()?.getGui();
        return !!overlayGui && _focusInto(overlayGui, backwards);
    }

    public focusGridView(column?: AgColumn, backwards: boolean = false, canFocusOverlay = true): boolean {
        if (this.overlays?.isExclusive()) {
            return canFocusOverlay && this.focusOverlay(backwards);
        }

        // if suppressCellFocus is `true`, it means the user does not want to
        // navigate between the cells using tab. Instead, we put focus on either
        // the header or after the grid, depending on whether tab or shift-tab was pressed.
        if (_isCellFocusSuppressed(this.beans)) {
            if (backwards) {
                if (!_isHeaderFocusSuppressed(this.beans)) {
                    return this.focusLastHeader();
                }
            }

            if (canFocusOverlay && this.focusOverlay(backwards)) {
                return true;
            }

            return _focusNextGridCoreContainer(this.beans, false);
        }

        const nextRow = backwards ? _getLastRow(this.beans) : _getFirstRow(this.beans);

        if (nextRow) {
            const { rowIndex, rowPinned } = nextRow;
            column ??= this.getFocusedHeader()?.column as AgColumn;
            if (column && rowIndex !== undefined && rowIndex !== null) {
                this.navigation?.ensureCellVisible({ rowIndex, column, rowPinned });

                if (backwards) {
                    // if full width we need to focus into the full width cell in the correct direction
                    const rowCtrl = this.rowRenderer.getRowByPosition(nextRow);
                    if (rowCtrl?.isFullWidth() && this.navigation?.tryToFocusFullWidthRow(nextRow, backwards)) {
                        return true;
                    }
                }

                this.setFocusedCell({
                    rowIndex,
                    column,
                    rowPinned: _makeNull(rowPinned),
                    forceBrowserFocus: true,
                });

                this.beans.rangeSvc?.setRangeToCell({ rowIndex, rowPinned, column });

                return true;
            }
        }

        if (canFocusOverlay && this.focusOverlay(backwards)) {
            return true;
        }

        if (backwards && this.focusLastHeader()) {
            return true;
        }

        return false;
    }

    private focusAdvancedFilter(position: HeaderPosition | null): boolean {
        this.advancedFilterFocusColumn = position?.column as AgColumn | undefined;
        return this.beans.advancedFilter?.getCtrl().focusHeaderComp() ?? false;
    }

    public focusNextFromAdvancedFilter(backwards?: boolean, forceFirstColumn?: boolean): boolean {
        const column = (forceFirstColumn ? undefined : this.advancedFilterFocusColumn) ?? this.visibleCols.allCols?.[0];
        if (backwards) {
            return this.focusHeaderPosition({
                headerPosition: {
                    column: column,
                    headerRowIndex: getFocusHeaderRowCount(this.beans) - 1,
                },
            });
        } else {
            return this.focusGridView(column);
        }
    }

    public clearAdvancedFilterColumn(): void {
        this.advancedFilterFocusColumn = undefined;
    }
}
