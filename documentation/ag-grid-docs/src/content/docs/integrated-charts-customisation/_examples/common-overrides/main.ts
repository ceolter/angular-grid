import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
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
        { field: 'gold', chartDataType: 'series' },
        { field: 'silver', chartDataType: 'series' },
        { field: 'bronze', chartDataType: 'series' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    popupParent: document.body,
    cellSelection: true,
    enableCharts: true,
    chartThemeOverrides: {
        common: {
            title: {
                enabled: true,
                text: 'Precious Metals Production',
            },
            subtitle: {
                enabled: true,
                text: 'by country',
                fontSize: 14,
                fontFamily: 'Monaco, monospace',
                color: '#aaa',
                spacing: 10,
            },
            padding: {
                left: 80,
                right: 80,
            },
            legend: {
                spacing: 30,
                item: {
                    label: {
                        fontStyle: 'italic',
                        fontWeight: 'bold',
                        fontSize: 18,
                        fontFamily: 'Palatino, serif',
                        color: '#aaa',
                    },
                    marker: {
                        shape: 'circle',
                        size: 10,
                        padding: 10,
                        strokeWidth: 2,
                    },
                    paddingX: 30,
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
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 3,
            columns: ['country', 'gold', 'silver', 'bronze'],
        },
        chartType: 'groupedColumn',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
