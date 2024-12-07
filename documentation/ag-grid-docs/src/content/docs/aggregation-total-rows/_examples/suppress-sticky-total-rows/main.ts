import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, ValidationModule /* Development Only */]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
    },
    autoGroupColumnDef: {
        minWidth: 300,
    },
    groupDefaultExpanded: -1,
    groupTotalRow: 'bottom',
    grandTotalRow: 'bottom',
};

function onChange() {
    const suppressStickyTotalRow = document.querySelector<HTMLInputElement>('#input-property-value')!.value;
    if (suppressStickyTotalRow === 'grand' || suppressStickyTotalRow === 'group') {
        gridApi.setGridOption('suppressStickyTotalRow', suppressStickyTotalRow);
    } else if (suppressStickyTotalRow === 'true') {
        gridApi.setGridOption('suppressStickyTotalRow', true);
    } else {
        gridApi.setGridOption('suppressStickyTotalRow', false);
    }
}
// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
