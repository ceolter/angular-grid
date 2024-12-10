import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import { isColumnGroup } from '../entities/agColumnGroup';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import { _getDocument } from '../gridOptionsUtils';
import { getFocusHeaderRowCount } from '../headerRendering/headerUtils';
import type { HeaderRowType } from '../headerRendering/row/headerRowComp';
import type { Column, ColumnGroup } from '../interfaces/iColumn';
import type { HeaderPosition } from '../interfaces/iHeaderPosition';
import { _last } from '../utils/array';

export type HeaderNavigationDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface HeaderFuturePosition extends HeaderPosition {
    headerRowIndexWithoutSpan?: number;
}

function isAnyChildSpanningHeaderHeight(columnGroup: AgColumnGroup | null): boolean {
    if (!columnGroup) {
        return false;
    }
    return columnGroup.getLeafColumns().some((col) => col.isSpanHeaderHeight());
}

export function getHeaderIndexToFocus(column: AgColumn | AgColumnGroup, currentIndex: number): HeaderPosition {
    let nextColumn: AgColumn | undefined;

    if (isColumnGroup(column) && isAnyChildSpanningHeaderHeight(column) && column.isPadding()) {
        const targetColumn: AgColumnGroup = column;
        nextColumn = targetColumn.getLeafColumns()[0];
        let col: AgColumn | AgColumnGroup = nextColumn;
        while (col !== targetColumn) {
            currentIndex++;
            col = col.getParent()!;
        }
    }

    return {
        column: nextColumn || column,
        headerRowIndex: currentIndex,
    };
}

export class HeaderNavigationService extends BeanStub implements NamedBean {
    beanName = 'headerNavigation' as const;

    private gridBodyCon: GridBodyCtrl;
    public currentHeaderRowWithoutSpan: number = -1;

    public postConstruct(): void {
        const beans = this.beans;
        beans.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCon = p.gridBodyCtrl;
        });

        const eDocument = _getDocument(beans);
        this.addManagedElementListeners(eDocument, {
            mousedown: () => {
                this.currentHeaderRowWithoutSpan = -1;
            },
        });
    }

    public getHeaderPositionForColumn(
        colKey: string | Column | ColumnGroup,
        floatingFilter: boolean
    ): HeaderPosition | null {
        let column: AgColumn | AgColumnGroup | null;

        const { colModel, colGroupSvc, ctrlsSvc } = this.beans;

        if (typeof colKey === 'string') {
            column = colModel.getCol(colKey);
            if (!column) {
                column = colGroupSvc?.getColumnGroup(colKey) ?? null;
            }
        } else {
            column = colKey as AgColumn | AgColumnGroup;
        }

        if (!column) {
            return null;
        }

        const centerHeaderContainer = ctrlsSvc.getHeaderRowContainerCtrl();
        const allCtrls = centerHeaderContainer?.getAllCtrls();
        const isFloatingFilterVisible = _last(allCtrls || []).type === 'filter';
        const headerRowCount = getFocusHeaderRowCount(this.beans) - 1;

        let row = -1;
        let col: AgColumn | AgColumnGroup | null = column;

        while (col) {
            row++;
            col = col.getParent();
        }

        let headerRowIndex = row;

        if (floatingFilter && isFloatingFilterVisible && headerRowIndex === headerRowCount - 1) {
            headerRowIndex++;
        }

        return headerRowIndex === -1
            ? null
            : {
                  headerRowIndex,
                  column,
              };
    }

    /*
     * This method navigates grid header vertically
     * @return {boolean} true to preventDefault on the event that caused this navigation.
     */
    public navigateVertically(
        direction: HeaderNavigationDirection,
        fromHeader: HeaderPosition | null,
        event: KeyboardEvent
    ): boolean {
        const focusSvc = this.beans.focusSvc;
        if (!fromHeader) {
            fromHeader = focusSvc.focusedHeader;
        }

        if (!fromHeader) {
            return false;
        }

        const { headerRowIndex } = fromHeader;
        const column = fromHeader.column as AgColumn;
        const rowLen = getFocusHeaderRowCount(this.beans);
        const isUp = direction === 'UP';

        const currentRowType = this.getHeaderRowType(headerRowIndex);

        let {
            headerRowIndex: nextRow,
            column: nextFocusColumn,
            headerRowIndexWithoutSpan,
        } = isUp
            ? getColumnVisibleParent(currentRowType, column, headerRowIndex)
            : getColumnVisibleChild(currentRowType, column, headerRowIndex);

        let skipColumn = false;

        if (nextRow < 0) {
            nextRow = 0;
            nextFocusColumn = column;
            skipColumn = true;
        }

        if (nextRow >= rowLen) {
            nextRow = -1; // -1 indicates the focus should move to grid rows.
            this.currentHeaderRowWithoutSpan = -1;
        } else if (headerRowIndexWithoutSpan !== undefined) {
            this.currentHeaderRowWithoutSpan = headerRowIndexWithoutSpan;
        }

        if (!skipColumn && !nextFocusColumn) {
            return false;
        }

        return focusSvc.focusHeaderPosition({
            headerPosition: { headerRowIndex: nextRow, column: nextFocusColumn! },
            allowUserOverride: true,
            event,
        });
    }

    /*
     * This method navigates grid header horizontally
     * @return {boolean} true to preventDefault on the event that caused this navigation.
     */
    public navigateHorizontally(
        direction: HeaderNavigationDirection,
        fromTab: boolean = false,
        event: KeyboardEvent
    ): boolean {
        const { focusSvc, gos } = this.beans;
        const focusedHeader = focusSvc.focusedHeader!;
        let nextHeader: HeaderPosition;
        let normalisedDirection: 'Before' | 'After';

        // either navigating to the left or isRtl (cannot be both)
        if (this.currentHeaderRowWithoutSpan !== -1) {
            focusedHeader.headerRowIndex = this.currentHeaderRowWithoutSpan;
        } else {
            this.currentHeaderRowWithoutSpan = focusedHeader.headerRowIndex;
        }

        if ((direction === 'LEFT') !== gos.get('enableRtl')) {
            normalisedDirection = 'Before';
            nextHeader = this.findHeader(focusedHeader, normalisedDirection)!;
        } else {
            normalisedDirection = 'After';
            nextHeader = this.findHeader(focusedHeader, normalisedDirection)!;
        }

        if (nextHeader || !fromTab) {
            return focusSvc.focusHeaderPosition({
                headerPosition: nextHeader,
                direction: normalisedDirection,
                fromTab,
                allowUserOverride: true,
                event,
            });
        } else if (fromTab) {
            const userFunc = gos.getCallback('tabToNextHeader');
            if (userFunc) {
                return focusSvc.focusHeaderPositionFromUserFunc({
                    userFunc,
                    headerPosition: nextHeader,
                    direction: normalisedDirection,
                });
            }
        }

        return this.focusNextHeaderRow(focusedHeader, normalisedDirection, event);
    }

    private focusNextHeaderRow(
        focusedHeader: HeaderPosition,
        direction: 'Before' | 'After',
        event: KeyboardEvent
    ): boolean {
        const currentIndex = focusedHeader.headerRowIndex;
        let nextPosition: HeaderPosition | null = null;
        let nextRowIndex: number;
        const beans = this.beans;

        if (direction === 'Before') {
            if (currentIndex > 0) {
                nextRowIndex = currentIndex - 1;
                this.currentHeaderRowWithoutSpan -= 1;
                nextPosition = this.findColAtEdgeForHeaderRow(nextRowIndex, 'end')!;
            }
        } else {
            nextRowIndex = currentIndex + 1;
            if (this.currentHeaderRowWithoutSpan < getFocusHeaderRowCount(beans)) {
                this.currentHeaderRowWithoutSpan += 1;
            } else {
                this.currentHeaderRowWithoutSpan = -1;
            }
            nextPosition = this.findColAtEdgeForHeaderRow(nextRowIndex, 'start')!;
        }

        if (!nextPosition) {
            return false;
        }

        const { column, headerRowIndex } = getHeaderIndexToFocus(
            nextPosition.column as AgColumn,
            nextPosition?.headerRowIndex
        );

        return beans.focusSvc.focusHeaderPosition({
            headerPosition: { column, headerRowIndex },
            direction,
            fromTab: true,
            allowUserOverride: true,
            event,
        });
    }

    public scrollToColumn(column: AgColumn | AgColumnGroup, direction: 'Before' | 'After' | null = 'After'): void {
        if (column.getPinned()) {
            return;
        }

        let columnToScrollTo: AgColumn;

        if (isColumnGroup(column)) {
            const columns = column.getDisplayedLeafColumns();
            columnToScrollTo = direction === 'Before' ? _last(columns) : columns[0];
        } else {
            columnToScrollTo = column;
        }

        this.gridBodyCon.scrollFeature.ensureColumnVisible(columnToScrollTo);
    }

    private findHeader(focusedHeader: HeaderPosition, direction: 'Before' | 'After'): HeaderPosition | undefined {
        let nextColumn: AgColumn | AgColumnGroup | undefined;
        let getColMethod: 'getColBefore' | 'getColAfter';
        const { colGroupSvc, visibleCols } = this.beans;

        if (isColumnGroup(focusedHeader.column)) {
            nextColumn = colGroupSvc?.getGroupAtDirection(focusedHeader.column, direction) ?? undefined;
        } else {
            getColMethod = `getCol${direction}` as any;
            nextColumn = visibleCols[getColMethod](focusedHeader.column as AgColumn)!;
        }

        if (!nextColumn) {
            return;
        }

        const { headerRowIndex } = focusedHeader;

        if (this.getHeaderRowType(headerRowIndex) !== 'filter') {
            const columnsInPath: (AgColumn | AgColumnGroup)[] = [nextColumn];

            while (nextColumn.getParent()) {
                nextColumn = nextColumn.getParent()!;
                columnsInPath.push(nextColumn);
            }

            nextColumn = columnsInPath[Math.max(0, columnsInPath.length - 1 - headerRowIndex)];
        }

        const { column, headerRowIndex: indexToFocus } = getHeaderIndexToFocus(nextColumn, headerRowIndex);

        return {
            column,
            headerRowIndex: indexToFocus,
        };
    }

    private getHeaderRowType(rowIndex: number): HeaderRowType | undefined {
        const centerHeaderContainer = this.beans.ctrlsSvc.getHeaderRowContainerCtrl();
        if (centerHeaderContainer) {
            return centerHeaderContainer.getRowType(rowIndex);
        }
    }

    private findColAtEdgeForHeaderRow(level: number, position: 'start' | 'end'): HeaderPosition | undefined {
        const { visibleCols, ctrlsSvc, colGroupSvc } = this.beans;
        const displayedColumns = visibleCols.allCols;
        const column = displayedColumns[position === 'start' ? 0 : displayedColumns.length - 1];

        if (!column) {
            return;
        }

        const childContainer = ctrlsSvc.getHeaderRowContainerCtrl(column.getPinned());
        const type = childContainer?.getRowType(level);

        if (type == 'group') {
            const columnGroup = colGroupSvc?.getColGroupAtLevel(column, level);
            return {
                headerRowIndex: level,
                column: columnGroup!,
            };
        }

        return {
            // if type==null, means the header level didn't exist
            headerRowIndex: type == null ? -1 : level,
            column,
        };
    }
}

function getColumnVisibleParent(
    currentRowType: HeaderRowType | undefined,
    currentColumn: AgColumn | AgColumnGroup,
    currentIndex: number
): HeaderFuturePosition {
    const isFloatingFilter = currentRowType === 'filter';
    const isColumn = currentRowType === 'column';

    let nextFocusColumn: AgColumn | AgColumnGroup | null = isFloatingFilter ? currentColumn : currentColumn.getParent();
    let nextRow = currentIndex - 1;
    let headerRowIndexWithoutSpan: number | undefined = nextRow;

    if (isColumn && isAnyChildSpanningHeaderHeight((currentColumn as AgColumn).getParent())) {
        while (nextFocusColumn && (nextFocusColumn as AgColumnGroup).isPadding()) {
            nextFocusColumn = nextFocusColumn.getParent();
            nextRow--;
        }

        headerRowIndexWithoutSpan = nextRow;
        if (nextRow < 0) {
            nextFocusColumn = currentColumn;
            nextRow = currentIndex;
            headerRowIndexWithoutSpan = undefined;
        }
    }

    return { column: nextFocusColumn!, headerRowIndex: nextRow, headerRowIndexWithoutSpan };
}

function getColumnVisibleChild(
    currentRowType: HeaderRowType | undefined,
    column: AgColumn | AgColumnGroup,
    currentIndex: number,
    direction: 'Before' | 'After' = 'After'
): HeaderFuturePosition {
    let nextFocusColumn: AgColumn | AgColumnGroup | null = column;
    let nextRow = currentIndex + 1;
    const headerRowIndexWithoutSpan = nextRow;

    if (currentRowType === 'group') {
        const leafColumns = (column as AgColumnGroup).getDisplayedLeafColumns();
        const leafColumn = direction === 'After' ? leafColumns[0] : _last(leafColumns);
        const columnsInTheWay: AgColumnGroup[] = [];

        let currentColumn: AgColumn | AgColumnGroup = leafColumn;
        while (currentColumn.getParent() !== column) {
            currentColumn = currentColumn.getParent()!;
            columnsInTheWay.push(currentColumn);
        }

        nextFocusColumn = leafColumn;
        if (leafColumn.isSpanHeaderHeight()) {
            for (let i = columnsInTheWay.length - 1; i >= 0; i--) {
                const colToFocus = columnsInTheWay[i];
                if (!colToFocus.isPadding()) {
                    nextFocusColumn = colToFocus;
                    break;
                }
                nextRow++;
            }
        } else {
            nextFocusColumn = _last(columnsInTheWay);
            if (!nextFocusColumn) {
                nextFocusColumn = leafColumn;
            }
        }
    }

    return { column: nextFocusColumn, headerRowIndex: nextRow, headerRowIndexWithoutSpan };
}
