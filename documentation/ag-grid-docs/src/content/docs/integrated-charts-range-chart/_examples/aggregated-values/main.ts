import { ClientSideRowModelModule } from 'ag-grid-community';
import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { CommunityFeaturesModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { GridChartsModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { generateData } from './data';

ModuleRegistry.registerModules([
    CommunityFeaturesModule,
    ClientSideRowModelModule,
    GridChartsModule,
    MenuModule,
    RowGroupingModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'division', width: 150, rowGroup: true, hide: true },
        { field: 'resource', width: 150, hide: true },
        { field: 'revenue' },
        { field: 'expenses' },
        { field: 'headcount' },
    ],
    defaultColDef: {
        flex: 1,
    },
    rowData: generateData(),
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    groupDefaultExpanded: 1,
    chartThemeOverrides: {
        bar: {
            axes: {
                category: {
                    label: {
                        fontSize: 8,
                    },
                },
            },
        },
    },
    onFirstDataRendered: onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 16,
            columns: ['expenses'],
        },
        chartType: 'groupedColumn',
        aggFunc: 'sum',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
