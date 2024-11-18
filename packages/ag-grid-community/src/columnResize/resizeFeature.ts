import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { IHeaderResizeFeature } from '../headerRendering/cells/abstractCell/abstractHeaderCellCtrl';
import type { HeaderCellCtrl, IHeaderCellComp } from '../headerRendering/cells/column/headerCellCtrl';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import { _getInnerWidth, _setDisplayed } from '../utils/dom';

export class ResizeFeature extends BeanStub implements IHeaderResizeFeature {
    private lastResizeAmount: number;
    private resizeStartWidth: number;
    private resizeWithShiftKey: boolean;

    constructor(
        private pinned: ColumnPinnedType,
        private column: AgColumn,
        private eResize: HTMLElement,
        private comp: IHeaderCellComp,
        private ctrl: HeaderCellCtrl
    ) {
        super();
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

            const { horizontalResizeSvc, colAutosize } = this.beans;

            const finishedWithResizeFunc = horizontalResizeSvc!.addResizeBar({
                eResizeBar: this.eResize,
                onResizeStart: this.onResizeStart.bind(this),
                onResizing: this.onResizing.bind(this, false),
                onResizeEnd: this.onResizing.bind(this, true),
            });
            destroyResizeFuncs.push(finishedWithResizeFunc);

            if (canAutosize && colAutosize) {
                destroyResizeFuncs.push(colAutosize.addColumnAutosize(this.eResize, this.column));
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
        const { column: key, lastResizeAmount, resizeStartWidth, beans } = this;

        const resizeAmountNormalised = this.normaliseResizeAmount(resizeAmount);
        const newWidth = resizeStartWidth + resizeAmountNormalised;

        const columnWidths = [{ key, newWidth }];

        const { pinnedCols, ctrlsSvc, colResize } = beans;

        if (this.column.getPinned()) {
            const leftWidth = pinnedCols?.leftWidth ?? 0;
            const rightWidth = pinnedCols?.rightWidth ?? 0;
            const bodyWidth = _getInnerWidth(ctrlsSvc.getGridBodyCtrl().eBodyViewport) - 50;

            if (leftWidth + rightWidth + (resizeAmountNormalised - lastResizeAmount) > bodyWidth) {
                return;
            }
        }

        this.lastResizeAmount = resizeAmountNormalised;

        colResize?.setColumnWidths(columnWidths, this.resizeWithShiftKey, finished, 'uiColumnResized');

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
