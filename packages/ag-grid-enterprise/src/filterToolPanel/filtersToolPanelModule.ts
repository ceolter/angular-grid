import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _ColumnFilterModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { SideBarModule } from '../sideBar/sideBarModule';
import { VERSION } from '../version';
import { FiltersToolPanel } from './filtersToolPanel';

/**
 * @feature Accessories -> Filters Tool Panel
 */
export const FiltersToolPanelModule: _ModuleWithoutApi = {
    moduleName: 'FiltersToolPanel',
    version: VERSION,
    userComponents: { agFiltersToolPanel: FiltersToolPanel },
    icons: {
        // filter tool panel tab
        filtersToolPanel: 'filter',
    },
    dependsOn: [SideBarModule, EnterpriseCoreModule, _ColumnFilterModule],
};
