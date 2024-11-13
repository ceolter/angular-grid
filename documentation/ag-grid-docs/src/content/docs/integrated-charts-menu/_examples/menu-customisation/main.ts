import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    FirstDataRenderedEvent,
    GetChartMenuItemsParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    MenuItemDef,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { CommunityFeaturesModule, ModuleRegistry } from 'ag-grid-community';
import { GridChartsModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CommunityFeaturesModule, ClientSideRowModelModule, GridChartsModule, MenuModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', width: 150, chartDataType: 'category' },
        { field: 'gold', chartDataType: 'series' },
        { field: 'silver', chartDataType: 'series' },
        { field: 'bronze', chartDataType: 'series' },
    ],
    defaultColDef: { flex: 1 },
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    chartMenuItems: chartMenuItems,
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function chartMenuItems(params: GetChartMenuItemsParams): (string | MenuItemDef)[] {
    // Remove edit chart and advanced settings.
    // `defaultItems` will automatically update the link/unlink options based on the current state.
    return params.defaultItems.filter((item: string) => {
        return item !== 'chartEdit' && item !== 'chartAdvancedSettings';
    });
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 4,
            columns: ['country', 'gold', 'silver', 'bronze'],
        },
        chartType: 'groupedColumn',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
