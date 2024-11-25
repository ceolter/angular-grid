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
                    type: 'area',
                    fill: 'rgba(216, 204, 235, 0.3)',
                    stroke: 'rgb(119,77,185)',
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params: any) => {
                            if (params.highlighted) {
                                return {
                                    size: 4,
                                    fill: 'rgb(143,185,77)',
                                };
                            }
                        },
                    },
                    axis: {
                        type: 'category',
                        stroke: 'rgb(204, 204, 235)',
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
