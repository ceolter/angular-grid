import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule, RowGroupingPanelModule } from 'ag-grid-enterprise';
import { PivotModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    PivotModule,
    RowGroupingPanelModule,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 150,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    sideBar: {
        toolPanels: ['columns'],
    },
    rowGroupPanelShow: 'always',
    pivotPanelShow: 'always',
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
};

function onBtSortAthlete() {
    gridApi!.applyColumnState({
        state: [{ colId: 'athlete', sort: 'asc' }],
    });
}

function onBtSortCountryThenSportClearOthers() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'country', sort: 'asc', sortIndex: 0 },
            { colId: 'sport', sort: 'asc', sortIndex: 1 },
        ],
        defaultState: { sort: null },
    });
}

function onBtClearAllSorting() {
    gridApi!.applyColumnState({
        defaultState: { sort: null },
    });
}

function onBtRowGroupCountryThenSport() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'country', rowGroupIndex: 0 },
            { colId: 'sport', rowGroupIndex: 1 },
        ],
        defaultState: { rowGroup: false },
    });
}

function onBtRemoveCountryRowGroup() {
    gridApi!.applyColumnState({
        state: [{ colId: 'country', rowGroup: false }],
    });
}

function onBtClearAllRowGroups() {
    gridApi!.applyColumnState({
        defaultState: { rowGroup: false },
    });
}

function onBtOrderColsMedalsFirst() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'gold' },
            { colId: 'silver' },
            { colId: 'bronze' },
            { colId: 'total' },
            { colId: 'athlete' },
            { colId: 'age' },
            { colId: 'country' },
            { colId: 'sport' },
            { colId: 'year' },
            { colId: 'date' },
        ],
        applyOrder: true,
    });
}

function onBtOrderColsMedalsLast() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'athlete' },
            { colId: 'age' },
            { colId: 'country' },
            { colId: 'sport' },
            { colId: 'year' },
            { colId: 'date' },
            { colId: 'gold' },
            { colId: 'silver' },
            { colId: 'bronze' },
            { colId: 'total' },
        ],
        applyOrder: true,
    });
}

function onBtHideMedals() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'gold', hide: true },
            { colId: 'silver', hide: true },
            { colId: 'bronze', hide: true },
            { colId: 'total', hide: true },
        ],
    });
}

function onBtShowMedals() {
    gridApi!.applyColumnState({
        state: [
            { colId: 'gold', hide: false },
            { colId: 'silver', hide: false },
            { colId: 'bronze', hide: false },
            { colId: 'total', hide: false },
        ],
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
