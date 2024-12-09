import type { ColDef, GridApi, GridOptions, INumberFilterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { SliderFloatingFilter } from './sliderFloatingFilter_typescript';

ModuleRegistry.registerModules([
    TextFilterModule,
    ClientSideRowModelModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

const filterParams: INumberFilterParams = {
    filterOptions: ['greaterThan'],
    maxNumConditions: 1,
};

const columnDefs: ColDef[] = [
    { field: 'athlete', filter: false },
    {
        field: 'gold',
        filter: 'agNumberColumnFilter',
        filterParams: filterParams,
        floatingFilterComponent: SliderFloatingFilter,
        floatingFilterComponentParams: {
            maxValue: 7,
        },
        suppressFloatingFilterButton: true,
        suppressHeaderMenuButton: false,
    },
    {
        field: 'silver',
        filter: 'agNumberColumnFilter',
        filterParams: filterParams,
        floatingFilterComponent: SliderFloatingFilter,
        floatingFilterComponentParams: {
            maxValue: 5,
        },
        suppressFloatingFilterButton: true,
        suppressHeaderMenuButton: false,
    },
    {
        field: 'bronze',
        filter: 'agNumberColumnFilter',
        filterParams: filterParams,
        floatingFilterComponent: SliderFloatingFilter,
        floatingFilterComponentParams: {
            maxValue: 10,
        },
        suppressFloatingFilterButton: true,
        suppressHeaderMenuButton: false,
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
    alwaysShowVerticalScroll: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => {
            gridApi!.setGridOption('rowData', data);
        });
});
