import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    ColDef,
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    GridReadyEvent,
    ValueFormatterParams,
} from 'ag-grid-community';
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
let currentChartRef: any;

function getColumnDefs() {
    return [{ field: 'date', valueFormatter: dateFormatter }, { field: 'avgTemp' }];
}

const gridOptions: GridOptions = {
    columnDefs: getColumnDefs(),
    defaultColDef: { flex: 1 },
    cellSelection: true,
    enableCharts: true,
    chartThemeOverrides: {
        line: {
            title: {
                enabled: true,
                text: 'Average Daily Temperatures',
            },
            navigator: {
                enabled: true,
                height: 20,
                spacing: 25,
            },
            axes: {
                time: {
                    label: {
                        rotation: 0,
                        format: '%d %b',
                    },
                },
                category: {
                    label: {
                        rotation: 0,
                        formatter: (params: any) => {
                            // charts typings
                            return formatDate(params.value);
                        },
                    },
                },
                number: {
                    label: {
                        formatter: (params: any) => {
                            // charts typings
                            return params.value + '°C';
                        },
                    },
                },
            },
            series: {
                tooltip: {
                    renderer: ({ datum, xKey, yKey }) => {
                        return {
                            content: `${formatDate(datum[xKey])}: ${Math.round(datum[yKey])}°C`,
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
    if (currentChartRef) {
        currentChartRef.destroyChart();
    }

    currentChartRef = params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: {
            columns: ['date', 'avgTemp'],
        },
        suppressChartRanges: true,
        chartType: 'line',
    });
}

function dateFormatter(params: ValueFormatterParams) {
    return params.value ? params.value.toISOString().substring(0, 10) : params.value;
}

function toggleAxis() {
    const axisBtn = document.querySelector('#axisBtn') as any;
    axisBtn.textContent = axisBtn.value;
    axisBtn.value = axisBtn.value === 'time' ? 'category' : 'time';

    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'date') {
            colDef.chartDataType = axisBtn.value;
        }
    });

    gridApi!.setGridOption('columnDefs', columnDefs);
}

function formatDate(date: Date | number) {
    return Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: undefined }).format(new Date(date));
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
