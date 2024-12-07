import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'bronze', aggFunc: 'max' },
        { field: 'silver', aggFunc: 'max' },
        { field: 'gold', aggFunc: 'max' },
        { field: 'total', aggFunc: 'avg' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 140,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
};

function toggleProperty() {
    const suppressAggFuncInHeader = document.querySelector<HTMLInputElement>('#suppressAggFuncInHeader')!.checked;
    gridApi.setGridOption('suppressAggFuncInHeader', suppressAggFuncInHeader);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
