import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule /* Development Only */]);

function createNormalColDefs(): (ColDef | ColGroupDef)[] {
    return [
        {
            headerName: 'Athlete Details',
            headerClass: 'participant-group',
            children: [
                { field: 'athlete', colId: 'athlete' },
                { field: 'country', colId: 'country' },
            ],
        },
        { field: 'age', colId: 'age' },
        {
            headerName: 'Sports Results',
            headerClass: 'medals-group',
            children: [
                { field: 'sport', colId: 'sport' },
                { field: 'gold', colId: 'gold' },
            ],
        },
    ];
}

function createExtraColDefs(): (ColDef | ColGroupDef)[] {
    return [
        {
            headerName: 'Athlete Details',
            headerClass: 'participant-group',
            children: [
                { field: 'athlete', colId: 'athlete' },
                { field: 'country', colId: 'country' },
                { field: 'region1', colId: 'region1' },
                { field: 'region2', colId: 'region2' },
            ],
        },
        { field: 'age', colId: 'age' },
        { field: 'distance', colId: 'distance' },
        {
            headerName: 'Sports Results',
            headerClass: 'medals-group',
            children: [
                { field: 'sport', colId: 'sport' },
                { field: 'gold', colId: 'gold' },
            ],
        },
    ];
}

function onBtNormalCols() {
    gridApi!.setGridOption('columnDefs', createNormalColDefs());
}

function onBtExtraCols() {
    gridApi!.setGridOption('columnDefs', createExtraColDefs());
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 150,
    },
    // debug: true,
    columnDefs: createNormalColDefs(),
    rowData: null,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
