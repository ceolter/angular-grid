import type { GridApi, GridOptions, ValueFormatterParams, ValueParserParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { CellSelectionModule, ClipboardModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextEditorModule,
    ClientSideRowModelModule,
    ClipboardModule,
    CellSelectionModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            headerName: '£A',
            field: 'a',
            valueFormatter: currencyFormatter,
            valueParser: currencyParser,
        },
        {
            headerName: '£B',
            field: 'b',
            valueFormatter: currencyFormatter,
            valueParser: currencyParser,
        },
    ],
    defaultColDef: {
        cellDataType: false,
        editable: true,
    },
    rowData: createRowData(),
    cellSelection: {
        handle: {
            mode: 'fill',
        },
    },
};

function currencyFormatter(params: ValueFormatterParams) {
    return params.value == null ? '' : '£' + params.value;
}

function currencyParser(params: ValueParserParams) {
    let value = params.newValue;
    if (value == null || value === '') {
        return null;
    }
    value = String(value);

    if (value.startsWith('£')) {
        value = value.slice(1);
    }
    return parseFloat(value);
}

function createRowData() {
    const rowData = [];

    for (let i = 0; i < 100; i++) {
        rowData.push({
            a: Math.floor(((i + 2) * 173456) % 10000),
            b: Math.floor(((i + 7) * 373456) % 10000),
        });
    }

    return rowData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
