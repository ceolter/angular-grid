import { AgChartsCommunityModule } from 'ag-charts-community';

import type { BarFormat, BarFormatterParams, GridApi, GridOptions, LabelFormatterParams } from 'ag-grid-community';
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
                    type: 'bar',
                    label: {
                        enabled: true,
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                        formatter: (params: LabelFormatterParams) => {
                            return `${params.value}%`;
                        },
                    },
                    paddingOuter: 0,
                    padding: {
                        top: 0,
                        bottom: 0,
                    },
                    valueAxisDomain: [0, 100],
                    axis: {
                        strokeWidth: 0,
                    },
                    tooltip: {
                        enabled: false,
                    },
                    formatter: formatter,
                },
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

function formatter(params: BarFormatterParams): BarFormat {
    const { yValue } = params;
    return {
        fill: yValue <= 20 ? '#4fa2d9' : yValue < 60 ? '#277cb5' : '#195176',
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
