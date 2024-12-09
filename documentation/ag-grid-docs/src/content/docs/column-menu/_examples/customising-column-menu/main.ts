import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 200, filter: true, suppressHeaderMenuButton: true },
    { field: 'age', filter: true, floatingFilter: true, suppressHeaderMenuButton: true },
    { field: 'country', minWidth: 200, filter: true, suppressHeaderFilterButton: true },
    { field: 'year', filter: true, floatingFilter: true, suppressHeaderFilterButton: true },
    { field: 'sport', minWidth: 200, suppressHeaderContextMenu: true },
    { field: 'gold', suppressHeaderMenuButton: true, suppressHeaderFilterButton: true },
    { field: 'silver', filter: true, suppressHeaderMenuButton: true, suppressHeaderFilterButton: true },
    {
        field: 'bronze',
        filter: true,
        floatingFilter: true,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
    },
    {
        field: 'total',
        filter: true,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        suppressHeaderContextMenu: true,
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
