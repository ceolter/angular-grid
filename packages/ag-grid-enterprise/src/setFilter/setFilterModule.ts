import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { SetFilter } from './setFilter';
import { SetFilterEvaluator } from './setFilterEvaluator';
import { SetFilterService } from './setFilterService';
import { SetFloatingFilterComp } from './setFloatingFilter';

/**
 * @feature Filtering -> Set Filter
 */
export const SetFilterModule: _ModuleWithoutApi = {
    moduleName: 'SetFilter',
    version: VERSION,
    beans: [SetFilterService],
    userComponents: { agSetColumnFilter: SetFilter, agSetColumnFloatingFilter: SetFloatingFilterComp },
    dynamicBeans: {
        agSetColumnFilterEvaluator: SetFilterEvaluator,
    },
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
