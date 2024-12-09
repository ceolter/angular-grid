import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            field: 'date',
            headerName: 'ISO Format',
            cellClass: 'dateISO',
            minWidth: 150,
        },
        {
            field: 'date',
            headerName: 'dd/mm/yy',
            cellClass: 'dateUK',
            valueFormatter: (params) => {
                const date = new Date(params.value);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear().toString().substring(2);
                return day + '/' + month + '/' + year;
            },
        },
        {
            field: 'date',
            headerName: 'mm/dd/yy',
            cellClass: 'dateUS',
            valueFormatter: (params) => {
                const date = new Date(params.value);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear().toString().substring(2);
                return month + '/' + day + '/' + year;
            },
        },
        {
            field: 'date',
            headerName: 'dd/mm/yyy h:mm:ss AM/PM',
            cellClass: 'dateLong',
            minWidth: 150,
            valueFormatter: (params) => {
                const date = new Date(params.value);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear().toString();
                const hourNum = date.getHours() % 12;
                const hour = (hourNum === 0 ? 12 : hourNum).toString().padStart(2, '0');
                const min = date.getMinutes().toString().padStart(2, '0');
                const sec = date.getSeconds().toString().padStart(2, '0');
                const amPM = date.getHours() < 12 ? 'AM' : 'PM';

                return day + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec + ' ' + amPM;
            },
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    excelStyles: [
        {
            id: 'dateISO',
            dataType: 'DateTime',
            numberFormat: {
                format: 'yyy-mm-ddThh:mm:ss',
            },
        },
        {
            id: 'dateUK',
            dataType: 'DateTime',
            numberFormat: {
                format: 'dd/mm/yy',
            },
        },
        {
            id: 'dateUS',
            dataType: 'DateTime',
            numberFormat: {
                format: 'mm/dd/yy',
            },
        },
        {
            id: 'dateLong',
            dataType: 'DateTime',
            numberFormat: {
                format: 'dd/mm/yyy h:mm:ss AM/PM',
            },
        },
    ],
    rowData: [
        { date: '2020-05-30T10:01:00' },
        { date: '2015-04-21T16:30:00' },
        { date: '2010-02-19T12:02:00' },
        { date: '1995-10-04T03:27:00' },
    ],
};

function onBtnExportDataAsExcel() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
