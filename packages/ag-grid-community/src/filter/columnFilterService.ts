import { _unwrapUserComp } from '../components/framework/unwrapUserComp';
import {
    _getFilterCompKeys,
    _getFilterDetails,
    _getFloatingFilterCompDetails,
    _mergeFilterParamsWithApplicationProvidedParams,
} from '../components/framework/userCompUtils';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanName } from '../context/context';
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
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type {
    BaseFilterParams,
    FilterDisplayParams,
    FilterEvaluator,
    FilterEvaluatorParams,
    FilterModel,
    IFilter,
    IFilterComp,
    IFilterParams,
} from '../interfaces/iFilter';
import type { UserCompDetails } from '../interfaces/iUserCompDetails';
import { _exists, _jsonEquals } from '../utils/generic';
import { AgPromise } from '../utils/promise';
import { _error, _warn } from '../validation/logging';
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

interface CompDoesFilterPassWrapper {
    isEvaluator: false;
    colId: string;
    comp: IFilterComp;
}

interface EvaluatorDoesFilterPassWrapper {
    isEvaluator: true;
    colId: string;
    evaluator: FilterEvaluator;
}

type DoesFilterPassWrapper = CompDoesFilterPassWrapper | EvaluatorDoesFilterPassWrapper;

export class ColumnFilterService extends BeanStub implements NamedBean {
    beanName: BeanName = 'colFilter';

    private allColumnFilters = new Map<string, FilterWrapper>();
    private allColumnListeners = new Map<string, (() => null) | undefined>();
    private activeAggregateFilters: DoesFilterPassWrapper[] = [];
    private activeColumnFilters: DoesFilterPassWrapper[] = [];

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
    /** This may not contain the model for non-evaluator columns */
    private model: FilterModel;

    public postConstruct(): void {
        this.addManagedEventListeners({
            gridColumnsChanged: this.onColumnsChanged.bind(this),
            beforeRefreshModel: ({ params }) => {
                // We listen to both row data updated and treeData changed as the SetFilter needs it
                if (params.rowDataUpdated || params.changedProps?.has('treeData')) {
                    this.onNewRowsLoaded('rowDataUpdated');
                }
            },
            dataTypesInferred: this.processFilterModelUpdateQueue.bind(this),
        });

        this.initialFilterModel = {
            ...(this.gos.get('initialState')?.filter?.filterModel ?? {}),
        };
        this.model = {
            ...this.initialFilterModel,
        };
    }

    public setModel(model: FilterModel | null, source: FilterChangedEventSourceType = 'api'): void {
        const { colModel, dataTypeSvc, filterManager } = this.beans;
        if (dataTypeSvc?.isPendingInference) {
            this.filterModelUpdateQueue.push({ model, source });
            return;
        }

        const allPromises: AgPromise<void>[] = [];
        const previousModel = this.getModel(true);

        this.model = {};
        if (model) {
            // mark the filters as we set them, so any active filters left over we stop
            const modelKeys = new Set(Object.keys(model));

            this.allColumnFilters.forEach((filterWrapper, colId) => {
                const newModel = model[colId];

                allPromises.push(this.setModelOnFilterWrapper(filterWrapper, newModel));
                modelKeys.delete(colId);
            });

            // at this point, processedFields contains data for which we don't have a filter working yet
            modelKeys.forEach((colId) => {
                const column = colModel.getColDefCol(colId) || colModel.getCol(colId);

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
                allPromises.push(this.setModelOnFilterWrapper(filterWrapper, model[colId]));
            });
        } else {
            this.allColumnFilters.forEach((filterWrapper) => {
                allPromises.push(this.setModelOnFilterWrapper(filterWrapper, null));
            });
        }

        AgPromise.all(allPromises).then(() => {
            const currentModel = this.getModel(true);

            const columns: AgColumn[] = [];
            this.allColumnFilters.forEach((filterWrapper, colId) => {
                const before = previousModel ? previousModel[colId] : null;
                const after = currentModel ? currentModel[colId] : null;

                if (!_jsonEquals(before, after)) {
                    columns.push(filterWrapper.column);
                }
            });

            if (columns.length > 0) {
                filterManager?.onFilterChanged({ columns, source });
            }
        });
    }

    public getModel(excludeInitialState?: boolean): FilterModel {
        const result: FilterModel = {};

        const {
            allColumnFilters,
            initialFilterModel,
            beans: { colModel },
        } = this;

        allColumnFilters.forEach((filterWrapper, key) => {
            const model = this.getModelFromFilterWrapper(filterWrapper);

            if (_exists(model)) {
                result[key] = model;
            }
        });

        if (!excludeInitialState) {
            Object.entries(initialFilterModel).forEach(([colId, model]) => {
                if (_exists(model) && !allColumnFilters.has(colId) && colModel.getCol(colId)?.isFilterAllowed()) {
                    result[colId] = model;
                }
            });
        }

        return result;
    }

    private getModelFromFilterWrapper(filterWrapper: FilterWrapper): any {
        const column = filterWrapper.column;
        if (filterWrapper.isEvaluator) {
            return this.model[column.getColId()];
        }
        const filter = filterWrapper.filter;
        if (filter) {
            if (typeof filter.getModel !== 'function') {
                _warn(66);
                return null;
            }

            return filter.getModel();
        }
        // filter still being created. return initial state if it exists and hasn't been applied yet
        return this.getModelFromInitialState(column);
    }

    private getModelFromInitialState(column: AgColumn): any {
        return this.initialFilterModel[column.getColId()] ?? null;
    }

    public isFilterPresent(): boolean {
        return this.activeColumnFilters.length > 0;
    }

    public isAggFilterPresent(): boolean {
        return !!this.activeAggregateFilters.length;
    }

    public disableFilters(): boolean {
        const { allColumnFilters } = this;
        if (allColumnFilters.size) {
            allColumnFilters.forEach((filterWrapper) =>
                this.disposeFilterWrapper(filterWrapper, 'advancedFilterEnabled')
            );
            return true;
        }
        return false;
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

        const { colModel, gos } = this.beans;
        const groupFilterEnabled = !!_getGroupAggFiltering(gos);

        const isAggFilter = (column: AgColumn) => {
            const isSecondary = !column.isPrimary();
            // the only filters that can appear on secondary columns are groupAgg filters
            if (isSecondary) {
                return true;
            }

            const isShowingPrimaryColumns = !colModel.isPivotActive();
            const isValueActive = column.isValueActive();

            // primary columns are only ever groupAgg filters if a) value is active and b) showing primary columns
            if (!isValueActive || !isShowingPrimaryColumns) {
                return false;
            }

            // from here on we know: isPrimary=true, isValueActive=true, isShowingPrimaryColumns=true
            if (colModel.isPivotMode()) {
                // primary column is pretending to be a pivot column, ie pivotMode=true, but we are
                // still showing primary columns
                return true;
            }
            // we are not pivoting, so we groupFilter when it's an agg column
            return groupFilterEnabled;
        };

        const activeAggregateFilters: DoesFilterPassWrapper[] = [];
        const activeColumnFilters: DoesFilterPassWrapper[] = [];

        const addFilter = (column: AgColumn, filterActive: boolean, doesFilterPassWrapper: DoesFilterPassWrapper) => {
            if (filterActive) {
                if (isAggFilter(column)) {
                    activeAggregateFilters.push(doesFilterPassWrapper);
                } else {
                    activeColumnFilters.push(doesFilterPassWrapper);
                }
            }
        };

        const promises: AgPromise<void>[] = [];
        this.allColumnFilters.forEach((filterWrapper) => {
            const column = filterWrapper.column;
            const colId = column.getColId();
            if (filterWrapper.isEvaluator) {
                promises.push(
                    filterWrapper.initPromise.then(() => {
                        addFilter(column, this.isEvaluatorActive(column), {
                            colId,
                            isEvaluator: true,
                            evaluator: filterWrapper.evaluator,
                        });
                    })
                );
            } else {
                const promise = this.getFilterUiFromWrapper(filterWrapper);
                if (promise) {
                    promises.push(
                        promise.then((filter) => {
                            addFilter(column, isFilterActive(filter), {
                                colId,
                                isEvaluator: false,
                                comp: filter!,
                            });
                        })
                    );
                }
            }
        });
        return AgPromise.all(promises).then(() => {
            this.activeAggregateFilters = activeAggregateFilters;
            this.activeColumnFilters = activeColumnFilters;
        });
    }

    private updateFilterFlagInColumns(
        source: ColumnEventType,
        additionalEventAttributes?: any
    ): AgPromise<(void | null)[]> {
        const promises: AgPromise<void>[] = [];
        this.allColumnFilters.forEach((filterWrapper) => {
            const column = filterWrapper.column;
            if (filterWrapper.isEvaluator) {
                promises.push(
                    filterWrapper.initPromise.then(() => {
                        this.setColFilterActive(
                            column,
                            this.isEvaluatorActive(column),
                            source,
                            additionalEventAttributes
                        );
                    })
                );
            } else {
                const promise = this.getFilterUiFromWrapper(filterWrapper);
                if (promise) {
                    promises.push(
                        promise.then((filter) => {
                            this.setColFilterActive(
                                column,
                                filter!.isFilterActive(),
                                source,
                                additionalEventAttributes
                            );
                        })
                    );
                }
            }
        });
        this.beans.groupFilter?.updateFilterFlags(source, additionalEventAttributes);
        return AgPromise.all(promises);
    }

    private getFilterUiFromWrapper(filterWrapper: FilterWrapper): AgPromise<IFilterComp> | null {
        const filterUi = filterWrapper.filterUi;
        if (!filterUi) {
            return null;
        }
        if (filterUi.created) {
            return filterUi.promise;
        }
        const promise = filterUi.create();
        const createdFilterUi = filterUi as unknown as CreatedFilterUi;
        createdFilterUi.created = true;
        createdFilterUi.promise = promise;
        return promise;
    }

    public doFiltersPass(node: RowNode, colIdToSkip?: string, targetAggregates?: boolean): boolean {
        const { data, aggData } = node;

        const targetedFilters = targetAggregates ? this.activeAggregateFilters : this.activeColumnFilters;
        const targetedData = targetAggregates ? aggData : data;
        for (let i = 0; i < targetedFilters.length; i++) {
            const filter = targetedFilters[i];
            const { colId, isEvaluator } = filter;

            if (colId === colIdToSkip) {
                continue;
            }

            if (isEvaluator) {
                const evaluator = filter.evaluator;
                const model = this.model[colId] ?? null;
                if (!evaluator.doesFilterPass({ node, data: targetedData, model })) {
                    return false;
                }
            } else {
                const comp = filter.comp;
                if (typeof comp.doesFilterPass !== 'function') {
                    // because users can do custom filters, give nice error message
                    _error(91);
                    continue;
                }

                if (!comp.doesFilterPass({ node, data: targetedData })) {
                    return false;
                }
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
        const { rowRenderer, filterManager } = this.beans;
        const action = () => {
            if (this.isAlive()) {
                filterManager?.onFilterChanged(params);
            }
        };
        if (rowRenderer.isRefreshInProgress()) {
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

        return this.updateActiveFilters().then(() =>
            this.updateFilterFlagInColumns('filterChanged', additionalEventAttributes).then(() => {
                this.allColumnFilters.forEach((filterWrapper) => {
                    const filterUi = filterWrapper.filterUi;
                    if (!filterUi || !filterUi.created) {
                        return;
                    }
                    filterUi.promise.then((filter) => {
                        if (filter && filter !== filterInstance && filter.onAnyFilterChanged) {
                            filter.onAnyFilterChanged();
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
        const promises: AgPromise<void>[] = [];
        this.allColumnFilters.forEach((filterWrapper) => {
            const promise = this.getFilterUiFromWrapper(filterWrapper);
            if (promise) {
                promises.push(
                    promise.then((filter) => {
                        filter!.onNewRowsLoaded?.();
                    })
                );
            }
        });
        AgPromise.all(promises)
            .then(() => this.updateFilterFlagInColumns(source, { afterDataChange: true }))
            .then(() => this.updateActiveFilters());
    }

    private createGetValue(filterColumn: AgColumn): IFilterParams['getValue'] {
        const { filterValueSvc, colModel } = this.beans;
        return (rowNode, column) => {
            const columnToUse = column ? colModel.getCol(column) : filterColumn;
            return columnToUse ? filterValueSvc!.getValue(columnToUse, rowNode) : undefined;
        };
    }

    public isFilterActive(column: AgColumn): boolean {
        const filterWrapper = this.cachedFilter(column);
        if (filterWrapper?.isEvaluator) {
            return this.isEvaluatorActive(column);
        }
        const filter = filterWrapper?.filter;
        if (filter) {
            return filter.isFilterActive();
        }
        // if not created, should only be active if there's a model
        return this.getModelFromInitialState(column) != null;
    }

    private isEvaluatorActive(column: AgColumn): boolean {
        // all the existing filter code uses `_exists` rather than not null,
        // so need to keep handling `''` until all the code is updated to do a simple null check
        const active = _exists(this.model[column.getColId()]);
        if (active) {
            return active;
        }
        const groupFilter = this.beans.groupFilter;
        return groupFilter?.isGroupFilter(column) ? groupFilter.isFilterActive(column) : false;
    }

    public getOrCreateFilterUi(column: AgColumn): AgPromise<IFilterComp> | null {
        const filterWrapper = this.getOrCreateFilterWrapper(column);
        return filterWrapper ? this.getFilterUiFromWrapper(filterWrapper) : null;
    }

    private getOrCreateFilterWrapper(column: AgColumn): FilterWrapper | null {
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
        const { gos, dataTypeSvc } = this.beans;
        if (_isSetFilterByDefault(gos)) {
            defaultFilter = 'agSetColumnFilter';
        } else {
            const cellDataType = dataTypeSvc?.getBaseDataType(column);
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
        const { gos, dataTypeSvc } = this.beans;
        if (_isSetFilterByDefault(gos)) {
            defaultFloatingFilterType = 'agSetColumnFloatingFilter';
        } else {
            const cellDataType = dataTypeSvc?.getBaseDataType(column);
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

    private createFilterInstance(column: AgColumn): {
        compDetails: UserCompDetails | null;
        evaluator: FilterEvaluator | undefined;
        evaluatorParams: FilterEvaluatorParams | undefined;
        createFilterUi: (() => AgPromise<IFilterComp>) | null;
    } {
        const defaultFilter = this.getDefaultFilter(column);

        const colDef = column.getColDef();

        const { evaluator, evaluatorParams } = this.getEvaluator(column, defaultFilter) ?? {};

        let filterInstance: IFilterComp;
        const params = this.createFilterCompParams(column, !!evaluator, () => filterInstance);

        const compDetails = _getFilterDetails(this.beans.userCompFactory, colDef, params, defaultFilter);
        if (!compDetails) {
            return { compDetails: null, createFilterUi: null, evaluator, evaluatorParams };
        }

        const createFilterUi = () => {
            const filterPromise = compDetails.newAgStackInstance();
            filterPromise.then((r) => {
                filterInstance = r!;
            });
            return filterPromise;
        };
        return {
            compDetails,
            evaluator,
            evaluatorParams,
            createFilterUi,
        };
    }

    private createFilterCompParams(
        column: AgColumn,
        useEvaluator: boolean,
        getFilterInstance: () => IFilterComp,
        additionalParams?: object
    ): BaseFilterParams {
        const colDef = column.getColDef();
        const params: BaseFilterParams = {
            ...this.createFilterParams(column, colDef),
            filterModifiedCallback: () =>
                this.eventSvc.dispatchEvent({
                    type: 'filterModified',
                    column,
                    filterInstance: getFilterInstance(),
                }),
            doesRowPassOtherFilter: (node) =>
                this.beans.filterManager?.doesRowPassOtherFilters(column.getColId(), node as RowNode) ?? true,
        };

        const filterChangedCallback = this.filterChangedCallbackFactory(getFilterInstance, column);

        if (useEvaluator) {
            const displayParams = params as FilterDisplayParams;
            const colId = column.getColId();
            displayParams.model = this.model[colId];
            displayParams.onModelChange = (model, additionalEventAttributes?: any) => {
                this.model[colId] = model;
                this.refreshEvaluator(colId, model, 'ui').then(() => {
                    filterChangedCallback({ ...additionalEventAttributes, source: 'columnFilter' });
                });
            };
            displayParams.filterChangedCallback = () => {};
        } else {
            (params as IFilterParams).filterChangedCallback = filterChangedCallback;
        }

        return additionalParams ? { ...params, ...additionalParams } : params;
    }

    public createFilterParams(column: AgColumn, colDef: ColDef): BaseFilterParams {
        const params = this.gos.addGridCommonParams<BaseFilterParams>({
            column,
            colDef,
            rowModel: this.beans.rowModel, // @deprecated v33.1
            getValue: this.createGetValue(column),
            doesRowPassOtherFilter: () => true,
            filterModifiedCallback: () => {},
        });

        return params;
    }

    private async initEvaluator(evaluator: FilterEvaluator, evaluatorParams: FilterEvaluatorParams): Promise<void> {
        await evaluator.init?.(evaluatorParams);
    }

    private createFilterWrapper(column: AgColumn): FilterWrapper {
        const { compDetails, evaluator, evaluatorParams, createFilterUi } = this.createFilterInstance(column);

        if (evaluator) {
            return {
                column,
                initPromise: new AgPromise((resolve) => {
                    this.initEvaluator(evaluator, evaluatorParams!).then(() => resolve());
                }),
                isEvaluator: true,
                evaluator,
                evaluatorParams: evaluatorParams!,
                filterUi: createFilterUi
                    ? {
                          created: false,
                          create: createFilterUi,
                          filterParams: compDetails!.params,
                          compDetails: compDetails!,
                      }
                    : null,
            };
        }

        if (createFilterUi) {
            const promise = createFilterUi();
            const filterWrapper: LegacyFilterWrapper = {
                column,
                initPromise: promise.then(() => {}),
                filterUi: {
                    created: true,
                    create: createFilterUi,
                    filterParams: compDetails!.params,
                    compDetails: compDetails!,
                    promise,
                },
                isEvaluator: false,
            } as const;
            promise.then((filterComp) => {
                filterWrapper.filter = filterComp ?? undefined;
            });
            return filterWrapper;
        }

        return {
            column,
            initPromise: AgPromise.resolve(),
            filterUi: null,
            isEvaluator: false,
        };
    }

    private getEvaluator(
        column: AgColumn,
        defaultFilter: string
    ): { evaluator: FilterEvaluator; evaluatorParams: FilterEvaluatorParams } | undefined {
        const colDef = column.getColDef();
        let filterEvaluator = colDef.filterEvaluator;
        if (!filterEvaluator) {
            let filterName: string | undefined;
            const { compName, jsComp, fwComp } = _getFilterCompKeys(this.beans.frameworkOverrides, colDef);
            if (compName) {
                filterName = compName;
            } else {
                const usingDefaultFilter = jsComp == null && fwComp == null && colDef.filter === true;
                if (usingDefaultFilter) {
                    filterName = defaultFilter;
                }
            }
            const evaluatorTypeMap = {
                agSetColumnFilter: 'agSetColumnFilterEvaluator',
                // agMultiColumnFilter: 'agMultiColumnFilterEvaluator',
                agGroupColumnFilter: 'agGroupColumnFilterEvaluator',
                agNumberColumnFilter: 'agNumberColumnFilterEvaluator',
                agDateColumnFilter: 'agDateColumnFilterEvaluator',
                agTextColumnFilter: 'agTextColumnFilterEvaluator',
            } as const;
            const evaluatorName = evaluatorTypeMap[filterName as keyof typeof evaluatorTypeMap];
            if (evaluatorName) {
                filterEvaluator = () =>
                    this.createBean(
                        this.beans.registry.createDynamicBean<FilterEvaluator & BeanStub>(evaluatorName, true)!
                    );
            }
        }
        if (!filterEvaluator) {
            return undefined;
        }
        const evaluator = filterEvaluator(this.gos.addGridCommonParams({ column, colDef }));
        const evaluatorParams = this.createEvaluatorParams(column, 'init');
        return { evaluator, evaluatorParams };
    }

    private createEvaluatorParams(
        column: AgColumn,
        source: 'init' | 'ui' | 'apiModel' | 'apiParams'
    ): FilterEvaluatorParams {
        const colDef = column.getColDef();
        return this.gos.addGridCommonParams({
            colDef,
            column,
            getValue: this.createGetValue(column),
            source,
            model: this.model[column.getColId()],
            ...colDef.filterParams,
        });
    }

    private onColumnsChanged(): void {
        const columns: AgColumn[] = [];
        const { colModel, filterManager, groupFilter } = this.beans;

        this.allColumnFilters.forEach((wrapper, colId) => {
            let currentColumn: AgColumn | null;
            if (wrapper.column.isPrimary()) {
                currentColumn = colModel.getColDefCol(colId);
            } else {
                currentColumn = colModel.getCol(colId);
            }
            // group columns can be recreated with the same colId
            if (currentColumn && currentColumn === wrapper.column) {
                return;
            }

            columns.push(wrapper.column);
            this.disposeFilterWrapper(wrapper, 'columnChanged');
            this.disposeColumnListener(colId);
        });

        const allFiltersAreGroupFilters = groupFilter && columns.every((col) => groupFilter.isGroupFilter(col));
        // don't call `onFilterChanged` if only group column filter is present as it has no model
        if (columns.length > 0 && !allFiltersAreGroupFilters) {
            // When a filter changes as a side effect of a column changes,
            // we report 'api' as the source, so that the client can distinguish
            filterManager?.onFilterChanged({ columns, source: 'api' });
        }
    }

    public isFilterAllowed(column: AgColumn): boolean {
        const isFilterAllowed = column.isFilterAllowed();
        if (!isFilterAllowed) {
            return false;
        }
        // for group filters, can change dynamically whether they are allowed or not
        const groupFilter = this.beans.groupFilter;
        if (groupFilter?.isGroupFilter(column)) {
            return groupFilter.isFilterAllowed(column);
        }
        return true;
    }

    public getFloatingFilterCompDetails(column: AgColumn, showParentFilter: () => void): UserCompDetails | undefined {
        const parentFilterInstance = (callback: IFloatingFilterParentCallback<IFilter>) => {
            const filterComponent = this.getOrCreateFilterUi(column);

            if (filterComponent == null) {
                return;
            }

            filterComponent.then((instance) => {
                callback(_unwrapUserComp(instance!));
            });
        };

        const colDef = column.getColDef();
        let filterInstance: IFilterComp;
        const filterChangedCallback = this.filterChangedCallbackFactory(() => filterInstance, column);
        const filterParams = {
            ...this.createFilterParams(column, colDef),
            filterChangedCallback: () =>
                parentFilterInstance((parentFilterInstance) => {
                    filterInstance = parentFilterInstance as IFilterComp;
                    filterChangedCallback();
                }),
            filterModifiedCallback: () => {},
        };
        const { userCompFactory, frameworkOverrides } = this.beans;
        const finalFilterParams = _mergeFilterParamsWithApplicationProvidedParams(
            userCompFactory,
            colDef,
            filterParams
        );

        let defaultFloatingFilterType = _getDefaultFloatingFilterType(frameworkOverrides, colDef, () =>
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

        return _getFloatingFilterCompDetails(userCompFactory, colDef, params, defaultFloatingFilterType);
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
            this.disposeFilterWrapper(filterWrapper, source).then((wasActive) => {
                if (wasActive && this.isAlive()) {
                    this.beans.filterManager?.onFilterChanged({
                        columns: [column],
                        source: 'api',
                    });
                }
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
    ): AgPromise<boolean> {
        let isActive = false;
        // TODO - this method needs updating to destroy things correctly
        if (filterWrapper.isEvaluator) {
            isActive = this.isEvaluatorActive(filterWrapper.column);
            this.destroyBean(filterWrapper.evaluator);
        }
        const filterUi = filterWrapper.filterUi;
        if (filterUi) {
            if (filterUi.created) {
                return filterUi.promise.then((filter) => {
                    isActive = filterWrapper.isEvaluator ? isActive : !!filter?.isFilterActive();

                    this.destroyBean(filter);

                    this.setColFilterActive(filterWrapper.column, false, 'filterDestroyed');

                    this.allColumnFilters.delete(filterWrapper.column.getColId());

                    this.eventSvc.dispatchEvent({
                        type: 'filterDestroyed',
                        source,
                        column: filterWrapper.column,
                    });

                    return isActive;
                });
            }
        }
        return AgPromise.resolve(isActive);
    }

    private filterChangedCallbackFactory(getFilterInstance: () => IFilterComp<any>, column: AgColumn) {
        return (additionalEventAttributes?: any) => {
            const source: FilterChangedEventSourceType = additionalEventAttributes?.source ?? 'columnFilter';
            const params = {
                filter: getFilterInstance(),
                additionalEventAttributes,
                columns: [column],
                source,
            };
            this.callOnFilterChangedOutsideRenderCycle(params);
        };
    }

    private refreshFilter(colId: string): void {
        const filterWrapper = this.allColumnFilters.get(colId);
        if (!filterWrapper) {
            return;
        }

        const column = filterWrapper.column;
        const { compDetails } = column.isFilterAllowed() ? this.createFilterInstance(column) : { compDetails: null };

        // TODO - destroy logic needs to change

        // Case when filter component changes
        if (this.areFilterCompsDifferent(filterWrapper.filterUi?.compDetails ?? null, compDetails)) {
            this.destroyFilter(column, 'paramsUpdated');
            return;
        }
        // When filter wrapper does not have promise to retrieve FilterComp, destroy
        if (!filterWrapper.filterUi || !compDetails) {
            // TODO - do we want to do this for evaluators?
            this.destroyFilter(column, 'paramsUpdated');
            return;
        }

        // callbacks need to refer to the old filter instance not the new one
        const { filterModifiedCallback, filterChangedCallback } = filterWrapper.filterUi.filterParams;
        const newFilterParams = {
            ...(compDetails.params as IFilterParams | FilterDisplayParams),
            filterModifiedCallback,
            filterChangedCallback,
        };

        filterWrapper.filterUi.filterParams = newFilterParams;

        if (filterWrapper.isEvaluator) {
            filterWrapper.evaluatorParams = this.createEvaluatorParams(column, 'apiParams');
            this.refreshEvaluator(colId, this.model[colId] ?? null, 'apiParams').then((hasRefreshed) => {
                if (hasRefreshed) {
                    this.beans.filterManager?.onFilterChanged({ columns: [column], source: 'api' });
                }
            });
            return;
        }

        // Otherwise - Check for refresh method before destruction
        // If refresh() method is implemented - call it and destroy filter if it returns false
        // Otherwise - do nothing ( filter will not be destroyed - we assume new params are compatible with old ones )

        this.getFilterUiFromWrapper(filterWrapper)?.then((filter) => {
            const shouldRefreshFilter = filter?.refresh ? filter.refresh(newFilterParams as IFilterParams) : true;
            // framework wrapper always implements optional methods, but returns null if no underlying method
            if (shouldRefreshFilter === false) {
                this.destroyFilter(column, 'paramsUpdated');
            }
        });
    }

    private async refreshEvaluator(
        colId: string,
        model: any,
        source: 'ui' | 'apiModel' | 'apiParams'
    ): Promise<boolean> {
        const filterWrapper = this.allColumnFilters.get(colId);

        if (!filterWrapper || !filterWrapper.isEvaluator) {
            return false;
        }

        const { filterUi, evaluator, evaluatorParams } = filterWrapper;

        let modelChanged = false;

        if (evaluator && evaluatorParams) {
            const result = await evaluator.refresh?.({ ...evaluatorParams, model, source });
            if (result?.valid === false) {
                model = result.model ?? null;
                this.model[evaluatorParams.column.getColId()] = model;
                modelChanged = true;
            }
        }

        if (filterUi?.created) {
            const filter = await filterUi.promise;
            filter?.refresh?.({
                ...filterUi.filterParams,
                model,
                source: modelChanged && source === 'ui' ? 'validation' : source,
            } as FilterDisplayParams);
        }

        return modelChanged;
    }

    private setColumnFilterWrapper(column: AgColumn, filterWrapper: FilterWrapper): void {
        const colId = column.getColId();
        this.allColumnFilters.set(colId, filterWrapper);
        this.allColumnListeners.set(
            colId,
            this.addManagedListeners(column, { colDefChanged: () => this.refreshFilter(colId) })[0]
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
        const gridColumns = this.beans.colModel.getCols();
        return gridColumns.some((col) => col.getColDef().floatingFilter);
    }

    public getFilterInstance<TFilter extends IFilter>(key: string | AgColumn): Promise<TFilter | null | undefined> {
        const column = this.beans.colModel.getColDefCol(key);

        if (!column) {
            return Promise.resolve(undefined);
        }

        const filterPromise = this.getOrCreateFilterUi(column);

        if (!filterPromise) {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            filterPromise.then((filter) => {
                resolve(_unwrapUserComp(filter) as any);
            });
        });
    }

    private processFilterModelUpdateQueue(): void {
        this.filterModelUpdateQueue.forEach(({ model, source }) => this.setModel(model, source));
        this.filterModelUpdateQueue = [];
        this.columnFilterModelUpdateQueue.forEach(({ key, model, resolve }) => {
            this.setModelForColumn(key, model).then(() => resolve());
        });
        this.columnFilterModelUpdateQueue = [];
    }

    public getModelForColumn(key: string | AgColumn): any {
        const filterWrapper = this.getFilterWrapper(key);
        return filterWrapper ? this.getModelFromFilterWrapper(filterWrapper) : null;
    }

    public setModelForColumn(key: string | AgColumn, model: any): Promise<void> {
        if (this.beans.dataTypeSvc?.isPendingInference) {
            let resolve: () => void = () => {};
            const promise = new Promise<void>((res) => {
                resolve = res;
            });
            this.columnFilterModelUpdateQueue.push({ key, model, resolve });
            return promise;
        }
        return new Promise((resolve) => {
            this.setModelForColumnLegacy(key, model).then((result) => resolve(result!));
        });
    }

    public setModelForColumnLegacy(key: string | AgColumn, model: any): AgPromise<void> {
        const column = this.beans.colModel.getColDefCol(key);
        const filterWrapper = column ? this.getOrCreateFilterWrapper(column) : null;
        return filterWrapper ? this.setModelOnFilterWrapper(filterWrapper, model) : AgPromise.resolve();
    }

    private getFilterWrapper(key: string | AgColumn): FilterWrapper | null {
        const column = this.beans.colModel.getColDefCol(key);
        return column ? this.cachedFilter(column) ?? null : null;
    }

    public setColDefPropsForDataType(
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
                            value: this.beans.valueSvc.getValue(params.column as AgColumn, params.node),
                        });
                }
                break;
            }
        }
    }

    // additionalEventAttributes is used by provided simple floating filter, so it can add 'floatingFilter=true' to the event
    public setColFilterActive(
        column: AgColumn,
        active: boolean,
        source: ColumnEventType,
        additionalEventAttributes?: any
    ): void {
        if (column.filterActive !== active) {
            column.filterActive = active;
            column.dispatchColEvent('filterActiveChanged', source);
        }
        column.dispatchColEvent('filterChanged', source, additionalEventAttributes);
    }

    private setModelOnFilterWrapper(filterWrapper: FilterWrapper, newModel: any): AgPromise<void> {
        return new AgPromise((resolve) => {
            if (filterWrapper.isEvaluator) {
                const colId = filterWrapper.column.getColId();
                if (_exists(newModel)) {
                    this.model[colId] = newModel;
                } else {
                    delete this.model[colId];
                }
                this.refreshEvaluator(colId, newModel, 'apiModel').then(() => resolve());
                return;
            }

            const uiPromise = this.getFilterUiFromWrapper(filterWrapper);
            if (uiPromise) {
                uiPromise.then((filter) => {
                    if (typeof filter?.setModel !== 'function') {
                        _warn(65);
                        resolve();
                        return;
                    }

                    (filter.setModel(newModel) || AgPromise.resolve()).then(() => resolve());
                });
                return;
            }

            // no evaluator and no filter comp
            resolve();
        });
    }

    public override destroy() {
        super.destroy();
        this.allColumnFilters.forEach((filterWrapper) => this.disposeFilterWrapper(filterWrapper, 'gridDestroyed'));
        // don't need to destroy the listeners as they are managed listeners
        this.allColumnListeners.clear();
    }
}

interface BaseFilterUi {
    create: () => AgPromise<IFilterComp>;
    filterParams: IFilterParams;
    compDetails: UserCompDetails;
}

interface CreatedFilterUi extends BaseFilterUi {
    created: true;
    promise: AgPromise<IFilterComp>;
}

interface UncreatedFilterUi extends BaseFilterUi {
    created: false;
}

type FilterUi = CreatedFilterUi | UncreatedFilterUi;

interface BaseFilterWrapper {
    column: AgColumn;
    initPromise: AgPromise<void>;
    /**
     * `null` if invalid
     */
    filterUi: FilterUi | null;
}

interface LegacyFilterWrapper extends BaseFilterWrapper {
    isEvaluator: false;
    filter?: IFilterComp;
}

interface EvaluatorFilterWrapper extends BaseFilterWrapper {
    isEvaluator: true;
    evaluator: FilterEvaluator;
    evaluatorParams: FilterEvaluatorParams;
}

type FilterWrapper = LegacyFilterWrapper | EvaluatorFilterWrapper;
