import type { ColumnGroupService } from '../../columns/columnGroups/columnGroupService';
import type { ColumnModel } from '../../columns/columnModel';
import type { ColumnState, ColumnStateParams, ColumnStateService } from '../../columns/columnStateService';
import type { VisibleColsService } from '../../columns/visibleColsService';
import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { AgColumn } from '../../entities/agColumn';
import type { FilterManager } from '../../filter/filterManager';
import type { FocusService } from '../../focusService';
import { _isCellSelectionEnabled, _isClientSideRowModel } from '../../gridOptionsUtils';
import type { CellRange, IRangeService } from '../../interfaces/IRangeService';
import type {
    AggregationColumnState,
    AggregationState,
    CellSelectionState,
    ColumnGroupState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizeState,
    ColumnSizingState,
    ColumnVisibilityState,
    FilterState,
    FocusedCellState,
    GridState,
    PaginationState,
    PivotState,
    RowGroupExpansionState,
    RowGroupState,
    ScrollState,
    SideBarState,
    SortState,
} from '../../interfaces/gridState';
import type { IExpansionService } from '../../interfaces/iExpansionService';
import type { FilterModel } from '../../interfaces/iFilter';
import type { IPivotResultColsService } from '../../interfaces/iPivotResultColsService';
import type { IRowModel } from '../../interfaces/iRowModel';
import type { ISelectionService } from '../../interfaces/iSelectionService';
import type { ISideBarService } from '../../interfaces/iSideBar';
import type { SortModelItem } from '../../interfaces/iSortModelItem';
import type { ServerSideRowGroupSelectionState, ServerSideRowSelectionState } from '../../interfaces/selectionState';
import type { PaginationService } from '../../pagination/paginationService';
import type { ColumnAnimationService } from '../../rendering/columnAnimationService';
import { _debounce } from '../../utils/function';
import { _jsonEquals } from '../../utils/generic';
import { VERSION } from '../../version';
import { migrateGridStateModel } from './stateModelMigration';

export class StateService extends BeanStub implements NamedBean {
    beanName = 'stateSvc' as const;

    private filterManager?: FilterManager;
    private ctrlsSvc: CtrlsService;
    private pivotResultCols?: IPivotResultColsService;
    private focusSvc: FocusService;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private pagination?: PaginationService;
    private selectionSvc?: ISelectionService;
    private expansionSvc?: IExpansionService;
    private colAnimation?: ColumnAnimationService;
    private colState: ColumnStateService;
    private sideBar?: ISideBarService;
    private rangeSvc?: IRangeService;
    private rowModel: IRowModel;
    private columnGroupSvc?: ColumnGroupService;
    private updateRowGroupExpansionStateTimer: ReturnType<typeof setTimeout> | number = 0;

    public wireBeans(beans: BeanCollection): void {
        this.filterManager = beans.filterManager;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pivotResultCols = beans.pivotResultCols;
        this.focusSvc = beans.focusSvc;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.pagination = beans.pagination;
        this.selectionSvc = beans.selectionSvc;
        this.expansionSvc = beans.expansionSvc;
        this.colAnimation = beans.colAnimation;
        this.colState = beans.colState;
        this.sideBar = beans.sideBar;
        this.rangeSvc = beans.rangeSvc;
        this.rowModel = beans.rowModel;
        this.columnGroupSvc = beans.columnGroupSvc;
    }

    private isClientSideRowModel: boolean;
    private cachedState: GridState;
    private suppressEvents = true;
    private queuedUpdateSources: Set<keyof GridState | 'gridInitializing'> = new Set();
    private dispatchStateUpdateEventDebounced = _debounce(this, () => this.dispatchQueuedStateUpdateEvents(), 0);
    // If user is doing a manual expand all node by node, we don't want to process one at a time.
    // EVENT_ROW_GROUP_OPENED is already async, so no impact of making the state async here.
    private onRowGroupOpenedDebounced = _debounce(
        this,
        () => {
            this.updateCachedState('rowGroupExpansion', this.getRowGroupExpansionState());
        },
        0
    );
    // similar to row expansion, want to debounce. However, selection is synchronous, so need to mark as stale in case `getState` is called.
    private onRowSelectedDebounced = _debounce(
        this,
        () => {
            this.staleStateKeys.delete('rowSelection');
            this.updateCachedState('rowSelection', this.getRowSelectionState());
        },
        0
    );
    private columnStates?: ColumnState[];
    private columnGroupStates?: { groupId: string; open: boolean | undefined }[];
    private staleStateKeys: Set<keyof GridState> = new Set();

    public postConstruct(): void {
        this.isClientSideRowModel = _isClientSideRowModel(this.gos);

        this.cachedState = this.getInitialState();
        this.setCachedStateValue('version', VERSION);

        this.ctrlsSvc.whenReady(this, () =>
            this.suppressEventsAndDispatchInitEvent(() => this.setupStateOnGridReady())
        );

        const [newColumnsLoadedDestroyFunc, rowCountReadyDestroyFunc, firstDataRenderedDestroyFunc] =
            this.addManagedEventListeners({
                newColumnsLoaded: ({ source }) => {
                    if (source === 'gridInitializing') {
                        newColumnsLoadedDestroyFunc();
                        this.suppressEventsAndDispatchInitEvent(() => this.setupStateOnColumnsInitialised());
                    }
                },
                rowCountReady: () => {
                    rowCountReadyDestroyFunc?.();
                    this.suppressEventsAndDispatchInitEvent(() => this.setupStateOnRowCountReady());
                },
                firstDataRendered: () => {
                    firstDataRenderedDestroyFunc?.();
                    this.suppressEventsAndDispatchInitEvent(() => this.setupStateOnFirstDataRendered());
                },
            });
    }

    public override destroy(): void {
        super.destroy();

        // Release memory
        clearTimeout(this.updateRowGroupExpansionStateTimer);
        this.queuedUpdateSources.clear();
    }

    private getInitialState(): GridState {
        return migrateGridStateModel(this.gos.get('initialState') ?? {});
    }

    public getState(): GridState {
        if (this.staleStateKeys.size) {
            this.refreshStaleState();
        }
        return this.cachedState;
    }

    private setupStateOnGridReady(): void {
        // sidebar reads the initial state itself, so don't need to set

        this.updateCachedState('sideBar', this.getSideBarState());
        const stateUpdater = () => this.updateCachedState('sideBar', this.getSideBarState());
        this.addManagedEventListeners({
            toolPanelVisibleChanged: stateUpdater,
            sideBarUpdated: stateUpdater,
        });
    }

    private setupStateOnColumnsInitialised(): void {
        const initialState = this.getInitialState();
        this.setColumnState(initialState);
        this.setColumnGroupState(initialState);

        this.updateColumnState([
            'aggregation',
            'columnOrder',
            'columnPinning',
            'columnSizing',
            'columnVisibility',
            'pivot',
            'pivot',
            'rowGroup',
            'sort',
        ]);
        this.updateCachedState('columnGroup', this.getColumnGroupState());

        const onUpdate = (state: keyof GridState) => () => this.updateColumnState([state]);
        this.addManagedEventListeners({
            columnValueChanged: onUpdate('aggregation'),
            columnMoved: onUpdate('columnOrder'),
            columnPinned: onUpdate('columnPinning'),
            columnResized: onUpdate('columnSizing'),
            columnVisible: onUpdate('columnVisibility'),
            columnPivotChanged: onUpdate('pivot'),
            columnPivotModeChanged: onUpdate('pivot'),
            columnRowGroupChanged: onUpdate('rowGroup'),
            sortChanged: onUpdate('sort'),
            newColumnsLoaded: () =>
                this.updateColumnState([
                    'aggregation',
                    'columnOrder',
                    'columnPinning',
                    'columnSizing',
                    'columnVisibility',
                    'pivot',
                    'rowGroup',
                    'sort',
                ]),
            columnGroupOpened: () => this.updateCachedState('columnGroup', this.getColumnGroupState()),
        });
    }

    private setupStateOnRowCountReady(): void {
        const {
            filter: filterState,
            rowGroupExpansion: rowGroupExpansionState,
            rowSelection: rowSelectionState,
            pagination: paginationState,
        } = this.getInitialState();
        if (filterState) {
            this.setFilterState(filterState);
        }
        if (rowGroupExpansionState) {
            this.setRowGroupExpansionState(rowGroupExpansionState);
        }
        if (rowSelectionState) {
            this.setRowSelectionState(rowSelectionState);
        }
        if (paginationState) {
            this.setPaginationState(paginationState);
        }

        this.updateCachedState('filter', this.getFilterState());
        this.updateCachedState('rowGroupExpansion', this.getRowGroupExpansionState());
        this.updateCachedState('rowSelection', this.getRowSelectionState());
        this.updateCachedState('pagination', this.getPaginationState());

        const updateRowGroupExpansionState = () => {
            this.updateRowGroupExpansionStateTimer = 0;
            this.updateCachedState('rowGroupExpansion', this.getRowGroupExpansionState());
        };

        this.addManagedEventListeners({
            filterChanged: () => this.updateCachedState('filter', this.getFilterState()),
            rowGroupOpened: () => this.onRowGroupOpenedDebounced(),
            expandOrCollapseAll: updateRowGroupExpansionState,
            // `groupDefaultExpanded` updates expansion state without an expansion event
            columnRowGroupChanged: updateRowGroupExpansionState,
            rowDataUpdated: () => {
                if (this.gos.get('groupDefaultExpanded') !== 0) {
                    // once rows are loaded, they may be expanded, start the timer only once
                    this.updateRowGroupExpansionStateTimer ||= setTimeout(updateRowGroupExpansionState);
                }
            },
            selectionChanged: () => {
                this.staleStateKeys.add('rowSelection');
                this.onRowSelectedDebounced();
            },
            paginationChanged: (event) => {
                if (event.newPage || event.newPageSize) {
                    this.updateCachedState('pagination', this.getPaginationState());
                }
            },
        });
    }

    private setupStateOnFirstDataRendered(): void {
        const {
            scroll: scrollState,
            cellSelection: cellSelectionState,
            focusedCell: focusedCellState,
            columnOrder: columnOrderState,
        } = this.getInitialState();
        if (focusedCellState) {
            this.setFocusedCellState(focusedCellState);
        }
        if (cellSelectionState) {
            this.setCellSelectionState(cellSelectionState);
        }
        if (scrollState) {
            this.setScrollState(scrollState);
        }
        this.setColumnPivotState(!!columnOrderState?.orderedColIds);

        // reset sidebar as it could have updated when columns changed
        this.updateCachedState('sideBar', this.getSideBarState());
        this.updateCachedState('focusedCell', this.getFocusedCellState());
        const cellSelection = this.getRangeSelectionState();
        this.updateCachedState('rangeSelection', cellSelection);
        this.updateCachedState('cellSelection', cellSelection);
        this.updateCachedState('scroll', this.getScrollState());

        this.addManagedEventListeners({
            cellFocused: () => this.updateCachedState('focusedCell', this.getFocusedCellState()),
            cellSelectionChanged: (event) => {
                if (event.finished) {
                    const cellSelection = this.getRangeSelectionState();
                    this.updateCachedState('rangeSelection', cellSelection);
                    this.updateCachedState('cellSelection', cellSelection);
                }
            },
            bodyScrollEnd: () => this.updateCachedState('scroll', this.getScrollState()),
        });
    }

    private getColumnState(): {
        sort?: SortState;
        rowGroup?: RowGroupState;
        aggregation?: AggregationState;
        pivot?: PivotState;
        columnPinning?: ColumnPinningState;
        columnVisibility?: ColumnVisibilityState;
        columnSizing?: ColumnSizingState;
        columnOrder?: ColumnOrderState;
    } {
        const pivotMode = this.colModel.isPivotMode();
        const sortColumns: SortModelItem[] = [];
        const groupColIds: string[] = [];
        const aggregationColumns: AggregationColumnState[] = [];
        const pivotColIds: string[] = [];
        const leftColIds: string[] = [];
        const rightColIds: string[] = [];
        const hiddenColIds: string[] = [];
        const columnSizes: ColumnSizeState[] = [];
        const columns: string[] = [];

        let defaultSortIndex = 0;
        const columnState = this.colState.getColumnState();
        for (let i = 0; i < columnState.length; i++) {
            const {
                colId,
                sort,
                sortIndex,
                rowGroup,
                rowGroupIndex,
                aggFunc,
                pivot,
                pivotIndex,
                pinned,
                hide,
                width,
                flex,
            } = columnState[i];
            columns.push(colId);
            if (sort) {
                sortColumns[sortIndex ?? defaultSortIndex++] = { colId, sort };
            }
            if (rowGroup) {
                groupColIds[rowGroupIndex ?? 0] = colId;
            }
            if (typeof aggFunc === 'string') {
                aggregationColumns.push({ colId, aggFunc });
            }
            if (pivot) {
                pivotColIds[pivotIndex ?? 0] = colId;
            }
            if (pinned) {
                (pinned === 'right' ? rightColIds : leftColIds).push(colId);
            }
            if (hide) {
                hiddenColIds.push(colId);
            }
            if (flex || width) {
                columnSizes.push({ colId, flex: flex ?? undefined, width });
            }
        }

        return {
            sort: sortColumns.length ? { sortModel: sortColumns } : undefined,
            rowGroup: groupColIds.length ? { groupColIds } : undefined,
            aggregation: aggregationColumns.length ? { aggregationModel: aggregationColumns } : undefined,
            pivot: pivotColIds.length || pivotMode ? { pivotMode, pivotColIds } : undefined,
            columnPinning: leftColIds.length || rightColIds.length ? { leftColIds, rightColIds } : undefined,
            columnVisibility: hiddenColIds.length ? { hiddenColIds } : undefined,
            columnSizing: columnSizes.length ? { columnSizingModel: columnSizes } : undefined,
            columnOrder: columns.length ? { orderedColIds: columns } : undefined,
        };
    }

    private setColumnState(initialState: GridState): void {
        const {
            sort: sortState,
            rowGroup: groupState,
            aggregation: aggregationState,
            pivot: pivotState,
            columnPinning: columnPinningState,
            columnVisibility: columnVisibilityState,
            columnSizing: columnSizingState,
            columnOrder: columnOrderState,
            partialColumnState,
        } = initialState;
        const columnStateMap: { [colId: string]: ColumnState } = {};
        const getColumnState = (colId: string) => {
            let columnState = columnStateMap[colId];
            if (columnState) {
                return columnState;
            }
            columnState = { colId };
            columnStateMap[colId] = columnState;
            return columnState;
        };
        // for partial state we don't want to override default
        const defaultState: ColumnStateParams = partialColumnState
            ? {}
            : {
                  sort: null,
                  sortIndex: null,
                  rowGroup: null,
                  rowGroupIndex: null,
                  aggFunc: null,
                  pivot: null,
                  pivotIndex: null,
                  pinned: null,
                  hide: null,
                  flex: null,
              };
        if (sortState) {
            sortState.sortModel.forEach(({ colId, sort }, sortIndex) => {
                const columnState = getColumnState(colId);
                columnState.sort = sort;
                columnState.sortIndex = sortIndex;
            });
            defaultState.sort = null;
            defaultState.sortIndex = null;
        }
        if (groupState) {
            groupState.groupColIds.forEach((colId, rowGroupIndex) => {
                const columnState = getColumnState(colId);
                columnState.rowGroup = true;
                columnState.rowGroupIndex = rowGroupIndex;
            });
            defaultState.rowGroup = null;
            defaultState.rowGroupIndex = null;
        }
        if (aggregationState) {
            aggregationState.aggregationModel.forEach(({ colId, aggFunc }) => {
                getColumnState(colId).aggFunc = aggFunc;
            });
            defaultState.aggFunc = null;
        }
        if (pivotState) {
            pivotState.pivotColIds.forEach((colId, pivotIndex) => {
                const columnState = getColumnState(colId);
                columnState.pivot = true;
                columnState.pivotIndex = pivotIndex;
            });
            this.gos.updateGridOptions({
                options: { pivotMode: pivotState.pivotMode },
                source: 'gridInitializing' as any,
            });
            defaultState.pivot = null;
            defaultState.pivotIndex = null;
        }
        if (columnPinningState) {
            columnPinningState.leftColIds.forEach((colId) => {
                getColumnState(colId).pinned = 'left';
            });
            columnPinningState.rightColIds.forEach((colId) => {
                getColumnState(colId).pinned = 'right';
            });
            defaultState.pinned = null;
        }
        if (columnVisibilityState) {
            columnVisibilityState.hiddenColIds.forEach((colId) => {
                getColumnState(colId).hide = true;
            });
            defaultState.hide = null;
        }
        if (columnSizingState) {
            columnSizingState.columnSizingModel.forEach(({ colId, flex, width }) => {
                const columnState = getColumnState(colId);
                columnState.flex = flex ?? null;
                columnState.width = width;
            });
            defaultState.flex = null;
        }
        const columns = columnOrderState?.orderedColIds;
        const applyOrder = !!columns?.length;
        const columnStates = applyOrder ? columns.map((colId) => getColumnState(colId)) : Object.values(columnStateMap);

        if (columnStates.length) {
            this.columnStates = columnStates;
            this.colState.applyColumnState(
                {
                    state: columnStates,
                    applyOrder,
                    defaultState,
                },
                'gridInitializing'
            );
        }
    }

    private setColumnPivotState(applyOrder: boolean): void {
        const columnStates = this.columnStates;
        this.columnStates = undefined;
        const columnGroupStates = this.columnGroupStates;
        this.columnGroupStates = undefined;

        if (!this.pivotResultCols?.isPivotResultColsPresent()) {
            return;
        }

        if (columnStates) {
            const secondaryColumnStates: ColumnState[] = [];
            for (const columnState of columnStates) {
                if (this.pivotResultCols.getPivotResultCol(columnState.colId)) {
                    secondaryColumnStates.push(columnState);
                }
            }

            this.colState.applyColumnState(
                {
                    state: secondaryColumnStates,
                    applyOrder,
                },
                'gridInitializing'
            );
        }

        if (columnGroupStates) {
            // no easy/performant way of knowing which column groups are pivot column groups
            this.columnGroupSvc?.setColumnGroupState(columnGroupStates, 'gridInitializing');
        }
    }

    private getColumnGroupState(): ColumnGroupState | undefined {
        if (!this.columnGroupSvc) {
            return undefined;
        }
        const columnGroupState = this.columnGroupSvc.getColumnGroupState();
        const openColumnGroups: string[] = [];
        columnGroupState.forEach(({ groupId, open }) => {
            if (open) {
                openColumnGroups.push(groupId);
            }
        });
        return openColumnGroups.length ? { openColumnGroupIds: openColumnGroups } : undefined;
    }

    private setColumnGroupState(initialState: GridState): void {
        if (!Object.prototype.hasOwnProperty.call(initialState, 'columnGroup') || !this.columnGroupSvc) {
            return;
        }

        const openColumnGroups = new Set(initialState.columnGroup?.openColumnGroupIds);
        const existingColumnGroupState = this.columnGroupSvc.getColumnGroupState();
        const stateItems = existingColumnGroupState.map(({ groupId }) => {
            const open = openColumnGroups.has(groupId);
            if (open) {
                openColumnGroups.delete(groupId);
            }
            return {
                groupId,
                open,
            };
        });
        // probably pivot cols
        openColumnGroups.forEach((groupId) => {
            stateItems.push({
                groupId,
                open: true,
            });
        });
        if (stateItems.length) {
            this.columnGroupStates = stateItems;
        }
        this.columnGroupSvc.setColumnGroupState(stateItems, 'gridInitializing');
    }

    private getFilterState(): FilterState | undefined {
        let filterModel: FilterModel | undefined = this.filterManager?.getFilterModel();
        if (filterModel && Object.keys(filterModel).length === 0) {
            filterModel = undefined;
        }
        const advancedFilterModel = this.filterManager?.getAdvancedFilterModel() ?? undefined;
        return filterModel || advancedFilterModel ? { filterModel, advancedFilterModel } : undefined;
    }

    private setFilterState(filterState?: FilterState): void {
        const { filterModel, advancedFilterModel } = filterState ?? {};
        if (filterModel) {
            this.filterManager?.setFilterModel(filterModel, 'columnFilter');
        }
        if (advancedFilterModel) {
            this.filterManager?.setAdvancedFilterModel(advancedFilterModel);
        }
    }

    private getRangeSelectionState(): CellSelectionState | undefined {
        const cellRanges = this.rangeSvc?.getCellRanges().map((cellRange) => {
            const { id, type, startRow, endRow, columns, startColumn } = cellRange;
            return {
                id,
                type,
                startRow,
                endRow,
                colIds: columns.map((column) => column.getColId()),
                startColId: startColumn.getColId(),
            };
        });
        return cellRanges?.length ? { cellRanges } : undefined;
    }

    private setCellSelectionState(cellSelectionState: CellSelectionState): void {
        const { gos, rangeSvc, colModel, visibleCols } = this;

        if (!_isCellSelectionEnabled(gos) || !rangeSvc) {
            return;
        }

        const cellRanges: CellRange[] = [];
        cellSelectionState.cellRanges.forEach((cellRange) => {
            const columns: AgColumn[] = [];
            cellRange.colIds.forEach((colId) => {
                const column = colModel.getCol(colId);
                if (column) {
                    columns.push(column);
                }
            });
            if (!columns.length) {
                return;
            }
            let startColumn = colModel.getCol(cellRange.startColId);
            if (!startColumn) {
                // find the first remaining column
                const allColumns = visibleCols.allCols;
                const columnSet = new Set(columns);
                startColumn = allColumns.find((column) => columnSet.has(column))!;
            }
            cellRanges.push({
                ...cellRange,
                columns,
                startColumn,
            });
        });

        rangeSvc.setCellRanges(cellRanges);
    }

    private getScrollState(): ScrollState | undefined {
        if (!this.isClientSideRowModel) {
            // can't restore, so don't provide
            return undefined;
        }
        const scrollFeature = this.ctrlsSvc.getGridBodyCtrl()?.getScrollFeature();
        const { left } = scrollFeature?.getHScrollPosition() ?? { left: 0 };
        const { top } = scrollFeature?.getVScrollPosition() ?? { top: 0 };
        return top || left
            ? {
                  top,
                  left,
              }
            : undefined;
    }

    private setScrollState(scrollState: ScrollState): void {
        if (!this.isClientSideRowModel) {
            return;
        }
        const { top, left } = scrollState;
        this.ctrlsSvc.getGridBodyCtrl()?.getScrollFeature().setScrollPosition(top, left);
    }

    private getSideBarState(): SideBarState | undefined {
        return this.sideBar?.getSideBarComp()?.getState();
    }

    private getFocusedCellState(): FocusedCellState | undefined {
        if (!this.isClientSideRowModel) {
            // can't restore, so don't provide
            return undefined;
        }
        const focusedCell = this.focusSvc.getFocusedCell();
        if (focusedCell) {
            const { column, rowIndex, rowPinned } = focusedCell;
            return {
                colId: column.getColId(),
                rowIndex,
                rowPinned,
            };
        }
        return undefined;
    }

    private setFocusedCellState(focusedCellState: FocusedCellState): void {
        if (!this.isClientSideRowModel) {
            return;
        }
        const { colId, rowIndex, rowPinned } = focusedCellState;
        this.focusSvc.setFocusedCell({
            column: this.colModel.getCol(colId),
            rowIndex,
            rowPinned,
            forceBrowserFocus: true,
            preventScrollOnBrowserFocus: true,
        });
    }

    private getPaginationState(): PaginationState | undefined {
        if (!this.pagination) {
            return undefined;
        }
        const page = this.pagination.getCurrentPage();
        const pageSize = !this.gos.get('paginationAutoPageSize') ? this.pagination.getPageSize() : undefined;

        if (!page && !pageSize) {
            return;
        }
        return { page, pageSize };
    }

    private setPaginationState(paginationState: PaginationState): void {
        if (!this.pagination) {
            return;
        }
        if (paginationState.pageSize && !this.gos.get('paginationAutoPageSize')) {
            this.pagination.setPageSize(paginationState.pageSize, 'initialState');
        }

        if (typeof paginationState.page === 'number') {
            this.pagination.setPage(paginationState.page);
        }
    }

    private getRowSelectionState():
        | string[]
        | ServerSideRowSelectionState
        | ServerSideRowGroupSelectionState
        | undefined {
        if (!this.selectionSvc) {
            return undefined;
        }
        const selectionState = this.selectionSvc.getSelectionState();
        const noSelections =
            !selectionState ||
            (!Array.isArray(selectionState) &&
                ((selectionState as ServerSideRowSelectionState).selectAll === false ||
                    (selectionState as ServerSideRowGroupSelectionState).selectAllChildren === false) &&
                !selectionState?.toggledNodes?.length);
        return noSelections ? undefined : selectionState;
    }

    private setRowSelectionState(
        rowSelectionState: string[] | ServerSideRowSelectionState | ServerSideRowGroupSelectionState
    ): void {
        this.selectionSvc?.setSelectionState(rowSelectionState, 'gridInitializing');
    }

    private getRowGroupExpansionState(): RowGroupExpansionState | undefined {
        if (!this.expansionSvc) {
            return undefined;
        }

        const expandedRowGroups: string[] = [];
        this.rowModel.forEachNode(({ expanded, id }) => {
            if (expanded && id) {
                expandedRowGroups.push(id);
            }
        });
        return expandedRowGroups.length
            ? {
                  expandedRowGroupIds: expandedRowGroups,
              }
            : undefined;
    }

    private setRowGroupExpansionState(rowGroupExpansionState: RowGroupExpansionState): void {
        this.expansionSvc?.expandRows(rowGroupExpansionState.expandedRowGroupIds);
    }

    private updateColumnState(features: (keyof GridState)[]): void {
        const newColumnState = this.getColumnState();
        let hasChanged = false;
        Object.entries(newColumnState).forEach(([key, value]: [keyof GridState, any]) => {
            if (!_jsonEquals(value, this.cachedState[key])) {
                hasChanged = true;
            }
        });
        this.cachedState = {
            ...this.cachedState,
            ...newColumnState,
        };
        if (hasChanged) {
            this.dispatchStateUpdateEvent(features);
        }
    }

    private updateCachedState<K extends keyof GridState>(key: K, value: GridState[K]): void {
        const existingValue = this.cachedState[key];
        this.setCachedStateValue(key, value);
        if (!_jsonEquals(value, existingValue)) {
            this.dispatchStateUpdateEvent([key]);
        }
    }

    private setCachedStateValue<K extends keyof GridState>(key: K, value: GridState[K]): void {
        this.cachedState = {
            ...this.cachedState,
            [key]: value,
        };
    }

    private refreshStaleState(): void {
        this.staleStateKeys.forEach((key) => {
            switch (key) {
                // only row selection supported for now
                case 'rowSelection':
                    this.setCachedStateValue(key, this.getRowSelectionState());
                    break;
            }
        });
        this.staleStateKeys.clear();
    }

    private dispatchStateUpdateEvent(sources: (keyof GridState | 'gridInitializing')[]): void {
        if (this.suppressEvents) {
            return;
        }
        sources.forEach((source) => this.queuedUpdateSources.add(source));
        this.dispatchStateUpdateEventDebounced();
    }

    private dispatchQueuedStateUpdateEvents(): void {
        const sources = Array.from(this.queuedUpdateSources);
        this.queuedUpdateSources.clear();
        this.eventSvc.dispatchEvent({
            type: 'stateUpdated',
            sources,
            state: this.cachedState,
        });
    }

    private suppressEventsAndDispatchInitEvent(updateFunc: () => void): void {
        this.suppressEvents = true;
        this.colAnimation?.setSuppressAnimation(true);
        updateFunc();
        // We want to suppress any grid events, but not user events.
        // Using a timeout here captures things like column resizing and emits a single grid initializing event.
        setTimeout(() => {
            this.suppressEvents = false;
            // We only want the grid initializing source.
            this.queuedUpdateSources.clear();
            if (!this.isAlive()) {
                // Ensure the grid is still alive before dispatching the event.
                return;
            }
            this.colAnimation?.setSuppressAnimation(false);
            this.dispatchStateUpdateEvent(['gridInitializing']);
        });
    }
}
