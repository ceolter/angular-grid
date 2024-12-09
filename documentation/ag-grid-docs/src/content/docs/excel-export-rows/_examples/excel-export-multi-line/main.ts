import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ICellRendererParams,
    ModuleRegistry,
    RowAutoHeightModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

import { MultilineCellRenderer } from './multilineCellRenderer_typescript';

ModuleRegistry.registerModules([
    RowAutoHeightModule,
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'address' },
    {
        headerName: 'Custom column',
        autoHeight: true,
        valueGetter: (param) => {
            return param.data.col1 + '\n' + param.data.col2;
        },
        cellRenderer: MultilineCellRenderer,
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        cellClass: 'multiline',
        minWidth: 100,
        flex: 1,
    },

    columnDefs: columnDefs,

    rowData: [
        {
            address: '1197 Thunder Wagon Common,\nCataract, RI, \n02987-1016, US, \n(401) 747-0763',
            col1: 'abc',
            col2: 'xyz',
        },
        {
            address: '3685 Rocky Glade, Showtucket, NU, \nX1E-9I0, CA, \n(867) 371-4215',
            col1: 'abc',
            col2: 'xyz',
        },
        {
            address: '3235 High Forest, Glen Campbell, MS, \n39035-6845, US, \n(601) 638-8186',
            col1: 'abc',
            col2: 'xyz',
        },
        {
            address: '2234 Sleepy Pony Mall , Drain, DC, \n20078-4243, US, \n(202) 948-3634',
            col1: 'abc',
            col2: 'xyz',
        },
    ],

    excelStyles: [
        {
            id: 'multiline',
            alignment: {
                wrapText: true,
            },
        },
    ],
};

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
