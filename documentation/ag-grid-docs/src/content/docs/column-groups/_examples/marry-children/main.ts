import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Athlete Details',
        marryChildren: true,
        children: [
            { field: 'athlete', colId: 'athlete' },
            { field: 'country', colId: 'country' },
        ],
    },
    { field: 'age', colId: 'age' },
    {
        headerName: 'Sports Results',
        marryChildren: true,
        children: [
            { field: 'sport', colId: 'sport' },
            { field: 'total', colId: 'total' },
            { field: 'gold', colId: 'gold' },
            { field: 'silver', colId: 'silver' },
            { field: 'bronze', colId: 'bronze' },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 160,
    },
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
