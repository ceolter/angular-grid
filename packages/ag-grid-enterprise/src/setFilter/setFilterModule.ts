import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { SetFilter } from './setFilter';
import { SetFloatingFilterComp } from './setFloatingFilter';

/**
 * @feature Filtering -> Set Filter
 */
export const SetFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFilter'),
    userComponents: { agSetColumnFilter: SetFilter, agSetColumnFloatingFilter: SetFloatingFilterComp },
    icons: {
        // set filter tree list group contracted (click to expand)
        setFilterGroupClosed: 'tree-closed',
        // set filter tree list group expanded (click to contract)
        setFilterGroupOpen: 'tree-open',
        // set filter tree list expand/collapse all button, shown when some children are expanded and
        //     others are collapsed
        setFilterGroupIndeterminate: 'tree-indeterminate',
    },
    dependsOn: [EnterpriseCoreModule, _ColumnFilterModule],
};
