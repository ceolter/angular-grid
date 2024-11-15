import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    FirstDataRenderedEvent,
    GridApi,
    GridOptions,
    GridReadyEvent,
    ValueFormatterParams,
} from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import {
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    MenuModule,
    MultiFilterModule,
    RowGroupingModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    MultiFilterModule,
    SetFilterModule,
    RowGroupingModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'salesRep', chartDataType: 'category' },
        { field: 'handset', chartDataType: 'category' },
        {
            headerName: 'Sale Price',
            field: 'sale',
            maxWidth: 160,
            aggFunc: 'sum',
            filter: 'agNumberColumnFilter',
            chartDataType: 'series',
        },
        {
            field: 'saleDate',
            chartDataType: 'category',
            filter: 'agSetColumnFilter',
            filterParams: {
                valueFormatter: (params: ValueFormatterParams) => `${params.value}`,
            },
            sort: 'asc',
        },
        {
            field: 'quarter',
            maxWidth: 160,
            filter: 'agSetColumnFilter',
            chartDataType: 'category',
        },
    ],
    defaultColDef: {
        flex: 1,
        editable: true,
        filter: 'agMultiColumnFilter',
        floatingFilter: true,
    },
    enableCharts: true,
    chartThemeOverrides: {
        bar: {
            axes: {
                category: {
                    label: {
                        rotation: 0,
                    },
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
    createQuarterlySalesChart(params.api);
    createSalesByRefChart(params.api);
    createHandsetSalesChart(params.api);
}

function createQuarterlySalesChart(api: GridApi) {
    api.createCrossFilterChart({
        chartType: 'line',
        cellRange: {
            columns: ['quarter', 'sale'],
        },
        aggFunc: 'sum',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Quarterly Sales ($)',
                },
                axes: {
                    category: {
                        label: {
                            rotation: 0,
                        },
                    },
                    number: {
                        label: {
                            formatter: (params: any) => {
                                return params.value / 1000 + 'k';
                            },
                        },
                    },
                },
            },
        },
        chartContainer: document.querySelector('#lineChart') as any,
    });
}

function createSalesByRefChart(api: GridApi) {
    api.createCrossFilterChart({
        chartType: 'donut',
        cellRange: {
            columns: ['salesRep', 'sale'],
        },
        aggFunc: 'sum',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Sales by Representative ($)',
                },
            },
            pie: {
                legend: {
                    position: 'right',
                },
                series: {
                    title: {
                        enabled: false,
                    },
                    calloutLabel: {
                        enabled: false,
                    },
                },
            },
        },
        chartContainer: document.querySelector('#donutChart') as any,
    });
}

function createHandsetSalesChart(api: GridApi) {
    api.createCrossFilterChart({
        chartType: 'area',
        cellRange: {
            columns: ['handset', 'sale'],
        },
        aggFunc: 'count',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Handsets Sold (Units)',
                },
                padding: { left: 47, right: 80 },
            },
        },
        chartContainer: document.querySelector('#areaChart') as any,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
