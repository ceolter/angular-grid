import type {
    ColDef,
    ColumnMovedEvent,
    ColumnPinnedEvent,
    ColumnPivotChangedEvent,
    ColumnResizedEvent,
    ColumnRowGroupChangedEvent,
    ColumnValueChangedEvent,
    ColumnVisibleEvent,
    GridApi,
    GridOptions,
    SortChangedEvent,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    Column,
    ColumnApiModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { PivotModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ColumnApiModule,
    ClientSideRowModelModule,
    PivotModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
];

function onSortChanged(e: SortChangedEvent) {
    console.log('Event Sort Changed', e);
}

function onColumnResized(e: ColumnResizedEvent) {
    console.log('Event Column Resized', e);
}

function onColumnVisible(e: ColumnVisibleEvent) {
    console.log('Event Column Visible', e);
}

function onColumnPivotChanged(e: ColumnPivotChangedEvent) {
    console.log('Event Pivot Changed', e);
}

function onColumnRowGroupChanged(e: ColumnRowGroupChangedEvent) {
    console.log('Event Row Group Changed', e);
}

function onColumnValueChanged(e: ColumnValueChangedEvent) {
    console.log('Event Value Changed', e);
}

function onColumnMoved(e: ColumnMovedEvent) {
    console.log('Event Column Moved', e);
}

function onColumnPinned(e: ColumnPinnedEvent) {
    console.log('Event Column Pinned', e);
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 150,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    },
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
    onSortChanged: onSortChanged,
    onColumnResized: onColumnResized,
    onColumnVisible: onColumnVisible,
    onColumnPivotChanged: onColumnPivotChanged,
    onColumnRowGroupChanged: onColumnRowGroupChanged,
    onColumnValueChanged: onColumnValueChanged,
    onColumnMoved: onColumnMoved,
    onColumnPinned: onColumnPinned,
};

function onBtSortOn() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'age', sort: 'desc' },
            { colId: 'athlete', sort: 'asc' },
        ],
    });
}

function onBtSortOff() {
    gridApi!.applyColumnState({
        defaultState: { sort: null },
    });
}

function onBtWidthNarrow() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'age', width: 100 },
            { colId: 'athlete', width: 100 },
        ],
    });
}

function onBtWidthNormal() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'age', width: 200 },
            { colId: 'athlete', width: 200 },
        ],
    });
}

function onBtHide() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'age', hide: true },
            { colId: 'athlete', hide: true },
        ],
    });
}

function onBtShow() {
    gridApi!.applyColumnState({
        defaultState: { hide: false },
    });
}

function onBtPivotOn() {
    gridApi!.setGridOption('pivotMode', true);
    gridApi!.applyColumnState({
        state: [{ colId: 'country', pivot: true }],
    });
}

function onBtPivotOff() {
    gridApi!.setGridOption('pivotMode', false);
    gridApi!.applyColumnState({
        defaultState: { pivot: false },
    });
}

function onBtRowGroupOn() {
    gridApi!.applyColumnState({
        state: [{ colId: 'sport', rowGroup: true }],
    });
}

function onBtRowGroupOff() {
    gridApi!.applyColumnState({
        defaultState: { rowGroup: false },
    });
}

function onBtAggFuncOn() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'gold', aggFunc: 'sum' },
            { colId: 'silver', aggFunc: 'sum' },
            { colId: 'bronze', aggFunc: 'sum' },
        ],
    });
}

function onBtAggFuncOff() {
    gridApi!.applyColumnState({
        defaultState: { aggFunc: null },
    });
}

function onBtNormalOrder() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'athlete' },
            { colId: 'age' },
            { colId: 'country' },
            { colId: 'sport' },
            { colId: 'gold' },
            { colId: 'silver' },
            { colId: 'bronze' },
        ],
        applyOrder: true,
    });
}

function onBtReverseOrder() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'athlete' },
            { colId: 'age' },
            { colId: 'country' },
            { colId: 'sport' },
            { colId: 'bronze' },
            { colId: 'silver' },
            { colId: 'gold' },
        ],
        applyOrder: true,
    });
}

function onBtPinnedOn() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'athlete', pinned: 'left' },
            { colId: 'age', pinned: 'right' },
        ],
    });
}

function onBtPinnedOff() {
    gridApi!.applyColumnState({
        defaultState: { pinned: null },
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
