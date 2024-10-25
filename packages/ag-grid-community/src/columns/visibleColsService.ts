import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { isColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import { isColumnGroup } from '../entities/agColumnGroup';
import type { RowNode } from '../entities/rowNode';
import type { ColumnEventType } from '../events';
import type { ColumnPinnedType, HeaderColumnId } from '../interfaces/iColumn';
import { _last } from '../utils/array';
import type { ColumnFlexService } from './columnFlexService';
import type { ColumnGroupService, CreateGroupsParams } from './columnGroups/columnGroupService';
import type { ColumnModel } from './columnModel';
import { getWidthOfColsInList } from './columnUtils';
import type { ColumnViewportService } from './columnViewportService';
import { GroupInstanceIdCreator } from './groupInstanceIdCreator';

function _removeAllFromUnorderedArray<T>(array: T[], toRemove: T[]) {
    for (let i = 0; i < toRemove.length; i++) {
        const index = array.indexOf(toRemove[i]);

        if (index >= 0) {
            // preserve the last element, then shorten array length by 1 to delete index
            array[index] = array[array.length - 1];
            array.pop();
        }
    }
}

// takes in a list of columns, as specified by the column definitions, and returns column groups
export class VisibleColsService extends BeanStub implements NamedBean {
    beanName = 'visibleCols' as const;

    private colModel: ColumnModel;
    private colFlex?: ColumnFlexService;
    private colViewport: ColumnViewportService;
    private columnGroupSvc?: ColumnGroupService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.colFlex = beans.colFlex;
        this.colViewport = beans.colViewport;
        this.columnGroupSvc = beans.columnGroupSvc;
    }

    // tree of columns to be displayed for each section
    public treeLeft: (AgColumn | AgColumnGroup)[];
    public treeRight: (AgColumn | AgColumnGroup)[];
    public treeCenter: (AgColumn | AgColumnGroup)[];

    // for fast lookup, to see if a column or group is still visible
    private colsAndGroupsMap: { [id: HeaderColumnId]: AgColumn | AgColumnGroup } = {};

    // leave level columns of the displayed trees
    public leftCols: AgColumn[] = [];
    public rightCols: AgColumn[] = [];
    public centerCols: AgColumn[] = [];
    // all three lists above combined
    public allCols: AgColumn[] = [];

    public autoHeightCols: AgColumn[];

    private bodyWidth = 0;
    private leftWidth = 0;
    private rightWidth = 0;

    public isBodyWidthDirty = true;

    // list of all columns (displayed and hidden) in visible order including pinned
    private ariaOrderColumns: AgColumn[];

    public refresh(source: ColumnEventType, skipTreeBuild = false): void {
        // when we open/close col group, skipTreeBuild=false, as we know liveCols haven't changed
        if (!skipTreeBuild) {
            this.buildTrees();
        }

        this.columnGroupSvc?.updateOpenClosedVisibility();

        this.leftCols = pickDisplayedCols(this.treeLeft);
        this.centerCols = pickDisplayedCols(this.treeCenter);
        this.rightCols = pickDisplayedCols(this.treeRight);

        this.joinColsAriaOrder();
        this.joinCols();
        this.setLeftValues(source);
        this.autoHeightCols = this.allCols.filter((col) => col.isAutoHeight());
        this.colFlex?.refreshFlexedColumns();
        this.updateBodyWidths();
        this.colViewport.checkViewportColumns(false);
        this.setFirstRightAndLastLeftPinned(source);

        this.eventSvc.dispatchEvent({
            type: 'displayedColumnsChanged',
            source,
        });
    }

    // after setColumnWidth or updateGroupsAndPresentedCols
    public updateBodyWidths(): void {
        const newBodyWidth = getWidthOfColsInList(this.centerCols);
        const newLeftWidth = getWidthOfColsInList(this.leftCols);
        const newRightWidth = getWidthOfColsInList(this.rightCols);

        // this is used by virtual col calculation, for RTL only, as a change to body width can impact displayed
        // columns, due to RTL inverting the y coordinates
        this.isBodyWidthDirty = this.bodyWidth !== newBodyWidth;

        const atLeastOneChanged =
            this.bodyWidth !== newBodyWidth || this.leftWidth !== newLeftWidth || this.rightWidth !== newRightWidth;

        if (atLeastOneChanged) {
            this.bodyWidth = newBodyWidth;
            this.leftWidth = newLeftWidth;
            this.rightWidth = newRightWidth;

            // this event is fired to allow the grid viewport to resize before the
            // scrollbar tries to update its visibility.
            this.eventSvc.dispatchEvent({
                type: 'columnContainerWidthChanged',
            });

            // when this fires, it is picked up by the gridPanel, which ends up in
            // gridPanel calling setWidthAndScrollPosition(), which in turn calls setViewportPosition()
            this.eventSvc.dispatchEvent({
                type: 'displayedColumnsWidthChanged',
            });
        }
    }

    // sets the left pixel position of each column
    public setLeftValues(source: ColumnEventType): void {
        this.setLeftValuesOfCols(source);
        this.setLeftValuesOfGroups();
    }

    private setFirstRightAndLastLeftPinned(source: ColumnEventType): void {
        let lastLeft: AgColumn | null;
        let firstRight: AgColumn | null;

        if (this.gos.get('enableRtl')) {
            lastLeft = this.leftCols ? this.leftCols[0] : null;
            firstRight = this.rightCols ? _last(this.rightCols) : null;
        } else {
            lastLeft = this.leftCols ? _last(this.leftCols) : null;
            firstRight = this.rightCols ? this.rightCols[0] : null;
        }

        this.colModel.getCols().forEach((col) => {
            col.setLastLeftPinned(col === lastLeft, source);
            col.setFirstRightPinned(col === firstRight, source);
        });
    }

    private buildTrees() {
        const cols = this.colModel.getColsToShow();

        const leftCols = cols.filter((col) => col.getPinned() == 'left');
        const rightCols = cols.filter((col) => col.getPinned() == 'right');
        const centerCols = cols.filter((col) => col.getPinned() != 'left' && col.getPinned() != 'right');

        const idCreator = new GroupInstanceIdCreator();

        this.treeLeft = this.createGroups({
            columns: leftCols,
            idCreator,
            pinned: 'left',
            oldDisplayedGroups: this.treeLeft,
        });
        this.treeRight = this.createGroups({
            columns: rightCols,
            idCreator,
            pinned: 'right',
            oldDisplayedGroups: this.treeRight,
        });
        this.treeCenter = this.createGroups({
            columns: centerCols,
            idCreator,
            pinned: null,
            oldDisplayedGroups: this.treeCenter,
        });

        this.updateColsAndGroupsMap();
    }

    public clear(): void {
        this.leftCols = [];
        this.rightCols = [];
        this.centerCols = [];
        this.allCols = [];
        this.ariaOrderColumns = [];
    }

    private joinColsAriaOrder(): void {
        const allColumns = this.colModel.getCols();
        const pinnedLeft: AgColumn[] = [];
        const center: AgColumn[] = [];
        const pinnedRight: AgColumn[] = [];

        for (const col of allColumns) {
            const pinned = col.getPinned();
            if (!pinned) {
                center.push(col);
            } else if (pinned === true || pinned === 'left') {
                pinnedLeft.push(col);
            } else {
                pinnedRight.push(col);
            }
        }

        this.ariaOrderColumns = pinnedLeft.concat(center).concat(pinnedRight);
    }

    public getAriaColIndex(colOrGroup: AgColumn | AgColumnGroup): number {
        let col: AgColumn;

        if (isColumnGroup(colOrGroup)) {
            col = colOrGroup.getLeafColumns()[0];
        } else {
            col = colOrGroup;
        }

        return this.ariaOrderColumns.indexOf(col) + 1;
    }

    private setLeftValuesOfGroups(): void {
        // a groups left value is the lest left value of it's children
        [this.treeLeft, this.treeRight, this.treeCenter].forEach((columns) => {
            columns.forEach((column) => {
                if (isColumnGroup(column)) {
                    const columnGroup = column;
                    columnGroup.checkLeft();
                }
            });
        });
    }

    private setLeftValuesOfCols(source: ColumnEventType): void {
        const primaryCols = this.colModel.getColDefCols();
        if (!primaryCols) {
            return;
        }

        // go through each list of displayed columns
        const allColumns = this.colModel.getCols().slice(0);

        // let totalColumnWidth = this.getWidthOfColsInList()
        const doingRtl = this.gos.get('enableRtl');

        [this.leftCols, this.rightCols, this.centerCols].forEach((columns) => {
            if (doingRtl) {
                // when doing RTL, we start at the top most pixel (ie RHS) and work backwards
                let left = getWidthOfColsInList(columns);
                columns.forEach((column) => {
                    left -= column.getActualWidth();
                    column.setLeft(left, source);
                });
            } else {
                // otherwise normal LTR, we start at zero
                let left = 0;
                columns.forEach((column) => {
                    column.setLeft(left, source);
                    left += column.getActualWidth();
                });
            }
            _removeAllFromUnorderedArray(allColumns, columns);
        });

        // items left in allColumns are columns not displayed, so remove the left position. this is
        // important for the rows, as if a col is made visible, then taken out, then made visible again,
        // we don't want the animation of the cell floating in from the old position, whatever that was.
        allColumns.forEach((column) => {
            column.setLeft(null, source);
        });
    }

    private joinCols(): void {
        if (this.gos.get('enableRtl')) {
            this.allCols = this.rightCols.concat(this.centerCols).concat(this.leftCols);
        } else {
            this.allCols = this.leftCols.concat(this.centerCols).concat(this.rightCols);
        }
    }

    public getAllTrees(): (AgColumn | AgColumnGroup)[] | null {
        if (this.treeLeft && this.treeRight && this.treeCenter) {
            return this.treeLeft.concat(this.treeCenter).concat(this.treeRight);
        }

        return null;
    }

    // gridPanel -> ensureColumnVisible
    public isColDisplayed(column: AgColumn): boolean {
        return this.allCols.indexOf(column as AgColumn) >= 0;
    }

    public getLeftColsForRow(rowNode: RowNode): AgColumn[] {
        const colSpanActive = this.colModel.colSpanActive;
        if (!colSpanActive) {
            return this.leftCols;
        }

        return this.getColsForRow(rowNode, this.leftCols);
    }

    public getRightColsForRow(rowNode: RowNode): AgColumn[] {
        const colSpanActive = this.colModel.colSpanActive;
        if (!colSpanActive) {
            return this.rightCols;
        }

        return this.getColsForRow(rowNode, this.rightCols);
    }

    public getColsForRow(
        rowNode: RowNode,
        displayedColumns: AgColumn[],
        filterCallback?: (column: AgColumn) => boolean,
        emptySpaceBeforeColumn?: (column: AgColumn) => boolean
    ): AgColumn[] {
        const result: AgColumn[] = [];
        let lastConsideredCol: AgColumn | null = null;

        for (let i = 0; i < displayedColumns.length; i++) {
            const col = displayedColumns[i] as AgColumn;
            const maxAllowedColSpan = displayedColumns.length - i;
            const colSpan = Math.min(col.getColSpan(rowNode), maxAllowedColSpan);
            const columnsToCheckFilter: AgColumn[] = [col];

            if (colSpan > 1) {
                const colsToRemove = colSpan - 1;

                for (let j = 1; j <= colsToRemove; j++) {
                    columnsToCheckFilter.push(displayedColumns[i + j]);
                }

                i += colsToRemove;
            }

            // see which cols we should take out for column virtualisation
            let filterPasses: boolean;

            if (filterCallback) {
                // if user provided a callback, means some columns may not be in the viewport.
                // the user will NOT provide a callback if we are talking about pinned areas,
                // as pinned areas have no horizontal scroll and do not virtualise the columns.
                // if lots of columns, that means column spanning, and we set filterPasses = true
                // if one or more of the columns spanned pass the filter.
                filterPasses = false;
                columnsToCheckFilter.forEach((colForFilter) => {
                    if (filterCallback(colForFilter)) {
                        filterPasses = true;
                    }
                });
            } else {
                filterPasses = true;
            }

            if (filterPasses) {
                if (result.length === 0 && lastConsideredCol) {
                    const gapBeforeColumn = emptySpaceBeforeColumn ? emptySpaceBeforeColumn(col) : false;
                    if (gapBeforeColumn) {
                        result.push(lastConsideredCol);
                    }
                }
                result.push(col);
            }

            lastConsideredCol = col;
        }

        return result;
    }

    // used by:
    // + angularGrid -> for setting body width
    // + rowController -> setting main row widths (when inserting and resizing)
    // need to cache this
    public getBodyContainerWidth(): number {
        return this.bodyWidth;
    }

    public getContainerWidth(pinned: ColumnPinnedType): number {
        switch (pinned) {
            case 'left':
                return this.leftWidth;
            case 'right':
                return this.rightWidth;
            default:
                return this.bodyWidth;
        }
    }

    public getColBefore(col: AgColumn): AgColumn | null {
        const allDisplayedColumns = this.allCols;
        const oldIndex = allDisplayedColumns.indexOf(col as AgColumn);

        if (oldIndex > 0) {
            return allDisplayedColumns[oldIndex - 1];
        }

        return null;
    }

    public isPinningLeft(): boolean {
        return this.leftCols.length > 0;
    }

    public isPinningRight(): boolean {
        return this.rightCols.length > 0;
    }

    private updateColsAndGroupsMap(): void {
        this.colsAndGroupsMap = {};

        const func = (child: AgColumn | AgColumnGroup) => {
            this.colsAndGroupsMap[child.getUniqueId()] = child;
        };

        depthFirstAllColumnTreeSearch(this.treeCenter, false, func);
        depthFirstAllColumnTreeSearch(this.treeLeft, false, func);
        depthFirstAllColumnTreeSearch(this.treeRight, false, func);
    }

    public isVisible(item: AgColumn | AgColumnGroup): boolean {
        const fromMap = this.colsAndGroupsMap[item.getUniqueId()];
        // check for reference, in case new column / group with same id is now present
        return fromMap === item;
    }

    public getFirstColumn(): AgColumn | null {
        const isRtl = this.gos.get('enableRtl');
        const queryOrder: ('leftCols' | 'centerCols' | 'rightCols')[] = ['leftCols', 'centerCols', 'rightCols'];

        if (isRtl) {
            queryOrder.reverse();
        }

        for (let i = 0; i < queryOrder.length; i++) {
            const container = this[queryOrder[i]];
            if (container.length) {
                return isRtl ? _last(container) : container[0];
            }
        }

        return null;
    }

    // used by:
    // + rowRenderer -> for navigation
    public getColAfter(col: AgColumn): AgColumn | null {
        const allDisplayedColumns = this.allCols;
        const oldIndex = allDisplayedColumns.indexOf(col as AgColumn);

        if (oldIndex < allDisplayedColumns.length - 1) {
            return allDisplayedColumns[oldIndex + 1];
        }

        return null;
    }

    // used by:
    // + angularGrid -> setting pinned body width
    // note: this should be cached
    public getColsLeftWidth() {
        return getWidthOfColsInList(this.leftCols);
    }

    // note: this should be cached
    public getDisplayedColumnsRightWidth() {
        return getWidthOfColsInList(this.rightCols);
    }

    public isColAtEdge(col: AgColumn | AgColumnGroup, edge: 'first' | 'last'): boolean {
        const allColumns = this.allCols;
        if (!allColumns.length) {
            return false;
        }

        const isFirst = edge === 'first';

        let columnToCompare: AgColumn;
        if (isColumnGroup(col)) {
            const leafColumns = col.getDisplayedLeafColumns();
            if (!leafColumns.length) {
                return false;
            }

            columnToCompare = isFirst ? leafColumns[0] : _last(leafColumns);
        } else {
            columnToCompare = col;
        }

        return (isFirst ? allColumns[0] : _last(allColumns)) === columnToCompare;
    }

    public createGroups(params: CreateGroupsParams): (AgColumn | AgColumnGroup)[] {
        return this.columnGroupSvc ? this.columnGroupSvc.createColumnGroups(params) : params.columns;
    }
}

export function depthFirstAllColumnTreeSearch(
    tree: (AgColumn | AgColumnGroup)[] | null,
    useDisplayedChildren: boolean,
    callback: (treeNode: AgColumn | AgColumnGroup) => void
): void {
    if (!tree) {
        return;
    }

    for (let i = 0; i < tree.length; i++) {
        const child = tree[i];
        if (isColumnGroup(child)) {
            const childTree = useDisplayedChildren ? child.getDisplayedChildren() : child.getChildren();
            depthFirstAllColumnTreeSearch(childTree, useDisplayedChildren, callback);
        }
        callback(child);
    }
}

function pickDisplayedCols(tree: (AgColumn | AgColumnGroup)[]): AgColumn[] {
    const res: AgColumn[] = [];
    depthFirstAllColumnTreeSearch(tree, true, (child) => {
        if (isColumn(child)) {
            res.push(child);
        }
    });
    return res;
}
