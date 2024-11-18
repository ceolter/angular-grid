import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

// specify the data
const rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 },
    { make: 'BMW', model: 'M50', price: 60000 },
    { make: 'Aston Martin', model: 'DBX', price: 190000 },
];

function getAllColumns() {
    console.log(gridApi!.getColumns());
    window.alert("Columns printed to developer's console");
}

function getAllColumnIds() {
    const columns = gridApi!.getColumns();
    if (columns) {
        console.log(columns.map((col) => col.getColId()));
    }
    window.alert("Column IDs printed to developer's console");
}
let gridApi: GridApi;

// let the grid know which columns and what data to use
const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
    },
    rowData: rowData,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
