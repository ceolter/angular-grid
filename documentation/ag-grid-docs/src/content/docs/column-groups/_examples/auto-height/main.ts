import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        children: [{ field: 'athlete' }, { field: 'country' }],
    },
    {
        headerName: 'A shared prop for all Groups',
        wrapHeaderText: true,
        autoHeaderHeight: true,
        children: [
            { columnGroupShow: 'closed', field: 'total' },
            { columnGroupShow: 'open', field: 'gold' },
            { columnGroupShow: 'open', field: 'silver' },
            { columnGroupShow: 'open', field: 'bronze' },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
