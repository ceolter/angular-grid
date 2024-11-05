import type { _ColumnFilterGridApi, _FilterGridApi, _QuickFilterGridApi } from '../api/gridApi';
import { HeaderFilterCellCtrl } from '../headerRendering/cells/floatingFilter/headerFilterCellCtrl';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { CommunityMenuApiModule, SharedMenuModule } from '../misc/menu/sharedMenuModule';
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
export const FilterCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterCoreModule'),
    beans: [FilterManager],
    css: [columnFiltersCSS],
};

/**
 * @feature Filtering
 */
export const FilterApiModule: _ModuleWithApi<_FilterGridApi> = {
    ...baseCommunityModule('FilterApiModule'),
    apiFunctions: {
        isAnyFilterPresent,
        onFilterChanged,
    },
    dependsOn: [FilterCoreModule],
};

/**
 * @feature Filtering
 */
export const FilterValueModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterValueModule'),
    beans: [FilterValueService],
};

/**
 * @feature Filtering -> Column Filters
 * @colDef filter
 */
export const ColumnFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnFilterModule'),
    beans: [ColumnFilterService],
    icons: {
        // open filter button - header, floating filter, menu
        filter: 'filter',
        // filter is applied - header (legacy column menu), filter tool panel
        filterActive: 'filter',
    },
    dependsOn: [FilterCoreModule, PopupModule, FilterValueModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const ColumnFilterMenuModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnFilterMenuModule'),
    beans: [FilterMenuFactory],
    dependsOn: [ColumnFilterModule, PopupModule, SharedMenuModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const ColumnFilterApiModule: _ModuleWithApi<_ColumnFilterGridApi> = {
    ...baseCommunityModule('ColumnFilterApiModule'),
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
    dependsOn: [ColumnFilterModule, FilterApiModule, CommunityMenuApiModule],
};

/**
 * @feature Filtering -> Column Filters
 * @colDef floatingFilter
 */
export const FloatingFilterCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FloatingFilterCoreModule'),
    dynamicBeans: { headerFilterCellCtrl: HeaderFilterCellCtrl as any },
    dependsOn: [ColumnFilterModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const FloatingFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FloatingFilterModule'),
    dependsOn: [FloatingFilterCoreModule, ColumnFilterModule],
};

/**
 * @feature Filtering -> Column Filters
 */
export const ReadOnlyFloatingFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ReadOnlyFloatingFilterModule'),
    userComponents: { agReadOnlyFloatingFilter: ReadOnlyFloatingFilter },
    dependsOn: [FloatingFilterCoreModule],
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
    dependsOn: [SimpleFilterModule, FloatingFilterCoreModule],
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
export const QuickFilterCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('QuickFilterCoreModule'),
    rowModels: ['clientSide'],
    beans: [QuickFilterService],
    dependsOn: [FilterCoreModule, FilterValueModule],
};

/**
 * @feature Filtering -> Quick Filter
 */
export const QuickFilterApiModule: _ModuleWithApi<_QuickFilterGridApi> = {
    ...baseCommunityModule('QuickFilterApiModule'),
    apiFunctions: {
        isQuickFilterPresent,
        getQuickFilter,
        resetQuickFilter,
    },
    dependsOn: [QuickFilterCoreModule],
};

/**
 * @feature Filtering -> Quick Filter
 */
export const QuickFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('QuickFilterModule'),
    dependsOn: [QuickFilterCoreModule, QuickFilterApiModule],
};

/**
 * @feature Filtering
 */
export const FilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterModule'),
    dependsOn: [
        SimpleFloatingFilterModule,
        ReadOnlyFloatingFilterModule,
        QuickFilterModule,
        ColumnFilterApiModule,
        ColumnFilterMenuModule,
    ],
};
