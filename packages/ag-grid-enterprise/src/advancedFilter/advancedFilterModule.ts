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
    icons: {
        // Builder button in Advanced Filter
        advancedFilterBuilder: 'group',
        // drag handle used to pick up Advanced Filter Builder rows
        advancedFilterBuilderDrag: 'grip',
        // Advanced Filter Builder row validation error
        advancedFilterBuilderInvalid: 'not-allowed',
        // shown on Advanced Filter Builder rows to move them up
        advancedFilterBuilderMoveUp: 'up',
        // shown on Advanced Filter Builder rows to move them down
        advancedFilterBuilderMoveDown: 'down',
        // shown on Advanced Filter Builder rows to add new rows
        advancedFilterBuilderAdd: 'plus',
        // shown on Advanced Filter Builder rows to remove row
        advancedFilterBuilderRemove: 'minus',
        // shown on Advanced Filter Builder selection pills
        advancedFilterBuilderSelectOpen: 'small-down',
        // remove for rich select editor pills
        richSelectRemove: 'cancel',
    },
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
