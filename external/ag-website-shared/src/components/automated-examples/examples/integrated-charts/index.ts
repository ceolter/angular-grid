/**
 * Automated Integrated Charts demo
 */
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import {
    ClipboardModule,
    IntegratedChartsModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
} from 'ag-grid-enterprise';

import type { AutomatedExample } from '../../types.d';
import type { CreateAutomatedIntegratedChartsParams } from './createAutomatedIntegratedChartsWithCreateGrid';
import { createAutomatedIntegratedChartsWithCreateGrid } from './createAutomatedIntegratedChartsWithCreateGrid';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
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
