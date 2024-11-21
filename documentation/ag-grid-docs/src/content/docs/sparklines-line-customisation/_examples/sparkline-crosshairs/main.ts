import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import type { AgSeriesTooltipRendererParams, AgSparklineOptions } from 'ag-charts-enterprise';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    SparklinesModule.with(AgChartsEnterpriseModule),
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
                    stroke: 'rgb(52, 168, 83)',
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params: any) => {
                            if (params.highlighted) {
                                return {
                                    size: 4,
                                    stroke: 'rgb(52, 168, 83)',
                                    fill: 'rgb(52, 168, 83)',
                                };
                            }
                        },
                    },
                    tooltip: {
                        renderer: renderer,
                    },
                    crosshair: {
                        enabled: true,
                        lineDash: [3, 3],
                        stroke: '#999',
                    },
                } as AgSparklineOptions,
            },
        },
        {
            field: 'rateOfChange',
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'line',
                    stroke: 'rgb(168,52,137)',
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params) => {
                            if (params.highlighted) {
                                return {
                                    size: 4,
                                    stroke: 'rgb(168,52,137)',
                                    fill: 'rgb(168,52,137)',
                                };
                            }
                        },
                    },
                    tooltip: {
                        renderer: renderer,
                    },
                    crosshair: {
                        enabled: false,
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

function renderer(params: AgSeriesTooltipRendererParams) {
    return {
        backgroundColor: 'black',
        opacity: 0.9,
        color: 'white',
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
