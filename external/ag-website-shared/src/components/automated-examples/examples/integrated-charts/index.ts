/**
 * Automated Integrated Charts demo
 */
import { ClientSideRowModelModule, CommunityFeaturesModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { ClipboardModule, GridChartsModule, MenuModule, RowGroupingModule, SideBarModule } from 'ag-grid-enterprise';

import type { AutomatedExample } from '../../types.d';
import type { CreateAutomatedIntegratedChartsParams } from './createAutomatedIntegratedChartsWithCreateGrid';
import { createAutomatedIntegratedChartsWithCreateGrid } from './createAutomatedIntegratedChartsWithCreateGrid';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    ClipboardModule,
    GridChartsModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
]);

/**
 * Create automated integrated charts example using modules
 */
export function createAutomatedIntegratedCharts(params: CreateAutomatedIntegratedChartsParams): AutomatedExample {
    return createAutomatedIntegratedChartsWithCreateGrid({
        createGrid,
        ...params,
    });
}
