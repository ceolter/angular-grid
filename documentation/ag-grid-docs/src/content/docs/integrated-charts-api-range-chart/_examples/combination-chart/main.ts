import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import type { AgAxisCaptionFormatterParams } from 'ag-charts-types';

import type { FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
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

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'day', maxWidth: 120 },
        {
            field: 'month',
            chartDataType: 'category',
            filterParams: {
                comparator: (a: string, b: string) => {
                    const months: { [key: string]: number } = {
                        jan: 1,
                        feb: 2,
                        mar: 3,
                        apr: 4,
                        may: 5,
                        jun: 6,
                        jul: 7,
                        aug: 8,
                        sep: 9,
                        oct: 10,
                        nov: 11,
                        dec: 12,
                    };
                    const valA = months[a.toLowerCase()];
                    const valB = months[b.toLowerCase()];
                    if (valA === valB) return 0;
                    return valA > valB ? 1 : -1;
                },
            },
        },
        { field: 'rain', chartDataType: 'series' },
        { field: 'pressure', chartDataType: 'series' },
        { field: 'temp', chartDataType: 'series' },
        { field: 'wind', chartDataType: 'series' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        editable: true,
        filter: true,
        floatingFilter: true,
    },
    cellSelection: true,
    enableCharts: true,
    popupParent: document.body,
    chartThemeOverrides: {
        common: {
            axes: {
                number: {
                    title: {
                        enabled: true,
                        formatter: (params: AgAxisCaptionFormatterParams) => {
                            return params.boundSeries.map((s) => s.name).join(' / ');
                        },
                    },
                },
            },
        },
        bar: {
            series: {
                strokeWidth: 2,
                fillOpacity: 0.8,
            },
        },
        line: {
            series: {
                strokeWidth: 5,
                strokeOpacity: 0.8,
                marker: {
                    enabled: false,
                },
            },
        },
    },
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartType: 'customCombo',
        cellRange: {
            columns: ['month', 'rain', 'pressure', 'temp'],
        },
        seriesChartTypes: [
            { colId: 'rain', chartType: 'groupedColumn', secondaryAxis: false },
            { colId: 'pressure', chartType: 'line', secondaryAxis: true },
            { colId: 'temp', chartType: 'line', secondaryAxis: true },
        ],
        aggFunc: 'sum',
        suppressChartRanges: true,
        chartContainer: document.querySelector('#myChart') as any,
    });
}

// set up the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
