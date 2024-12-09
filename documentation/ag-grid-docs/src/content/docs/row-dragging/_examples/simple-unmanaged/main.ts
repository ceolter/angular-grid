import type { GetRowIdParams, GridApi, GridOptions, RowDragMoveEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    NumberFilterModule,
    RowDragModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { getData } from './data';

ModuleRegistry.registerModules([
    RowDragModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ColumnApiModule,
    ValidationModule /* Development Only */,
]);

let immutableStore: any[] = getData();

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'athlete', rowDrag: true },
        { field: 'country' },
        { field: 'year', width: 100 },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ],
    defaultColDef: {
        width: 170,
        filter: true,
    },
    // this tells the grid we are doing updates when setting new data
    onRowDragMove: onRowDragMove,
    getRowId: getRowId,
    onSortChanged: onSortChanged,
    onFilterChanged: onFilterChanged,
    onGridReady: (params) => {
        // add id to each item, needed for immutable store to work
        immutableStore.forEach(function (data, index) {
            data.id = index;
        });

        params.api.setGridOption('rowData', immutableStore);
    },
};

let sortActive = false;
let filterActive = false;

// listen for change on sort changed
function onSortChanged() {
    const colState = gridApi!.getColumnState() || [];
    sortActive = colState.some((c) => c.sort);
    // suppress row drag if either sort or filter is active
    const suppressRowDrag = sortActive || filterActive;
    console.log(
        'sortActive = ' + sortActive + ', filterActive = ' + filterActive + ', allowRowDrag = ' + suppressRowDrag
    );
    gridApi!.setGridOption('suppressRowDrag', suppressRowDrag);
}

// listen for changes on filter changed
function onFilterChanged() {
    filterActive = gridApi!.isAnyFilterPresent();
    // suppress row drag if either sort or filter is active
    const suppressRowDrag = sortActive || filterActive;
    console.log(
        'sortActive = ' + sortActive + ', filterActive = ' + filterActive + ', allowRowDrag = ' + suppressRowDrag
    );
    gridApi!.setGridOption('suppressRowDrag', suppressRowDrag);
}

function getRowId(params: GetRowIdParams) {
    return String(params.data.id);
}

function onRowDragMove(event: RowDragMoveEvent) {
    const movingNode = event.node;
    const overNode = event.overNode;

    const rowNeedsToMove = movingNode !== overNode;

    if (rowNeedsToMove) {
        // the list of rows we have is data, not row nodes, so extract the data
        const movingData = movingNode.data;
        const overData = overNode!.data;

        const fromIndex = immutableStore.indexOf(movingData);
        const toIndex = immutableStore.indexOf(overData);

        const newStore = immutableStore.slice();
        moveInArray(newStore, fromIndex, toIndex);

        immutableStore = newStore;
        gridApi!.setGridOption('rowData', newStore);

        gridApi!.clearFocusedCell();
    }

    function moveInArray(arr: any[], fromIndex: number, toIndex: number) {
        const element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
