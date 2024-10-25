import type { ColumnCollections, ColumnModel } from '../../columns/columnModel';
import type { ColumnViewportService } from '../../columns/columnViewportService';
import type { VisibleColsService } from '../../columns/visibleColsService';
import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { RowNode } from '../../entities/rowNode';
import { _getDocument, _getRowHeightForNode } from '../../gridOptionsUtils';
import type { IClientSideRowModel } from '../../interfaces/iClientSideRowModel';
import type { IRowModel } from '../../interfaces/iRowModel';
import type { IServerSideRowModel } from '../../interfaces/iServerSideRowModel';
import { _getElementSize, _observeResize } from '../../utils/dom';
import { _debounce } from '../../utils/function';
import type { CellCtrl } from '../cell/cellCtrl';

export class RowAutoHeightService extends BeanStub implements NamedBean {
    beanName = 'rowAutoHeight' as const;

    private visibleCols: VisibleColsService;
    private colViewport: ColumnViewportService;
    private rowModel: IRowModel;
    private colModel: ColumnModel;

    /** grid columns have colDef.autoHeight set */
    public active: boolean;
    private wasEverActive = false;

    public wireBeans(beans: BeanCollection): void {
        this.visibleCols = beans.visibleCols;
        this.colViewport = beans.colViewport;
        this.rowModel = beans.rowModel;
        this.colModel = beans.colModel;
    }

    public setRowAutoHeight(rowNode: RowNode, cellHeight: number | undefined, column: AgColumn): void {
        if (!rowNode.__autoHeights) {
            rowNode.__autoHeights = {};
        }
        rowNode.__autoHeights[column.getId()] = cellHeight;

        if (cellHeight != null) {
            if (rowNode.__checkAutoHeightsDebounced == null) {
                rowNode.__checkAutoHeightsDebounced = _debounce(this, this.doCheckAutoHeights.bind(this, rowNode), 1);
            }
            rowNode.__checkAutoHeightsDebounced();
        }
    }

    public checkAutoHeights(rowNode: RowNode): void {
        if (this.wasEverActive) {
            this.doCheckAutoHeights(rowNode);
        }
    }

    private doCheckAutoHeights(rowNode: RowNode): void {
        const autoHeights = rowNode.__autoHeights;
        if (autoHeights == null) {
            return;
        }

        let notAllPresent = false;
        let nonePresent = true;
        let newRowHeight = 0;

        const displayedAutoHeightCols = this.visibleCols.autoHeightCols;
        displayedAutoHeightCols.forEach((col) => {
            let cellHeight = autoHeights[col.getId()];

            if (cellHeight == null) {
                // If column spanning is active a column may not provide auto height for a row if that
                // cell is not present for the given row due to a previous cell spanning over the auto height column.
                if (this.colModel.colSpanActive) {
                    let activeColsForRow: AgColumn[] = [];
                    switch (col.getPinned()) {
                        case 'left':
                            activeColsForRow = this.visibleCols.getLeftColsForRow(rowNode);
                            break;
                        case 'right':
                            activeColsForRow = this.visibleCols.getRightColsForRow(rowNode);
                            break;
                        case null:
                            activeColsForRow = this.colViewport.getColsWithinViewport(rowNode);
                            break;
                    }
                    if (activeColsForRow.includes(col)) {
                        // Column is present in the row, i.e not spanned over, but no auto height was provided so we cannot calculate the row height
                        notAllPresent = true;
                        return;
                    }
                    // Ignore this column as it is spanned over and not present in the row
                    cellHeight = -1;
                } else {
                    notAllPresent = true;
                    return;
                }
            } else {
                // At least one auto height is present
                nonePresent = false;
            }

            if (cellHeight > newRowHeight) {
                newRowHeight = cellHeight;
            }
        });

        if (notAllPresent) {
            return;
        }

        // we take min of 10, so we don't adjust for empty rows. if <10, we put to default.
        // this prevents the row starting very small when waiting for async components,
        // which would then mean the grid squashes in far to many rows (as small heights
        // means more rows fit in) which looks crap. so best ignore small values and assume
        // we are still waiting for values to render.
        if (nonePresent || newRowHeight < 10) {
            newRowHeight = _getRowHeightForNode(this.gos, rowNode).height;
        }

        if (newRowHeight == rowNode.rowHeight) {
            return;
        }

        rowNode.setRowHeight(newRowHeight);

        const rowModel = this.rowModel as IClientSideRowModel | IServerSideRowModel;
        rowModel.onRowHeightChangedDebounced?.();
    }

    public setupCellAutoHeight(cellCtrl: CellCtrl, eCellWrapper: HTMLElement, compBean: BeanStub): void {
        const eParentCell = eCellWrapper.parentElement!;
        const rowNode = cellCtrl.getRowNode();
        const column = cellCtrl.getColumn();
        // taking minRowHeight from getRowHeightForNode means the getRowHeight() callback is used,
        // thus allowing different min heights for different rows.
        const minRowHeight = _getRowHeightForNode(this.gos, rowNode).height;

        const measureHeight = (timesCalled: number) => {
            if (cellCtrl.isEditing()) {
                return;
            }
            // because of the retry's below, it's possible the retry's go beyond
            // the rows life.
            if (!cellCtrl.isAlive() || !compBean.isAlive()) {
                return;
            }

            const { paddingTop, paddingBottom, borderBottomWidth, borderTopWidth } = _getElementSize(eParentCell);
            const extraHeight = paddingTop + paddingBottom + borderBottomWidth + borderTopWidth;

            const wrapperHeight = eCellWrapper!.offsetHeight;
            const autoHeight = wrapperHeight + extraHeight;

            if (timesCalled < 5) {
                // if not in doc yet, means framework not yet inserted, so wait for next VM turn,
                // maybe it will be ready next VM turn
                const doc = _getDocument(this.gos);
                const notYetInDom = !doc || !doc.contains(eCellWrapper);

                // this happens in React, where React hasn't put any content in. we say 'possibly'
                // as a) may not be React and b) the cell could be empty anyway
                const possiblyNoContentYet = autoHeight == 0;

                if (notYetInDom || possiblyNoContentYet) {
                    window.setTimeout(() => measureHeight(timesCalled + 1), 0);
                    return;
                }
            }

            const newHeight = Math.max(autoHeight, minRowHeight);
            this.setRowAutoHeight(rowNode, newHeight, column);
        };

        const listener = () => measureHeight(0);

        // do once to set size in case size doesn't change, common when cell is blank
        listener();

        const destroyResizeObserver = _observeResize(this.gos, eCellWrapper, listener);

        compBean.addDestroyFunc(() => {
            destroyResizeObserver();
            this.setRowAutoHeight(rowNode, undefined, column);
        });
    }

    public setAutoHeightActive(cols: ColumnCollections): void {
        this.active = cols.list.some((col) => col.isVisible() && col.isAutoHeight());

        if (this.active) {
            this.wasEverActive = true;
        }
    }
}
