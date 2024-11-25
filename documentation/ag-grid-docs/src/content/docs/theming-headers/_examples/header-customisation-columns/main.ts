import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    createGrid,
    themeQuartz,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const myTheme = themeQuartz.withParams({
    headerColumnBorder: { color: 'purple' },
    headerColumnBorderHeight: '80%',

    headerColumnResizeHandleColor: 'orange',
    headerColumnResizeHandleHeight: '25%',
    headerColumnResizeHandleWidth: '5px',
});

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    rowData: null,
    columnDefs: [
        {
            headerName: 'Group 1',
            children: [
                { field: 'athlete', minWidth: 170, resizable: true },
                { field: 'age', resizable: true },
            ],
            resizable: true,
        },
        {
            headerName: 'Group 2',
            children: [
                { field: 'country' },
                { field: 'year' },
                { field: 'date' },
                { field: 'sport' },
                { field: 'gold' },
                { field: 'silver' },
                { field: 'bronze' },
                { field: 'total' },
            ],
        },
    ],
    defaultColDef: {
        editable: true,
        filter: true,
        resizable: false,
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
