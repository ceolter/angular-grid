import type { _ModuleWithApi, _ModuleWithoutApi, _StatusBarGridApi } from 'ag-grid-community';
import { KeyboardNavigationCoreModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { AgStatusBarSelector } from './agStatusBar';
import { AggregationComp } from './providedPanels/aggregationComp';
import { FilteredRowsComp } from './providedPanels/filteredRowsComp';
import { SelectedRowsComp } from './providedPanels/selectedRowsComp';
import { TotalAndFilteredRowsComp } from './providedPanels/totalAndFilteredRowsComp';
import { TotalRowsComp } from './providedPanels/totalRowsComp';
import { getStatusPanel } from './statusBarApi';
import { StatusBarService } from './statusBarService';

/**
 * @feature Accessories -> Status Bar
 * @gridOption statusBar
 */
export const StatusBarCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('StatusBarCoreModule'),
    beans: [StatusBarService],
    userComponents: {
        agAggregationComponent: AggregationComp,
        agTotalRowCountComponent: TotalRowsComp,
        agFilteredRowCountComponent: FilteredRowsComp,
        agTotalAndFilteredRowCountComponent: TotalAndFilteredRowsComp,
    },
    selectors: [AgStatusBarSelector],
    dependsOn: [EnterpriseCoreModule, KeyboardNavigationCoreModule],
};

/**
 * @feature Accessories -> Status Bar
 */
export const StatusBarSelectionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('StatusBarSelectionModule'),
    userComponents: { agSelectedRowCountComponent: SelectedRowsComp },
    dependsOn: [StatusBarCoreModule],
};

/**
 * @feature Accessories -> Status Bar
 */
export const StatusBarApiModule: _ModuleWithApi<_StatusBarGridApi> = {
    ...baseEnterpriseModule('StatusBarApiModule'),
    apiFunctions: {
        getStatusPanel,
    },
    dependsOn: [StatusBarCoreModule],
};

/**
 * @feature Accessories -> Status Bar
 */
export const StatusBarModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('StatusBarModule'),
    dependsOn: [StatusBarCoreModule, StatusBarApiModule, StatusBarSelectionModule],
};
