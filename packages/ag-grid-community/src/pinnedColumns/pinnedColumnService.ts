import { dispatchColumnPinnedEvent } from '../columns/columnEventUtils';
import type { ColKey } from '../columns/columnModel';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColumnEventType } from '../events';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import { SetPinnedWidthFeature } from '../gridBodyComp/rowContainer/setPinnedWidthFeature';
import { _isDomLayout } from '../gridOptionsUtils';
import type { HeaderRowContainerCtrl } from '../headerRendering/rowContainer/headerRowContainerCtrl';
import type { ProcessUnpinnedColumnsParams } from '../interfaces/iCallbackParams';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import { _getInnerWidth } from '../utils/dom';
import { _warn } from '../validation/logging';

export class PinnedColumnService extends BeanStub implements NamedBean {
    beanName = 'pinnedCols' as const;

    private gridBodyCtrl: GridBodyCtrl;

    public leftWidth: number;
    public rightWidth: number;

    public postConstruct(): void {
        this.beans.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCtrl = p.gridBodyCtrl;
        });
        const listener = this.checkContainerWidths.bind(this);
        this.addManagedEventListeners({
            displayedColumnsChanged: listener,
            displayedColumnsWidthChanged: listener,
        });
        this.addManagedPropertyListener('domLayout', listener);
    }

    private checkContainerWidths() {
        const { gos, visibleCols, eventSvc } = this.beans;
        const printLayout = _isDomLayout(gos, 'print');

        const newLeftWidth = printLayout ? 0 : visibleCols.getColsLeftWidth();
        const newRightWidth = printLayout ? 0 : visibleCols.getDisplayedColumnsRightWidth();

        if (newLeftWidth != this.leftWidth) {
            this.leftWidth = newLeftWidth;
            eventSvc.dispatchEvent({ type: 'leftPinnedWidthChanged' });
        }

        if (newRightWidth != this.rightWidth) {
            this.rightWidth = newRightWidth;
            eventSvc.dispatchEvent({ type: 'rightPinnedWidthChanged' });
        }
    }

    public keepPinnedColumnsNarrowerThanViewport(): void {
        const eBodyViewport = this.gridBodyCtrl.eBodyViewport;
        const bodyWidth = _getInnerWidth(eBodyViewport);

        if (bodyWidth <= 50) {
            return;
        }

        // remove 50px from the bodyWidth to give some margin
        let columnsToRemove = this.getPinnedColumnsOverflowingViewport(bodyWidth - 50);
        const processUnpinnedColumns = this.gos.getCallback('processUnpinnedColumns');

        if (!columnsToRemove.length) {
            return;
        }

        if (processUnpinnedColumns) {
            const params: WithoutGridCommon<ProcessUnpinnedColumnsParams> = {
                columns: columnsToRemove,
                viewportWidth: bodyWidth,
            };
            columnsToRemove = processUnpinnedColumns(params) as AgColumn[];
        }

        this.setColsPinned(columnsToRemove, null, 'viewportSizeFeature');
    }

    public createPinnedWidthFeature(element: HTMLElement, isLeft: boolean): SetPinnedWidthFeature {
        return new SetPinnedWidthFeature(element, isLeft);
    }

    public setColsPinned(keys: ColKey[], pinned: ColumnPinnedType, source: ColumnEventType): void {
        const { colModel, colAnimation, visibleCols, gos } = this.beans;
        if (!colModel.cols) {
            return;
        }
        if (!keys?.length) {
            return;
        }

        if (_isDomLayout(gos, 'print')) {
            _warn(37);
            return;
        }

        colAnimation?.start();

        let actualPinned: ColumnPinnedType;
        if (pinned === true || pinned === 'left') {
            actualPinned = 'left';
        } else if (pinned === 'right') {
            actualPinned = 'right';
        } else {
            actualPinned = null;
        }

        const updatedCols: AgColumn[] = [];

        keys.forEach((key) => {
            if (!key) {
                return;
            }
            const column = colModel.getCol(key);
            if (!column) {
                return;
            }

            if (column.getPinned() !== actualPinned) {
                this.setColPinned(column, actualPinned);
                updatedCols.push(column);
            }
        });

        if (updatedCols.length) {
            visibleCols.refresh(source);
            dispatchColumnPinnedEvent(this.eventSvc, updatedCols, source);
        }

        colAnimation?.finish();
    }

    public initCol(column: AgColumn): void {
        const { pinned, initialPinned } = column.colDef;
        if (pinned !== undefined) {
            this.setColPinned(column, pinned);
        } else {
            this.setColPinned(column, initialPinned);
        }
    }

    public setColPinned(column: AgColumn, pinned: ColumnPinnedType): void {
        if (pinned === true || pinned === 'left') {
            column.pinned = 'left';
        } else if (pinned === 'right') {
            column.pinned = 'right';
        } else {
            column.pinned = null;
        }
        column.dispatchStateUpdatedEvent('pinned');
    }

    public setupHeaderPinnedWidth(ctrl: HeaderRowContainerCtrl): void {
        const { scrollVisibleSvc } = this.beans;

        if (ctrl.pinned == null) {
            return;
        }

        const pinningLeft = ctrl.pinned === 'left';
        const pinningRight = ctrl.pinned === 'right';

        ctrl.hidden = true;

        const listener = () => {
            const width = pinningLeft ? this.leftWidth : this.rightWidth;
            if (width == null) {
                return;
            } // can happen at initialisation, width not yet set

            const hidden = width == 0;
            const hiddenChanged = ctrl.hidden !== hidden;
            const isRtl = this.gos.get('enableRtl');
            const scrollbarWidth = scrollVisibleSvc.getScrollbarWidth();

            // if there is a scroll showing (and taking up space, so Windows, and not iOS)
            // in the body, then we add extra space to keep header aligned with the body,
            // as body width fits the cols and the scrollbar
            const addPaddingForScrollbar =
                scrollVisibleSvc.verticalScrollShowing && ((isRtl && pinningLeft) || (!isRtl && pinningRight));
            const widthWithPadding = addPaddingForScrollbar ? width + scrollbarWidth : width;

            ctrl.comp.setPinnedContainerWidth(`${widthWithPadding}px`);
            ctrl.comp.setDisplayed(!hidden);

            if (hiddenChanged) {
                ctrl.hidden = hidden;
                ctrl.refresh();
            }
        };

        ctrl.addManagedEventListeners({
            leftPinnedWidthChanged: listener,
            rightPinnedWidthChanged: listener,
            scrollVisibilityChanged: listener,
            scrollbarWidthChanged: listener,
        });
    }

    public getHeaderResizeDiff(diff: number, column: AgColumn | AgColumnGroup): number {
        const pinned = column.getPinned();
        if (pinned) {
            const { leftWidth, rightWidth } = this;
            const bodyWidth = _getInnerWidth(this.beans.ctrlsSvc.getGridBodyCtrl().eBodyViewport) - 50;

            if (leftWidth + rightWidth + diff > bodyWidth) {
                if (bodyWidth > leftWidth + rightWidth) {
                    // allow body width to ignore resize multiplier and fill space for last tick
                    diff = bodyWidth - leftWidth - rightWidth;
                } else {
                    return 0;
                }
            }
        }

        return diff;
    }

    private getPinnedColumnsOverflowingViewport(viewportWidth: number): AgColumn[] {
        const pinnedRightWidth = this.rightWidth ?? 0;
        const pinnedLeftWidth = this.leftWidth ?? 0;
        const totalPinnedWidth = pinnedRightWidth + pinnedLeftWidth;

        if (totalPinnedWidth < viewportWidth) {
            return [];
        }

        const { visibleCols } = this.beans;
        const pinnedLeftColumns = [...visibleCols.leftCols];
        const pinnedRightColumns = [...visibleCols.rightCols];

        let indexRight = 0;
        let indexLeft = 0;
        const totalWidthRemoved = 0;

        const columnsToRemove: AgColumn[] = [];

        let spaceNecessary = totalPinnedWidth - totalWidthRemoved - viewportWidth;

        while ((indexLeft < pinnedLeftColumns.length || indexRight < pinnedRightColumns.length) && spaceNecessary > 0) {
            if (indexRight < pinnedRightColumns.length) {
                const currentColumn = pinnedRightColumns[indexRight++];
                spaceNecessary -= currentColumn.getActualWidth();
                columnsToRemove.push(currentColumn);
            }

            if (indexLeft < pinnedLeftColumns.length && spaceNecessary > 0) {
                const currentColumn = pinnedLeftColumns[indexLeft++];
                spaceNecessary -= currentColumn.getActualWidth();
                columnsToRemove.push(currentColumn);
            }
        }

        return columnsToRemove;
    }
}
