import type { ColumnMoveService } from '../../columnMove/columnMoveService';
import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';
import { isColumn } from '../../entities/agColumn';
import type { AgColumnGroup } from '../../entities/agColumnGroup';
import type { FilterManager } from '../../filter/filterManager';
import type { FocusService } from '../../focusService';
import { CenterWidthFeature } from '../../gridBodyComp/centerWidthFeature';
import type { ScrollPartner } from '../../gridBodyComp/gridBodyScrollFeature';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import type { HeaderPosition } from '../../interfaces/iHeaderPosition';
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
    public comp: IHeaderRowContainerComp;
    public hidden: boolean = false;
    private includeFloatingFilter: boolean = false;

    private filtersRowCtrl: HeaderRowCtrl | undefined;
    private columnsRowCtrl: HeaderRowCtrl | undefined;
    private groupsRowCtrls: HeaderRowCtrl[] = [];
    public eViewport: HTMLElement;

    constructor(public readonly pinned: ColumnPinnedType) {
        super();
    }

    public setComp(comp: IHeaderRowContainerComp, eGui: HTMLElement): void {
        this.comp = comp;
        this.eViewport = eGui;

        const { pinnedCols, ctrlsSvc, colModel, colMoves, filterManager } = this.beans;

        this.setupCenterWidth();
        pinnedCols?.setupHeaderPinnedWidth(this);

        this.setupDragAndDrop(colMoves, this.eViewport);

        const onDisplayedColsChanged = this.onDisplayedColumnsChanged.bind(this, filterManager);
        this.addManagedEventListeners({
            gridColumnsChanged: this.onGridColumnsChanged.bind(this),
            displayedColumnsChanged: onDisplayedColsChanged,
            advancedFilterEnabledChanged: onDisplayedColsChanged,
        });

        const headerType = `${typeof this.pinned === 'string' ? this.pinned : 'center'}Header` as const;
        ctrlsSvc.register(headerType, this);

        if (colModel.ready) {
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
        const { focusSvc, colModel, filterManager } = this.beans;
        let sequence = 0;
        const focusedHeaderPosition = focusSvc.getFocusHeaderToUseAfterRefresh();

        const refreshColumnGroups = () => {
            const groupRowCount = getHeaderRowCount(colModel) - 1;

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
                (this.columnsRowCtrl == null || !keepColumns || this.columnsRowCtrl.rowIndex !== rowIndex);
            const shouldDestroyInstance = needNewInstance || this.hidden;

            if (shouldDestroyInstance) {
                this.columnsRowCtrl = this.destroyBean(this.columnsRowCtrl);
            }

            if (needNewInstance) {
                this.columnsRowCtrl = this.createBean(new HeaderRowCtrl(rowIndex, this.pinned, 'column'));
            }
        };

        const refreshFilters = () => {
            this.includeFloatingFilter = !!filterManager?.hasFloatingFilters() && !this.hidden;

            const destroyPreviousComp = () => {
                this.filtersRowCtrl = this.destroyBean(this.filtersRowCtrl);
            };

            if (!this.includeFloatingFilter) {
                destroyPreviousComp();
                return;
            }

            const rowIndex = sequence++;

            if (this.filtersRowCtrl) {
                const rowIndexMismatch = this.filtersRowCtrl.rowIndex !== rowIndex;
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

        this.restoreFocusOnHeader(focusSvc, focusedHeaderPosition);
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
        return this.getHeaderCtrlForColumn(column)?.eGui ?? null;
    }

    public getRowType(rowIndex: number): HeaderRowType | undefined {
        return this.getAllCtrls()[rowIndex]?.type;
    }

    public focusHeader(rowIndex: number, column: AgColumn | AgColumnGroup, event?: KeyboardEvent): boolean {
        const allCtrls = this.getAllCtrls();
        const ctrl = allCtrls[rowIndex];
        if (!ctrl) {
            return false;
        }

        return ctrl.focusHeader(column, event);
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
        this.addManagedElementListeners(this.eViewport, { scroll: fn });
    }

    public override destroy(): void {
        this.filtersRowCtrl = this.destroyBean(this.filtersRowCtrl);

        this.columnsRowCtrl = this.destroyBean(this.columnsRowCtrl);

        this.groupsRowCtrls = this.destroyBeans(this.groupsRowCtrls);

        super.destroy();
    }

    private setupDragAndDrop(colMoves: ColumnMoveService | undefined, dropContainer: HTMLElement): void {
        const bodyDropTarget = colMoves?.createBodyDropTarget(this.pinned, dropContainer);
        if (bodyDropTarget) {
            this.createManagedBean(bodyDropTarget);
        }
    }

    private restoreFocusOnHeader(focusSvc: FocusService, position: HeaderPosition | null): void {
        if (!position) {
            return;
        }

        const { column } = position;

        if ((column as AgColumn | AgColumnGroup).getPinned() != this.pinned) {
            return;
        }

        focusSvc.focusHeaderPosition({ headerPosition: position });
    }

    // grid cols have changed - this also means the number of rows in the header can have
    // changed. so we remove all the old rows and insert new ones for a complete refresh
    private onGridColumnsChanged() {
        this.refresh(true);
    }

    private onDisplayedColumnsChanged(filterManager: FilterManager): void {
        const includeFloatingFilter = !!filterManager?.hasFloatingFilters() && !this.hidden;
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
}
