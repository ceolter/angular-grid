import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Athlete Details',
        suppressStickyLabel: true,
        children: [
            { field: 'athlete', pinned: true, colId: 'athlete' },
            { field: 'country', colId: 'country' },
            { field: 'age', colId: 'age' },
        ],
    },
    {
        headerName: 'Sports Results',
        suppressStickyLabel: true,
        openByDefault: true,
        children: [
            { field: 'sport', colId: 'sport' },
            { field: 'gold', colId: 'gold', columnGroupShow: 'open' },
            { field: 'silver', colId: 'silver', columnGroupShow: 'open' },
            { field: 'bronze', colId: 'bronze', columnGroupShow: 'open' },
            { field: 'total', colId: 'total', columnGroupShow: 'closed' },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 200,
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
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
