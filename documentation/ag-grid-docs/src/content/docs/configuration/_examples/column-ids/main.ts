import type { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([ColumnApiModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        // colId will be 'height',
        { headerName: 'Col 1', field: 'height' },

        // colId will be 'firstWidth',
        { headerName: 'Col 2', colId: 'firstWidth', field: 'width' },
        // colId will be 'secondWidth'
        { headerName: 'Col 3', colId: 'secondWidth', field: 'width' },

        // no colId, no field, so grid generated ID
        { headerName: 'Col 4', valueGetter: 'data.width' },
        { headerName: 'Col 5', valueGetter: 'data.width' },
    ],
    rowData: createRowData(),
    onGridReady: (params: GridReadyEvent) => {
        const cols = params.api.getColumns()!;
        cols.forEach((col) => {
            const colDef = col.getColDef();
            console.log(colDef.headerName + ', Column ID = ' + col.getId(), JSON.stringify(colDef));
        });
    },
};

function createRowData() {
    const data = [];
    for (let i = 0; i < 20; i++) {
        data.push({
            height: Math.floor(Math.random() * 100),
            width: Math.floor(Math.random() * 100),
            depth: Math.floor(Math.random() * 100),
        });
    }
    return data;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
