import type { _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnFilterModule, FloatingFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { SetFilter } from './setFilter';
import { SetFloatingFilterComp } from './setFloatingFilter';

export const SetFilterCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFilterCoreModule'),
    userComponents: { agSetColumnFilter: SetFilter },
    dependsOn: [EnterpriseCoreModule, ColumnFilterModule],
};

export const SetFloatingFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFloatingFilterModule'),
    userComponents: { agSetColumnFloatingFilter: SetFloatingFilterComp },
    dependsOn: [SetFilterCoreModule, FloatingFilterModule],
};

export const SetFilterModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('SetFilterModule'),
    dependsOn: [SetFilterCoreModule, SetFloatingFilterModule],
};
