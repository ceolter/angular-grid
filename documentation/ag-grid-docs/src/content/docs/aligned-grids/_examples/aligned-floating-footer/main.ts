import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    AlignedGridsModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    NumberFilterModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    ColumnAutoSizeModule,
    RowStyleModule,
    AlignedGridsModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 200 },
    { field: 'age', width: 100 },
    { field: 'country', width: 150 },
    { field: 'year', width: 120 },
    { field: 'sport', width: 200 },
    {
        headerName: 'Total',
        colId: 'total',
        valueGetter: 'data.gold + data.silver + data.bronze',
        width: 200,
    },
    { field: 'gold', width: 100 },
    { field: 'silver', width: 100 },
    { field: 'bronze', width: 100 },
];

const dataForBottomGrid = [
    {
        athlete: 'Total',
        age: '15 - 61',
        country: 'Ireland',
        year: '2020',
        date: '26/11/1970',
        sport: 'Synchronised Riding',
        gold: 55,
        silver: 65,
        bronze: 12,
    },
];
// this is the grid options for the top grid
let topApi: GridApi;
let bottomApi: GridApi;
const gridOptionsTop: GridOptions = {
    defaultColDef: {
        filter: true,
        flex: 1,
        minWidth: 100,
    },
    columnDefs,
    rowData: null,
    // don't show the horizontal scrollbar on the top grid
    suppressHorizontalScroll: true,
    alwaysShowVerticalScroll: true,
    alignedGrids: () => [bottomApi],
    autoSizeStrategy: {
        type: 'fitCellContents',
    },
};

// this is the grid options for the bottom grid
const gridOptionsBottom: GridOptions = {
    defaultColDef: {
        filter: true,
        flex: 1,
        minWidth: 100,
    },
    columnDefs: columnDefs,
    // we are hard coding the data here, it's just for demo purposes
    rowData: dataForBottomGrid,
    rowClass: 'bold-row',
    // hide the header on the bottom grid
    headerHeight: 0,
    alwaysShowVerticalScroll: true,
    alignedGrids: () => [topApi],
};

const gridDivTop = document.querySelector<HTMLElement>('#myGridTop')!;
topApi = createGrid(gridDivTop, gridOptionsTop);

const gridDivBottom = document.querySelector<HTMLElement>('#myGridBottom')!;
bottomApi = createGrid(gridDivBottom, gridOptionsBottom);

fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then((response) => response.json())
    .then((data) => {
        topApi!.setGridOption('rowData', data);
    });
