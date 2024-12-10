import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    HighlightChangesModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    HighlightChangesModule,
    RowApiModule,
    CellStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

function formatNumber(number: number) {
    return Math.floor(number).toLocaleString();
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'a' }, { field: 'b' }, { field: 'c' }, { field: 'd' }, { field: 'e' }, { field: 'f' }],
    defaultColDef: {
        flex: 1,
        cellClass: 'align-right',
        valueFormatter: (params) => {
            return formatNumber(params.value);
        },
    },
    rowData: createRowData(),
};

function onFlashOneCell() {
    // pick fourth row at random
    const rowNode = gridApi!.getDisplayedRowAtIndex(4)!;
    // pick 'c' column
    gridApi!.flashCells({ rowNodes: [rowNode], columns: ['c'] });
}

function onFlashTwoColumns() {
    // flash whole column, so leave row selection out
    gridApi!.flashCells({ columns: ['c', 'd'] });
}

function onFlashTwoRows() {
    // pick fourth and fifth row at random
    const rowNode1 = gridApi!.getDisplayedRowAtIndex(4)!;
    const rowNode2 = gridApi!.getDisplayedRowAtIndex(5)!;
    // flash whole row, so leave column selection out
    gridApi!.flashCells({ rowNodes: [rowNode1, rowNode2] });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});

function createRowData() {
    const rowData = [];

    for (let i = 0; i < 20; i++) {
        rowData.push({
            a: Math.floor(((i + 323) * 25435) % 10000),
            b: Math.floor(((i + 323) * 23221) % 10000),
            c: Math.floor(((i + 323) * 468276) % 10000),
            d: 0,
            e: 0,
            f: 0,
        });
    }

    return rowData;
}
