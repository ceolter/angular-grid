import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { isColumn } from '../entities/agColumn';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { RowNode } from '../entities/rowNode';
import type { ColumnPinnedType } from '../interfaces/iColumn';
import { _exists } from '../utils/generic';
import type { ColumnModel } from './columnModel';
import type { VisibleColsService } from './visibleColsService';

export class ColumnViewportService extends BeanStub implements NamedBean {
    beanName = 'colViewport' as const;

    private visibleCols: VisibleColsService;
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection): void {
        this.visibleCols = beans.visibleCols;
        this.colModel = beans.colModel;
    }

    // cols in center that are in the viewport
    private colsWithinViewport: AgColumn[] = [];
    // same as colsWithinViewport, except we always include columns with headerAutoHeight
    private headerColsWithinViewport: AgColumn[] = [];

    // A hash key to keep track of changes in viewport columns
    private colsWithinViewportHash: string = '';

    // all columns & groups to be rendered, index by row.
    // used by header rows to get all items to render for that row.
    private rowsOfHeadersToRenderLeft: { [row: number]: (AgColumn | AgColumnGroup)[] } = {};
    private rowsOfHeadersToRenderRight: { [row: number]: (AgColumn | AgColumnGroup)[] } = {};
    private rowsOfHeadersToRenderCenter: { [row: number]: (AgColumn | AgColumnGroup)[] } = {};

    private scrollWidth: number;
    private scrollPosition: number;

    private viewportLeft: number; // same as scrollPosition, except when doing RTL
    private viewportRight: number;

    private suppressColumnVirtualisation: boolean;

    public postConstruct(): void {
        this.suppressColumnVirtualisation = this.gos.get('suppressColumnVirtualisation');
    }

    public setScrollPosition(scrollWidth: number, scrollPosition: number, afterScroll: boolean = false): void {
        const bodyWidthDirty = this.visibleCols.isBodyWidthDirty;

        const noChange = scrollWidth === this.scrollWidth && scrollPosition === this.scrollPosition && !bodyWidthDirty;
        if (noChange) {
            return;
        }

        this.scrollWidth = scrollWidth;
        this.scrollPosition = scrollPosition;
        // we need to call setVirtualViewportLeftAndRight() at least once after the body width changes,
        // as the viewport can stay the same, but in RTL, if body width changes, we need to work out the
        // virtual columns again
        this.visibleCols.isBodyWidthDirty = true;

        if (this.gos.get('enableRtl')) {
            const bodyWidth = this.visibleCols.getBodyContainerWidth();
            this.viewportLeft = bodyWidth - this.scrollPosition - this.scrollWidth;
            this.viewportRight = bodyWidth - this.scrollPosition;
        } else {
            this.viewportLeft = this.scrollPosition;
            this.viewportRight = this.scrollWidth + this.scrollPosition;
        }

        if (this.colModel.ready) {
            this.checkViewportColumns(afterScroll);
        }
    }

    public getHeadersToRender(type: ColumnPinnedType, dept: number): (AgColumn | AgColumnGroup)[] {
        let result: (AgColumn | AgColumnGroup)[];

        switch (type) {
            case 'left':
                result = this.rowsOfHeadersToRenderLeft[dept];
                break;
            case 'right':
                result = this.rowsOfHeadersToRenderRight[dept];
                break;
            default:
                result = this.rowsOfHeadersToRenderCenter[dept];
                break;
        }

        return result || [];
    }

    private extractViewportColumns(): void {
        const displayedColumnsCenter = this.visibleCols.centerCols;
        if (this.isColumnVirtualisationSuppressed()) {
            // no virtualisation, so don't filter
            this.colsWithinViewport = displayedColumnsCenter;
            this.headerColsWithinViewport = displayedColumnsCenter;
        } else {
            // filter out what should be visible
            this.colsWithinViewport = displayedColumnsCenter.filter(this.isColumnInRowViewport.bind(this));
            this.headerColsWithinViewport = displayedColumnsCenter.filter(this.isColumnInHeaderViewport.bind(this));
        }
    }

    private isColumnVirtualisationSuppressed() {
        // When running within jsdom the viewportRight is always 0, so we need to return true to allow
        // tests to validate all the columns.
        return this.suppressColumnVirtualisation || this.viewportRight === 0;
    }

    public clear(): void {
        this.rowsOfHeadersToRenderLeft = {};
        this.rowsOfHeadersToRenderRight = {};
        this.rowsOfHeadersToRenderCenter = {};
        this.colsWithinViewportHash = '';
    }

    private isColumnInHeaderViewport(col: AgColumn): boolean {
        // for headers, we never filter out autoHeaderHeight columns, if calculating
        if (col.isAutoHeaderHeight() || this.isAnyParentAutoHeaderHeight(col)) {
            return true;
        }

        return this.isColumnInRowViewport(col);
    }

    private isAnyParentAutoHeaderHeight(col: AgColumn | AgColumnGroup | null): boolean {
        while (col) {
            if (col.isAutoHeaderHeight()) {
                return true;
            }
            col = col.getParent();
        }

        return false;
    }

    private isColumnInRowViewport(col: AgColumn): boolean {
        // we never filter out autoHeight columns, as we need them in the DOM for calculating Auto Height
        if (col.isAutoHeight()) {
            return true;
        }

        const columnLeft = col.getLeft() || 0;
        const columnRight = columnLeft + col.getActualWidth();

        // adding 200 for buffer size, so some cols off viewport are rendered.
        // this helps horizontal scrolling so user rarely sees white space (unless
        // they scroll horizontally fast). however we are conservative, as the more
        // buffer the slower the vertical redraw speed
        const leftBounds = this.viewportLeft - 200;
        const rightBounds = this.viewportRight + 200;

        const columnToMuchLeft = columnLeft < leftBounds && columnRight < leftBounds;
        const columnToMuchRight = columnLeft > rightBounds && columnRight > rightBounds;

        return !columnToMuchLeft && !columnToMuchRight;
    }

    // used by Grid API only
    public getViewportColumns(): AgColumn[] {
        const leftCols = this.visibleCols.leftCols;
        const rightCols = this.visibleCols.rightCols;
        const res = this.colsWithinViewport.concat(leftCols).concat(rightCols);
        return res;
    }

    // + rowRenderer
    // if we are not column spanning, this just returns back the virtual centre columns,
    // however if we are column spanning, then different rows can have different virtual
    // columns, so we have to work out the list for each individual row.
    public getColsWithinViewport(rowNode: RowNode): AgColumn[] {
        if (!this.colModel.colSpanActive) {
            return this.colsWithinViewport;
        }

        const emptySpaceBeforeColumn = (col: AgColumn) => {
            const left = col.getLeft();

            return _exists(left) && left > this.viewportLeft;
        };

        // if doing column virtualisation, then we filter based on the viewport.
        const inViewportCallback = this.isColumnVirtualisationSuppressed()
            ? undefined
            : this.isColumnInRowViewport.bind(this);
        const displayedColumnsCenter = this.visibleCols.centerCols;

        return this.visibleCols.getColsForRow(
            rowNode,
            displayedColumnsCenter,
            inViewportCallback,
            emptySpaceBeforeColumn
        );
    }

    // checks what columns are currently displayed due to column virtualisation. dispatches an event
    // if the list of columns has changed.
    // + setColumnWidth(), setViewportPosition(), setColumnDefs(), sizeColumnsToFit()
    public checkViewportColumns(afterScroll: boolean = false): void {
        const viewportColumnsChanged = this.extractViewport();
        if (viewportColumnsChanged) {
            this.eventSvc.dispatchEvent({
                type: 'virtualColumnsChanged',
                afterScroll,
            });
        }
    }

    private calculateHeaderRows(): void {
        // go through each group, see if any of it's cols are displayed, and if yes,
        // then this group is included
        this.rowsOfHeadersToRenderLeft = {};
        this.rowsOfHeadersToRenderRight = {};
        this.rowsOfHeadersToRenderCenter = {};

        // for easy lookup when building the groups.
        const renderedColIds: { [key: string]: boolean } = {};

        const renderedColsLeft = this.visibleCols.leftCols;
        const renderedColsRight = this.visibleCols.rightCols;
        const allRenderedCols = this.headerColsWithinViewport.concat(renderedColsLeft).concat(renderedColsRight);

        allRenderedCols.forEach((col) => (renderedColIds[col.getId()] = true));

        const testGroup = (
            children: (AgColumn | AgColumnGroup)[],
            result: { [row: number]: (AgColumn | AgColumnGroup)[] },
            dept: number
        ): boolean => {
            let returnValue = false;

            for (let i = 0; i < children.length; i++) {
                // see if this item is within viewport
                const child = children[i];
                let addThisItem = false;

                if (isColumn(child)) {
                    // for column, test if column is included
                    addThisItem = renderedColIds[child.getId()] === true;
                } else {
                    // if group, base decision on children
                    const columnGroup = child as AgColumnGroup;
                    const displayedChildren = columnGroup.getDisplayedChildren();

                    if (displayedChildren) {
                        addThisItem = testGroup(displayedChildren, result, dept + 1);
                    }
                }

                if (addThisItem) {
                    returnValue = true;
                    if (!result[dept]) {
                        result[dept] = [];
                    }
                    result[dept].push(child);
                }
            }
            return returnValue;
        };

        testGroup(this.visibleCols.treeLeft, this.rowsOfHeadersToRenderLeft, 0);
        testGroup(this.visibleCols.treeRight, this.rowsOfHeadersToRenderRight, 0);
        testGroup(this.visibleCols.treeCenter, this.rowsOfHeadersToRenderCenter, 0);
    }

    private extractViewport(): boolean {
        const hashColumn = (c: AgColumn) => `${c.getId()}-${c.getPinned() || 'normal'}`;

        this.extractViewportColumns();
        const newHash = this.getViewportColumns().map(hashColumn).join('#');
        const changed = this.colsWithinViewportHash !== newHash;

        if (changed) {
            this.colsWithinViewportHash = newHash;
            this.calculateHeaderRows();
        }

        return changed;
    }
}
