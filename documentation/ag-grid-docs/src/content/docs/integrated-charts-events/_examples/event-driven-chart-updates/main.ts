import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    ChartCreatedEvent,
    ChartRangeSelectionChangedEvent,
    CreateRangeChartParams,
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
} from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { IntegratedChartsModule, MenuModule, RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'Month', width: 150, chartDataType: 'category' },
        { field: 'Sunshine (hours)', chartDataType: 'series' },
        { field: 'Rainfall (mm)', chartDataType: 'series' },
    ],
    defaultColDef: { flex: 1 },
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    chartThemeOverrides: {
        common: {
            title: { enabled: true, text: 'Monthly Weather' },
            subtitle: { enabled: true },
            legend: { enabled: true },
        },
    },
    onFirstDataRendered: onFirstDataRendered,
    onChartCreated: onChartCreated,
    onChartRangeSelectionChanged: onChartRangeSelectionChanged,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    const createRangeChartParams: CreateRangeChartParams = {
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 3,
            columns: ['Month', 'Sunshine (hours)'],
        },
        chartType: 'stackedColumn',
        chartContainer: document.querySelector('#myChart') as any,
    };

    params.api.createRangeChart(createRangeChartParams);
}

function onChartCreated(event: ChartCreatedEvent) {
    console.log('Created chart with ID ' + event.chartId);
    updateTitle(gridApi!, event.chartId);
}

function onChartRangeSelectionChanged(event: ChartRangeSelectionChangedEvent) {
    console.log('Changed range selection of chart with ID ' + event.chartId);
    updateTitle(gridApi!, event.chartId);
}

function updateTitle(api: GridApi, chartId: string) {
    const cellRange = api.getCellRanges()![1];
    if (!cellRange) return;
    const columnCount = cellRange.columns.length;
    const rowCount = cellRange.endRow!.rowIndex - cellRange.startRow!.rowIndex + 1;
    const subtitle = `Using series data from ${columnCount} column(s) and ${rowCount} row(s)`;

    api!.updateChart({
        type: 'rangeChartUpdate',
        chartId: chartId,
        chartThemeOverrides: {
            common: {
                subtitle: { text: subtitle },
            },
        },
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/weather-se-england.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
