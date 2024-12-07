import type { ColDef, GridApi, GridOptions, ValueFormatterParams } from 'ag-grid-community';
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
        headerName: 'Date Editor',
        field: 'date',
        valueFormatter: (params: ValueFormatterParams<any, Date>) => {
            if (!params.value) {
                return '';
            }
            const month = params.value.getMonth() + 1;
            const day = params.value.getDate();
            return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
        },
        cellEditor: 'agDateCellEditor',
    },
];

const data = Array.from(Array(20).keys()).map((val: any, index: number) => ({
    date: new Date(2023, 5, index + 1),
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
