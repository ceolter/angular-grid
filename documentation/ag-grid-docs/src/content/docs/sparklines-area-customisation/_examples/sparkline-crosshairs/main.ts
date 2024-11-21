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
                    type: 'area',
                    fill: 'rgba(185,173,77,0.3)',
                    stroke: 'rgb(185,173,77)',
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params: any) => {
                            if (params.highlighted) {
                                return {
                                    size: 4,
                                    stroke: 'rgb(185,173,77)',
                                    fill: 'rgb(185,173,77)',
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
                    type: 'area',
                    fill: 'rgba(77,89,185, 0.3)',
                    stroke: 'rgb(77,89,185)',
                    marker: {
                        enabled: true,
                        size: 0,
                        itemStyler: (params: any) => {
                            if (params.highlighted) {
                                return {
                                    size: 4,
                                    stroke: 'rgb(77,89,185)',
                                    fill: 'rgb(77,89,185)',
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
