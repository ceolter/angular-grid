import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, IntegratedChartsModule, RowGroupingModule } from 'ag-grid-enterprise';

import { generateData } from './data';

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
    columnDefs: [
        { field: 'year', chartDataType: 'category' },
        { field: 'jan' },
        { field: 'feb' },
        { field: 'mar' },
        { field: 'apr' },
        { field: 'may' },
        { field: 'jun' },
        { field: 'jul' },
        { field: 'aug' },
        { field: 'sep' },
        { field: 'oct' },
        { field: 'nov' },
        { field: 'dec' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: generateData(),
    cellSelection: true,
    popupParent: document.body,
    enableCharts: true,
    onFirstDataRendered: onFirstDataRendered,
    onGridReady: () => {},
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createRangeChart({
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        cellRange: {
            rowStartIndex: 0,
            rowEndIndex: 79,
            columns: ['year', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
        },
        chartType: 'line',
        aggFunc: 'sum',
        switchCategorySeries: true,
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
