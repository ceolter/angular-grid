import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GetRowIdParams, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface ICar {
    id: string;
    make: string;
    model: string;
    price: number;
}

const columnDefs: ColDef<ICar>[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

// specify the data
const rowDataA: ICar[] = [
    { id: '1', make: 'Toyota', model: 'Celica', price: 35000 },
    { id: '4', make: 'BMW', model: 'M50', price: 60000 },
    { id: '5', make: 'Aston Martin', model: 'DBX', price: 190000 },
];

const rowDataB: ICar[] = [
    { id: '1', make: 'Toyota', model: 'Celica', price: 35000 },
    { id: '2', make: 'Ford', model: 'Mondeo', price: 32000 },
    { id: '3', make: 'Porsche', model: 'Boxster', price: 72000 },
    { id: '4', make: 'BMW', model: 'M50', price: 60000 },
    { id: '5', make: 'Aston Martin', model: 'DBX', price: 190000 },
];

let gridApi: GridApi<ICar>;

// let the grid know which columns and what data to use
const gridOptions: GridOptions<ICar> = {
    columnDefs: columnDefs,
    rowData: rowDataA,
    rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
    getRowId: (params: GetRowIdParams<ICar>) => params.data.id,
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
