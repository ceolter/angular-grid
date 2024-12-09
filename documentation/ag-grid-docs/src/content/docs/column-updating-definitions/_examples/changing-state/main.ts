import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([ColumnApiModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

function getColumnDefs(): ColDef[] {
    return [
        { field: 'athlete', width: 150, sort: 'asc' },
        { field: 'age' },
        { field: 'country', pinned: 'left' },
        { field: 'sport' },
        { field: 'year' },
        { field: 'date' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 100, // resets col widths if manually resized
        pinned: null, // important - clears pinned if not specified in col def
        sort: null, // important - clears sort if not specified in col def
    },
    columnDefs: getColumnDefs(),
};

function onBtWithState() {
    gridApi!.setGridOption('columnDefs', getColumnDefs());
}

function onBtRemove() {
    gridApi!.setGridOption('columnDefs', []);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
