import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowSelectionModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([RowSelectionModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

interface ICar {
    make: string;
    model: string;
    price: number;
}

const columnDefs: ColDef<ICar>[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

// specify the data
const rowDataA: ICar[] = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 },
    { make: 'Aston Martin', model: 'DBX', price: 190000 },
];

const rowDataB: ICar[] = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 },
    { make: 'BMW', model: 'M50', price: 60000 },
    { make: 'Aston Martin', model: 'DBX', price: 190000 },
];

let gridApi: GridApi<ICar>;

// let the grid know which columns and what data to use
const gridOptions: GridOptions<ICar> = {
    columnDefs: columnDefs,
    rowData: rowDataA,
    rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
};

function onRowDataA() {
    gridApi!.setGridOption('rowData', rowDataA);
}

function onRowDataB() {
    gridApi!.setGridOption('rowData', rowDataB);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
