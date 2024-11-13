import { AgChartsCommunityModule } from 'ag-charts-community';

import type { AreaSparklineOptions, GridApi, GridOptions, TooltipRendererParams } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, SparklinesModule.with(AgChartsCommunityModule)]);

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
                    line: {
                        stroke: 'rgb(185,173,77)',
                    },
                    highlightStyle: {
                        size: 4,
                        stroke: 'rgb(185,173,77)',
                        fill: 'rgb(185,173,77)',
                    },
                    tooltip: {
                        renderer: renderer,
                    },
                    crosshairs: {
                        xLine: {
                            enabled: true,
                            lineDash: 'dash',
                            stroke: '#999',
                        },
                        yLine: {
                            enabled: true,
                            lineDash: 'dash',
                            stroke: '#999',
                        },
                    },
                } as AreaSparklineOptions,
            },
        },
        {
            field: 'rateOfChange',
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'area',
                    fill: 'rgba(77,89,185, 0.3)',
                    line: {
                        stroke: 'rgb(77,89,185)',
                    },
                    highlightStyle: {
                        size: 4,
                        stroke: 'rgb(77,89,185)',
                        fill: 'rgb(77,89,185)',
                    },
                    tooltip: {
                        renderer: renderer,
                    },
                    crosshairs: {
                        xLine: {
                            enabled: false,
                        },
                    },
                } as AreaSparklineOptions,
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

function renderer(params: TooltipRendererParams) {
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
