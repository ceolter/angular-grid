import { AgChartsCommunityModule } from 'ag-charts-community';

import type { AreaSparklineOptions, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getStockData } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, SparklinesModule.with(AgChartsCommunityModule)]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'symbol', maxWidth: 110 },
        { field: 'name', minWidth: 250 },
        {
            field: 'rateOfChange',
            headerName: 'Rate of Change',
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'area',
                    axis: {
                        type: 'time',
                    },
                    marker: {
                        size: 3,
                    },
                } as AreaSparklineOptions,
            },
        },
        { field: 'volume', type: 'numericColumn', maxWidth: 140 },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getStockData(),
    rowHeight: 50,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
