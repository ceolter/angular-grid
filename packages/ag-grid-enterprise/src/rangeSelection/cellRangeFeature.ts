import type {
    AgColumn,
    BeanCollection,
    CellCtrl,
    GridOptionsService,
    ICellComp,
    ICellRangeFeature,
    IRangeService,
} from 'ag-grid-community';
import { CellRangeType, _isSameRow, _last, _missing, _setAriaSelected } from 'ag-grid-community';

import { SelectionHandleType } from './abstractSelectionHandle';
import type { AgFillHandle } from './agFillHandle';
import type { AgRangeHandle } from './agRangeHandle';

const CSS_CELL_RANGE_SELECTED = 'ag-cell-range-selected';
const CSS_CELL_RANGE_CHART = 'ag-cell-range-chart';
const CSS_CELL_RANGE_SINGLE_CELL = 'ag-cell-range-single-cell';
const CSS_CELL_RANGE_CHART_CATEGORY = 'ag-cell-range-chart-category';
const CSS_CELL_RANGE_HANDLE = 'ag-cell-range-handle';
const CSS_CELL_RANGE_TOP = 'ag-cell-range-top';
const CSS_CELL_RANGE_RIGHT = 'ag-cell-range-right';
const CSS_CELL_RANGE_BOTTOM = 'ag-cell-range-bottom';
const CSS_CELL_RANGE_LEFT = 'ag-cell-range-left';

function _isRangeHandleEnabled(gos: GridOptionsService): boolean {
    const selection = gos.get('cellSelection');
    const useNewAPI = selection !== undefined;

    if (!useNewAPI) {
        return gos.get('enableRangeHandle');
    }

    return typeof selection !== 'boolean' ? selection.handle?.mode === 'range' : false;
}
function _isFillHandleEnabled(gos: GridOptionsService): boolean {
    const selection = gos.get('cellSelection');
    const useNewAPI = selection !== undefined;

    if (!useNewAPI) {
        return gos.get('enableFillHandle');
    }

    return typeof selection !== 'boolean' ? selection.handle?.mode === 'fill' : false;
}

export class CellRangeFeature implements ICellRangeFeature {
    private rangeSvc: IRangeService;
    private cellComp: ICellComp;
    private eGui: HTMLElement;

    private rangeCount: number;
    private hasChartRange: boolean;

    private selectionHandle: AgFillHandle | AgRangeHandle | null | undefined;

    constructor(
        private readonly beans: BeanCollection,
        private readonly cellCtrl: CellCtrl
    ) {
        // We know these are defined otherwise the feature wouldn't be registered
        this.rangeSvc = beans.rangeSvc!;
    }

    public setComp(cellComp: ICellComp, eGui: HTMLElement): void {
        this.cellComp = cellComp;
        this.eGui = eGui;
        this.onCellSelectionChanged();
    }

    public onCellSelectionChanged(): void {
        const cellComp = this.cellComp;
        // when using reactUi, given UI is async, it's possible this method is called before the comp is registered
        if (!cellComp) {
            return;
        }

        const { rangeSvc, cellCtrl, eGui } = this;

        const rangeCount = rangeSvc.getCellRangeCount(cellCtrl.cellPosition);
        this.rangeCount = rangeCount;
        const hasChartRange = this.getHasChartRange();
        this.hasChartRange = hasChartRange;

        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_SELECTED, rangeCount !== 0);
        cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-1`, rangeCount === 1);
        cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-2`, rangeCount === 2);
        cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-3`, rangeCount === 3);
        cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-4`, rangeCount >= 4);
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_CHART, hasChartRange);

        _setAriaSelected(eGui, rangeCount > 0 ? true : undefined);
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_SINGLE_CELL, this.isSingleCell());

        this.updateRangeBorders();

        this.refreshHandle();
    }

    private updateRangeBorders(): void {
        const rangeBorders = this.getRangeBorders();
        const isSingleCell = this.isSingleCell();
        const isTop = !isSingleCell && rangeBorders.top;
        const isRight = !isSingleCell && rangeBorders.right;
        const isBottom = !isSingleCell && rangeBorders.bottom;
        const isLeft = !isSingleCell && rangeBorders.left;

        const cellComp = this.cellComp;
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_TOP, isTop);
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_RIGHT, isRight);
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_BOTTOM, isBottom);
        cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_LEFT, isLeft);
    }

    private isSingleCell(): boolean {
        const { rangeSvc } = this;
        return this.rangeCount === 1 && !!rangeSvc && !rangeSvc.isMoreThanOneCell();
    }

    private getHasChartRange(): boolean {
        const { rangeSvc } = this;

        if (!this.rangeCount || !rangeSvc) {
            return false;
        }

        const cellRanges = rangeSvc.getCellRanges();

        return (
            cellRanges.length > 0 &&
            cellRanges.every((range) => [CellRangeType.DIMENSION, CellRangeType.VALUE].includes(range.type!))
        );
    }

    public updateRangeBordersIfRangeCount(): void {
        // we only need to update range borders if we are in a range
        if (this.rangeCount > 0) {
            this.updateRangeBorders();
            this.refreshHandle();
        }
    }

    private getRangeBorders(): {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
    } {
        const isRtl = this.beans.gos.get('enableRtl');

        let top = false;
        let right = false;
        let bottom = false;
        let left = false;

        const {
            rangeSvc,
            beans: { visibleCols },
            cellCtrl: { cellPosition },
        } = this;
        const thisCol = cellPosition.column as AgColumn;

        let leftCol: AgColumn | null;
        let rightCol: AgColumn | null;

        if (isRtl) {
            leftCol = visibleCols.getColAfter(thisCol);
            rightCol = visibleCols.getColBefore(thisCol);
        } else {
            leftCol = visibleCols.getColBefore(thisCol);
            rightCol = visibleCols.getColAfter(thisCol);
        }

        const ranges = rangeSvc.getCellRanges().filter((range) => rangeSvc.isCellInSpecificRange(cellPosition, range));

        // this means we are the first column in the grid
        if (!leftCol) {
            left = true;
        }

        // this means we are the last column in the grid
        if (!rightCol) {
            right = true;
        }

        for (let i = 0; i < ranges.length; i++) {
            if (top && right && bottom && left) {
                break;
            }

            const range = ranges[i];
            const startRow = rangeSvc.getRangeStartRow(range);
            const endRow = rangeSvc.getRangeEndRow(range);

            if (!top && _isSameRow(startRow, cellPosition)) {
                top = true;
            }

            if (!bottom && _isSameRow(endRow, cellPosition)) {
                bottom = true;
            }

            if (!left && leftCol && range.columns.indexOf(leftCol) < 0) {
                left = true;
            }

            if (!right && rightCol && range.columns.indexOf(rightCol) < 0) {
                right = true;
            }
        }

        return { top, right, bottom, left };
    }

    public refreshHandle(): void {
        if (this.beans.context.isDestroyed()) {
            return;
        }

        const shouldHaveSelectionHandle = this.shouldHaveSelectionHandle();

        if (this.selectionHandle && !shouldHaveSelectionHandle) {
            this.selectionHandle = this.beans.context.destroyBean(this.selectionHandle);
        }

        if (shouldHaveSelectionHandle) {
            this.addSelectionHandle();
        }

        this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_HANDLE, !!this.selectionHandle);
    }

    private shouldHaveSelectionHandle(): boolean {
        const gos = this.beans.gos;
        const rangeSvc = this.rangeSvc;
        const cellRanges = rangeSvc.getCellRanges();
        const rangesLen = cellRanges.length;

        if (this.rangeCount < 1 || rangesLen < 1) {
            return false;
        }

        const cellRange = _last(cellRanges);
        const { cellPosition } = this.cellCtrl;
        const isFillHandleAvailable = _isFillHandleEnabled(gos) && !this.cellCtrl.column.isSuppressFillHandle();
        const isRangeHandleAvailable = _isRangeHandleEnabled(gos);

        let handleIsAvailable =
            rangesLen === 1 && !this.cellCtrl.editing && (isFillHandleAvailable || isRangeHandleAvailable);

        if (this.hasChartRange) {
            const hasCategoryRange = cellRanges[0].type === CellRangeType.DIMENSION;
            const isCategoryCell = hasCategoryRange && rangeSvc.isCellInSpecificRange(cellPosition, cellRanges[0]);

            this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_CHART_CATEGORY, isCategoryCell);
            handleIsAvailable = cellRange.type === CellRangeType.VALUE;
        }

        return (
            handleIsAvailable &&
            cellRange.endRow != null &&
            rangeSvc.isContiguousRange(cellRange) &&
            rangeSvc.isBottomRightCell(cellRange, cellPosition)
        );
    }

    private addSelectionHandle() {
        const { beans, rangeSvc } = this;
        const cellRangeType = _last(rangeSvc.getCellRanges()).type;
        const selectionHandleFill = _isFillHandleEnabled(beans.gos) && _missing(cellRangeType);
        const type = selectionHandleFill ? SelectionHandleType.FILL : SelectionHandleType.RANGE;

        if (this.selectionHandle && this.selectionHandle.getType() !== type) {
            this.selectionHandle = beans.context.destroyBean(this.selectionHandle);
        }

        if (!this.selectionHandle) {
            const selectionHandle = beans.registry.createDynamicBean<AgFillHandle | AgRangeHandle>(
                type === SelectionHandleType.FILL ? 'fillHandle' : 'rangeHandle',
                false
            );
            if (selectionHandle) {
                this.selectionHandle = beans.context.createBean(selectionHandle);
            }
        }

        this.selectionHandle?.refresh(this.cellCtrl);
    }

    public destroy(): void {
        this.beans.context.destroyBean(this.selectionHandle);
    }
}
