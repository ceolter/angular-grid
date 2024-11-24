import type { CellCtrl, CellPosition, CellRange, RowPosition } from 'ag-grid-community';
import {
    Component,
    _areCellsEqual,
    _getCellPositionForEvent,
    _isRowBefore,
    _isVisible,
    _last,
    _setDisplayed,
} from 'ag-grid-community';

import type { RangeService } from './rangeService';

export enum SelectionHandleType {
    FILL,
    RANGE,
}

export abstract class AbstractSelectionHandle extends Component {
    protected cellCtrl: CellCtrl;
    protected cellRange: CellRange;

    protected rangeStartRow: RowPosition;
    protected rangeEndRow: RowPosition;

    private cellHoverListener: (() => void) | undefined;
    private lastCellHovered: CellPosition | null | undefined;
    protected changedCalculatedValues: boolean = false;
    private dragging: boolean = false;

    protected abstract type: SelectionHandleType;
    protected shouldDestroyOnEndDragging: boolean = false;

    public postConstruct() {
        const { dragSvc, rangeSvc } = this.beans;
        dragSvc!.addDragSource({
            dragStartPixels: 0,
            eElement: this.getGui(),
            onDragStart: this.onDragStart.bind(this),
            onDragging: (e: MouseEvent | Touch) => {
                this.dragging = true;
                (rangeSvc as RangeService).autoScrollService.check(e as MouseEvent);

                if (this.changedCalculatedValues) {
                    this.onDrag(e);
                    this.changedCalculatedValues = false;
                }
            },
            onDragStop: (e: MouseEvent | Touch) => {
                this.dragging = false;
                this.onDragEnd(e);
                this.clearDragProperties();

                if (this.shouldDestroyOnEndDragging) {
                    this.destroy();
                }
            },
            onDragCancel: () => {
                this.dragging = false;
                this.onDragCancel();
                this.clearDragProperties();
            },
        });

        this.addManagedElementListeners(this.getGui(), { mousedown: this.preventRangeExtension.bind(this) });
    }

    protected abstract onDrag(e: MouseEvent | Touch): void;
    protected abstract onDragEnd(e: MouseEvent | Touch): void;
    protected abstract onDragCancel(): void;

    protected getLastCellHovered(): CellPosition | null | undefined {
        return this.lastCellHovered;
    }

    private preventRangeExtension(e: MouseEvent) {
        e.stopPropagation();
    }

    protected onDragStart(_: MouseEvent) {
        [this.cellHoverListener] = this.addManagedElementListeners(this.beans.ctrlsSvc.get('gridCtrl').getGui(), {
            mousemove: this.updateValuesOnMove.bind(this),
        });

        document.body.classList.add(this.getDraggingCssClass());
    }

    private getDraggingCssClass(): string {
        return `ag-dragging-${this.type === SelectionHandleType.FILL ? 'fill' : 'range'}-handle`;
    }

    protected updateValuesOnMove(e: MouseEvent) {
        const cell = _getCellPositionForEvent(this.gos, e);

        if (!cell || (this.lastCellHovered && _areCellsEqual(cell, this.lastCellHovered))) {
            return;
        }

        this.lastCellHovered = cell;
        this.changedCalculatedValues = true;
    }

    private clearDragProperties(): void {
        this.clearValues();
        (this.beans.rangeSvc as RangeService).autoScrollService.ensureCleared();

        // TODO: this causes a bug where if there are multiple grids in the same page, all of them will
        // be affected by a drag on any. Move it to the root element.
        document.body.classList.remove(this.getDraggingCssClass());
    }

    public getType(): SelectionHandleType {
        return this.type;
    }

    public refresh(cellCtrl: CellCtrl) {
        const oldCellComp = this.cellCtrl;
        const eGui = this.getGui();

        const cellRange = _last(this.beans.rangeSvc!.getCellRanges());

        const start = cellRange.startRow;
        const end = cellRange.endRow;

        if (start && end) {
            const isBefore = _isRowBefore(end, start);

            if (isBefore) {
                this.rangeStartRow = end;
                this.rangeEndRow = start;
            } else {
                this.rangeStartRow = start;
                this.rangeEndRow = end;
            }
        }

        if (oldCellComp !== cellCtrl || !_isVisible(eGui)) {
            this.cellCtrl = cellCtrl;
            const eParentOfValue = cellCtrl.comp.getParentOfValue();
            if (eParentOfValue) {
                eParentOfValue.appendChild(eGui);
            }
        }

        this.cellRange = cellRange;
    }

    protected clearValues() {
        this.lastCellHovered = undefined;
        this.removeListeners();
    }

    private removeListeners() {
        const cellHoverListener = this.cellHoverListener;
        if (cellHoverListener) {
            cellHoverListener();
            this.cellHoverListener = undefined;
        }
    }

    public override destroy() {
        if (!this.shouldDestroyOnEndDragging && this.dragging) {
            _setDisplayed(this.getGui(), false);
            this.shouldDestroyOnEndDragging = true;
            return;
        }

        this.shouldDestroyOnEndDragging = false;

        super.destroy();
        this.removeListeners();

        const eGui = this.getGui();

        eGui.parentElement?.removeChild(eGui);
    }
}
