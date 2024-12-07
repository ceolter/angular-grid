import type { ColDef, GridApi, GridOptions, INumberCellEditorParams, ValueFormatterParams } from 'ag-grid-community';
import {
    CheckboxEditorModule,
    ClientSideRowModelModule,
    DateEditorModule,
    ModuleRegistry,
    NumberEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    NumberEditorModule,
    DateEditorModule,
    CheckboxEditorModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    {
        headerName: 'Number Editor',
        field: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
            precision: 0,
        } as INumberCellEditorParams,
    },
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
    {
        headerName: 'Date as String Editor',
        field: 'dateString',
        cellEditor: 'agDateStringCellEditor',
    },
    {
        headerName: 'Checkbox Cell Editor',
        field: 'boolean',
        cellEditor: 'agCheckboxCellEditor',
    },
];

const data = Array.from(Array(20).keys()).map((val: any, index: number) => ({
    number: index,

    date: new Date(2023, 5, index + 1),
    dateString: `2023-06-${index < 9 ? '0' + (index + 1) : index + 1}`,
    boolean: !!(index % 2),
}));

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
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
