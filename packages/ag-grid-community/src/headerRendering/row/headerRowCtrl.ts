import { setupCompBean } from '../../components/emptyBean';
import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';
import type { AgColumnGroup } from '../../entities/agColumnGroup';
import { _isDomLayout } from '../../gridOptionsUtils';
import type { BrandedType } from '../../interfaces/brandedType';
import type { ColumnPinnedType, HeaderColumnId } from '../../interfaces/iColumn';
import type { AbstractHeaderCellCtrl } from '../cells/abstractCell/abstractHeaderCellCtrl';
import { HeaderCellCtrl } from '../cells/column/headerCellCtrl';
import type { HeaderGroupCellCtrl } from '../cells/columnGroup/headerGroupCellCtrl';
import type { HeaderFilterCellCtrl } from '../cells/floatingFilter/headerFilterCellCtrl';
import { getColumnHeaderRowHeight, getFloatingFiltersHeight, getGroupRowsHeight } from '../headerUtils';
import type { HeaderRowType } from './headerRowComp';

export interface IHeaderRowComp {
    setTop(top: string): void;
    setHeight(height: string): void;
    setHeaderCtrls(ctrls: AbstractHeaderCellCtrl[], forceOrder: boolean, afterScroll: boolean): void;
    setWidth(width: string): void;
}

let instanceIdSequence = 0;
export type HeaderRowCtrlInstanceId = BrandedType<number, 'HeaderRowCtrlInstanceId'>;

export class HeaderRowCtrl extends BeanStub {
    public readonly instanceId: HeaderRowCtrlInstanceId = instanceIdSequence++ as HeaderRowCtrlInstanceId;

    private comp: IHeaderRowComp;
    private rowIndex: number;
    private pinned: ColumnPinnedType;
    private type: HeaderRowType;
    private headerRowClass: string;

    private headerCellCtrls: Map<HeaderColumnId, AbstractHeaderCellCtrl> | undefined;

    private isPrintLayout: boolean;
    private isEnsureDomOrder: boolean;

    constructor(rowIndex: number, pinned: ColumnPinnedType, type: HeaderRowType) {
        super();
        this.rowIndex = rowIndex;
        this.pinned = pinned;
        this.type = type;

        const typeClass =
            type == 'group'
                ? `ag-header-row-column-group`
                : type == 'filter'
                  ? `ag-header-row-column-filter`
                  : `ag-header-row-column`;
        this.headerRowClass = `ag-header-row ${typeClass}`;
    }

    public postConstruct(): void {
        this.isPrintLayout = _isDomLayout(this.gos, 'print');
        this.isEnsureDomOrder = this.gos.get('ensureDomOrder');
    }

    /** Checks that every header cell that is currently visible has been rendered.
     * Can only be false under some circumstances when using React
     */
    public areCellsRendered(): boolean {
        if (!this.comp) {
            return false;
        }
        return this.getHeaderCellCtrls().every((ctrl) => ctrl.getGui() != null);
    }

    /**
     *
     * @param comp Proxy to the actual component
     * @param initCompState Should the component be initialised with the current state of the controller. Default: true
     */
    public setComp(comp: IHeaderRowComp, compBean: BeanStub | undefined, initCompState: boolean = true): void {
        this.comp = comp;
        compBean = setupCompBean(this, this.beans.context, compBean);

        if (initCompState) {
            this.onRowHeightChanged();
            this.onVirtualColumnsChanged();
        }
        // width is managed directly regardless of framework and so is not included in initCompState
        this.setWidth();

        this.addEventListeners(compBean);
    }

    public getHeaderRowClass(): string {
        return this.headerRowClass;
    }
    public getAriaRowIndex(): number {
        return this.rowIndex + 1;
    }

    private addEventListeners(compBean: BeanStub): void {
        const onHeightChanged = this.onRowHeightChanged.bind(this);
        compBean.addManagedEventListeners({
            columnResized: this.onColumnResized.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            virtualColumnsChanged: (params) => this.onVirtualColumnsChanged(params.afterScroll),
            columnGroupHeaderHeightChanged: onHeightChanged,
            columnHeaderHeightChanged: onHeightChanged,
            gridStylesChanged: onHeightChanged,
            advancedFilterEnabledChanged: onHeightChanged,
        });

        // when print layout changes, it changes what columns are in what section
        compBean.addManagedPropertyListener('domLayout', this.onDisplayedColumnsChanged.bind(this));
        compBean.addManagedPropertyListener('ensureDomOrder', (e) => (this.isEnsureDomOrder = e.currentValue));

        compBean.addManagedPropertyListeners(
            [
                'headerHeight',
                'pivotHeaderHeight',
                'groupHeaderHeight',
                'pivotGroupHeaderHeight',
                'floatingFiltersHeight',
            ],
            onHeightChanged
        );
    }

    public getHeaderCellCtrl(column: AgColumn | AgColumnGroup): AbstractHeaderCellCtrl | undefined {
        if (!this.headerCellCtrls) {
            return;
        }
        for (const cellCtrl of this.headerCellCtrls.values()) {
            if (cellCtrl.getColumnGroupChild() === column) {
                return cellCtrl;
            }
        }
        return undefined;
    }

    private onDisplayedColumnsChanged(): void {
        this.isPrintLayout = _isDomLayout(this.gos, 'print');
        this.onVirtualColumnsChanged();
        this.setWidth();
        this.onRowHeightChanged();
    }

    public getType(): HeaderRowType {
        return this.type;
    }

    private onColumnResized(): void {
        this.setWidth();
    }

    private setWidth(): void {
        const width = this.getWidthForRow();
        this.comp.setWidth(`${width}px`);
    }

    private getWidthForRow(): number {
        const { visibleCols: presentedColsService } = this.beans;
        if (this.isPrintLayout) {
            const pinned = this.pinned != null;
            if (pinned) {
                return 0;
            }

            return (
                presentedColsService.getContainerWidth('right') +
                presentedColsService.getContainerWidth('left') +
                presentedColsService.getContainerWidth(null)
            );
        }

        // if not printing, just return the width as normal
        return presentedColsService.getContainerWidth(this.pinned);
    }

    private onRowHeightChanged(): void {
        const { topOffset, rowHeight } = this.getTopAndHeight();

        this.comp.setTop(topOffset + 'px');
        this.comp.setHeight(rowHeight + 'px');
    }

    public getTopAndHeight() {
        const { filterManager } = this.beans;
        const sizes: number[] = [];

        const groupHeadersHeight = getGroupRowsHeight(this.beans);
        const headerHeight = getColumnHeaderRowHeight(this.beans);

        sizes.push(...groupHeadersHeight);
        sizes.push(headerHeight);

        if (filterManager?.hasFloatingFilters()) {
            sizes.push(getFloatingFiltersHeight(this.beans) as number);
        }

        let topOffset = 0;

        for (let i = 0; i < this.rowIndex; i++) {
            topOffset += sizes[i];
        }

        const rowHeight = sizes[this.rowIndex];

        return { topOffset, rowHeight };
    }

    public getPinned(): ColumnPinnedType {
        return this.pinned;
    }

    public getRowIndex(): number {
        return this.rowIndex;
    }

    private onVirtualColumnsChanged(afterScroll: boolean = false): void {
        const ctrlsToDisplay = this.getHeaderCtrls();
        const forceOrder = this.isEnsureDomOrder || this.isPrintLayout;
        this.comp.setHeaderCtrls(ctrlsToDisplay, forceOrder, afterScroll);
    }

    public getHeaderCtrls() {
        const oldCtrls = this.headerCellCtrls;
        this.headerCellCtrls = new Map();
        const columns = this.getColumnsInViewport();

        for (const child of columns) {
            this.recycleAndCreateHeaderCtrls(child, oldCtrls);
        }

        // we want to keep columns that are focused, otherwise keyboard navigation breaks
        const isFocusedAndDisplayed = (ctrl: HeaderCellCtrl) => {
            const { focusSvc, visibleCols: visibleCols } = this.beans;

            const isFocused = focusSvc.isHeaderWrapperFocused(ctrl);
            if (!isFocused) {
                return false;
            }
            const isDisplayed = visibleCols.isVisible(ctrl.getColumnGroupChild());
            return isDisplayed;
        };

        if (oldCtrls) {
            for (const [id, oldCtrl] of oldCtrls) {
                const keepCtrl = isFocusedAndDisplayed(oldCtrl as HeaderCellCtrl);
                if (keepCtrl) {
                    this.headerCellCtrls.set(id, oldCtrl);
                } else {
                    this.destroyBean(oldCtrl);
                }
            }
        }

        return this.getHeaderCellCtrls();
    }

    private getHeaderCellCtrls(): AbstractHeaderCellCtrl[] {
        return Array.from(this.headerCellCtrls?.values() ?? []);
    }

    private recycleAndCreateHeaderCtrls(
        headerColumn: AgColumn | AgColumnGroup,
        oldCtrls?: Map<HeaderColumnId, AbstractHeaderCellCtrl>
    ): void {
        if (!this.headerCellCtrls) {
            return;
        }
        // skip groups that have no displayed children. this can happen when the group is broken,
        // and this section happens to have nothing to display for the open / closed state.
        // (a broken group is one that is split, ie columns in the group have a non-group column
        // in between them)
        if (headerColumn.isEmptyGroup()) {
            return;
        }

        const idOfChild = headerColumn.getUniqueId();

        // if we already have this cell rendered, do nothing
        let headerCtrl: AbstractHeaderCellCtrl | undefined;
        if (oldCtrls) {
            headerCtrl = oldCtrls.get(idOfChild);
            oldCtrls.delete(idOfChild);
        }

        // it's possible there is a new Column with the same ID, but it's for a different Column.
        // this is common with pivoting, where the pivot cols change, but the id's are still pivot_0,
        // pivot_1 etc. so if new col but same ID, need to remove the old col here first as we are
        // about to replace it in the this.headerComps map.
        const forOldColumn = headerCtrl && headerCtrl.getColumnGroupChild() != headerColumn;
        if (forOldColumn) {
            this.destroyBean(headerCtrl);
            headerCtrl = undefined;
        }

        if (headerCtrl == null) {
            switch (this.type) {
                case 'filter': {
                    headerCtrl = this.createBean(
                        this.beans.registry.createDynamicBean<HeaderFilterCellCtrl>(
                            'headerFilterCellCtrl',
                            headerColumn as AgColumn,
                            this
                        )!
                    );
                    break;
                }
                case 'group':
                    headerCtrl = this.createBean(
                        this.beans.registry.createDynamicBean<HeaderGroupCellCtrl>(
                            'headerGroupCellCtrl',
                            headerColumn as AgColumnGroup,
                            this
                        )!
                    );
                    break;
                default:
                    headerCtrl = this.createBean(new HeaderCellCtrl(headerColumn as AgColumn, this));
                    break;
            }
        }

        this.headerCellCtrls.set(idOfChild, headerCtrl);
    }

    private getColumnsInViewport(): (AgColumn | AgColumnGroup)[] {
        return this.isPrintLayout ? this.getColumnsInViewportPrintLayout() : this.getColumnsInViewportNormalLayout();
    }

    private getColumnsInViewportPrintLayout(): (AgColumn | AgColumnGroup)[] {
        // for print layout, we add all columns into the center
        if (this.pinned != null) {
            return [];
        }

        let viewportColumns: (AgColumn | AgColumnGroup)[] = [];
        const actualDepth = this.getActualDepth();
        const { colViewport } = this.beans;

        (['left', null, 'right'] as ColumnPinnedType[]).forEach((pinned) => {
            const items = colViewport.getHeadersToRender(pinned, actualDepth);
            viewportColumns = viewportColumns.concat(items);
        });

        return viewportColumns;
    }

    private getActualDepth(): number {
        return this.type == 'filter' ? this.rowIndex - 1 : this.rowIndex;
    }

    private getColumnsInViewportNormalLayout(): (AgColumn | AgColumnGroup)[] {
        // when in normal layout, we add the columns for that container only
        return this.beans.colViewport.getHeadersToRender(this.pinned, this.getActualDepth());
    }

    public findHeaderCellCtrl(
        column: AgColumn | AgColumnGroup | ((cellCtrl: AbstractHeaderCellCtrl) => boolean)
    ): AbstractHeaderCellCtrl | undefined {
        if (!this.headerCellCtrls) {
            return;
        }

        const allCtrls = this.getHeaderCellCtrls();
        let ctrl: AbstractHeaderCellCtrl | undefined;

        if (typeof column === 'function') {
            ctrl = allCtrls.find(column);
        } else {
            ctrl = allCtrls.find((ctrl) => ctrl.getColumnGroupChild() == column);
        }

        return ctrl;
    }

    public focusHeader(column: AgColumn | AgColumnGroup, event?: KeyboardEvent): boolean {
        const ctrl = this.findHeaderCellCtrl(column);

        if (!ctrl) {
            return false;
        }

        const focused = ctrl.focus(event);

        return focused;
    }

    public override destroy(): void {
        this.headerCellCtrls?.forEach((ctrl) => {
            this.destroyBean(ctrl);
        });
        this.headerCellCtrls = undefined;
        super.destroy();
    }
}
