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

const palette = {
    blue: 'rgb(20,94,140)',
    lightBlue: 'rgb(182,219,242)',
    green: 'rgb(63,141,119)',
    lightGreen: 'rgba(75,168,142, 0.2)',
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    rowHeight: 70,
    columnDefs: [
        {
            field: 'bar',
            headerName: 'Bar Sparkline',
            minWidth: 100,
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'bar',
                    direction: 'horizontal',
                    min: 0,
                    max: 100,
                    label: {
                        enabled: true,
                        color: '#5577CC',
                        placement: 'outside-end',
                        formatter: function (params) {
                            return `${params.value}%`;
                        },
                        fontSize: 8,
                        fontWeight: 'bold',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    },
                    padding: {
                        top: 15,
                        bottom: 15,
                    },
                    itemStyler: barItemStyler,
                } as AgSparklineOptions,
            },
        },
        {
            field: 'line',
            headerName: 'Line Sparkline',
            minWidth: 100,
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'line',
                    stroke: 'rgb(63,141,119)',
                    padding: {
                        top: 10,
                        bottom: 10,
                    },
                    marker: {
                        enabled: true,
                        itemStyler: lineItemStyler,
                    },
                } as AgSparklineOptions,
            },
        },
        {
            field: 'column',
            headerName: 'Column Sparkline',
            minWidth: 100,
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'bar',
                    direction: 'vertical',
                    label: {
                        color: '#5577CC',
                        enabled: true,
                        placement: 'outside-end',
                        fontSize: 8,
                        fontFamily: 'Arial, Helvetica, sans-serif',
                    },
                    padding: {
                        top: 15,
                        bottom: 15,
                    },
                    itemStyler: columnItemStyler,
                } as AgSparklineOptions,
            },
        },
        {
            field: 'area',
            headerName: 'Area Sparkline',
            minWidth: 100,
            cellRenderer: 'agSparklineCellRenderer',
            cellRendererParams: {
                sparklineOptions: {
                    type: 'area',
                    fill: 'rgba(75,168,142, 0.2)',
                    stroke: 'rgb(63,141,119)',
                    padding: {
                        top: 10,
                        bottom: 10,
                    },
                    marker: {
                        enabled: true,
                        itemStyler: areaItemStyler,
                    },
                } as AgSparklineOptions,
            },
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getData(),
};

function barItemStyler(params: any) {
    const { yValue, highlighted } = params;

    if (highlighted) {
        return;
    }
    return { fill: yValue <= 50 ? palette.lightBlue : palette.blue };
}

function lineItemStyler(params: any) {
    const { first, last, highlighted } = params;

    const color = highlighted ? palette.blue : last ? palette.lightBlue : palette.green;

    return {
        size: highlighted || first || last ? 5 : 0,
        fill: color,
        stroke: color,
    };
}

function columnItemStyler(params: any) {
    const { yValue, highlighted } = params;

    if (highlighted) {
        return;
    }
    return { fill: yValue < 0 ? palette.lightBlue : palette.blue };
}

function areaItemStyler(params: any) {
    const { min, highlighted } = params;

    return {
        size: min || highlighted ? 5 : 0,
        fill: palette.green,
        stroke: palette.green,
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
