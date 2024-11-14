import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 150, suppressSizeToFit: true },
    { field: 'age', width: 50, maxWidth: 50 },
    { colId: 'country', field: 'country', maxWidth: 300 },
    { field: 'year', width: 90 },
    { field: 'sport', width: 110 },
    { field: 'gold', width: 100 },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    autoSizeStrategy: {
        type: 'fitGridWidth',
        defaultMinWidth: 100,
        columnLimits: [
            {
                colId: 'country',
                minWidth: 900,
            },
        ],
    },
};

function sizeToFit() {
    gridApi!.sizeColumnsToFit({
        defaultMinWidth: 100,
        columnLimits: [{ key: 'country', minWidth: 900 }],
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
