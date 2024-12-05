import type { _ModuleWithApi, _StatusBarGridApi } from 'ag-grid-community';
import { _KeyboardNavigationModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
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
export const StatusBarModule: _ModuleWithApi<_StatusBarGridApi> = {
    moduleName: 'StatusBar',
    version: VERSION,
    beans: [StatusBarService],
    userComponents: {
        agAggregationComponent: AggregationComp,
        agTotalRowCountComponent: TotalRowsComp,
        agFilteredRowCountComponent: FilteredRowsComp,
        agTotalAndFilteredRowCountComponent: TotalAndFilteredRowsComp,
        agSelectedRowCountComponent: SelectedRowsComp,
    },
    selectors: [AgStatusBarSelector],
    apiFunctions: {
        getStatusPanel,
    },
    dependsOn: [EnterpriseCoreModule, _KeyboardNavigationModule],
};
