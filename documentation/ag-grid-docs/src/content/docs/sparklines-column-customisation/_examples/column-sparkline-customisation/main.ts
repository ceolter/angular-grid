import type { AgSparklineOptions } from 'ag-charts-community';
import { AgChartsCommunityModule } from 'ag-charts-community';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    SparklinesModule.with(AgChartsCommunityModule),
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'symbol', maxWidth: 120 },
        { field: 'name', minWidth: 250 },
        {
            field: 'change',
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'bar',
                    direction: 'vertical',
                    fill: '#91cc75',
                    stroke: '#91cc75',
                    highlightStyle: {
                        item: {
                            fill: 'orange',
                        },
                    },
                    theme: {
                        overrides: {
                            paddingInner: 0.3,
                            paddingOuter: 0.1,
                        },
                    },
                } as AgSparklineOptions,
            },
        },
        {
            field: 'volume',

            maxWidth: 140,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getData(),
    rowHeight: 50,
    onGridReady: (params) => {},
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
