import type { _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnFilterModule, ReadOnlyFloatingFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { MenuItemModule } from '../widgets/menuItemModule';
import { MultiFilter } from './multiFilter';
import { MultiFloatingFilterComp } from './multiFloatingFilter';

export const MultiFilterCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MultiFilterCoreModule'),
    userComponents: { agMultiColumnFilter: MultiFilter },
    dependsOn: [EnterpriseCoreModule, ColumnFilterModule, MenuItemModule],
};

export const MultiFloatingFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MultiFloatingFilterModule'),
    userComponents: { agMultiColumnFloatingFilter: MultiFloatingFilterComp },
    dependsOn: [MultiFilterCoreModule, ReadOnlyFloatingFilterModule],
};

export const MultiFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('MultiFilterModule'),
    dependsOn: [MultiFilterCoreModule, MultiFloatingFilterModule],
};
