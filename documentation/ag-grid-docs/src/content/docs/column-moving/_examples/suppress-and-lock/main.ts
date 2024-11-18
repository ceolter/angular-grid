import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { ColDef, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            suppressMovable: true,
            cellClass: 'suppress-movable-col',
        },
        { field: 'age', lockPosition: 'left', cellClass: 'locked-col' },
        { field: 'country' },
        { field: 'year' },
        { field: 'total', lockPosition: 'right', cellClass: 'locked-col' },
    ],
    defaultColDef: {
        flex: 1,
        lockPinned: true, // Dont allow pinning for this example
    },
    suppressDragLeaveHidesColumns: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
