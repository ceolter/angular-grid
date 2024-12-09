import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    RowApiModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, IntegratedChartsModule, PivotModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    RowApiModule,
    ClientSideRowModelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    ColumnMenuModule,
    ContextMenuModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', pivot: true },
        { field: 'year', rowGroup: true },
        { field: 'sport', rowGroup: true },
        { field: 'total', aggFunc: 'sum' },
        { field: 'gold', aggFunc: 'sum' },
    ],
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 150,
        filter: true,
    },
    autoGroupColumnDef: {
        minWidth: 150,
    },
    pivotMode: true,
    onFirstDataRendered,
    popupParent: document.body,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.createPivotChart({
        chartType: 'groupedColumn',
        chartContainer: document.querySelector('#myChart') as HTMLElement,
        chartThemeOverrides: {
            common: {
                navigator: {
                    enabled: true,
                    height: 10,
                },
            },
        },
    });

    // expand one row for demonstration purposes
    setTimeout(() => params.api.getDisplayedRowAtIndex(2)!.setExpanded(true), 0);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/wide-spread-of-sports.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
