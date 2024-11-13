import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { CommunityFeaturesModule, ModuleRegistry, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([CommunityFeaturesModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    { headerName: '#', colId: 'rowNum', valueGetter: 'node.id' },
    { field: 'athlete', minWidth: 170 },
    { field: 'age' },
    { field: 'country' },
    { field: 'year' },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
