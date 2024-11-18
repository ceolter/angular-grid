import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

const columnDefs: ColGroupDef[] = [
    {
        headerName: 'Athlete Details',
        children: [
            {
                field: 'athlete',
                width: 150,
                suppressSizeToFit: true,
                enableRowGroup: true,
                rowGroupIndex: 0,
            },
            {
                field: 'age',
                width: 90,
                minWidth: 75,
                maxWidth: 100,
                enableRowGroup: true,
            },
            {
                field: 'country',
                width: 120,
                enableRowGroup: true,
            },
            {
                field: 'year',
                width: 90,
                enableRowGroup: true,
            },
            { field: 'sport', width: 110, enableRowGroup: true },
            {
                field: 'gold',
                width: 60,
                enableValue: true,
                suppressHeaderMenuButton: true,
                suppressHeaderFilterButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'silver',
                width: 60,
                enableValue: true,
                suppressHeaderMenuButton: true,
                suppressHeaderFilterButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'bronze',
                width: 60,
                enableValue: true,
                suppressHeaderMenuButton: true,
                suppressHeaderFilterButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
            {
                field: 'total',
                width: 60,
                enableValue: true,
                suppressHeaderMenuButton: true,
                suppressHeaderFilterButton: true,
                filter: 'agNumberColumnFilter',
                aggFunc: 'sum',
            },
        ],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    groupHeaderHeight: 75,
    headerHeight: 150,
    floatingFiltersHeight: 50,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
