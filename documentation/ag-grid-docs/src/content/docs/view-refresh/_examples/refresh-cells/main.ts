import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IRowNode, RefreshCellsParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// placing in 13 rows, so there are exactly enough rows to fill the grid, makes
// the row animation look nice when you see all the rows
let data: any[] = [];
let topRowData: any[] = [];
let bottomRowData: any[] = [];
let gridApi: GridApi;
const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'a', enableCellChangeFlash: false },
        { field: 'b' },
        { field: 'c' },
        { field: 'd' },
        { field: 'e' },
        { field: 'f' },
    ],
    defaultColDef: {
        flex: 1,
        enableCellChangeFlash: true,
    },
    rowData: [],
    pinnedTopRowData: [],
    pinnedBottomRowData: [],
    onGridReady: (params) => {
        // placing in 13 rows, so there are exactly enough rows to fill the grid, makes
        // the row animation look nice when you see all the rows
        data = createData(14);
        topRowData = createData(2);
        bottomRowData = createData(2);
        params.api.setGridOption('rowData', data);
        params.api.setGridOption('pinnedTopRowData', topRowData);
        params.api.setGridOption('pinnedBottomRowData', bottomRowData);
    },
};

function createData(count: number): any[] {
    const result = [];
    for (let i = 1; i <= count; i++) {
        result.push({
            a: (i * 863) % 100,
            b: (i * 811) % 100,
            c: (i * 743) % 100,
            d: (i * 677) % 100,
            e: (i * 619) % 100,
            f: (i * 571) % 100,
        });
    }
    return result;
}

function isForceRefreshSelected() {
    return (document.querySelector('#forceRefresh') as HTMLInputElement).checked;
}

function isSuppressFlashSelected() {
    return (document.querySelector('#suppressFlash') as HTMLInputElement).checked;
}

function scrambleAndRefreshAll() {
    scramble();
    const params = {
        force: isForceRefreshSelected(),
        suppressFlash: isSuppressFlashSelected(),
    };
    gridApi!.refreshCells(params);
}

function scrambleAndRefreshLeftToRight() {
    scramble();

    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((col, index) => {
        const millis = index * 100;
        const params = {
            force: isForceRefreshSelected(),
            suppressFlash: isSuppressFlashSelected(),
            columns: [col],
        };
        callRefreshAfterMillis(params, millis, gridApi);
    });
}

function scrambleAndRefreshTopToBottom() {
    scramble();

    let frame = 0;
    let i;
    let rowNode;

    for (i = 0; i < gridApi.getPinnedTopRowCount(); i++) {
        rowNode = gridApi.getPinnedTopRow(i)!;
        refreshRow(rowNode, gridApi);
    }

    for (i = 0; i < gridApi.getDisplayedRowCount(); i++) {
        rowNode = gridApi.getDisplayedRowAtIndex(i)!;
        refreshRow(rowNode, gridApi);
    }

    for (i = 0; i < gridApi.getPinnedBottomRowCount(); i++) {
        rowNode = gridApi.getPinnedBottomRow(i)!;
        refreshRow(rowNode, gridApi);
    }

    function refreshRow(rowNode: IRowNode, api: GridApi) {
        const millis = frame++ * 100;
        const rowNodes = [rowNode]; // params needs an array
        const params: RefreshCellsParams = {
            force: isForceRefreshSelected(),
            suppressFlash: isSuppressFlashSelected(),
            rowNodes: rowNodes,
        };
        callRefreshAfterMillis(params, millis, api);
    }
}

function callRefreshAfterMillis(params: RefreshCellsParams, millis: number, api: GridApi) {
    setTimeout(() => {
        api.refreshCells(params);
    }, millis);
}

function scramble() {
    data.forEach(scrambleItem);
    topRowData.forEach(scrambleItem);
    bottomRowData.forEach(scrambleItem);
}

function scrambleItem(item: any) {
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((colId) => {
        // skip 50% of the cells so updates are random
        if (Math.random() > 0.5) {
            return;
        }
        item[colId] = Math.floor(Math.random() * 100);
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
