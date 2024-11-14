import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomTooltip } from './customTooltip_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        minWidth: 150,
        tooltipField: 'athlete',
        tooltipComponentParams: { type: 'success' },
    },
    { field: 'age', minWidth: 130, tooltipField: 'age' },
    { field: 'year' },
    { field: 'sport' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        tooltipComponent: CustomTooltip,
    },

    tooltipInteraction: true,
    tooltipShowDelay: 500,
    // set rowData to null or undefined to show loading panel by default
    rowData: null,
    columnDefs: columnDefs,
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
