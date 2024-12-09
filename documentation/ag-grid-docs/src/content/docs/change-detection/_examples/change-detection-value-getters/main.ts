import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    HighlightChangesModule,
    ModuleRegistry,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    HighlightChangesModule,
    CellStyleModule,
    ClientSideRowModelModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'a', type: 'valueColumn' },
        { field: 'b', type: 'valueColumn' },
        { field: 'c', type: 'valueColumn' },
        { field: 'd', type: 'valueColumn' },
        { field: 'e', type: 'valueColumn' },
        { field: 'f', type: 'valueColumn' },
        {
            headerName: 'Total',
            valueGetter: 'data.a + data.b + data.c + data.d + data.e + data.f',
            editable: false,
            cellClass: 'total-col',
        },
    ],
    defaultColDef: {
        flex: 1,
        enableCellChangeFlash: true,
    },
    columnTypes: {
        valueColumn: {
            minWidth: 90,
            editable: true,
            valueParser: 'Number(newValue)',
            filter: 'agNumberColumnFilter',
        },
    },
    rowData: getRowData(),
    groupDefaultExpanded: 1,
    suppressAggFuncInHeader: true,
};

function getRowData() {
    const rowData = [];
    for (let i = 1; i <= 20; i++) {
        rowData.push({
            group: i < 5 ? 'A' : 'B',
            a: (i * 863) % 100,
            b: (i * 811) % 100,
            c: (i * 743) % 100,
            d: (i * 677) % 100,
            e: (i * 619) % 100,
            f: (i * 571) % 100,
        });
    }
    return rowData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
