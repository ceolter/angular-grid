import type { _ColumnFilterGridApi, _FilterGridApi, _QuickFilterGridApi } from '../api/gridApi';
import { FilterStage } from '../clientSideRowModel/filterStage';
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
 * @internal
 */
export const ClientSideRowModelFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ClientSideRowModelFilterModule'),
    rowModels: ['clientSide'],
    beans: [FilterStage],
};

/**
 * @internal
 */
export const FilterCoreModule: _ModuleWithApi<_FilterGridApi> = {
    ...baseCommunityModule('FilterCoreModule'),
    beans: [FilterManager],
    apiFunctions: {
        isAnyFilterPresent,
        onFilterChanged,
    },
    css: [columnFiltersCSS],
    dependsOn: [ClientSideRowModelFilterModule],
};

/**
 * @internal
 */
export const FilterValueModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FilterValueModule'),
    beans: [FilterValueService],
};

/**
 * @internal
 */
export const ColumnFilterModule: _ModuleWithApi<_ColumnFilterGridApi> = {
    ...baseCommunityModule('ColumnFilterModule'),
    beans: [ColumnFilterService, FilterMenuFactory],
    dynamicBeans: { headerFilterCellCtrl: HeaderFilterCellCtrl as any },
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
 * @feature Filtering -> Custom Column Filters
 */
export const CustomFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CustomFilterModule'),
    userComponents: { agReadOnlyFloatingFilter: ReadOnlyFloatingFilter },
    dependsOn: [ColumnFilterModule],
};

/**
 * @feature Filtering -> Text Filter
 */
export const TextFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TextFilterModule'),
    dependsOn: [ColumnFilterModule],
    userComponents: {
        agTextColumnFilter: TextFilter,
        agTextColumnFloatingFilter: TextFloatingFilter,
    },
};

/**
 * @feature Filtering -> Number Filter
 */
export const NumberFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('NumberFilterModule'),
    dependsOn: [ColumnFilterModule],
    userComponents: {
        agNumberColumnFilter: NumberFilter,
        agNumberColumnFloatingFilter: NumberFloatingFilter,
    },
};

/**
 * @feature Filtering -> Date Filter
 */
export const DateFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DateFilterModule'),
    dependsOn: [ColumnFilterModule],
    userComponents: {
        agDateColumnFilter: DateFilter,
        agDateInput: DefaultDateComponent,
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
 * @feature Filtering -> External Filter
 * @gridOption doesExternalFilterPass
 */
export const ExternalFilterModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ExternalFilterModule'),
    dependsOn: [FilterCoreModule],
};
