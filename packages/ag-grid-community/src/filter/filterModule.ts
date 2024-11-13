import type { _ColumnFilterGridApi, _FilterGridApi, _QuickFilterGridApi } from '../api/gridApi';
import { HeaderFilterCellCtrl } from '../headerRendering/cells/floatingFilter/headerFilterCellCtrl';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { SharedMenuModule } from '../misc/menu/sharedMenuModule';
import { PopupModule } from '../widgets/popupModule';
import { columnFiltersCSS } from './column-filters.css-GENERATED';
import {
    destroyFilter,
    getColumnFilterInstance,
    getColumnFilterModel,
    getFilterModel,
    isColumnFilterPresent,
    setColumnFilterModel,
    setFilterModel,
    showColumnFilter,
} from './columnFilterApi';
import { ColumnFilterService } from './columnFilterService';
import { isAnyFilterPresent, onFilterChanged } from './filterApi';
import { FilterManager } from './filterManager';
import { FilterMenuFactory } from './filterMenuFactory';
import { FilterValueService } from './filterValueService';
import { ReadOnlyFloatingFilter } from './floating/provided/readOnlyFloatingFilter';
import { DateFilter } from './provided/date/dateFilter';
import { DateFloatingFilter } from './provided/date/dateFloatingFilter';
import { DefaultDateComponent } from './provided/date/defaultDateComponent';
import { NumberFilter } from './provided/number/numberFilter';
import { NumberFloatingFilter } from './provided/number/numberFloatingFilter';
import { TextFilter } from './provided/text/textFilter';
import { TextFloatingFilter } from './provided/text/textFloatingFilter';
import { getQuickFilter, isQuickFilterPresent, resetQuickFilter } from './quickFilterApi';
import { QuickFilterService } from './quickFilterService';

/**
 * @feature Filtering
 */
export const FilterCoreModule: _ModuleWithApi<_FilterGridApi> = {
    ...baseCommunityModule('FilterCoreModule'),
    beans: [FilterManager],
    apiFunctions: {
        isAnyFilterPresent,
        onFilterChanged,
    },
    css: [columnFiltersCSS],
};

/**
 * @internal
 */
export const FilterValueModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterValueModule'),
    beans: [FilterValueService],
};

/**
 * @feature Filtering -> Column Filters
 * @colDef filter
 */
export const ColumnFilterModule: _ModuleWithApi<_ColumnFilterGridApi> = {
    ...baseCommunityModule('ColumnFilterModule'),
    beans: [ColumnFilterService, FilterMenuFactory],
    icons: {
        // open filter button - header, floating filter, menu
        filter: 'filter',
        // filter is applied - header (legacy column menu), filter tool panel
        filterActive: 'filter',
    },
    apiFunctions: {
        isColumnFilterPresent,
        getColumnFilterInstance,
        destroyFilter,
        setFilterModel,
        getFilterModel,
        getColumnFilterModel,
        setColumnFilterModel,
        showColumnFilter,
    },
    dependsOn: [FilterCoreModule, PopupModule, FilterValueModule, SharedMenuModule],
};

/**
 * @feature Filtering -> Column Filters
 * @colDef floatingFilter
 */
export const FloatingFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FloatingFilterModule'),
    dynamicBeans: { headerFilterCellCtrl: HeaderFilterCellCtrl as any },
    dependsOn: [ColumnFilterModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const ReadOnlyFloatingFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ReadOnlyFloatingFilterModule'),
    userComponents: { agReadOnlyFloatingFilter: ReadOnlyFloatingFilter },
    dependsOn: [FloatingFilterModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const SimpleFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SimpleFilterModule'),
    dependsOn: [ColumnFilterModule],
    userComponents: {
        agTextColumnFilter: TextFilter,
        agNumberColumnFilter: NumberFilter,
        agDateColumnFilter: DateFilter,
        agDateInput: DefaultDateComponent,
    },
};

/**
 * @feature Filtering -> Column Filters
 */
export const SimpleFloatingFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SimpleFloatingFilterModule'),
    dependsOn: [SimpleFilterModule, FloatingFilterModule],
    userComponents: {
        agTextColumnFloatingFilter: TextFloatingFilter,
        agNumberColumnFloatingFilter: NumberFloatingFilter,
        agDateColumnFloatingFilter: DateFloatingFilter,
    },
};

/**
 * @feature Filtering -> Quick Filter
 * @gridOption quickFilterText
 */
export const QuickFilterModule: _ModuleWithApi<_QuickFilterGridApi> = {
    ...baseCommunityModule('QuickFilterModule'),
    rowModels: ['clientSide'],
    beans: [QuickFilterService],
    apiFunctions: {
        isQuickFilterPresent,
        getQuickFilter,
        resetQuickFilter,
    },
    dependsOn: [FilterCoreModule, FilterValueModule],
};

/**
 * @feature Filtering
 */
export const FilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterModule'),
    dependsOn: [SimpleFloatingFilterModule, ReadOnlyFloatingFilterModule, QuickFilterModule],
};
