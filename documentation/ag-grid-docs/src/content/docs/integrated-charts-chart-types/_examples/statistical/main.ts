import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    ChartRef,
    ChartType,
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    GridReadyEvent,
} from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, IntegratedChartsModule, RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;
let chartRef: ChartRef;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'period', chartDataType: 'category', headerName: 'Financial Period', width: 150 },
        { field: 'client', chartDataType: 'category', headerName: 'Client name' },
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
            columns: ['period', 'client', 'recurring', 'individual'],
        },
        chartType: 'boxPlot',
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
