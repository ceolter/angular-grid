import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TooltipModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([TooltipModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Name & Country',
        headerTooltip: 'Name & Country Group',
        children: [{ field: 'athlete' }, { field: 'country' }],
    },
    {
        headerName: 'Sports Results',
        headerTooltip: 'Sports Results Group',
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
