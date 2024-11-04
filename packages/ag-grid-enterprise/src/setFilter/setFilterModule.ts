import type { _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnFilterModule, FloatingFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { SetFilter } from './setFilter';
import { SetFloatingFilterComp } from './setFloatingFilter';

/**
 * @feature Filtering -> Set Filter
 */
export const SetFilterCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFilterCoreModule'),
    userComponents: { agSetColumnFilter: SetFilter },
    icons: {
        // set filter tree list group contracted (click to expand)
        setFilterGroupClosed: 'tree-closed',
        // set filter tree list group expanded (click to contract)
        setFilterGroupOpen: 'tree-open',
        // set filter tree list expand/collapse all button, shown when some children are expanded and
        //     others are collapsed
        setFilterGroupIndeterminate: 'tree-indeterminate',
    },
    dependsOn: [EnterpriseCoreModule, ColumnFilterModule],
};

/**
 * @feature Filtering -> Set Filter
 */
export const SetFloatingFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFloatingFilterModule'),
    userComponents: { agSetColumnFloatingFilter: SetFloatingFilterComp },
    dependsOn: [SetFilterCoreModule, FloatingFilterModule],
};

/**
 * @feature Filtering -> Set Filter
 */
export const SetFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFilterModule'),
    dependsOn: [SetFilterCoreModule, SetFloatingFilterModule],
};
