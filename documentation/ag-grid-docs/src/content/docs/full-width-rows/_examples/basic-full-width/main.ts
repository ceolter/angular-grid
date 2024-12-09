import type { ColDef, GridApi, GridOptions, IsFullWidthRowParams, RowHeightParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    PinnedRowModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { FullWidthCellRenderer } from './fullWidthCellRenderer_typescript';

ModuleRegistry.registerModules([
    ColumnApiModule,
    PinnedRowModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const rowData = createData(100, 'body');
const pinnedTopRowData = createData(3, 'pinned');
const pinnedBottomRowData = createData(3, 'pinned');

function getColumnDefs() {
    const columnDefs: ColDef[] = [];
    alphabet().forEach((letter) => {
        const colDef: ColDef = {
            headerName: letter,
            field: letter,
            width: 150,
        };
        if (letter === 'A') {
            colDef.pinned = 'left';
        }
        if (letter === 'Z') {
            colDef.pinned = 'right';
        }
        columnDefs.push(colDef);
    });
    return columnDefs;
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: getColumnDefs(),
    rowData: rowData,
    pinnedTopRowData: pinnedTopRowData,
    pinnedBottomRowData: pinnedBottomRowData,
    isFullWidthRow: (params: IsFullWidthRowParams) => {
        // in this example, we check the fullWidth attribute that we set
        // while creating the data. what check you do to decide if you
        // want a row full width is up to you, as long as you return a boolean
        // for this method.
        return params.rowNode.data.fullWidth;
    },
    // see AG Grid docs cellRenderer for details on how to build cellRenderers
    // this is a simple function cellRenderer, returns plain HTML, not a component
    fullWidthCellRenderer: FullWidthCellRenderer,
    getRowHeight: (params: RowHeightParams) => {
        // you can have normal rows and full width rows any height that you want
        const isBodyRow = params.node.rowPinned === undefined;
        const isFullWidth = params.node.data.fullWidth;
        if (isBodyRow && isFullWidth) {
            return 75;
        }
    },
};

function alphabet() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
}

function createData(count: number, prefix: string) {
    const rowData = [];
    for (let i = 0; i < count; i++) {
        const item: any = {};
        // mark every third row as full width. how you mark the row is up to you,
        // in this example the example code (not the grid code) looks at the
        // fullWidth attribute in the isFullWidthRow() callback. how you determine
        // if a row is full width or not is totally up to you.
        item.fullWidth = i % 3 === 2;
        // put in a column for each letter of the alphabet
        alphabet().forEach((letter) => {
            item[letter] = prefix + ' (' + letter + ',' + i + ')';
        });
        rowData.push(item);
    }
    return rowData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
