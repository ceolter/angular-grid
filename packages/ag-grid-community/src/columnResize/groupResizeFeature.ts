import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColumnEventType } from '../events';
import type { IHeaderResizeFeature } from '../headerRendering/cells/abstractCell/abstractHeaderCellCtrl';
import type { IHeaderGroupCellComp } from '../headerRendering/cells/columnGroup/headerGroupCellCtrl';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import type { ColumnResizeSet } from './columnResizeService';

interface ColumnSizeAndRatios {
    columnsToResize: AgColumn[];
    resizeStartWidth: number;
    resizeRatios: number[];
    groupAfterColumns?: AgColumn[];
    groupAfterStartWidth?: number;
    groupAfterRatios?: number[];
}
export class GroupResizeFeature extends BeanStub implements IHeaderResizeFeature {
    private resizeCols?: AgColumn[];
    private resizeStartWidth: number;
    private resizeRatios?: number[];

    private resizeTakeFromCols?: AgColumn[];
    private resizeTakeFromStartWidth?: number;
    private resizeTakeFromRatios?: number[];

    constructor(
        private comp: IHeaderGroupCellComp,
        private eResize: HTMLElement,
        private pinned: ColumnPinnedType,
        private columnGroup: AgColumnGroup
    ) {
        super();
    }

    public postConstruct(): void {
        if (!this.columnGroup.isResizable()) {
            this.comp.setResizableDisplayed(false);
            return;
        }

        const { horizontalResizeSvc, gos, colAutosize } = this.beans;

        const finishedWithResizeFunc = horizontalResizeSvc!.addResizeBar({
            eResizeBar: this.eResize,
            onResizeStart: this.onResizeStart.bind(this),
            onResizing: this.onResizing.bind(this, false),
            onResizeEnd: this.onResizing.bind(this, true),
        });

        this.addDestroyFunc(finishedWithResizeFunc);

        if (!gos.get('suppressAutoSize') && colAutosize) {
            this.addDestroyFunc(
                colAutosize.addColumnGroupResize(this.eResize, this.columnGroup, () =>
                    this.resizeLeafColumnsToFit('uiColumnResized')
                )
            );
        }
    }

    private onResizeStart(shiftKey: boolean): void {
        const {
            columnsToResize,
            resizeStartWidth,
            resizeRatios,
            groupAfterColumns,
            groupAfterStartWidth,
            groupAfterRatios,
        } = this.getInitialValues(shiftKey);

        this.resizeCols = columnsToResize;
        this.resizeStartWidth = resizeStartWidth;
        this.resizeRatios = resizeRatios;

        this.resizeTakeFromCols = groupAfterColumns;
        this.resizeTakeFromStartWidth = groupAfterStartWidth;
        this.resizeTakeFromRatios = groupAfterRatios;

        this.toggleColumnResizing(true);
    }

    public onResizing(finished: boolean, resizeAmount: any, source: ColumnEventType = 'uiColumnResized'): void {
        const resizeAmountNormalised = this.normaliseDragChange(resizeAmount);
        const width = this.resizeStartWidth + resizeAmountNormalised;

        this.resizeColumnsFromLocalValues(width, source, finished);
    }

    public getInitialValues(shiftKey?: boolean): ColumnSizeAndRatios {
        const getInitialSizeOfColumns = (columns: AgColumn[]) =>
            columns.reduce((totalWidth: number, column: AgColumn) => totalWidth + column.getActualWidth(), 0);
        const getSizeRatiosOfColumns = (columns: AgColumn[], initialSizeOfColumns: number) =>
            columns.map((column) => column.getActualWidth() / initialSizeOfColumns);

        const columnsToResize = this.getColumnsToResize();
        const resizeStartWidth = getInitialSizeOfColumns(columnsToResize);
        const resizeRatios = getSizeRatiosOfColumns(columnsToResize, resizeStartWidth);

        const columnSizeAndRatios: ColumnSizeAndRatios = {
            columnsToResize,
            resizeStartWidth,
            resizeRatios,
        };

        let groupAfter: AgColumnGroup | null = null;

        if (shiftKey) {
            groupAfter = this.beans.colGroupSvc?.getGroupAtDirection(this.columnGroup, 'After') ?? null;
        }

        if (groupAfter) {
            const takeFromLeafCols = groupAfter.getDisplayedLeafColumns();
            const groupAfterColumns = (columnSizeAndRatios.groupAfterColumns = takeFromLeafCols.filter((col) =>
                col.isResizable()
            ));
            const groupAfterStartWidth = (columnSizeAndRatios.groupAfterStartWidth =
                getInitialSizeOfColumns(groupAfterColumns));
            columnSizeAndRatios.groupAfterRatios = getSizeRatiosOfColumns(groupAfterColumns, groupAfterStartWidth);
        } else {
            columnSizeAndRatios.groupAfterColumns = undefined;
            columnSizeAndRatios.groupAfterStartWidth = undefined;
            columnSizeAndRatios.groupAfterRatios = undefined;
        }

        return columnSizeAndRatios;
    }

    public resizeLeafColumnsToFit(source: ColumnEventType): void {
        const preferredSize = this.beans.autoWidthCalc!.getPreferredWidthForColumnGroup(this.columnGroup);
        const initialValues = this.getInitialValues();

        if (preferredSize > initialValues.resizeStartWidth) {
            this.resizeColumns(initialValues, preferredSize, source, true);
        }
    }

    private resizeColumnsFromLocalValues(totalWidth: number, source: ColumnEventType, finished: boolean = true): void {
        if (!this.resizeCols || !this.resizeRatios) {
            return;
        }

        const initialValues: ColumnSizeAndRatios = {
            columnsToResize: this.resizeCols,
            resizeStartWidth: this.resizeStartWidth,
            resizeRatios: this.resizeRatios,
            groupAfterColumns: this.resizeTakeFromCols,
            groupAfterStartWidth: this.resizeTakeFromStartWidth,
            groupAfterRatios: this.resizeTakeFromRatios,
        };

        this.resizeColumns(initialValues, totalWidth, source, finished);
    }

    public resizeColumns(
        initialValues: ColumnSizeAndRatios,
        totalWidth: number,
        source: ColumnEventType,
        finished: boolean = true
    ): void {
        const {
            columnsToResize,
            resizeStartWidth,
            resizeRatios,
            groupAfterColumns,
            groupAfterStartWidth,
            groupAfterRatios,
        } = initialValues;

        const resizeSets: ColumnResizeSet[] = [];

        resizeSets.push({
            columns: columnsToResize,
            ratios: resizeRatios,
            width: totalWidth,
        });

        if (groupAfterColumns) {
            const diff = totalWidth - resizeStartWidth;
            resizeSets.push({
                columns: groupAfterColumns,
                ratios: groupAfterRatios!,
                width: groupAfterStartWidth! - diff,
            });
        }

        this.beans.colResize?.resizeColumnSets({
            resizeSets,
            finished,
            source: source,
        });

        if (finished) {
            this.toggleColumnResizing(false);
        }
    }

    public toggleColumnResizing(resizing: boolean): void {
        this.comp.addOrRemoveCssClass('ag-column-resizing', resizing);
    }

    private getColumnsToResize(): AgColumn[] {
        const leafCols = this.columnGroup.getDisplayedLeafColumns();
        return leafCols.filter((col) => col.isResizable());
    }

    // optionally inverts the drag, depending on pinned and RTL
    // note - this method is duplicated in RenderedHeaderCell - should refactor out?
    private normaliseDragChange(dragChange: number): number {
        let result = dragChange;

        if (this.gos.get('enableRtl')) {
            // for RTL, dragging left makes the col bigger, except when pinning left
            if (this.pinned !== 'left') {
                result *= -1;
            }
        } else if (this.pinned === 'right') {
            // for LTR (ie normal), dragging left makes the col smaller, except when pinning right
            result *= -1;
        }

        return result;
    }

    public override destroy(): void {
        super.destroy();

        this.resizeCols = undefined;
        this.resizeRatios = undefined;

        this.resizeTakeFromCols = undefined;
        this.resizeTakeFromRatios = undefined;
    }
}
