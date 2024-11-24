import { AgChartsCommunityModule } from 'ag-charts-community';
import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesStyle,
    AgChartLabelFormatterParams,
    AgSparklineOptions,
} from 'ag-charts-community';

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
                    type: 'bar',
                    direction: 'horizontal',
                    label: {
                        enabled: true,
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                        formatter: (params: AgChartLabelFormatterParams) => {
                            return `${params.value}%`;
                        },
                    },
                    min: 0,
                    max: 100,
                    tooltip: {
                        enabled: false,
                    },
                    itemStyler: itemStyler,
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

function itemStyler(params: AgBarSeriesItemStylerParams<any>): AgBarSeriesStyle {
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
