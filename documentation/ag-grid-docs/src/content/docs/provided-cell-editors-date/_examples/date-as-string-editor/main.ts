import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    DateEditorModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([ClientSideRowModelModule, DateEditorModule, ValidationModule /* Development Only */]);

const columnDefs: ColDef[] = [
    {
        headerName: 'Date as String Editor',
        field: 'dateString',
        cellEditor: 'agDateStringCellEditor',
    },
];

const data = Array.from(Array(20).keys()).map((val: any, index: number) => ({
    dateString: `2023-06-${index < 9 ? '0' + (index + 1) : index + 1}`,
}));

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        width: 200,
        editable: true,
    },
    columnDefs: columnDefs,
    rowData: data,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
