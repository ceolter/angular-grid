import type { _AdvancedFilterGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { DragAndDropModule, FilterCoreModule, FilterValueModule, PopupModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { advancedFilterCSS } from './advanced-filter.css-GENERATED';
import {
    getAdvancedFilterModel,
    hideAdvancedFilterBuilder,
    setAdvancedFilterModel,
    showAdvancedFilterBuilder,
} from './advancedFilterApi';
import { AdvancedFilterExpressionService } from './advancedFilterExpressionService';
import { AdvancedFilterService } from './advancedFilterService';

export const AdvancedFilterCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('AdvancedFilterCoreModule'),
    beans: [AdvancedFilterService, AdvancedFilterExpressionService],
    dependsOn: [EnterpriseCoreModule, FilterCoreModule, DragAndDropModule, PopupModule, FilterValueModule],
    css: [advancedFilterCSS],
};

export const AdvancedFilterApiModule: _ModuleWithApi<_AdvancedFilterGridApi> = {
    ...baseEnterpriseModule('AdvancedFilterApiModule'),
    apiFunctions: {
        getAdvancedFilterModel,
        setAdvancedFilterModel,
        showAdvancedFilterBuilder,
        hideAdvancedFilterBuilder,
    },
    dependsOn: [AdvancedFilterCoreModule],
};

export const AdvancedFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('AdvancedFilterModule'),
    dependsOn: [AdvancedFilterCoreModule, AdvancedFilterApiModule],
};
