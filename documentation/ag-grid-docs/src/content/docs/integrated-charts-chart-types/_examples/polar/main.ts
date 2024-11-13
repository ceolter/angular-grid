import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ChartRef,
    ChartType,
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    GridReadyEvent,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { CommunityFeaturesModule, ModuleRegistry } from 'ag-grid-community';
import { GridChartsModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    GridChartsModule,
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;
let chartRef: ChartRef;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'division', chartDataType: 'category', width: 150 },
        { field: 'recurring', chartDataType: 'series', headerName: 'Recurring revenue' },
        { field: 'individual', chartDataType: 'series', headerName: 'Individual sales' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    popupParent: document.body,
    cellSelection: true,
    enableCharts: true,
    chartToolPanelsDef: {
        defaultToolPanel: 'settings',
    },
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    chartRef = params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as any,
        cellRange: {
            columns: ['division', 'recurring', 'individual'],
        },
        chartType: 'radarLine',
    })!;
}

function updateChart(chartType: ChartType) {
    gridApi.updateChart({
        type: 'rangeChartUpdate',
        chartId: `${chartRef.chartId}`,
        chartType: chartType,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
