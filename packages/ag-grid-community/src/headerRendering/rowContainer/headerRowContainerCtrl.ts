import type { ColumnMoveService } from '../../columnMove/columnMoveService';
import type { ColumnModel } from '../../columns/columnModel';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { AgColumn } from '../../entities/agColumn';
import { isColumn } from '../../entities/agColumn';
import type { AgColumnGroup } from '../../entities/agColumnGroup';
import type { FilterManager } from '../../filter/filterManager';
import type { FocusService } from '../../focusService';
import { CenterWidthFeature } from '../../gridBodyComp/centerWidthFeature';
import type { ScrollPartner } from '../../gridBodyComp/gridBodyScrollFeature';
import type { ScrollVisibleService } from '../../gridBodyComp/scrollVisibleService';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import type { HeaderPosition } from '../../interfaces/iHeaderPosition';
import type { PinnedColumnService } from '../../pinnedColumns/pinnedColumnService';
import type { AbstractHeaderCellCtrl } from '../cells/abstractCell/abstractHeaderCellCtrl';
import { getHeaderRowCount } from '../headerUtils';
import type { HeaderRowType } from '../row/headerRowComp';
import { HeaderRowCtrl } from '../row/headerRowCtrl';

export interface IHeaderRowContainerComp {
    setCenterWidth(width: string): void;
    setViewportScrollLeft(left: number): void;
    setPinnedContainerWidth(width: string): void;
    setDisplayed(displayed: boolean): void;
    setCtrls(ctrls: HeaderRowCtrl[]): void;
}

export class HeaderRowContainerCtrl extends BeanStub implements ScrollPartner {
    private ctrlsSvc: CtrlsService;
    private scrollVisibleSvc: ScrollVisibleService;
    private pinnedCols?: PinnedColumnService;
    private colModel: ColumnModel;
    private focusSvc: FocusService;
    private filterManager?: FilterManager;
    private colMoves?: ColumnMoveService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
        this.pinnedCols = beans.pinnedCols;
        this.colModel = beans.colModel;
        this.focusSvc = beans.focusSvc;
        this.filterManager = beans.filterManager;
        this.colMoves = beans.colMoves;
    }

    private pinned: ColumnPinnedType;
    private comp: IHeaderRowContainerComp;
    private hidden: boolean = false;
    private includeFloatingFilter: boolean = false;

    private filtersRowCtrl: HeaderRowCtrl | undefined;
    private columnsRowCtrl: HeaderRowCtrl | undefined;
    private groupsRowCtrls: HeaderRowCtrl[] = [];
    private eViewport: HTMLElement;

    constructor(pinned: ColumnPinnedType) {
        super();
        this.pinned = pinned;
    }

    public setComp(comp: IHeaderRowContainerComp, eGui: HTMLElement): void {
        this.comp = comp;
        this.eViewport = eGui;

        this.setupCenterWidth();
        this.setupPinnedWidth();

        this.setupDragAndDrop(this.eViewport);

        const onDisplayedColsChanged = this.onDisplayedColumnsChanged.bind(this);
        this.addManagedEventListeners({
            gridColumnsChanged: this.onGridColumnsChanged.bind(this),
            displayedColumnsChanged: onDisplayedColsChanged,
            advancedFilterEnabledChanged: onDisplayedColsChanged,
        });

        const headerType = `${typeof this.pinned === 'string' ? this.pinned : 'center'}Header` as const;
        this.ctrlsSvc.register(headerType, this);

        if (this.colModel.ready) {
            this.refresh();
        }
    }

    public getAllCtrls(): HeaderRowCtrl[] {
        const res: HeaderRowCtrl[] = [...this.groupsRowCtrls];

        if (this.columnsRowCtrl) {
            res.push(this.columnsRowCtrl);
        }

        if (this.filtersRowCtrl) {
            res.push(this.filtersRowCtrl);
        }

        return res;
    }

    public refresh(keepColumns = false): void {
        let sequence = 0;
        const focusedHeaderPosition = this.focusSvc.getFocusHeaderToUseAfterRefresh();

        const refreshColumnGroups = () => {
            const groupRowCount = getHeaderRowCount(this.colModel) - 1;

            this.groupsRowCtrls = this.destroyBeans(this.groupsRowCtrls);

            for (let i = 0; i < groupRowCount; i++) {
                const ctrl = this.createBean(new HeaderRowCtrl(sequence++, this.pinned, 'group'));
                this.groupsRowCtrls.push(ctrl);
            }
        };

        const refreshColumns = () => {
            const rowIndex = sequence++;

            const needNewInstance =
                !this.hidden &&
                (this.columnsRowCtrl == null || !keepColumns || this.columnsRowCtrl.getRowIndex() !== rowIndex);
            const shouldDestroyInstance = needNewInstance || this.hidden;

            if (shouldDestroyInstance) {
                this.columnsRowCtrl = this.destroyBean(this.columnsRowCtrl);
            }

            if (needNewInstance) {
                this.columnsRowCtrl = this.createBean(new HeaderRowCtrl(rowIndex, this.pinned, 'column'));
            }
        };

        const refreshFilters = () => {
            this.includeFloatingFilter = !!this.filterManager?.hasFloatingFilters() && !this.hidden;

            const destroyPreviousComp = () => {
                this.filtersRowCtrl = this.destroyBean(this.filtersRowCtrl);
            };

            if (!this.includeFloatingFilter) {
                destroyPreviousComp();
                return;
            }

            const rowIndex = sequence++;

            if (this.filtersRowCtrl) {
                const rowIndexMismatch = this.filtersRowCtrl.getRowIndex() !== rowIndex;
                if (!keepColumns || rowIndexMismatch) {
                    destroyPreviousComp();
                }
            }

            if (!this.filtersRowCtrl) {
                this.filtersRowCtrl = this.createBean(new HeaderRowCtrl(rowIndex, this.pinned, 'filter'));
            }
        };

        refreshColumnGroups();
        refreshColumns();
        refreshFilters();

        const allCtrls = this.getAllCtrls();
        this.comp.setCtrls(allCtrls);

        this.restoreFocusOnHeader(focusedHeaderPosition);
    }

    public getHeaderCtrlForColumn(column: AgColumn | AgColumnGroup): AbstractHeaderCellCtrl | undefined {
        if (isColumn(column)) {
            return this.columnsRowCtrl?.getHeaderCellCtrl(column);
        }

        if (this.groupsRowCtrls.length === 0) {
            return;
        }

        for (let i = 0; i < this.groupsRowCtrls.length; i++) {
            const ctrl = this.groupsRowCtrls[i].getHeaderCellCtrl(column);

            if (ctrl) {
                return ctrl;
            }
        }
    }

    public getHtmlElementForColumnHeader(column: AgColumn | AgColumnGroup): HTMLElement | null {
        const cellCtrl = this.getHeaderCtrlForColumn(column);

        if (!cellCtrl) {
            return null;
        }

        return cellCtrl.getGui();
    }

    public getRowType(rowIndex: number): HeaderRowType | undefined {
        const allCtrls = this.getAllCtrls();
        const ctrl = allCtrls[rowIndex];
        return ctrl ? ctrl.getType() : undefined;
    }

    public focusHeader(rowIndex: number, column: AgColumn | AgColumnGroup, event?: KeyboardEvent): boolean {
        const allCtrls = this.getAllCtrls();
        const ctrl = allCtrls[rowIndex];
        if (!ctrl) {
            return false;
        }

        return ctrl.focusHeader(column, event);
    }

    public getViewportElement(): HTMLElement {
        return this.eViewport;
    }

    public getGroupRowCount(): number {
        return this.groupsRowCtrls.length;
    }

    public getGroupRowCtrlAtIndex(index: number): HeaderRowCtrl {
        return this.groupsRowCtrls[index];
    }

    public getRowCount(): number {
        return this.groupsRowCtrls.length + (this.columnsRowCtrl ? 1 : 0) + (this.filtersRowCtrl ? 1 : 0);
    }

    public setHorizontalScroll(offset: number): void {
        this.comp.setViewportScrollLeft(offset);
    }

    public onScrollCallback(fn: () => void): void {
        this.addManagedElementListeners(this.getViewportElement(), { scroll: fn });
    }

    public override destroy(): void {
        if (this.filtersRowCtrl) {
            this.filtersRowCtrl = this.destroyBean(this.filtersRowCtrl);
        }

        if (this.columnsRowCtrl) {
            this.columnsRowCtrl = this.destroyBean(this.columnsRowCtrl);
        }

        if (this.groupsRowCtrls && this.groupsRowCtrls.length) {
            this.groupsRowCtrls = this.destroyBeans(this.groupsRowCtrls);
        }

        super.destroy();
    }

    private setupDragAndDrop(dropContainer: HTMLElement): void {
        const bodyDropTarget = this.colMoves?.createBodyDropTarget(this.pinned, dropContainer);
        if (bodyDropTarget) {
            this.createManagedBean(bodyDropTarget);
        }
    }

    private restoreFocusOnHeader(position: HeaderPosition | null): void {
        if (!position) {
            return;
        }

        const { column } = position;

        if ((column as AgColumn | AgColumnGroup).getPinned() != this.pinned) {
            return;
        }

        this.focusSvc.focusHeaderPosition({ headerPosition: position });
    }

    // grid cols have changed - this also means the number of rows in the header can have
    // changed. so we remove all the old rows and insert new ones for a complete refresh
    private onGridColumnsChanged() {
        this.refresh(true);
    }

    private onDisplayedColumnsChanged(): void {
        const includeFloatingFilter = this.filterManager?.hasFloatingFilters() && !this.hidden;
        if (this.includeFloatingFilter !== includeFloatingFilter) {
            this.refresh(true);
        }
    }

    private setupCenterWidth(): void {
        if (this.pinned != null) {
            return;
        }

        this.createManagedBean(new CenterWidthFeature((width) => this.comp.setCenterWidth(`${width}px`), true));
    }

    private setupPinnedWidth(): void {
        if (this.pinned == null || !this.pinnedCols) {
            return;
        }

        const pinningLeft = this.pinned === 'left';
        const pinningRight = this.pinned === 'right';

        this.hidden = true;

        const listener = () => {
            const width = pinningLeft ? this.pinnedCols!.getPinnedLeftWidth() : this.pinnedCols!.getPinnedRightWidth();
            if (width == null) {
                return;
            } // can happen at initialisation, width not yet set

            const hidden = width == 0;
            const hiddenChanged = this.hidden !== hidden;
            const isRtl = this.gos.get('enableRtl');
            const scrollbarWidth = this.scrollVisibleSvc.getScrollbarWidth();

            // if there is a scroll showing (and taking up space, so Windows, and not iOS)
            // in the body, then we add extra space to keep header aligned with the body,
            // as body width fits the cols and the scrollbar
            const addPaddingForScrollbar =
                this.scrollVisibleSvc.isVerticalScrollShowing() && ((isRtl && pinningLeft) || (!isRtl && pinningRight));
            const widthWithPadding = addPaddingForScrollbar ? width + scrollbarWidth : width;

            this.comp.setPinnedContainerWidth(`${widthWithPadding}px`);
            this.comp.setDisplayed(!hidden);

            if (hiddenChanged) {
                this.hidden = hidden;
                this.refresh();
            }
        };

        this.addManagedEventListeners({
            leftPinnedWidthChanged: listener,
            rightPinnedWidthChanged: listener,
            scrollVisibilityChanged: listener,
            scrollbarWidthChanged: listener,
        });
    }
}
