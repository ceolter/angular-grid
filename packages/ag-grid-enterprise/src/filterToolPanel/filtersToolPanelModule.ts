import type { _ModuleWithoutApi } from 'ag-grid-community';
import { ColumnFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { SideBarModule } from '../sideBar/sideBarModule';
import { FiltersToolPanel } from './filtersToolPanel';

/**
 * @feature Accessories -> Filters Tool Panel
 */
export const FiltersToolPanelModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('FiltersToolPanelModule'),
    userComponents: { agFiltersToolPanel: FiltersToolPanel },
    icons: {
        // filter tool panel tab
        filtersToolPanel: 'filter',
    },
    dependsOn: [SideBarModule, EnterpriseCoreModule, ColumnFilterModule],
};
