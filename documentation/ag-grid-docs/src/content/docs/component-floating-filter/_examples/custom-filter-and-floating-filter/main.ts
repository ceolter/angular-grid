import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { NumberFilterComponent } from './numberFilterComponent_typescript';
import { NumberFloatingFilterComponent } from './numberFloatingFilterComponent_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'athlete', filter: 'agTextColumnFilter' },
    {
        field: 'gold',
        floatingFilterComponent: NumberFloatingFilterComponent,
        filter: NumberFilterComponent,
        suppressFloatingFilterButton: true,
    },
    {
        field: 'silver',
        floatingFilterComponent: NumberFloatingFilterComponent,
        filter: NumberFilterComponent,
        suppressFloatingFilterButton: true,
    },
    {
        field: 'bronze',
        floatingFilterComponent: NumberFloatingFilterComponent,
        filter: NumberFilterComponent,
        suppressFloatingFilterButton: true,
    },
    {
        field: 'total',
        floatingFilterComponent: NumberFloatingFilterComponent,
        filter: NumberFilterComponent,
        suppressFloatingFilterButton: true,
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
    },
    columnDefs: columnDefs,
    rowData: null,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
