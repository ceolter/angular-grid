import type { ColumnAutosizeService } from '../columnAutosize/columnAutosizeService';
import type { ColumnGroupService } from '../columns/columnGroups/columnGroupService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { HorizontalResizeService } from '../dragAndDrop/horizontalResizeService';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColumnEventType } from '../events';
import type { IHeaderResizeFeature } from '../headerRendering/cells/abstractCell/abstractHeaderCellCtrl';
import type { IHeaderGroupCellComp } from '../headerRendering/cells/columnGroup/headerGroupCellCtrl';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import type { AutoWidthCalculator } from '../rendering/autoWidthCalculator';
import type { ColumnResizeService, ColumnResizeSet } from './columnResizeService';

interface ColumnSizeAndRatios {
    columnsToResize: AgColumn[];
    resizeStartWidth: number;
    resizeRatios: number[];
    groupAfterColumns?: AgColumn[];
    groupAfterStartWidth?: number;
    groupAfterRatios?: number[];
}
export class GroupResizeFeature extends BeanStub implements IHeaderResizeFeature {
    private horizontalResizeSvc: HorizontalResizeService;
    private autoWidthCalculator: AutoWidthCalculator;
    private columnGroupSvc?: ColumnGroupService;
    private colResize?: ColumnResizeService;
    private colAutosize?: ColumnAutosizeService;

    public wireBeans(beans: BeanCollection) {
        this.horizontalResizeSvc = beans.horizontalResizeSvc!;
        this.autoWidthCalculator = beans.autoWidthCalculator!;
        this.columnGroupSvc = beans.columnGroupSvc;
        this.colResize = beans.colResize;
        this.colAutosize = beans.colAutosize;
    }

    private eResize: HTMLElement;
    private columnGroup: AgColumnGroup;
    private comp: IHeaderGroupCellComp;
    private pinned: ColumnPinnedType;

    private resizeCols?: AgColumn[];
    private resizeStartWidth: number;
    private resizeRatios?: number[];

    private resizeTakeFromCols?: AgColumn[];
    private resizeTakeFromStartWidth?: number;
    private resizeTakeFromRatios?: number[];

    constructor(
        comp: IHeaderGroupCellComp,
        eResize: HTMLElement,
        pinned: ColumnPinnedType,
        columnGroup: AgColumnGroup
    ) {
        super();

        this.eResize = eResize;
        this.comp = comp;
        this.pinned = pinned;
        this.columnGroup = columnGroup;
    }

    public postConstruct(): void {
        if (!this.columnGroup.isResizable()) {
            this.comp.setResizableDisplayed(false);
            return;
        }

        const finishedWithResizeFunc = this.horizontalResizeSvc.addResizeBar({
            eResizeBar: this.eResize,
            onResizeStart: this.onResizeStart.bind(this),
            onResizing: this.onResizing.bind(this, false),
            onResizeEnd: this.onResizing.bind(this, true),
        });

        this.addDestroyFunc(finishedWithResizeFunc);

        if (!this.gos.get('suppressAutoSize') && this.colAutosize) {
            this.addDestroyFunc(
                this.colAutosize.addColumnGroupResize(this.eResize, this.columnGroup, () =>
                    this.resizeLeafColumnsToFit('uiColumnResized')
                )
            );
        }
    }

    private onResizeStart(shiftKey: boolean): void {
        const initialValues = this.getInitialValues(shiftKey);
        this.storeLocalValues(initialValues);
        this.toggleColumnResizing(true);
    }

    public onResizing(finished: boolean, resizeAmount: any, source: ColumnEventType = 'uiColumnResized'): void {
        const resizeAmountNormalised = this.normaliseDragChange(resizeAmount);
        const width = this.resizeStartWidth + resizeAmountNormalised;

        this.resizeColumnsFromLocalValues(width, source, finished);
    }

    public getInitialValues(shiftKey?: boolean): ColumnSizeAndRatios {
        const columnsToResize = this.getColumnsToResize();
        const resizeStartWidth = this.getInitialSizeOfColumns(columnsToResize);
        const resizeRatios = this.getSizeRatiosOfColumns(columnsToResize, resizeStartWidth);

        const columnSizeAndRatios: ColumnSizeAndRatios = {
            columnsToResize,
            resizeStartWidth,
            resizeRatios,
        };

        let groupAfter: AgColumnGroup | null = null;

        if (shiftKey) {
            groupAfter = this.columnGroupSvc?.getGroupAtDirection(this.columnGroup, 'After') ?? null;
        }

        if (groupAfter) {
            const takeFromLeafCols = groupAfter.getDisplayedLeafColumns();
            const groupAfterColumns = (columnSizeAndRatios.groupAfterColumns = takeFromLeafCols.filter((col) =>
                col.isResizable()
            ));
            const groupAfterStartWidth = (columnSizeAndRatios.groupAfterStartWidth =
                this.getInitialSizeOfColumns(groupAfterColumns));
            columnSizeAndRatios.groupAfterRatios = this.getSizeRatiosOfColumns(groupAfterColumns, groupAfterStartWidth);
        } else {
            columnSizeAndRatios.groupAfterColumns = undefined;
            columnSizeAndRatios.groupAfterStartWidth = undefined;
            columnSizeAndRatios.groupAfterRatios = undefined;
        }

        return columnSizeAndRatios;
    }

    private storeLocalValues(initialValues: ColumnSizeAndRatios): void {
        const {
            columnsToResize,
            resizeStartWidth,
            resizeRatios,
            groupAfterColumns,
            groupAfterStartWidth,
            groupAfterRatios,
        } = initialValues;

        this.resizeCols = columnsToResize;
        this.resizeStartWidth = resizeStartWidth;
        this.resizeRatios = resizeRatios;

        this.resizeTakeFromCols = groupAfterColumns;
        this.resizeTakeFromStartWidth = groupAfterStartWidth;
        this.resizeTakeFromRatios = groupAfterRatios;
    }

    public resizeLeafColumnsToFit(source: ColumnEventType): void {
        const preferredSize = this.autoWidthCalculator.getPreferredWidthForColumnGroup(this.columnGroup);
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
            groupAfterColumns: this.resizeTakeFromCols ?? undefined,
            groupAfterStartWidth: this.resizeTakeFromStartWidth ?? undefined,
            groupAfterRatios: this.resizeTakeFromRatios ?? undefined,
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

        this.colResize?.resizeColumnSets({
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

    private getInitialSizeOfColumns(columns: AgColumn[]): number {
        return columns.reduce((totalWidth: number, column: AgColumn) => totalWidth + column.getActualWidth(), 0);
    }

    private getSizeRatiosOfColumns(columns: AgColumn[], initialSizeOfColumns: number): number[] {
        return columns.map((column) => column.getActualWidth() / initialSizeOfColumns);
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
