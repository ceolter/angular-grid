import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    PaginationModule,
    RowApiModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    PaginationModule,
    RowApiModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 180 },
        { field: 'age' },
        { field: 'country', minWidth: 150 },
        { headerName: 'Group', valueGetter: 'data.country.charAt(0)' },
        { field: 'year' },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 180 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    pagination: true,
    paginationAutoPageSize: true,
};

function getDisplayedRowAtIndex() {
    const rowNode = gridApi!.getDisplayedRowAtIndex(0)!;
    console.log('getDisplayedRowAtIndex(0) => ' + rowNode.data!.athlete + ' ' + rowNode.data!.year);
}

function getDisplayedRowCount() {
    const count = gridApi!.getDisplayedRowCount();
    console.log('getDisplayedRowCount() => ' + count);
}

function printAllDisplayedRows() {
    const count = gridApi!.getDisplayedRowCount();
    console.log('## printAllDisplayedRows');
    for (let i = 0; i < count; i++) {
        const rowNode = gridApi!.getDisplayedRowAtIndex(i)!;
        console.log('row ' + i + ' is ' + rowNode.data!.athlete);
    }
}

function printPageDisplayedRows() {
    const rowCount = gridApi!.getDisplayedRowCount();
    const lastGridIndex = rowCount - 1;
    const currentPage = gridApi!.paginationGetCurrentPage();
    const pageSize = gridApi!.paginationGetPageSize();
    const startPageIndex = currentPage * pageSize;
    let endPageIndex = (currentPage + 1) * pageSize - 1;

    if (endPageIndex > lastGridIndex) {
        endPageIndex = lastGridIndex;
    }

    console.log('## printPageDisplayedRows');
    for (let i = startPageIndex; i <= endPageIndex; i++) {
        const rowNode = gridApi!.getDisplayedRowAtIndex(i)!;
        console.log('row ' + i + ' is ' + rowNode.data!.athlete);
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data.slice(0, 100));
        });
});
