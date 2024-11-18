import { ClientSideRowModelModule } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomNoRowsOverlay } from './customNoRowsOverlay_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface IAthlete {
    athlete: string;
    country: string;
}

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 150 },
    { field: 'country', width: 120 },
];

let gridApi: GridApi<IAthlete>;

const gridOptions: GridOptions<IAthlete> = {
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },

    columnDefs: columnDefs,
    rowData: [],

    noRowsOverlayComponent: CustomNoRowsOverlay,
    noRowsOverlayComponentParams: {
        noRowsMessageFunc: () => 'No rows found at: ' + new Date().toLocaleTimeString(),
    },
};

function onBtnClearRowData() {
    gridApi!.setGridOption('rowData', []);
}

function onBtnSetRowData() {
    gridApi!.setGridOption('rowData', [{ athlete: 'Michael Phelps', country: 'US' }]);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
