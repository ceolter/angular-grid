import type {
    BeanCollection,
    CellCtrl,
    CellPosition,
    CellRange,
    CtrlsService,
    DragService,
    MouseEventService,
    RowPosition,
} from 'ag-grid-community';
import { Component, _areCellsEqual, _isRowBefore, _isVisible, _last, _setDisplayed } from 'ag-grid-community';

import type { RangeService } from './rangeService';

export enum SelectionHandleType {
    FILL,
    RANGE,
}

export abstract class AbstractSelectionHandle extends Component {
    protected dragSvc: DragService;
    protected rangeSvc: RangeService;
    protected mouseEventSvc: MouseEventService;
    protected ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection) {
        this.dragSvc = beans.dragSvc!;
        this.rangeSvc = beans.rangeSvc as RangeService;
        this.mouseEventSvc = beans.mouseEventSvc;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private cellCtrl: CellCtrl;
    private cellRange: CellRange;

    private rangeStartRow: RowPosition;
    private rangeEndRow: RowPosition;

    private cellHoverListener: (() => void) | undefined;
    private lastCellHovered: CellPosition | null | undefined;
    protected changedCalculatedValues: boolean = false;
    private dragging: boolean = false;

    protected abstract type: SelectionHandleType;
    protected shouldDestroyOnEndDragging: boolean = false;

    public postConstruct() {
        this.dragSvc.addDragSource({
            dragStartPixels: 0,
            eElement: this.getGui(),
            onDragStart: this.onDragStart.bind(this),
            onDragging: (e: MouseEvent | Touch) => {
                this.dragging = true;
                this.rangeSvc.autoScrollService.check(e as MouseEvent);

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

    protected isDragging(): boolean {
        return this.dragging;
    }

    protected getCellCtrl(): CellCtrl | undefined {
        return this.cellCtrl;
    }

    protected setCellCtrl(cellComp: CellCtrl) {
        this.cellCtrl = cellComp;
    }

    protected getCellRange(): CellRange {
        return this.cellRange;
    }

    protected setCellRange(range: CellRange) {
        this.cellRange = range;
    }

    protected getRangeStartRow(): RowPosition {
        return this.rangeStartRow;
    }

    protected setRangeStartRow(row: RowPosition) {
        this.rangeStartRow = row;
    }

    protected getRangeEndRow(): RowPosition {
        return this.rangeEndRow;
    }

    protected setRangeEndRow(row: RowPosition) {
        this.rangeEndRow = row;
    }

    protected getLastCellHovered(): CellPosition | null | undefined {
        return this.lastCellHovered;
    }

    private preventRangeExtension(e: MouseEvent) {
        e.stopPropagation();
    }

    protected onDragStart(_: MouseEvent) {
        [this.cellHoverListener] = this.addManagedElementListeners(this.ctrlsSvc.get('gridCtrl').getGui(), {
            mousemove: this.updateValuesOnMove.bind(this),
        });

        document.body.classList.add(this.getDraggingCssClass());
    }

    private getDraggingCssClass(): string {
        return `ag-dragging-${this.type === SelectionHandleType.FILL ? 'fill' : 'range'}-handle`;
    }

    protected updateValuesOnMove(e: MouseEvent) {
        const cell = this.mouseEventSvc.getCellPositionForEvent(e);

        if (!cell || (this.lastCellHovered && _areCellsEqual(cell, this.lastCellHovered))) {
            return;
        }

        this.lastCellHovered = cell;
        this.changedCalculatedValues = true;
    }

    private clearDragProperties(): void {
        this.clearValues();
        this.rangeSvc.autoScrollService.ensureCleared();

        // TODO: this causes a bug where if there are multiple grids in the same page, all of them will
        // be affected by a drag on any. Move it to the root element.
        document.body.classList.remove(this.getDraggingCssClass());
    }

    public getType(): SelectionHandleType {
        return this.type;
    }

    public refresh(cellCtrl: CellCtrl) {
        const oldCellComp = this.getCellCtrl();
        const eGui = this.getGui();

        const cellRange = _last(this.rangeSvc.getCellRanges());

        const start = cellRange.startRow;
        const end = cellRange.endRow;

        if (start && end) {
            const isBefore = _isRowBefore(end, start);

            if (isBefore) {
                this.setRangeStartRow(end);
                this.setRangeEndRow(start);
            } else {
                this.setRangeStartRow(start);
                this.setRangeEndRow(end);
            }
        }

        if (oldCellComp !== cellCtrl || !_isVisible(eGui)) {
            this.setCellCtrl(cellCtrl);
            const eParentOfValue = cellCtrl.getComp().getParentOfValue();
            if (eParentOfValue) {
                eParentOfValue.appendChild(eGui);
            }
        }

        this.setCellRange(cellRange);
    }

    protected clearValues() {
        this.lastCellHovered = undefined;
        this.removeListeners();
    }

    private removeListeners() {
        if (this.cellHoverListener) {
            this.cellHoverListener();
            this.cellHoverListener = undefined;
        }
    }

    public override destroy() {
        if (!this.shouldDestroyOnEndDragging && this.isDragging()) {
            _setDisplayed(this.getGui(), false);
            this.shouldDestroyOnEndDragging = true;
            return;
        }

        this.shouldDestroyOnEndDragging = false;

        super.destroy();
        this.removeListeners();

        const eGui = this.getGui();

        if (eGui.parentElement) {
            eGui.parentElement.removeChild(eGui);
        }
    }
}
