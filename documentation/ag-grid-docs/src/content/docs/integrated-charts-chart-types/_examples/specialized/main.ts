import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { ChartRef, ColDef, FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { IntegratedChartsModule, MenuModule, RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;
let chartRef: ChartRef;

const heatmapColIds: string[] = [
    'year',
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
];
const heatmapColDefs: ColDef[] = [
    { field: 'year', width: 150, chartDataType: 'category' },
    { field: 'jan' },
    { field: 'feb' },
    { field: 'mar' },
    { field: 'apr' },
    { field: 'may' },
    { field: 'jun' },
    { field: 'jul' },
    { field: 'aug' },
    { field: 'sep' },
    { field: 'oct' },
    { field: 'nov' },
    { field: 'dec' },
];

const waterfallColIds: string[] = ['financials', 'amount'];
const waterfallColDefs: ColDef[] = [
    { field: 'financials', width: 150, chartDataType: 'category' },
    { field: 'amount', chartDataType: 'series' },
];

const gridOptions: GridOptions = {
    columnDefs: heatmapColDefs,
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
        getData('heatmap').then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    chartRef = params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as any,
        chartType: 'heatmap',
        cellRange: {
            columns: heatmapColIds,
        },
    })!;
}

function updateChart(chartType: 'heatmap' | 'waterfall') {
    getData(chartType).then((rowData) => {
        gridApi.updateGridOptions({
            columnDefs: chartType === 'heatmap' ? heatmapColDefs : waterfallColDefs,
            rowData,
        });
        gridApi.updateChart({
            type: 'rangeChartUpdate',
            chartId: chartRef.chartId,
            chartType,
            cellRange: {
                columns: chartType === 'heatmap' ? heatmapColIds : waterfallColIds,
            },
        });
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
