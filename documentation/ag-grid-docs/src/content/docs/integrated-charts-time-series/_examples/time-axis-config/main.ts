import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, IntegratedChartsModule, RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'timestamp', chartDataType: 'time' }, { field: 'cpuUsage' }],
    defaultColDef: { flex: 1 },
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    chartThemeOverrides: {
        area: {
            title: {
                enabled: true,
                text: 'CPU Usage',
            },
            navigator: {
                enabled: true,
                height: 20,
                spacing: 25,
            },
            axes: {
                time: {
                    label: {
                        rotation: 315,
                        format: '%H:%M',
                    },
                },
                number: {
                    label: {
                        formatter: (params: any) => {
                            // charts typings
                            return params.value + '%';
                        },
                    },
                },
            },
            series: {
                tooltip: {
                    renderer: ({ datum, xKey, yKey }) => {
                        return {
                            content: `${formatTime(datum[xKey])}: ${datum[yKey]}%`,
                        };
                    },
                },
            },
        },
    },
    chartToolPanelsDef: {
        panels: ['data', 'format'],
    },
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: {
            columns: ['timestamp', 'cpuUsage'],
        },
        suppressChartRanges: true,
        chartType: 'area',
    });
}

function formatTime(date: Date | number) {
    return Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(date));
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
