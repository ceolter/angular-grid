import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomHeader } from './customHeader_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'athlete', suppressHeaderFilterButton: true, minWidth: 120 },
    {
        field: 'age',
        sortable: false,
        headerComponentParams: { menuIcon: 'fa-external-link-alt' },
    },
    { field: 'country', suppressHeaderFilterButton: true, minWidth: 120 },
    { field: 'year', sortable: false },
    { field: 'date', suppressHeaderFilterButton: true },
    { field: 'sport', sortable: false },
    {
        field: 'gold',
        headerComponentParams: { menuIcon: 'fa-cog' },
        minWidth: 120,
    },
    { field: 'silver', sortable: false },
    { field: 'bronze', suppressHeaderFilterButton: true, minWidth: 120 },
    { field: 'total', sortable: false },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    components: {
        agColumnHeader: CustomHeader,
    },
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        headerComponentParams: {
            menuIcon: 'fa-filter',
        },
    },
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
