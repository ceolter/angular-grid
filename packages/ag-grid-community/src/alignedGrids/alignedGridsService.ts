import type { GridApi } from '../api/gridApi';
import type { ColumnResizeService } from '../columnResize/columnResizeService';
import type { ColumnGroupService } from '../columns/columnGroups/columnGroupService';
import type { ColumnModel } from '../columns/columnModel';
import type { ColumnStateService } from '../columns/columnStateService';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type {
    AgEvent,
    AlignedGridColumnEvent,
    AlignedGridScrollEvent,
    BodyScrollEvent,
    ColumnEvent,
    ColumnGroupOpenedEvent,
    ColumnResizedEvent,
} from '../events';
import type { AlignedGrid } from '../interfaces/iAlignedGrid';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import { _error, _warn } from '../validation/logging';

export class AlignedGridsService extends BeanStub implements NamedBean {
    beanName = 'alignedGridsSvc' as const;

    private colModel: ColumnModel;
    private colResize?: ColumnResizeService;
    private ctrlsSvc: CtrlsService;
    private colState: ColumnStateService;
    private columnGroupSvc?: ColumnGroupService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.colResize = beans.colResize;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colState = beans.colState;
        this.columnGroupSvc = beans.columnGroupSvc;
    }

    // flag to mark if we are consuming. to avoid cyclic events (ie other grid firing back to master
    // while processing a master event) we mark this if consuming an event, and if we are, then
    // we don't fire back any events.
    private consuming = false;

    private getAlignedGridApis(): GridApi[] {
        let alignedGrids = this.gos.get('alignedGrids') ?? [];
        const isCallbackConfig = typeof alignedGrids === 'function';
        if (typeof alignedGrids === 'function') {
            alignedGrids = alignedGrids();
        }
        const apis = alignedGrids
            .map((alignedGrid) => {
                if (!alignedGrid) {
                    _error(18);
                    if (!isCallbackConfig) {
                        _error(20);
                    }
                    return;
                }
                if (this.isGridApi(alignedGrid)) {
                    return alignedGrid;
                }
                // Extract the GridApi from a ref or component
                const refOrComp = alignedGrid;
                if ('current' in refOrComp) {
                    return refOrComp.current?.api;
                }

                if (!refOrComp.api) {
                    _error(19);
                }
                return refOrComp.api;
            })
            .filter((api) => !!api && !api.isDestroyed());

        return apis as GridApi[];
    }

    private isGridApi(ref: AlignedGrid): ref is GridApi {
        return !!ref && !!(ref as GridApi).dispatchEvent;
    }

    public postConstruct(): void {
        const fireColumnEvent = this.fireColumnEvent.bind(this);
        this.addManagedEventListeners({
            columnMoved: fireColumnEvent,
            columnVisible: fireColumnEvent,
            columnPinned: fireColumnEvent,
            columnGroupOpened: fireColumnEvent,
            columnResized: fireColumnEvent,
            bodyScroll: this.fireScrollEvent.bind(this),
            alignedGridColumn: ({ event }) => this.onColumnEvent(event),
            alignedGridScroll: ({ event }) => this.onScrollEvent(event),
        });
    }

    // common logic across all the fire methods
    private fireEvent(event: WithoutGridCommon<AlignedGridColumnEvent | AlignedGridScrollEvent>): void {
        // if we are already consuming, then we are acting on an event from a master,
        // so we don't cause a cyclic firing of events
        if (this.consuming) {
            return;
        }

        this.getAlignedGridApis().forEach((api) => {
            if (api.isDestroyed()) {
                return;
            }
            api.dispatchEvent(event);
        });
    }

    // common logic across all consume methods. very little common logic, however extracting
    // guarantees consistency across the methods.
    private onEvent(callback: () => void): void {
        this.consuming = true;
        callback();
        this.consuming = false;
    }

    private fireColumnEvent(columnEvent: ColumnEvent | ColumnGroupOpenedEvent): void {
        this.fireEvent({
            type: 'alignedGridColumn',
            event: columnEvent,
        });
    }

    private fireScrollEvent(scrollEvent: BodyScrollEvent): void {
        if (scrollEvent.direction !== 'horizontal') {
            return;
        }
        this.fireEvent({
            type: 'alignedGridScroll',
            event: scrollEvent,
        });
    }

    private onScrollEvent(event: BodyScrollEvent): void {
        this.onEvent(() => {
            const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
            gridBodyCon.getScrollFeature().setHorizontalScrollPosition(event.left, true);
        });
    }

    private extractDataFromEvent<T extends AgColumn | string>(event: ColumnEvent, func: (col: AgColumn) => T): T[] {
        const result: T[] = [];
        if (event.columns) {
            event.columns.forEach((column: AgColumn) => {
                result.push(func(column));
            });
        } else if (event.column) {
            result.push(func(event.column as AgColumn));
        }
        return result;
    }

    public getMasterColumns(event: ColumnEvent): AgColumn[] {
        return this.extractDataFromEvent(event, (col) => col);
    }

    public getColumnIds(event: ColumnEvent): string[] {
        return this.extractDataFromEvent(event, (col) => col.getColId());
    }

    public onColumnEvent(event: AgEvent): void {
        this.onEvent(() => {
            switch (event.type) {
                case 'columnMoved':
                case 'columnVisible':
                case 'columnPinned':
                case 'columnResized': {
                    this.processColumnEvent(event as ColumnEvent);
                    break;
                }
                case 'columnGroupOpened': {
                    this.processGroupOpenedEvent(event as ColumnGroupOpenedEvent);
                    break;
                }
                case 'columnPivotChanged':
                    // we cannot support pivoting with aligned grids as the columns will be out of sync as the
                    // grids will have columns created based on the row data of the grid.
                    _warn(21);
                    break;
            }
        });
    }

    private processGroupOpenedEvent(groupOpenedEvent: ColumnGroupOpenedEvent): void {
        const { columnGroupSvc } = this;
        if (!columnGroupSvc) {
            return;
        }
        groupOpenedEvent.columnGroups.forEach((masterGroup) => {
            // likewise for column group
            let otherColumnGroup: AgProvidedColumnGroup | null = null;

            if (masterGroup) {
                otherColumnGroup = columnGroupSvc.getProvidedColGroup(masterGroup.getGroupId());
            }

            if (masterGroup && !otherColumnGroup) {
                return;
            }

            columnGroupSvc.setColumnGroupOpened(otherColumnGroup, masterGroup.isExpanded(), 'alignedGridChanged');
        });
    }

    private processColumnEvent(colEvent: ColumnEvent): void {
        // the column in the event is from the master grid. need to
        // look up the equivalent from this (other) grid
        const masterColumn = colEvent.column;
        let otherColumn: AgColumn | null = null;

        if (masterColumn) {
            otherColumn = this.colModel.getColDefCol(masterColumn.getColId());
        }
        // if event was with respect to a master column, that is not present in this
        // grid, then we ignore the event
        if (masterColumn && !otherColumn) {
            return;
        }

        // in time, all the methods below should use the column ids, it's a more generic way
        // of handling columns, and also allows for single or multi column events
        const masterColumns = this.getMasterColumns(colEvent);
        const { colState, colResize, ctrlsSvc } = this;
        switch (colEvent.type) {
            case 'columnMoved':
                // when the user moves columns via applyColumnState, we can't depend on moving specific columns
                // to an index, as there maybe be many indexes columns moved to (as wasn't result of a mouse drag).
                // so only way to be sure is match the order of all columns using Column State.
                {
                    const srcColState = colEvent.api.getColumnState();
                    const destColState = srcColState.map((s) => ({ colId: s.colId }));
                    colState.applyColumnState({ state: destColState, applyOrder: true }, 'alignedGridChanged');
                }
                break;
            case 'columnVisible':
                // when the user changes visibility via applyColumnState, we can't depend on visibility flag in event
                // as there maybe be mix of true/false (as wasn't result of a mouse click to set visiblity).
                // so only way to be sure is match the visibility of all columns using Column State.
                {
                    const srcColState = colEvent.api.getColumnState();
                    const destColState = srcColState.map((s) => ({ colId: s.colId, hide: s.hide }));
                    colState.applyColumnState({ state: destColState }, 'alignedGridChanged');
                }
                break;
            case 'columnPinned':
                {
                    const srcColState = colEvent.api.getColumnState();
                    const destColState = srcColState.map((s) => ({ colId: s.colId, pinned: s.pinned }));
                    colState.applyColumnState({ state: destColState }, 'alignedGridChanged');
                }
                break;
            case 'columnResized': {
                const resizedEvent = colEvent as ColumnResizedEvent;

                const columnWidths: {
                    [key: string]: {
                        key: string | AgColumn;
                        newWidth: number;
                    };
                } = {};
                masterColumns.forEach((column) => {
                    columnWidths[column.getId()] = { key: column.getColId(), newWidth: column.getActualWidth() };
                });
                // don't set flex columns width
                resizedEvent.flexColumns?.forEach((col) => {
                    if (columnWidths[col.getId()]) {
                        delete columnWidths[col.getId()];
                    }
                });
                colResize?.setColumnWidths(
                    Object.values(columnWidths),
                    false,
                    resizedEvent.finished,
                    'alignedGridChanged'
                );
                break;
            }
        }
        const gridBodyCon = ctrlsSvc.getGridBodyCtrl();
        const isVerticalScrollShowing = gridBodyCon.isVerticalScrollShowing();
        this.getAlignedGridApis().forEach((api) => {
            api.setGridOption('alwaysShowVerticalScroll', isVerticalScrollShowing);
        });
    }
}
