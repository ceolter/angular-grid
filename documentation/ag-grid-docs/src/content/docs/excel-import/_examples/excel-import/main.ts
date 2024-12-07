import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

declare let XLSX: any;

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'athlete', minWidth: 180 },
        { field: 'age' },
        { field: 'country', minWidth: 150 },
        { field: 'year' },
        { field: 'date', minWidth: 130 },
        { field: 'sport', minWidth: 100 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],

    defaultColDef: {
        minWidth: 80,
        flex: 1,
    },

    rowData: [],
};

// XMLHttpRequest in promise format
function makeRequest(method: string, url: string, success: any, error: any) {
    const httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, true);
    httpRequest.responseType = 'arraybuffer';

    httpRequest.open(method, url);
    httpRequest.onload = function () {
        success(httpRequest.response);
    };
    httpRequest.onerror = function () {
        error(httpRequest.response);
    };
    httpRequest.send();
}

// read the raw data and convert it to a XLSX workbook
function convertDataToWorkbook(dataRows: ArrayBuffer) {
    /* convert data to binary string */
    const data = new Uint8Array(dataRows);
    const arr = [];

    for (let i = 0; i !== data.length; ++i) {
        arr[i] = String.fromCharCode(data[i]);
    }

    const bstr = arr.join('');

    return XLSX.read(bstr, { type: 'binary' });
}

// pull out the values we're after, converting it into an array of rowData

function populateGrid(workbook: any) {
    // our data is in the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // we expect the following columns to be present
    const columns: Record<string, string> = {
        A: 'athlete',
        B: 'age',
        C: 'country',
        D: 'year',
        E: 'date',
        F: 'sport',
        G: 'gold',
        H: 'silver',
        I: 'bronze',
        J: 'total',
    };

    const rowData = [];

    // start at the 2nd row - the first row are the headers
    let rowIndex = 2;

    // iterate over the worksheet pulling out the columns we're expecting
    while (worksheet['A' + rowIndex]) {
        var row: any = {};
        Object.keys(columns).forEach((column) => {
            row[columns[column]] = worksheet[column + rowIndex].w;
        });

        rowData.push(row);

        rowIndex++;
    }

    // finally, set the imported rowData into the grid
    gridApi!.setGridOption('rowData', rowData);
}

function importExcel() {
    fetch('https://www.ag-grid.com/example-assets/olympic-data.xlsx')
        .then((response) => response.arrayBuffer())
        .then((data: ArrayBuffer) => {
            const workbook = convertDataToWorkbook(data);
            populateGrid(workbook);
        });
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;

    // create the grid passing in the div to use together with the columns & data we want to use
    gridApi = createGrid(eGridDiv, gridOptions);
});
