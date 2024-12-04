import type { _AdvancedFilterGridApi, _ModuleWithApi } from 'ag-grid-community';
import { _FilterCoreModule, _FilterValueModule, _PopupModule, _SharedDragAndDropModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { advancedFilterCSS } from './advanced-filter.css-GENERATED';
import {
    getAdvancedFilterModel,
    hideAdvancedFilterBuilder,
    setAdvancedFilterModel,
    showAdvancedFilterBuilder,
} from './advancedFilterApi';
import { AdvancedFilterExpressionService } from './advancedFilterExpressionService';
import { AdvancedFilterService } from './advancedFilterService';

/**
 * @feature Filtering -> Advanced Filter
 * @gridOption enableAdvanced Filter
 */
export const AdvancedFilterModule: _ModuleWithApi<_AdvancedFilterGridApi> = {
    moduleName: 'AdvancedFilter',
    version: VERSION,
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
    apiFunctions: {
        getAdvancedFilterModel,
        setAdvancedFilterModel,
        showAdvancedFilterBuilder,
        hideAdvancedFilterBuilder,
    },
    dependsOn: [EnterpriseCoreModule, _FilterCoreModule, _SharedDragAndDropModule, _PopupModule, _FilterValueModule],
    css: [advancedFilterCSS],
};
