import { dispatchColumnResizedEvent } from '../columns/columnEventUtils';
import type { ColumnFlexService } from '../columns/columnFlexService';
import type { ColKey, ColumnModel } from '../columns/columnModel';
import type { ColumnViewportService } from '../columns/columnViewportService';
import type { VisibleColsService } from '../columns/visibleColsService';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColumnEventType } from '../events';
import type { HeaderCellCtrl, IHeaderCellComp } from '../headerRendering/cells/column/headerCellCtrl';
import type { IHeaderGroupCellComp } from '../headerRendering/cells/columnGroup/headerGroupCellCtrl';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import { _error } from '../validation/logging';
import { GroupResizeFeature } from './groupResizeFeature';
import { ResizeFeature } from './resizeFeature';

export interface ColumnResizeSet {
    columns: AgColumn[];
    ratios: number[];
    width: number;
}

export class ColumnResizeService extends BeanStub implements NamedBean {
    beanName = 'colResize' as const;

    private colModel: ColumnModel;
    private colViewport: ColumnViewportService;
    private visibleCols: VisibleColsService;
    private colFlex?: ColumnFlexService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.colViewport = beans.colViewport;
        this.visibleCols = beans.visibleCols;
        this.colFlex = beans.colFlex;
    }

    public setColumnWidths(
        columnWidths: {
            key: ColKey; // @key - the column who's size we want to change
            newWidth: number; // @newWidth - width in pixels
        }[],
        shiftKey: boolean, // @takeFromAdjacent - if user has 'shift' pressed, then pixels are taken from adjacent column
        finished: boolean, // @finished - ends up in the event, tells the user if more events are to come
        source: ColumnEventType
    ): void {
        const sets: ColumnResizeSet[] = [];

        columnWidths.forEach((columnWidth) => {
            const col = this.colModel.getColDefCol(columnWidth.key) || this.colModel.getCol(columnWidth.key);

            if (!col) {
                return;
            }

            sets.push({
                width: columnWidth.newWidth,
                ratios: [1],
                columns: [col],
            });

            // if user wants to do shift resize by default, then we invert the shift operation
            const defaultIsShift = this.gos.get('colResizeDefault') === 'shift';

            if (defaultIsShift) {
                shiftKey = !shiftKey;
            }

            if (shiftKey) {
                const otherCol = this.visibleCols.getColAfter(col);
                if (!otherCol) {
                    return;
                }

                const widthDiff = col.getActualWidth() - columnWidth.newWidth;
                const otherColWidth = otherCol.getActualWidth() + widthDiff;

                sets.push({
                    width: otherColWidth,
                    ratios: [1],
                    columns: [otherCol],
                });
            }
        });

        if (sets.length === 0) {
            return;
        }

        this.resizeColumnSets({
            resizeSets: sets,
            finished,
            source,
        });
    }

    // method takes sets of columns and resizes them. either all sets will be resized, or nothing
    // be resized. this is used for example when user tries to resize a group and holds shift key,
    // then both the current group (grows), and the adjacent group (shrinks), will get resized,
    // so that's two sets for this method.
    public resizeColumnSets(params: {
        resizeSets: ColumnResizeSet[];
        finished: boolean;
        source: ColumnEventType;
    }): void {
        const { resizeSets, finished, source } = params;
        const passMinMaxCheck =
            !resizeSets || resizeSets.every((columnResizeSet) => this.checkMinAndMaxWidthsForSet(columnResizeSet));

        if (!passMinMaxCheck) {
            // even though we are not going to resize beyond min/max size, we still need to dispatch event when finished
            if (finished) {
                const columns = resizeSets && resizeSets.length > 0 ? resizeSets[0].columns : null;
                dispatchColumnResizedEvent(this.eventSvc, columns, finished, source);
            }

            return; // don't resize!
        }

        const changedCols: AgColumn[] = [];
        const allResizedCols: AgColumn[] = [];

        resizeSets.forEach((set) => {
            const { width, columns, ratios } = set;

            // keep track of pixels used, and last column gets the remaining,
            // to cater for rounding errors, and min width adjustments
            const newWidths: { [colId: string]: number } = {};
            const finishedCols: { [colId: string]: boolean } = {};

            columns.forEach((col) => allResizedCols.push(col));

            // the loop below goes through each col. if a col exceeds it's min/max width,
            // it then gets set to its min/max width and the column is removed marked as 'finished'
            // and the calculation is done again leaving this column out. take for example columns
            // {A, width: 50, maxWidth: 100}
            // {B, width: 50}
            // {C, width: 50}
            // and then the set is set to width 600 - on the first pass the grid tries to set each column
            // to 200. it checks A and sees 200 > 100 and so sets the width to 100. col A is then marked
            // as 'finished' and the calculation is done again with the remaining cols B and C, which end up
            // splitting the remaining 500 pixels.
            let finishedColsGrew = true;
            let loopCount = 0;

            while (finishedColsGrew) {
                loopCount++;
                if (loopCount > 1000) {
                    // this should never happen, but in the future, someone might introduce a bug here,
                    // so we stop the browser from hanging and report bug properly
                    _error(31);
                    break;
                }

                finishedColsGrew = false;

                const subsetCols: AgColumn[] = [];
                let subsetRatioTotal = 0;
                let pixelsToDistribute = width;

                columns.forEach((col, index) => {
                    const thisColFinished = finishedCols[col.getId()];
                    if (thisColFinished) {
                        pixelsToDistribute -= newWidths[col.getId()];
                    } else {
                        subsetCols.push(col);
                        const ratioThisCol = ratios[index];
                        subsetRatioTotal += ratioThisCol;
                    }
                });

                // because we are not using all of the ratios (cols can be missing),
                // we scale the ratio. if all columns are included, then subsetRatioTotal=1,
                // and so the ratioScale will be 1.
                const ratioScale = 1 / subsetRatioTotal;

                subsetCols.forEach((col, index) => {
                    const lastCol = index === subsetCols.length - 1;
                    let colNewWidth: number;

                    if (lastCol) {
                        colNewWidth = pixelsToDistribute;
                    } else {
                        colNewWidth = Math.round(ratios[index] * width * ratioScale);
                        pixelsToDistribute -= colNewWidth;
                    }

                    const minWidth = col.getMinWidth();
                    const maxWidth = col.getMaxWidth();

                    if (colNewWidth < minWidth) {
                        colNewWidth = minWidth;
                        finishedCols[col.getId()] = true;
                        finishedColsGrew = true;
                    } else if (maxWidth > 0 && colNewWidth > maxWidth) {
                        colNewWidth = maxWidth;
                        finishedCols[col.getId()] = true;
                        finishedColsGrew = true;
                    }

                    newWidths[col.getId()] = colNewWidth;
                });
            }

            columns.forEach((col) => {
                const newWidth = newWidths[col.getId()];
                const actualWidth = col.getActualWidth();

                if (actualWidth !== newWidth) {
                    col.setActualWidth(newWidth, source);
                    changedCols.push(col);
                }
            });
        });

        // if no cols changed, then no need to update more or send event.
        const atLeastOneColChanged = changedCols.length > 0;

        let flexedCols: AgColumn[] = [];

        if (atLeastOneColChanged) {
            flexedCols =
                this.colFlex?.refreshFlexedColumns({
                    skipSetLeft: true,
                }) ?? [];
            this.visibleCols.setLeftValues(source);
            this.visibleCols.updateBodyWidths();
            this.colViewport.checkViewportColumns();
        }

        // check for change first, to avoid unnecessary firing of events
        // however we always dispatch 'finished' events. this is important
        // when groups are resized, as if the group is changing slowly,
        // eg 1 pixel at a time, then each change will dispatch change events
        // in all the columns in the group, but only one with get the pixel.
        const colsForEvent = allResizedCols.concat(flexedCols);

        if (atLeastOneColChanged || finished) {
            dispatchColumnResizedEvent(this.eventSvc, colsForEvent, finished, source, flexedCols);
        }
    }

    public resizeHeader(column: AgColumn, delta: number, shiftKey: boolean): void {
        if (!column.isResizable()) {
            return;
        }

        const actualWidth = column.getActualWidth();
        const minWidth = column.getMinWidth();
        const maxWidth = column.getMaxWidth();

        const newWidth = Math.min(Math.max(actualWidth + delta, minWidth), maxWidth);

        this.setColumnWidths([{ key: column, newWidth }], shiftKey, true, 'uiColumnResized');
    }

    public createResizeFeature(
        pinned: ColumnPinnedType,
        column: AgColumn,
        eResize: HTMLElement,
        comp: IHeaderCellComp,
        ctrl: HeaderCellCtrl
    ): ResizeFeature {
        return new ResizeFeature(pinned, column, eResize, comp, ctrl);
    }

    public createGroupResizeFeature(
        comp: IHeaderGroupCellComp,
        eResize: HTMLElement,
        pinned: ColumnPinnedType,
        columnGroup: AgColumnGroup
    ): GroupResizeFeature {
        return new GroupResizeFeature(comp, eResize, pinned, columnGroup);
    }

    private checkMinAndMaxWidthsForSet(columnResizeSet: ColumnResizeSet): boolean {
        const { columns, width } = columnResizeSet;

        // every col has a min width, so sum them all up and see if we have enough room
        // for all the min widths
        let minWidthAccumulated = 0;
        let maxWidthAccumulated = 0;
        let maxWidthActive = true;

        columns.forEach((col) => {
            const minWidth = col.getMinWidth();
            minWidthAccumulated += minWidth || 0;

            const maxWidth = col.getMaxWidth();
            if (maxWidth > 0) {
                maxWidthAccumulated += maxWidth;
            } else {
                // if at least one columns has no max width, it means the group of columns
                // then has no max width, as at least one column can take as much width as possible
                maxWidthActive = false;
            }
        });

        const minWidthPasses = width >= minWidthAccumulated;
        const maxWidthPasses = !maxWidthActive || width <= maxWidthAccumulated;

        return minWidthPasses && maxWidthPasses;
    }
}
