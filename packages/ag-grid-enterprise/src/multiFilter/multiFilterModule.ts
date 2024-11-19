import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { MenuItemModule } from '../widgets/menuItemModule';
import { MultiFilter } from './multiFilter';
import { MultiFloatingFilterComp } from './multiFloatingFilter';

/**
 * @feature Filtering -> Multi Filter
 */
export const MultiFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MultiFilterModule'),
    userComponents: { agMultiColumnFilter: MultiFilter, agMultiColumnFloatingFilter: MultiFloatingFilterComp },
    dependsOn: [EnterpriseCoreModule, _ColumnFilterModule, MenuItemModule],
};
