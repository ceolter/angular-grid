import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { IntegratedChartsModule, MenuModule, RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', width: 150, chartDataType: 'category' },
        { field: 'gold', chartDataType: 'series', sort: 'desc' },
        { field: 'silver', chartDataType: 'series', sort: 'desc' },
        { field: 'bronze', chartDataType: 'series' },
    ],
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    cellSelection: true,
    enableCharts: true,
    popupParent: document.body,
    onGridReady: (params: GridReadyEvent) => {
        getData().then((rowData) => params.api.setGridOption('rowData', rowData));
    },
};

function onChart1() {
    gridApi.createRangeChart({
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 4,
            columns: ['country', 'gold', 'silver'],
        },
        chartType: 'groupedColumn',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Top 5 Medal Winners',
                },
            },
        },
    });
}

function onChart2() {
    gridApi.createRangeChart({
        cellRange: {
            columns: ['country', 'bronze'],
        },
        chartType: 'groupedBar',
        chartThemeOverrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Bronze Medal by Country',
                },
            },
        },
        unlinkChart: true,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
