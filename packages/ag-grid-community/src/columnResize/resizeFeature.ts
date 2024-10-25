import type { ColumnAutosizeService } from '../columnAutosize/columnAutosizeService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { HorizontalResizeService } from '../dragAndDrop/horizontalResizeService';
import type { AgColumn } from '../entities/agColumn';
import type { IHeaderResizeFeature } from '../headerRendering/cells/abstractCell/abstractHeaderCellCtrl';
import type { HeaderCellCtrl, IHeaderCellComp } from '../headerRendering/cells/column/headerCellCtrl';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import type { PinnedColumnService } from '../pinnedColumns/pinnedColumnService';
import { _getInnerWidth, _setDisplayed } from '../utils/dom';
import type { ColumnResizeService } from './columnResizeService';

export class ResizeFeature extends BeanStub implements IHeaderResizeFeature {
    private horizontalResizeSvc: HorizontalResizeService;
    private pinnedCols?: PinnedColumnService;
    private ctrlsSvc: CtrlsService;
    private colResize?: ColumnResizeService;
    private colAutosize?: ColumnAutosizeService;

    public wireBeans(beans: BeanCollection) {
        this.horizontalResizeSvc = beans.horizontalResizeSvc!;
        this.pinnedCols = beans.pinnedCols;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colResize = beans.colResize;
        this.colAutosize = beans.colAutosize;
    }

    private pinned: ColumnPinnedType;
    private column: AgColumn;
    private eResize: HTMLElement;
    private comp: IHeaderCellComp;

    private lastResizeAmount: number;
    private resizeStartWidth: number;
    private resizeWithShiftKey: boolean;

    private ctrl: HeaderCellCtrl;

    constructor(
        pinned: ColumnPinnedType,
        column: AgColumn,
        eResize: HTMLElement,
        comp: IHeaderCellComp,
        ctrl: HeaderCellCtrl
    ) {
        super();
        this.pinned = pinned;
        this.column = column;
        this.eResize = eResize;
        this.comp = comp;
        this.ctrl = ctrl;
    }

    public postConstruct(): void {
        const destroyResizeFuncs: (() => void)[] = [];

        let canResize: boolean;
        let canAutosize: boolean;

        const addResize = () => {
            _setDisplayed(this.eResize, canResize);

            if (!canResize) {
                return;
            }

            const finishedWithResizeFunc = this.horizontalResizeSvc.addResizeBar({
                eResizeBar: this.eResize,
                onResizeStart: this.onResizeStart.bind(this),
                onResizing: this.onResizing.bind(this, false),
                onResizeEnd: this.onResizing.bind(this, true),
            });
            destroyResizeFuncs.push(finishedWithResizeFunc);

            if (canAutosize && this.colAutosize) {
                destroyResizeFuncs.push(this.colAutosize.addColumnAutosize(this.eResize, this.column));
            }
        };

        const removeResize = () => {
            destroyResizeFuncs.forEach((f) => f());
            destroyResizeFuncs.length = 0;
        };

        const refresh = () => {
            const resize = this.column.isResizable();
            const autoSize = !this.gos.get('suppressAutoSize') && !this.column.getColDef().suppressAutoSize;
            const propertyChange = resize !== canResize || autoSize !== canAutosize;
            if (propertyChange) {
                canResize = resize;
                canAutosize = autoSize;
                removeResize();
                addResize();
            }
        };

        refresh();
        this.addDestroyFunc(removeResize);
        this.ctrl.setRefreshFunction('resize', refresh);
    }

    private onResizing(finished: boolean, resizeAmount: number): void {
        const { column: key, lastResizeAmount, resizeStartWidth } = this;

        const resizeAmountNormalised = this.normaliseResizeAmount(resizeAmount);
        const newWidth = resizeStartWidth + resizeAmountNormalised;

        const columnWidths = [{ key, newWidth }];

        if (this.column.getPinned()) {
            const leftWidth = this.pinnedCols?.getPinnedLeftWidth() ?? 0;
            const rightWidth = this.pinnedCols?.getPinnedRightWidth() ?? 0;
            const bodyWidth = _getInnerWidth(this.ctrlsSvc.getGridBodyCtrl().getBodyViewportElement()) - 50;

            if (leftWidth + rightWidth + (resizeAmountNormalised - lastResizeAmount) > bodyWidth) {
                return;
            }
        }

        this.lastResizeAmount = resizeAmountNormalised;

        this.colResize?.setColumnWidths(columnWidths, this.resizeWithShiftKey, finished, 'uiColumnResized');

        if (finished) {
            this.toggleColumnResizing(false);
        }
    }

    private onResizeStart(shiftKey: boolean): void {
        this.resizeStartWidth = this.column.getActualWidth();
        this.lastResizeAmount = 0;
        this.resizeWithShiftKey = shiftKey;

        this.toggleColumnResizing(true);
    }

    public toggleColumnResizing(resizing: boolean): void {
        this.comp.addOrRemoveCssClass('ag-column-resizing', resizing);
    }

    // optionally inverts the drag, depending on pinned and RTL
    // note - this method is duplicated in RenderedHeaderGroupCell - should refactor out?
    private normaliseResizeAmount(dragChange: number): number {
        let result = dragChange;

        const notPinningLeft = this.pinned !== 'left';
        const pinningRight = this.pinned === 'right';

        if (this.gos.get('enableRtl')) {
            // for RTL, dragging left makes the col bigger, except when pinning left
            if (notPinningLeft) {
                result *= -1;
            }
        } else {
            // for LTR (ie normal), dragging left makes the col smaller, except when pinning right
            if (pinningRight) {
                result *= -1;
            }
        }

        return result;
    }
}
