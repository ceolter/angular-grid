import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [{ field: 'accented', width: 150 }];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    accentedSort: true,
    rowData: [{ accented: 'aàáä' }, { accented: 'aäàá' }, { accented: 'aáàä' }],
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
