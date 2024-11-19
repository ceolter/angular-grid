import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface IAthlete {
    athlete: string;
    country: string;
}

let gridApi: GridApi<IAthlete>;

const gridOptions: GridOptions<IAthlete> = {
    loading: true,
    columnDefs: [{ field: 'athlete' }, { field: 'country' }],
};

function setLoading(value: boolean) {
    gridApi!.setGridOption('loading', value);
}

function onBtnClearRowData() {
    gridApi!.setGridOption('rowData', []);
}

function onBtnSetRowData() {
    gridApi!.setGridOption('rowData', [{ athlete: 'Michael Phelps', country: 'US' }]);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
