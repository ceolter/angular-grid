import { AgChartsCommunityModule } from 'ag-charts-community';
import type { AgSparklineOptions } from 'ag-charts-community';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    SparklinesModule.with(AgChartsCommunityModule),
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
                    type: 'line',
                    stroke: 'rgb(124, 255, 178)',
                    strokeWidth: 2,
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params: any) => {
                            if (params.highlighted) {
                                return {
                                    size: 7,
                                    fill: 'rgb(124, 255, 178)',
                                };
                            }
                        },
                    },
                    padding: {
                        top: 5,
                        bottom: 5,
                    },
                } as AgSparklineOptions,
            },
        },
        {
            field: 'volume',
            type: 'numericColumn',
            maxWidth: 140,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getData(),
    rowHeight: 50,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
