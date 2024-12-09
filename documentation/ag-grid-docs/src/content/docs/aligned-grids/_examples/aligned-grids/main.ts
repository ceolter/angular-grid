import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import {
    AlignedGridsModule,
    ClientSideRowModelModule,
    ColumnApiModule,
    ColumnAutoSizeModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnApiModule,
    TextFilterModule,
    NumberFilterModule,
    ColumnAutoSizeModule,
    AlignedGridsModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'year' },
    { field: 'sport' },
    {
        headerName: 'Medals',
        children: [
            {
                colId: 'total',
                columnGroupShow: 'closed',
                valueGetter: 'data.gold + data.silver + data.bronze',
            },
            { columnGroupShow: 'open', field: 'gold' },
            { columnGroupShow: 'open', field: 'silver' },
            { columnGroupShow: 'open', field: 'bronze' },
        ],
    },
];
const defaultColDef: ColDef = {
    filter: true,
    minWidth: 100,
};
// this is the grid options for the top grid
const gridOptionsTop: GridOptions = {
    defaultColDef,
    columnDefs,
    rowData: null,
    alignedGrids: () => [bottomApi],
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};
const gridDivTop = document.querySelector<HTMLElement>('#myGridTop')!;
const topApi = createGrid(gridDivTop, gridOptionsTop);

// this is the grid options for the bottom grid
const gridOptionsBottom: GridOptions = {
    defaultColDef,
    columnDefs,
    rowData: null,
    alignedGrids: () => [topApi],
};
const gridDivBottom = document.querySelector<HTMLElement>('#myGridBottom')!;
const bottomApi = createGrid(gridDivBottom, gridOptionsBottom);

function onCbAthlete(value: boolean) {
    // we only need to update one grid, as the other is a slave
    topApi!.setColumnsVisible(['athlete'], value);
}

function onCbAge(value: boolean) {
    // we only need to update one grid, as the other is a slave
    topApi!.setColumnsVisible(['age'], value);
}

function onCbCountry(value: boolean) {
    // we only need to update one grid, as the other is a slave
    topApi!.setColumnsVisible(['country'], value);
}

function setData(rowData: any[]) {
    topApi!.setGridOption('rowData', rowData);
    bottomApi!.setGridOption('rowData', rowData);
}

fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then((response) => response.json())
    .then((data) => setData(data));

if (typeof window !== 'undefined') {
    // Attach external event handlers to window so they can be called from index.html
    (<any>window).onCbAthlete = onCbAthlete;
    (<any>window).onCbAge = onCbAge;
    (<any>window).onCbCountry = onCbCountry;
}
