import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import type { ValueFormatterParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

// Row Data Interface
interface IRow {
    mission: string;
    company: string;
    location: string;
    date: string;
    time: string;
    rocket: string;
    price: number;
    successful: boolean;
}

// Grid API: Access to Grid API methods
let gridApi: GridApi;

// Grid Options: Contains all of the grid configurations
const gridOptions: GridOptions = {
    // Data to be displayed
    rowData: [] as IRow[],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [
        {
            field: 'mission',
            filter: true,
        },
        { field: 'company' },
        { field: 'location' },
        { field: 'date' },
        {
            field: 'price',
            valueFormatter: (params: ValueFormatterParams) => {
                return '£' + params.value.toLocaleString();
            },
        },
        { field: 'successful' },
        { field: 'rocket' },
    ] as ColDef[],
    // Configurations applied to all columns
    defaultColDef: {
        filter: true,
    } as ColDef,
    // Grid Options
    pagination: true,
};

// Create Grid: Create new grid within the #myGrid div, using the Grid Options object
gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);

// Fetch Remote Data
fetch('https://www.ag-grid.com/example-assets/space-mission-data.json')
    .then((response) => response.json())
    .then((data: any) => gridApi.setGridOption('rowData', data));
