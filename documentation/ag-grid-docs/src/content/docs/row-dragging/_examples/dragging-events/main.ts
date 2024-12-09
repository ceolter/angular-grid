import type {
    GridApi,
    GridOptions,
    RowDragCancelEvent,
    RowDragEndEvent,
    RowDragEnterEvent,
    RowDragLeaveEvent,
    RowDragMoveEvent,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    RowDragModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    RowDragModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
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
    onRowDragEnter: onRowDragEnter,
    onRowDragEnd: onRowDragEnd,
    onRowDragMove: onRowDragMove,
    onRowDragLeave: onRowDragLeave,
    onRowDragCancel: onRowDragCancel,
};

function onRowDragEnter(e: RowDragEnterEvent) {
    console.log('onRowDragEnter', e);
}

function onRowDragEnd(e: RowDragEndEvent) {
    console.log('onRowDragEnd', e);
}

function onRowDragMove(e: RowDragMoveEvent) {
    console.log('onRowDragMove', e);
}

function onRowDragLeave(e: RowDragLeaveEvent) {
    console.log('onRowDragLeave', e);
}

function onRowDragCancel(e: RowDragCancelEvent) {
    console.log('onRowDragCancel', e);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
