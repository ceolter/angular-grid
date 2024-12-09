import type { ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    AlignedGridsModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextFilterModule,
    ColumnAutoSizeModule,
    ClientSideRowModelModule,
    AlignedGridsModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColGroupDef[] = [
    {
        headerName: 'Group 1',
        groupId: 'Group1',
        children: [
            { field: 'athlete', pinned: true },
            { field: 'age', pinned: true, columnGroupShow: 'open' },
            { field: 'country' },
            { field: 'year', columnGroupShow: 'open' },
            { field: 'date' },
            { field: 'sport', columnGroupShow: 'open' },
        ],
    },
    {
        headerName: 'Group 2',
        groupId: 'Group2',
        children: [
            { field: 'athlete', pinned: true },
            { field: 'age', pinned: true, columnGroupShow: 'open' },
            { field: 'country' },
            { field: 'year', columnGroupShow: 'open' },
            { field: 'date' },
            { field: 'sport', columnGroupShow: 'open' },
        ],
    },
];
let topApi: GridApi;
let bottomApi: GridApi;
// this is the grid options for the top grid
const gridOptionsTop: GridOptions = {
    defaultColDef: {
        filter: true,
        flex: 1,
        minWidth: 120,
    },
    columnDefs: columnDefs,
    rowData: null,
    alignedGrids: () => [bottomApi],
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};

// this is the grid options for the bottom grid
const gridOptionsBottom: GridOptions = {
    defaultColDef: {
        filter: true,
        flex: 1,
        minWidth: 120,
    },
    columnDefs: columnDefs,
    rowData: null,
    alignedGrids: () => [topApi],
};

function setData(rowData: any[]) {
    topApi!.setGridOption('rowData', rowData);
    bottomApi!.setGridOption('rowData', rowData);

    // mix up some columns
    topApi!.moveColumnByIndex(11, 4);
    topApi!.moveColumnByIndex(11, 4);
}

const gridDivTop = document.querySelector<HTMLElement>('#myGridTop')!;
topApi = createGrid(gridDivTop, gridOptionsTop);

const gridDivBottom = document.querySelector<HTMLElement>('#myGridBottom')!;
bottomApi = createGrid(gridDivBottom, gridOptionsBottom);

fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then((response) => response.json())
    .then((data) => {
        setData(data);
    });
