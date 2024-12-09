import type { GridApi, GridOptions, RowHeightParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'rowHeight' },
        { field: 'athlete' },
        { field: 'age', width: 80 },
        { field: 'country' },
        { field: 'year', width: 90 },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        width: 150,
        filter: true,
    },
    // call back function, to tell the grid what height each row should be
    getRowHeight: getRowHeight,
};

function getRowHeight(params: RowHeightParams): number | undefined | null {
    return params.data.rowHeight;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            const differentHeights = [40, 80, 120, 200];
            data.forEach(function (dataItem: any, index: number) {
                dataItem.rowHeight = differentHeights[index % 4];
            });
            gridApi!.setGridOption('rowData', data);
        });
});
