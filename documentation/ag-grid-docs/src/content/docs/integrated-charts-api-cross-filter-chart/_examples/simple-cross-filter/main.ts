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
        { field: 'salesRep', chartDataType: 'category' },
        { field: 'handset', chartDataType: 'category' },
        { field: 'sale', chartDataType: 'series' },
        { field: 'saleDate', chartDataType: 'category' },
    ],
    defaultColDef: {
        flex: 1,
        filter: 'agSetColumnFilter',
        floatingFilter: true,
    },
    enableCharts: true,
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
    onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createCrossFilterChart({
        chartType: 'pie',
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
                series: {
                    title: {
                        enabled: false,
                    },
                    calloutLabel: {
                        enabled: false,
                    },
                },
                legend: {
                    position: 'right',
                },
            },
        },
        chartContainer: document.querySelector('#pieChart') as any,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
});
