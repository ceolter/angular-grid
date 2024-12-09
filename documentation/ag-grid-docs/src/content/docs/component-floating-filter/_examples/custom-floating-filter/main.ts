import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { NumberFloatingFilterComponent } from './numberFloatingFilterComponent_typescript';

ModuleRegistry.registerModules([
    TextFilterModule,
    ClientSideRowModelModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', filter: false },
    {
        field: 'gold',
        filter: 'agNumberColumnFilter',
        suppressHeaderFilterButton: true,
        floatingFilterComponent: NumberFloatingFilterComponent,
        floatingFilterComponentParams: {
            color: 'gold',
        },
        suppressFloatingFilterButton: true,
    },
    {
        field: 'silver',
        filter: 'agNumberColumnFilter',
        suppressHeaderFilterButton: true,
        floatingFilterComponent: NumberFloatingFilterComponent,
        floatingFilterComponentParams: {
            color: 'silver',
        },
        suppressFloatingFilterButton: true,
    },
    {
        field: 'bronze',
        filter: 'agNumberColumnFilter',
        suppressHeaderFilterButton: true,
        floatingFilterComponent: NumberFloatingFilterComponent,
        floatingFilterComponentParams: {
            color: '#CD7F32',
        },
        suppressFloatingFilterButton: true,
    },
    {
        field: 'total',
        filter: 'agNumberColumnFilter',
        suppressHeaderFilterButton: true,
        floatingFilterComponent: NumberFloatingFilterComponent,
        floatingFilterComponentParams: {
            color: 'unset',
        },
        suppressFloatingFilterButton: true,
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
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
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
