import type { ColumnModel } from '../columns/columnModel';
import type { DataTypeService } from '../columns/dataTypeService';
import { _unwrapUserComp } from '../components/framework/unwrapUserComp';
import {
    _getFilterDetails,
    _getFloatingFilterCompDetails,
    _mergeFilterParamsWithApplicationProvidedParams,
} from '../components/framework/userCompUtils';
import type { UserComponentFactory } from '../components/framework/userComponentFactory';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection, BeanName } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef, ValueFormatterParams, ValueGetterParams } from '../entities/colDef';
import type {
    CoreDataTypeDefinition,
    DataTypeFormatValueFunc,
    DateStringDataTypeDefinition,
} from '../entities/dataType';
import type { RowNode } from '../entities/rowNode';
import type { ColumnEventType, FilterChangedEventSourceType } from '../events';
import { _getGroupAggFiltering, _isSetFilterByDefault } from '../gridOptionsUtils';
import type { IAutoColService } from '../interfaces/iAutoColService';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { FilterModel, IFilter, IFilterComp, IFilterParams } from '../interfaces/iFilter';
import type { IRowModel } from '../interfaces/iRowModel';
import type { UserCompDetails } from '../interfaces/iUserCompDetails';
import type { RowRenderer } from '../rendering/rowRenderer';
import { _exists, _jsonEquals } from '../utils/generic';
import { AgPromise } from '../utils/promise';
import { _warn } from '../validation/logging';
import type { ValueService } from '../valueService/valueService';
import type { FilterManager } from './filterManager';
import type { FilterValueService } from './filterValueService';
import type { IFloatingFilterParams, IFloatingFilterParentCallback } from './floating/floatingFilter';
import { _getDefaultFloatingFilterType } from './floating/floatingFilterMapper';

const MONTH_LOCALE_TEXT = {
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
};
const MONTH_KEYS: (keyof typeof MONTH_LOCALE_TEXT)[] = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
];

function setFilterNumberComparator(a: string, b: string): number {
    if (a == null) {
        return -1;
    }
    if (b == null) {
        return 1;
    }
    return parseFloat(a) - parseFloat(b);
}

export class ColumnFilterService extends BeanStub implements NamedBean {
    beanName: BeanName = 'colFilter';

    private valueSvc: ValueService;
    private colModel: ColumnModel;
    private rowModel: IRowModel;
    private userCompFactory: UserComponentFactory;
    private rowRenderer: RowRenderer;
    private dataTypeSvc?: DataTypeService;
    private filterManager?: FilterManager;
    private filterValueSvc: FilterValueService;
    private autoColSvc?: IAutoColService;

    public wireBeans(beans: BeanCollection): void {
        this.valueSvc = beans.valueSvc;
        this.colModel = beans.colModel;
        this.rowModel = beans.rowModel;
        this.userCompFactory = beans.userCompFactory;
        this.rowRenderer = beans.rowRenderer;
        this.dataTypeSvc = beans.dataTypeSvc;
        this.filterManager = beans.filterManager;
        this.filterValueSvc = beans.filterValueSvc!;
        this.autoColSvc = beans.autoColSvc;
    }

    private allColumnFilters = new Map<string, FilterWrapper>();
    private allColumnListeners = new Map<string, (() => null) | undefined>();
    private activeAggregateFilters: IFilterComp[] = [];
    private activeColumnFilters: IFilterComp[] = [];

    // this is true when the grid is processing the filter change. this is used by the cell comps, so that they
    // don't flash when data changes due to filter changes. there is no need to flash when filter changes as the
    // user is in control, so doesn't make sense to show flashing changes. for example, go to main demo where
    // this feature is turned off (hack code to always return false for isSuppressFlashingCellsBecauseFiltering(), put in)
    // 100,000 rows and group by country. then do some filtering. all the cells flash, which is silly.
    private processingFilterChange = false;

    // when we're waiting for cell data types to be inferred, we need to defer filter model updates
    private filterModelUpdateQueue: { model: FilterModel | null; source: FilterChangedEventSourceType }[] = [];
    private columnFilterModelUpdateQueue: { key: string | AgColumn; model: any; resolve: () => void }[] = [];

    private initialFilterModel: FilterModel;

    public postConstruct(): void {
        this.addManagedEventListeners({
            gridColumnsChanged: this.onColumnsChanged.bind(this),
            rowDataUpdated: () => this.onNewRowsLoaded('rowDataUpdated'),
            dataTypesInferred: this.processFilterModelUpdateQueue.bind(this),
        });

        this.initialFilterModel = {
            ...(this.gos.get('initialState')?.filter?.filterModel ?? {}),
        };
    }

    public setFilterModel(model: FilterModel | null, source: FilterChangedEventSourceType = 'api'): void {
        if (this.dataTypeSvc?.isPendingInference()) {
            this.filterModelUpdateQueue.push({ model, source });
            return;
        }

        const allPromises: AgPromise<void>[] = [];
        const previousModel = this.getFilterModel(true);

        if (model) {
            // mark the filters as we set them, so any active filters left over we stop
            const modelKeys = new Set(Object.keys(model));

            this.allColumnFilters.forEach((filterWrapper, colId) => {
                const newModel = model[colId];

                allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise!, newModel));
                modelKeys.delete(colId);
            });

            // at this point, processedFields contains data for which we don't have a filter working yet
            modelKeys.forEach((colId) => {
                const column = this.colModel.getColDefCol(colId) || this.colModel.getCol(colId);

                if (!column) {
                    _warn(62, { colId });
                    return;
                }

                if (!column.isFilterAllowed()) {
                    _warn(63, { colId });
                    return;
                }

                const filterWrapper = this.getOrCreateFilterWrapper(column);
                if (!filterWrapper) {
                    _warn(64, { colId });
                    return;
                }
                allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise!, model[colId]));
            });
        } else {
            this.allColumnFilters.forEach((filterWrapper) => {
                allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise!, null));
            });
        }

        AgPromise.all(allPromises).then(() => {
            const currentModel = this.getFilterModel(true);

            const columns: AgColumn[] = [];
            this.allColumnFilters.forEach((filterWrapper, colId) => {
                const before = previousModel ? previousModel[colId] : null;
                const after = currentModel ? currentModel[colId] : null;

                if (!_jsonEquals(before, after)) {
                    columns.push(filterWrapper.column);
                }
            });

            if (columns.length > 0) {
                this.filterManager?.onFilterChanged({ columns, source });
            }
        });
    }

    private setModelOnFilterWrapper(filterPromise: AgPromise<IFilterComp>, newModel: any): AgPromise<void> {
        return new AgPromise<void>((resolve) => {
            filterPromise.then((filter) => {
                if (typeof filter!.setModel !== 'function') {
                    _warn(65);
                    resolve();
                }

                (filter!.setModel(newModel) || AgPromise.resolve()).then(() => resolve());
            });
        });
    }

    public getFilterModel(excludeInitialState?: boolean): FilterModel {
        const result: FilterModel = {};

        const { allColumnFilters, initialFilterModel } = this;

        allColumnFilters.forEach((filterWrapper, key) => {
            const model = this.getModelFromFilterWrapper(filterWrapper);

            if (_exists(model)) {
                result[key] = model;
            }
        });

        if (!excludeInitialState) {
            Object.entries(initialFilterModel).forEach(([colId, model]) => {
                if (_exists(model) && !allColumnFilters.has(colId) && this.colModel.getCol(colId)?.isFilterAllowed()) {
                    result[colId] = model;
                }
            });
        }

        return result;
    }

    private getModelFromFilterWrapper(filterWrapper: FilterWrapper): any {
        const { filter } = filterWrapper;
        if (filter) {
            if (typeof filter.getModel !== 'function') {
                _warn(66);
                return null;
            }

            return filter.getModel();
        } else {
            // filter still being created. return initial state if it exists and hasn't been applied yet
            return this.getModelFromInitialState(filterWrapper.column);
        }
    }

    private getModelFromInitialState(column: AgColumn): any {
        return this.initialFilterModel[column.getColId()] ?? null;
    }

    public isColumnFilterPresent(): boolean {
        return this.activeColumnFilters.length > 0;
    }

    public isAggregateFilterPresent(): boolean {
        return !!this.activeAggregateFilters.length;
    }

    public disableColumnFilters(): boolean {
        if (this.allColumnFilters.size) {
            this.allColumnFilters.forEach((filterWrapper) =>
                this.disposeFilterWrapper(filterWrapper, 'advancedFilterEnabled')
            );
            return true;
        }
        return false;
    }

    public doAggregateFiltersPass(node: RowNode, filterToSkip?: IFilterComp) {
        return this.doColumnFiltersPass(node, filterToSkip, true);
    }

    private updateActiveFilters(): AgPromise<void> {
        const isFilterActive = (filter: IFilter | null) => {
            if (!filter) {
                return false;
            } // this never happens, including to avoid compile error
            if (!filter.isFilterActive) {
                _warn(67);
                return false;
            }
            return filter.isFilterActive();
        };

        const groupFilterEnabled = !!_getGroupAggFiltering(this.gos);

        const isAggFilter = (column: AgColumn) => {
            const isSecondary = !column.isPrimary();
            // the only filters that can appear on secondary columns are groupAgg filters
            if (isSecondary) {
                return true;
            }

            const isShowingPrimaryColumns = !this.colModel.isPivotActive();
            const isValueActive = column.isValueActive();

            // primary columns are only ever groupAgg filters if a) value is active and b) showing primary columns
            if (!isValueActive || !isShowingPrimaryColumns) {
                return false;
            }

            // from here on we know: isPrimary=true, isValueActive=true, isShowingPrimaryColumns=true
            if (this.colModel.isPivotMode()) {
                // primary column is pretending to be a pivot column, ie pivotMode=true, but we are
                // still showing primary columns
                return true;
            }
            // we are not pivoting, so we groupFilter when it's an agg column
            return groupFilterEnabled;
        };

        const activeAggregateFilters: IFilterComp[] = [];
        const activeColumnFilters: IFilterComp[] = [];

        return this.forEachColumnFilter((filter, filterWrapper) => {
            const filterActive = isFilterActive(filter);
            if (filterActive) {
                if (isAggFilter(filterWrapper.column)) {
                    activeAggregateFilters.push(filter!);
                } else {
                    activeColumnFilters.push(filter!);
                }
            }
        }).then(() => {
            this.activeAggregateFilters = activeAggregateFilters;
            this.activeColumnFilters = activeColumnFilters;
        });
    }

    private updateFilterFlagInColumns(
        source: ColumnEventType,
        additionalEventAttributes?: any
    ): AgPromise<(void | null)[]> {
        return this.forEachColumnFilter((filter, filterWrapper) =>
            filterWrapper.column.setFilterActive(filter!.isFilterActive(), source, additionalEventAttributes)
        );
    }

    private forEachColumnFilter(
        callback: (filter: IFilterComp | null, filterWrapper: FilterWrapper) => void
    ): AgPromise<(void | null)[]> {
        return AgPromise.all(
            Array.from(this.allColumnFilters.values()).map((filterWrapper) =>
                filterWrapper.filterPromise!.then((filter) => callback(filter, filterWrapper))
            )
        );
    }

    public doColumnFiltersPass(node: RowNode, filterToSkip?: IFilterComp, targetAggregates?: boolean): boolean {
        const { data, aggData } = node;

        const targetedFilters = targetAggregates ? this.activeAggregateFilters : this.activeColumnFilters;
        const targetedData = targetAggregates ? aggData : data;
        for (let i = 0; i < targetedFilters.length; i++) {
            const filter = targetedFilters[i];

            if (filter == null || filter === filterToSkip) {
                continue;
            }

            if (typeof filter.doesFilterPass !== 'function') {
                // because users can do custom filters, give nice error message
                throw new Error('Filter is missing method doesFilterPass');
            }

            if (!filter.doesFilterPass({ node, data: targetedData })) {
                return false;
            }
        }

        return true;
    }

    // sometimes (especially in React) the filter can call onFilterChanged when we are in the middle
    // of a render cycle. this would be bad, so we wait for render cycle to complete when this happens.
    // this happens in react when we change React State in the grid (eg setting RowCtrl's in RowContainer)
    // which results in React State getting applied in the main application, triggering a useEffect() to
    // be kicked off adn then the application calling the grid's API. in AG-6554, the custom filter was
    // getting it's useEffect() triggered in this way.
    private callOnFilterChangedOutsideRenderCycle(params: {
        source?: FilterChangedEventSourceType;
        filterInstance?: IFilterComp;
        additionalEventAttributes?: any;
        columns?: AgColumn[];
    }): void {
        const action = () => {
            if (this.isAlive()) {
                this.filterManager?.onFilterChanged(params);
            }
        };
        if (this.rowRenderer.isRefreshInProgress()) {
            setTimeout(action, 0);
        } else {
            action();
        }
    }

    public updateBeforeFilterChanged(
        params: {
            filterInstance?: IFilterComp;
            additionalEventAttributes?: any;
        } = {}
    ): AgPromise<void> {
        const { filterInstance, additionalEventAttributes } = params;

        this.updateDependentFilters();
        return this.updateActiveFilters().then(() =>
            this.updateFilterFlagInColumns('filterChanged', additionalEventAttributes).then(() => {
                this.allColumnFilters.forEach((filterWrapper) => {
                    if (!filterWrapper.filterPromise) {
                        return;
                    }
                    filterWrapper.filterPromise.then((filter) => {
                        if (filter && filter !== filterInstance && filter.onAnyFilterChanged) {
                            filter!.onAnyFilterChanged();
                        }
                    });
                });

                // because internal events are not async in ag-grid, when the dispatchEvent
                // method comes back, we know all listeners have finished executing.
                this.processingFilterChange = true;
            })
        ) as AgPromise<void>;
    }

    public updateAfterFilterChanged(): void {
        this.processingFilterChange = false;
    }

    public isSuppressFlashingCellsBecauseFiltering(): boolean {
        // if user has elected to always flash cell changes, then always return false, otherwise we suppress flashing
        // changes when filtering
        const allowShowChangeAfterFilter = this.gos.get('allowShowChangeAfterFilter') ?? false;
        return !allowShowChangeAfterFilter && this.processingFilterChange;
    }

    private onNewRowsLoaded(source: ColumnEventType): void {
        this.forEachColumnFilter((filter) => {
            if (filter!.onNewRowsLoaded) {
                filter!.onNewRowsLoaded();
            }
        })
            .then(() => this.updateFilterFlagInColumns(source, { afterDataChange: true }))
            .then(() => this.updateActiveFilters());
    }

    private createGetValue(filterColumn: AgColumn): IFilterParams['getValue'] {
        return (rowNode, column) => {
            const columnToUse = column ? this.colModel.getCol(column) : filterColumn;
            return columnToUse ? this.filterValueSvc.getValue(columnToUse, rowNode) : undefined;
        };
    }

    public isFilterActive(column: AgColumn): boolean {
        const { filter } = this.cachedFilter(column) ?? {};
        if (filter) {
            return filter.isFilterActive();
        }
        // if not created, should only be active if there's a model
        return this.getModelFromInitialState(column) != null;
    }

    public getOrCreateFilterWrapper(column: AgColumn): FilterWrapper | null {
        if (!column.isFilterAllowed()) {
            return null;
        }

        let filterWrapper = this.cachedFilter(column);

        if (!filterWrapper) {
            filterWrapper = this.createFilterWrapper(column);
            this.setColumnFilterWrapper(column, filterWrapper);
        }

        return filterWrapper;
    }

    private cachedFilter(column: AgColumn): FilterWrapper | undefined {
        return this.allColumnFilters.get(column.getColId());
    }

    private getDefaultFilter(column: AgColumn): string {
        let defaultFilter;
        if (_isSetFilterByDefault(this.gos)) {
            defaultFilter = 'agSetColumnFilter';
        } else {
            const cellDataType = this.dataTypeSvc?.getBaseDataType(column);
            if (cellDataType === 'number') {
                defaultFilter = 'agNumberColumnFilter';
            } else if (cellDataType === 'date' || cellDataType === 'dateString') {
                defaultFilter = 'agDateColumnFilter';
            } else {
                defaultFilter = 'agTextColumnFilter';
            }
        }
        return defaultFilter;
    }

    public getDefaultFloatingFilter(column: AgColumn): string {
        let defaultFloatingFilterType: string;
        if (_isSetFilterByDefault(this.gos)) {
            defaultFloatingFilterType = 'agSetColumnFloatingFilter';
        } else {
            const cellDataType = this.dataTypeSvc?.getBaseDataType(column);
            if (cellDataType === 'number') {
                defaultFloatingFilterType = 'agNumberColumnFloatingFilter';
            } else if (cellDataType === 'date' || cellDataType === 'dateString') {
                defaultFloatingFilterType = 'agDateColumnFloatingFilter';
            } else {
                defaultFloatingFilterType = 'agTextColumnFloatingFilter';
            }
        }
        return defaultFloatingFilterType;
    }

    private createFilterInstance(
        column: AgColumn,
        filterWrapper?: FilterWrapper
    ): {
        filterPromise: (() => AgPromise<IFilterComp> | null) | null;
        compDetails: UserCompDetails | null;
    } {
        const defaultFilter = this.getDefaultFilter(column);

        const colDef = column.getColDef();

        let filterInstance: IFilterComp;

        const params: IFilterParams = {
            ...this.createFilterParams(column, colDef),
            filterModifiedCallback: () => this.filterModifiedCallbackFactory(filterInstance, column)(),
            filterChangedCallback: (additionalEventAttributes?: any) =>
                this.filterChangedCallbackFactory(filterInstance, column)(additionalEventAttributes),
            doesRowPassOtherFilter: (node) =>
                this.filterManager ? this.filterManager.doesRowPassOtherFilters(filterInstance, node) : true,
        };

        const compDetails = _getFilterDetails(this.userCompFactory, colDef, params, defaultFilter);
        if (!compDetails) {
            return { filterPromise: null, compDetails: null };
        }
        return {
            filterPromise: () => {
                const filterPromise = compDetails.newAgStackInstance();
                if (filterPromise != null) {
                    filterPromise.then((r) => {
                        filterInstance = r!;
                        if (filterWrapper) {
                            filterWrapper.filter = r;
                        }
                    });
                }
                return filterPromise;
            },
            compDetails,
        };
    }

    public createFilterParams(column: AgColumn, colDef: ColDef): IFilterParams {
        const params: IFilterParams = this.gos.addGridCommonParams({
            column,
            colDef,
            rowModel: this.rowModel,
            filterChangedCallback: () => {},
            filterModifiedCallback: () => {},
            getValue: this.createGetValue(column),
            doesRowPassOtherFilter: () => true,
        });

        return params;
    }

    private createFilterWrapper(column: AgColumn): FilterWrapper {
        const filterWrapper: FilterWrapper = {
            column: column,
            filterPromise: null,
            compiledElement: null,
            compDetails: null,
        };

        const { filterPromise, compDetails } = this.createFilterInstance(column, filterWrapper);
        filterWrapper.filterPromise = filterPromise?.() ?? null;
        filterWrapper.compDetails = compDetails;

        return filterWrapper;
    }

    private onColumnsChanged(): void {
        const columns: AgColumn[] = [];

        this.allColumnFilters.forEach((wrapper, colId) => {
            let currentColumn: AgColumn | null;
            if (wrapper.column.isPrimary()) {
                currentColumn = this.colModel.getColDefCol(colId);
            } else {
                currentColumn = this.colModel.getCol(colId);
            }
            // group columns can be recreated with the same colId
            if (currentColumn && currentColumn === wrapper.column) {
                return;
            }

            columns.push(wrapper.column);
            this.disposeFilterWrapper(wrapper, 'columnChanged');
            this.disposeColumnListener(colId);
        });

        const allFiltersAreGroupFilters = columns.every(
            (column) => column.getColDef().filter === 'agGroupColumnFilter'
        );
        // don't call `onFilterChanged` if only group column filter is present as it has no model
        if (columns.length > 0 && !allFiltersAreGroupFilters) {
            // When a filter changes as a side effect of a column changes,
            // we report 'api' as the source, so that the client can distinguish
            this.filterManager?.onFilterChanged({ columns, source: 'api' });
        } else {
            // onFilterChanged does this already
            this.updateDependentFilters();
        }
    }

    private updateDependentFilters(): void {
        // Group column filters can be dependant on underlying column filters, but don't normally get created until they're used for the first time.
        // Instead, create them by default when any filter changes.
        this.autoColSvc?.getAutoCols()?.forEach((groupColumn) => {
            if (groupColumn.getColDef().filter === 'agGroupColumnFilter') {
                this.getOrCreateFilterWrapper(groupColumn);
            }
        });
    }

    // for group filters, can change dynamically whether they are allowed or not
    public isFilterAllowed(column: AgColumn): boolean {
        const isFilterAllowed = column.isFilterAllowed();
        if (!isFilterAllowed) {
            return false;
        }
        const { filter } = this.allColumnFilters.get(column.getColId()) ?? {};
        if (filter) {
            // defer to filter component isFilterAllowed if it exists
            return typeof (filter as any)?.isFilterAllowed === 'function' ? (filter as any).isFilterAllowed() : true;
        }
        return true;
    }

    public getFloatingFilterCompDetails(column: AgColumn, showParentFilter: () => void): UserCompDetails | undefined {
        const parentFilterInstance = (callback: IFloatingFilterParentCallback<IFilter>) => {
            const filterComponent = this.getOrCreateFilterWrapper(column)?.filterPromise;

            if (filterComponent == null) {
                return;
            }

            filterComponent.then((instance) => {
                callback(_unwrapUserComp(instance!));
            });
        };

        const colDef = column.getColDef();
        const filterParams = {
            ...this.createFilterParams(column, colDef),
            filterChangedCallback: () =>
                parentFilterInstance((filterInstance) =>
                    this.filterChangedCallbackFactory(filterInstance as IFilterComp, column)()
                ),
        };
        const finalFilterParams = _mergeFilterParamsWithApplicationProvidedParams(
            this.userCompFactory,
            colDef,
            filterParams
        );

        let defaultFloatingFilterType = _getDefaultFloatingFilterType(this.beans.frameworkOverrides, colDef, () =>
            this.getDefaultFloatingFilter(column)
        );

        if (defaultFloatingFilterType == null) {
            defaultFloatingFilterType = 'agReadOnlyFloatingFilter';
        }

        const params: WithoutGridCommon<IFloatingFilterParams<IFilter>> = {
            column: column,
            filterParams: finalFilterParams,
            currentParentModel: () => this.getCurrentFloatingFilterParentModel(column),
            parentFilterInstance,
            showParentFilter,
        };

        return _getFloatingFilterCompDetails(this.userCompFactory, colDef, params, defaultFloatingFilterType);
    }

    public getCurrentFloatingFilterParentModel(column: AgColumn): any {
        return this.getModelFromFilterWrapper(this.cachedFilter(column) ?? ({ column } as FilterWrapper));
    }

    // destroys the filter, so it no longer takes part
    public destroyFilter(column: AgColumn, source: 'api' | 'columnChanged' | 'paramsUpdated' = 'api'): void {
        const colId = column.getColId();
        const filterWrapper = this.allColumnFilters.get(colId);

        this.disposeColumnListener(colId);

        delete this.initialFilterModel[colId];

        if (filterWrapper) {
            this.disposeFilterWrapper(filterWrapper, source);
            this.filterManager?.onFilterChanged({
                columns: [column],
                source: 'api',
            });
        }
    }

    private disposeColumnListener(colId: string): void {
        const columnListener = this.allColumnListeners.get(colId);

        if (columnListener) {
            this.allColumnListeners.delete(colId);
            columnListener();
        }
    }

    private disposeFilterWrapper(
        filterWrapper: FilterWrapper,
        source: 'api' | 'columnChanged' | 'gridDestroyed' | 'advancedFilterEnabled' | 'paramsUpdated'
    ): void {
        filterWrapper.filterPromise!.then((filter) => {
            this.destroyBean(filter);

            filterWrapper.column.setFilterActive(false, 'filterDestroyed');

            this.allColumnFilters.delete(filterWrapper.column.getColId());

            this.eventSvc.dispatchEvent({
                type: 'filterDestroyed',
                source,
                column: filterWrapper.column,
            });
        });
    }

    private filterModifiedCallbackFactory(filter: IFilterComp<any>, column: AgColumn<any>) {
        return () => {
            this.eventSvc.dispatchEvent({
                type: 'filterModified',
                column,
                filterInstance: filter,
            });
        };
    }

    private filterChangedCallbackFactory(filter: IFilterComp<any>, column: AgColumn<any>) {
        return (additionalEventAttributes?: any) => {
            const source: FilterChangedEventSourceType = additionalEventAttributes?.source ?? 'columnFilter';
            const params = {
                filter,
                additionalEventAttributes,
                columns: [column],
                source,
            };
            this.callOnFilterChangedOutsideRenderCycle(params);
        };
    }

    private checkDestroyFilter(colId: string): void {
        const filterWrapper = this.allColumnFilters.get(colId);
        if (!filterWrapper) {
            return;
        }

        const column = filterWrapper.column;
        const { compDetails } = column.isFilterAllowed() ? this.createFilterInstance(column) : { compDetails: null };

        // Case when filter component changes
        if (this.areFilterCompsDifferent(filterWrapper.compDetails, compDetails)) {
            this.destroyFilter(column, 'paramsUpdated');
            return;
        }

        // Case when filter params changes
        const newFilterParams = column.getColDef().filterParams;
        // When filter wrapper does not have promise to retrieve FilterComp, destroy
        if (!filterWrapper.filterPromise) {
            this.destroyFilter(column, 'paramsUpdated');
            return;
        }

        // Otherwise - Check for refresh method before destruction
        // If refresh() method is implemented - call it and destroy filter if it returns false
        // Otherwise - do nothing ( filter will not be destroyed - we assume new params are compatible with old ones )
        filterWrapper.filterPromise.then((filter) => {
            const shouldRefreshFilter = filter?.refresh
                ? filter.refresh({
                      ...this.createFilterParams(column, column.getColDef()),
                      filterModifiedCallback: this.filterModifiedCallbackFactory(filter, column),
                      filterChangedCallback: this.filterChangedCallbackFactory(filter, column),
                      doesRowPassOtherFilter: (node) =>
                          this.filterManager ? this.filterManager.doesRowPassOtherFilters(filter, node) : true,
                      ...newFilterParams,
                  })
                : true;
            // framework wrapper always implements optional methods, but returns null if no underlying method
            if (shouldRefreshFilter === false) {
                this.destroyFilter(column, 'paramsUpdated');
            }
        });
    }

    private setColumnFilterWrapper(column: AgColumn, filterWrapper: FilterWrapper): void {
        const colId = column.getColId();
        this.allColumnFilters.set(colId, filterWrapper);
        this.allColumnListeners.set(
            colId,
            this.addManagedListeners(column, { colDefChanged: () => this.checkDestroyFilter(colId) })[0]
        );
    }

    public areFilterCompsDifferent(
        oldCompDetails: UserCompDetails | null,
        newCompDetails: UserCompDetails | null
    ): boolean {
        if (!newCompDetails || !oldCompDetails) {
            return true;
        }
        const { componentClass: oldComponentClass } = oldCompDetails;
        const { componentClass: newComponentClass } = newCompDetails;
        const isSameComponentClass =
            oldComponentClass === newComponentClass ||
            // react hooks returns new wrappers, so check nested render method
            (oldComponentClass?.render &&
                newComponentClass?.render &&
                oldComponentClass.render === newComponentClass.render);
        return !isSameComponentClass;
    }

    public hasFloatingFilters(): boolean {
        const gridColumns = this.colModel.getCols();
        return gridColumns.some((col) => col.getColDef().floatingFilter);
    }

    public getColumnFilterInstance<TFilter extends IFilter>(
        key: string | AgColumn
    ): Promise<TFilter | null | undefined> {
        return new Promise((resolve) => {
            this.getFilterInstanceImpl(key).then((filter) => {
                resolve(_unwrapUserComp(filter) as any);
            });
        });
    }

    private getFilterInstanceImpl(key: string | AgColumn): AgPromise<IFilter | null | undefined> {
        const column = this.colModel.getColDefCol(key);

        if (!column) {
            return AgPromise.resolve(undefined);
        }

        const filterPromise = this.getOrCreateFilterWrapper(column)?.filterPromise;
        return filterPromise ?? AgPromise.resolve(null);
    }

    private processFilterModelUpdateQueue(): void {
        this.filterModelUpdateQueue.forEach(({ model, source }) => this.setFilterModel(model, source));
        this.filterModelUpdateQueue = [];
        this.columnFilterModelUpdateQueue.forEach(({ key, model, resolve }) => {
            this.setColumnFilterModel(key, model).then(() => resolve());
        });
        this.columnFilterModelUpdateQueue = [];
    }

    public getColumnFilterModel(key: string | AgColumn): any {
        const filterWrapper = this.getFilterWrapper(key);
        return filterWrapper ? this.getModelFromFilterWrapper(filterWrapper) : null;
    }

    public setColumnFilterModel(key: string | AgColumn, model: any): Promise<void> {
        if (this.dataTypeSvc?.isPendingInference()) {
            let resolve: () => void = () => {};
            const promise = new Promise<void>((res) => {
                resolve = res;
            });
            this.columnFilterModelUpdateQueue.push({ key, model, resolve });
            return promise;
        }

        const column = this.colModel.getColDefCol(key);
        const filterWrapper = column ? this.getOrCreateFilterWrapper(column) : null;
        const convertPromise = <T>(promise: AgPromise<T>): Promise<T> => {
            return new Promise((resolve) => {
                promise.then((result) => resolve(result!));
            });
        };
        return filterWrapper
            ? convertPromise(this.setModelOnFilterWrapper(filterWrapper.filterPromise!, model))
            : Promise.resolve();
    }

    private getFilterWrapper(key: string | AgColumn): FilterWrapper | null {
        const column = this.colModel.getColDefCol(key);
        return column ? this.cachedFilter(column) ?? null : null;
    }

    public setColDefPropertiesForDataType(
        colDef: ColDef,
        dataTypeDefinition: CoreDataTypeDefinition,
        formatValue: DataTypeFormatValueFunc
    ): void {
        const usingSetFilter = _isSetFilterByDefault(this.gos);
        const translate = this.getLocaleTextFunc();
        const mergeFilterParams = (params: any) => {
            const { filterParams } = colDef;
            colDef.filterParams =
                typeof filterParams === 'object'
                    ? {
                          ...filterParams,
                          ...params,
                      }
                    : params;
        };
        switch (dataTypeDefinition.baseDataType) {
            case 'number': {
                if (usingSetFilter) {
                    mergeFilterParams({
                        comparator: setFilterNumberComparator,
                    });
                }
                break;
            }
            case 'boolean': {
                if (usingSetFilter) {
                    mergeFilterParams({
                        valueFormatter: (params: ValueFormatterParams) => {
                            if (!_exists(params.value)) {
                                return translate('blanks', '(Blanks)');
                            }
                            return translate(String(params.value), params.value ? 'True' : 'False');
                        },
                    });
                } else {
                    mergeFilterParams({
                        maxNumConditions: 1,
                        debounceMs: 0,
                        filterOptions: [
                            'empty',
                            {
                                displayKey: 'true',
                                displayName: 'True',
                                predicate: (_filterValues: any[], cellValue: any) => cellValue,
                                numberOfInputs: 0,
                            },
                            {
                                displayKey: 'false',
                                displayName: 'False',
                                predicate: (_filterValues: any[], cellValue: any) => cellValue === false,
                                numberOfInputs: 0,
                            },
                        ],
                    });
                }
                break;
            }
            case 'date': {
                if (usingSetFilter) {
                    mergeFilterParams({
                        valueFormatter: (params: ValueFormatterParams) => {
                            const valueFormatted = formatValue(params);
                            return _exists(valueFormatted) ? valueFormatted : translate('blanks', '(Blanks)');
                        },
                        treeList: true,
                        treeListFormatter: (pathKey: string | null, level: number) => {
                            if (level === 1 && pathKey != null) {
                                const monthKey = MONTH_KEYS[Number(pathKey) - 1];
                                return translate(monthKey, MONTH_LOCALE_TEXT[monthKey]);
                            }
                            return pathKey ?? translate('blanks', '(Blanks)');
                        },
                    });
                }
                break;
            }
            case 'dateString': {
                const convertToDate = (dataTypeDefinition as DateStringDataTypeDefinition).dateParser!;
                if (usingSetFilter) {
                    mergeFilterParams({
                        valueFormatter: (params: ValueFormatterParams) => {
                            const valueFormatted = formatValue(params);
                            return _exists(valueFormatted) ? valueFormatted : translate('blanks', '(Blanks)');
                        },
                        treeList: true,
                        treeListPathGetter: (value: string | null) => {
                            const date = convertToDate(value ?? undefined);
                            return date
                                ? [String(date.getFullYear()), String(date.getMonth() + 1), String(date.getDate())]
                                : null;
                        },
                        treeListFormatter: (pathKey: string | null, level: number) => {
                            if (level === 1 && pathKey != null) {
                                const monthKey = MONTH_KEYS[Number(pathKey) - 1];
                                return translate(monthKey, MONTH_LOCALE_TEXT[monthKey]);
                            }
                            return pathKey ?? translate('blanks', '(Blanks)');
                        },
                    });
                } else {
                    mergeFilterParams({
                        comparator: (filterDate: Date, cellValue: string | undefined) => {
                            const cellAsDate = convertToDate(cellValue)!;
                            if (cellValue == null || cellAsDate < filterDate) {
                                return -1;
                            }
                            if (cellAsDate > filterDate) {
                                return 1;
                            }
                            return 0;
                        },
                    });
                }
                break;
            }
            case 'object': {
                if (usingSetFilter) {
                    mergeFilterParams({
                        valueFormatter: (params: ValueFormatterParams) => {
                            const valueFormatted = formatValue(params);
                            return _exists(valueFormatted) ? valueFormatted : translate('blanks', '(Blanks)');
                        },
                    });
                } else {
                    colDef.filterValueGetter = (params: ValueGetterParams) =>
                        formatValue({
                            column: params.column,
                            node: params.node,
                            value: this.valueSvc.getValue(params.column as AgColumn, params.node),
                        });
                }
                break;
            }
        }
    }

    public override destroy() {
        super.destroy();
        this.allColumnFilters.forEach((filterWrapper) => this.disposeFilterWrapper(filterWrapper, 'gridDestroyed'));
        // don't need to destroy the listeners as they are managed listeners
        this.allColumnListeners.clear();
    }
}

export interface FilterWrapper {
    compiledElement: any;
    column: AgColumn;
    filterPromise: AgPromise<IFilterComp> | null;
    filter?: IFilterComp;
    compDetails: UserCompDetails | null;
}
