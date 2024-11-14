import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import {
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    MenuModule,
    MultiFilterModule,
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
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'city', chartDataType: 'category' },
        { field: 'country', chartDataType: 'category' },
        { field: 'longitude', chartDataType: 'series' },
        { field: 'latitude', chartDataType: 'series' },
        { field: 'population', chartDataType: 'series' },
    ],
    defaultColDef: {
        flex: 1,
        editable: true,
        filter: 'agMultiColumnFilter',
        floatingFilter: true,
    },
    enableCharts: true,
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    createColumnChart(params.api);
    createBubbleChart(params.api);
}

function createColumnChart(api: GridApi) {
    api.createCrossFilterChart({
        chartType: 'column',
        cellRange: {
            columns: ['country', 'population'],
        },
        aggFunc: 'count',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Number of Most Populous Cities by Country',
                },
                legend: {
                    enabled: false,
                },
            },
            bar: {
                axes: {
                    category: {
                        label: {
                            rotation: 325,
                        },
                    },
                },
            },
        },
        chartContainer: document.querySelector('#barChart') as any,
    });
}

function createBubbleChart(api: GridApi) {
    api.createCrossFilterChart({
        chartType: 'bubble',
        cellRange: {
            columns: ['longitude', 'latitude', 'population'],
        },
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Latitude vs Longitude of Most Populous Cities',
                },
                legend: {
                    enabled: false,
                },
            },
        },
        chartContainer: document.querySelector('#bubbleChart') as any,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
