import { ModuleRegistry } from 'ag-grid-community';
import type { GridApi, GridOptions, Params } from 'ag-grid-community';
import { createGrid as originalCreateGrid } from 'ag-grid-community';

import { IntegratedChartsModule, SparklinesModule } from './main';

function autoRegisterAgCharts() {
    const agChartsDynamic = (globalThis as any)?.agCharts;
    const agChartsModule = agChartsDynamic?.AgChartsEnterpriseModule ?? agChartsDynamic?.AgChartsCommunityModule;
    if (agChartsModule) {
        ModuleRegistry.registerModules([
            IntegratedChartsModule.with(agChartsModule),
            SparklinesModule.with(agChartsModule),
        ]);
    }
}

/**
 * Creates a grid inside the provided HTML element.
 * @param eGridDiv Parent element to contain the grid.
 * @param gridOptions Configuration for the grid.
 * @param params Individually register AG Grid Modules to this grid.
 * @returns api to be used to interact with the grid.
 */
export function createGrid<TData>(
    eGridDiv: HTMLElement,
    gridOptions: GridOptions<TData>,
    params?: Params
): GridApi<TData> {
    // Look for the AG Charts modules and register them if present
    autoRegisterAgCharts();

    // Call the original createGrid function
    return originalCreateGrid(eGridDiv, gridOptions, params);
}
