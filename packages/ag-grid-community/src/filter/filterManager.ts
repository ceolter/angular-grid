import type { ColumnModel } from '../columns/columnModel';
import type { DataTypeService } from '../columns/dataTypeService';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef } from '../entities/colDef';
import type { CoreDataTypeDefinition, DataTypeFormatValueFunc } from '../entities/dataType';
import type { RowNode } from '../entities/rowNode';
import type { FilterChangedEvent, FilterChangedEventSourceType } from '../events';
import { _getGroupAggFiltering } from '../gridOptionsUtils';
import type { AdvancedFilterModel } from '../interfaces/advancedFilterModel';
import type { IAdvancedFilterService } from '../interfaces/iAdvancedFilterService';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { FilterModel, IFilter, IFilterComp, IFilterParams } from '../interfaces/iFilter';
import type { UserCompDetails } from '../interfaces/iUserCompDetails';
import { _mergeDeep } from '../utils/object';
import { AgPromise } from '../utils/promise';
import { _warn } from '../validation/logging';
import type { ColumnFilterService, FilterWrapper } from './columnFilterService';
import type { QuickFilterService } from './quickFilterService';

export class FilterManager extends BeanStub implements NamedBean {
    beanName = 'filterManager' as const;

    private colModel: ColumnModel;
    private dataTypeSvc?: DataTypeService;
    private quickFilter?: QuickFilterService;
    private advancedFilter: IAdvancedFilterService;
    private colFilter?: ColumnFilterService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.dataTypeSvc = beans.dataTypeSvc;
        this.quickFilter = beans.quickFilter;
        this.advancedFilter = beans.advancedFilter;
        this.colFilter = beans.colFilter;
    }

    // A cached version of gridOptions.isExternalFilterPresent so its not called for every row
    private externalFilterPresent: boolean;

    private aggFiltering: boolean;

    // when we're waiting for cell data types to be inferred, we need to defer filter model updates
    private advancedFilterModelUpdateQueue: (AdvancedFilterModel | null | undefined)[] = [];

    public postConstruct(): void {
        const refreshFiltersForAggregations = this.refreshFiltersForAggregations.bind(this);
        const updateAdvancedFilterColumns = this.updateAdvancedFilterColumns.bind(this);
        this.addManagedEventListeners({
            columnValueChanged: refreshFiltersForAggregations,
            columnPivotChanged: refreshFiltersForAggregations,
            columnPivotModeChanged: refreshFiltersForAggregations,
            newColumnsLoaded: updateAdvancedFilterColumns,
            columnVisible: updateAdvancedFilterColumns,
            advancedFilterEnabledChanged: ({ enabled }) => this.onAdvancedFilterEnabledChanged(enabled),
            dataTypesInferred: this.processFilterModelUpdateQueue.bind(this),
        });

        this.externalFilterPresent = this.isExternalFilterPresentCallback();
        this.addManagedPropertyListeners(['isExternalFilterPresent', 'doesExternalFilterPass'], () => {
            this.onFilterChanged({ source: 'api' });
        });

        this.updateAggFiltering();
        this.addManagedPropertyListener('groupAggFiltering', () => {
            this.updateAggFiltering();
            this.onFilterChanged();
        });

        if (this.quickFilter) {
            this.addManagedListeners(this.quickFilter, {
                quickFilterChanged: () => this.onFilterChanged({ source: 'quickFilter' }),
            });
        }
    }

    private isExternalFilterPresentCallback() {
        const isFilterPresent = this.gos.getCallback('isExternalFilterPresent');
        if (typeof isFilterPresent === 'function') {
            return isFilterPresent({});
        }
        return false;
    }

    private doesExternalFilterPass(node: RowNode) {
        const doesFilterPass = this.gos.get('doesExternalFilterPass');
        if (typeof doesFilterPass === 'function') {
            return doesFilterPass(node);
        }
        return false;
    }

    public setFilterModel(model: FilterModel | null, source: FilterChangedEventSourceType = 'api'): void {
        if (this.isAdvancedFilterEnabled()) {
            this.warnAdvancedFilters();
            return;
        }

        this.colFilter?.setFilterModel(model, source);
    }

    public getFilterModel(): FilterModel {
        return this.colFilter?.getFilterModel() ?? {};
    }

    public isColumnFilterPresent(): boolean {
        return !!this.colFilter?.isColumnFilterPresent();
    }

    public isAggregateFilterPresent(): boolean {
        return !!this.colFilter?.isAggregateFilterPresent();
    }

    public isExternalFilterPresent(): boolean {
        return this.externalFilterPresent;
    }

    public isChildFilterPresent(): boolean {
        return (
            this.isColumnFilterPresent() ||
            this.isQuickFilterPresent() ||
            this.isExternalFilterPresent() ||
            this.isAdvancedFilterPresent()
        );
    }

    private isAdvancedFilterPresent(): boolean {
        return this.isAdvancedFilterEnabled() && this.advancedFilter.isFilterPresent();
    }

    private onAdvancedFilterEnabledChanged(enabled: boolean): void {
        if (enabled) {
            if (this.colFilter?.disableColumnFilters()) {
                this.onFilterChanged({ source: 'advancedFilter' });
            }
        } else {
            if (this.advancedFilter?.isFilterPresent()) {
                this.advancedFilter.setModel(null);
                this.onFilterChanged({ source: 'advancedFilter' });
            }
        }
    }

    public isAdvancedFilterEnabled(): boolean {
        return !!this.advancedFilter?.isEnabled();
    }

    public isAdvancedFilterHeaderActive(): boolean {
        return this.isAdvancedFilterEnabled() && this.advancedFilter.isHeaderActive();
    }

    public isAnyFilterPresent(): boolean {
        return (
            this.isQuickFilterPresent() ||
            this.isColumnFilterPresent() ||
            this.isAggregateFilterPresent() ||
            this.isExternalFilterPresent() ||
            this.isAdvancedFilterPresent()
        );
    }

    public resetQuickFilterCache(): void {
        this.quickFilter?.resetQuickFilterCache();
    }

    private refreshFiltersForAggregations() {
        const isAggFiltering = _getGroupAggFiltering(this.gos);
        if (isAggFiltering) {
            this.onFilterChanged();
        }
    }

    public onFilterChanged(
        params: {
            source?: FilterChangedEventSourceType;
            filterInstance?: IFilterComp;
            additionalEventAttributes?: any;
            columns?: AgColumn[];
        } = {}
    ): void {
        const { source, additionalEventAttributes, columns = [] } = params;
        this.externalFilterPresent = this.isExternalFilterPresentCallback();
        (this.colFilter ? this.colFilter.updateBeforeFilterChanged(params) : AgPromise.resolve()).then(() => {
            const filterChangedEvent: WithoutGridCommon<FilterChangedEvent> = {
                source,
                type: 'filterChanged',
                columns,
            };

            if (additionalEventAttributes) {
                _mergeDeep(filterChangedEvent, additionalEventAttributes);
            }

            this.eventSvc.dispatchEvent(filterChangedEvent);

            this.colFilter?.updateAfterFilterChanged();
        });
    }

    public isSuppressFlashingCellsBecauseFiltering(): boolean {
        return !!this.colFilter?.isSuppressFlashingCellsBecauseFiltering();
    }

    public isQuickFilterPresent(): boolean {
        return !!this.quickFilter?.isQuickFilterPresent();
    }

    private updateAggFiltering(): void {
        this.aggFiltering = !!_getGroupAggFiltering(this.gos);
    }

    public isAggregateQuickFilterPresent(): boolean {
        return this.isQuickFilterPresent() && this.shouldApplyQuickFilterAfterAgg();
    }

    private isNonAggregateQuickFilterPresent(): boolean {
        return this.isQuickFilterPresent() && !this.shouldApplyQuickFilterAfterAgg();
    }

    private shouldApplyQuickFilterAfterAgg(): boolean {
        return (this.aggFiltering || this.colModel.isPivotMode()) && !this.gos.get('applyQuickFilterBeforePivotOrAgg');
    }

    public doesRowPassOtherFilters(filterToSkip: IFilterComp, node: any): boolean {
        return this.doesRowPassFilter({ rowNode: node, filterInstanceToSkip: filterToSkip });
    }

    public doesRowPassAggregateFilters(params: { rowNode: RowNode; filterInstanceToSkip?: IFilterComp }): boolean {
        // check quick filter
        if (this.isAggregateQuickFilterPresent() && !this.quickFilter!.doesRowPassQuickFilter(params.rowNode)) {
            return false;
        }

        if (
            this.isAggregateFilterPresent() &&
            !this.colFilter!.doAggregateFiltersPass(params.rowNode, params.filterInstanceToSkip)
        ) {
            return false;
        }

        // got this far, all filters pass
        return true;
    }

    public doesRowPassFilter(params: { rowNode: RowNode; filterInstanceToSkip?: IFilterComp }): boolean {
        // the row must pass ALL of the filters, so if any of them fail,
        // we return true. that means if a row passes the quick filter,
        // but fails the column filter, it fails overall

        // first up, check quick filter
        if (this.isNonAggregateQuickFilterPresent() && !this.quickFilter!.doesRowPassQuickFilter(params.rowNode)) {
            return false;
        }

        // secondly, give the client a chance to reject this row
        if (this.isExternalFilterPresent() && !this.doesExternalFilterPass(params.rowNode)) {
            return false;
        }

        // lastly, check column filter
        if (
            this.isColumnFilterPresent() &&
            !this.colFilter!.doColumnFiltersPass(params.rowNode, params.filterInstanceToSkip)
        ) {
            return false;
        }

        if (this.isAdvancedFilterPresent() && !this.advancedFilter.doesFilterPass(params.rowNode)) {
            return false;
        }

        // got this far, all filters pass
        return true;
    }

    public isFilterActive(column: AgColumn): boolean {
        return !!this.colFilter?.isFilterActive(column);
    }

    public getOrCreateFilterWrapper(column: AgColumn): FilterWrapper | null {
        return this.colFilter?.getOrCreateFilterWrapper(column) ?? null;
    }

    public getDefaultFloatingFilter(column: AgColumn): string {
        return this.colFilter!.getDefaultFloatingFilter(column);
    }

    public createFilterParams(column: AgColumn, colDef: ColDef): IFilterParams {
        return this.colFilter!.createFilterParams(column, colDef);
    }

    // for group filters, can change dynamically whether they are allowed or not
    public isFilterAllowed(column: AgColumn): boolean {
        if (this.isAdvancedFilterEnabled()) {
            return false;
        }
        return !!this.colFilter?.isFilterAllowed(column);
    }

    public getFloatingFilterCompDetails(column: AgColumn, showParentFilter: () => void): UserCompDetails | undefined {
        return this.colFilter?.getFloatingFilterCompDetails(column, showParentFilter);
    }

    public getCurrentFloatingFilterParentModel(column: AgColumn): any {
        return this.colFilter?.getCurrentFloatingFilterParentModel(column);
    }

    // destroys the filter, so it no longer takes part
    public destroyFilter(column: AgColumn, source: 'api' | 'columnChanged' | 'paramsUpdated' = 'api'): void {
        this.colFilter?.destroyFilter(column, source);
    }

    public areFilterCompsDifferent(
        oldCompDetails: UserCompDetails | null,
        newCompDetails: UserCompDetails | null
    ): boolean {
        return !!this.colFilter?.areFilterCompsDifferent(oldCompDetails, newCompDetails);
    }

    public getAdvancedFilterModel(): AdvancedFilterModel | null {
        return this.isAdvancedFilterEnabled() ? this.advancedFilter.getModel() : null;
    }

    public setAdvancedFilterModel(expression: AdvancedFilterModel | null | undefined): void {
        if (!this.isAdvancedFilterEnabled()) {
            return;
        }
        if (this.dataTypeSvc?.isPendingInference()) {
            this.advancedFilterModelUpdateQueue.push(expression);
            return;
        }
        this.advancedFilter.setModel(expression ?? null);
        this.onFilterChanged({ source: 'advancedFilter' });
    }

    public toggleAdvancedFilterBuilder(show: boolean, source: 'api' | 'ui'): void {
        if (!this.isAdvancedFilterEnabled()) {
            return;
        }
        this.advancedFilter.getCtrl().toggleFilterBuilder({ source, force: show });
    }

    private updateAdvancedFilterColumns(): void {
        if (!this.isAdvancedFilterEnabled()) {
            return;
        }
        if (this.advancedFilter.updateValidity()) {
            this.onFilterChanged({ source: 'advancedFilter' });
        }
    }

    public hasFloatingFilters(): boolean {
        if (this.isAdvancedFilterEnabled()) {
            return false;
        }
        return !!this.colFilter?.hasFloatingFilters();
    }

    public getColumnFilterInstance<TFilter extends IFilter>(
        key: string | AgColumn
    ): Promise<TFilter | null | undefined> {
        if (this.isAdvancedFilterEnabled()) {
            this.warnAdvancedFilters();
            return Promise.resolve(undefined);
        }
        return this.colFilter?.getColumnFilterInstance(key) ?? Promise.resolve(undefined);
    }

    private warnAdvancedFilters(): void {
        // Column Filter API methods have been disabled as Advanced Filters are enabled
        _warn(68);
    }

    public setupAdvancedFilterHeaderComp(eCompToInsertBefore: HTMLElement): void {
        this.advancedFilter?.getCtrl().setupHeaderComp(eCompToInsertBefore);
    }

    public getHeaderRowCount(): number {
        return this.isAdvancedFilterHeaderActive() ? 1 : 0;
    }

    public getHeaderHeight(): number {
        return this.isAdvancedFilterHeaderActive() ? this.advancedFilter.getCtrl().getHeaderHeight() : 0;
    }

    private processFilterModelUpdateQueue(): void {
        this.advancedFilterModelUpdateQueue.forEach((model) => this.setAdvancedFilterModel(model));
        this.advancedFilterModelUpdateQueue = [];
    }

    public getColumnFilterModel(key: string | AgColumn): any {
        return this.colFilter?.getColumnFilterModel(key);
    }

    public setColumnFilterModel(key: string | AgColumn, model: any): Promise<void> {
        if (this.isAdvancedFilterEnabled()) {
            this.warnAdvancedFilters();
            return Promise.resolve();
        }
        return this.colFilter?.setColumnFilterModel(key, model) ?? Promise.resolve();
    }

    public setColDefPropertiesForDataType(
        colDef: ColDef,
        dataTypeDefinition: CoreDataTypeDefinition,
        formatValue: DataTypeFormatValueFunc
    ): void {
        this.colFilter?.setColDefPropertiesForDataType(colDef, dataTypeDefinition, formatValue);
    }
}
