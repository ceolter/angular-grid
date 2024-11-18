import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'athlete', colId: 'athlete' },
    { field: 'age', colId: 'age' },
    { field: 'country', colId: 'country' },
    { field: 'year', colId: 'year' },
    { field: 'date', colId: 'date' },
    { field: 'total', colId: 'total' },
    { field: 'gold', colId: 'gold' },
    { field: 'silver', colId: 'silver' },
    { field: 'bronze', colId: 'bronze' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        initialWidth: 150,
        filter: true,
    },
    columnDefs: columnDefs,
    maintainColumnOrder: true,
};

function onBtNoGroups() {
    const columnDefs: ColDef[] = [
        { field: 'athlete', colId: 'athlete' },
        { field: 'age', colId: 'age' },
        { field: 'country', colId: 'country' },
        { field: 'year', colId: 'year' },
        { field: 'date', colId: 'date' },
        { field: 'total', colId: 'total' },
        { field: 'gold', colId: 'gold' },
        { field: 'silver', colId: 'silver' },
        { field: 'bronze', colId: 'bronze' },
    ];
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onMedalsInGroupOnly() {
    const columnDefs: (ColDef | ColGroupDef)[] = [
        { field: 'athlete', colId: 'athlete' },
        { field: 'age', colId: 'age' },
        { field: 'country', colId: 'country' },
        { field: 'year', colId: 'year' },
        { field: 'date', colId: 'date' },
        {
            headerName: 'Medals',
            headerClass: 'medals-group',
            children: [
                { field: 'total', colId: 'total' },
                { field: 'gold', colId: 'gold' },
                { field: 'silver', colId: 'silver' },
                { field: 'bronze', colId: 'bronze' },
            ],
        },
    ];
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onParticipantInGroupOnly() {
    const columnDefs: (ColDef | ColGroupDef)[] = [
        {
            headerName: 'Participant',
            headerClass: 'participant-group',
            children: [
                { field: 'athlete', colId: 'athlete' },
                { field: 'age', colId: 'age' },
                { field: 'country', colId: 'country' },
                { field: 'year', colId: 'year' },
                { field: 'date', colId: 'date' },
            ],
        },
        { field: 'total', colId: 'total' },
        { field: 'gold', colId: 'gold' },
        { field: 'silver', colId: 'silver' },
        { field: 'bronze', colId: 'bronze' },
    ];
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onParticipantAndMedalsInGroups() {
    const columnDefs: (ColDef | ColGroupDef)[] = [
        {
            headerName: 'Participant',
            headerClass: 'participant-group',
            children: [
                { field: 'athlete', colId: 'athlete' },
                { field: 'age', colId: 'age' },
                { field: 'country', colId: 'country' },
                { field: 'year', colId: 'year' },
                { field: 'date', colId: 'date' },
            ],
        },
        {
            headerName: 'Medals',
            headerClass: 'medals-group',
            children: [
                { field: 'total', colId: 'total' },
                { field: 'gold', colId: 'gold' },
                { field: 'silver', colId: 'silver' },
                { field: 'bronze', colId: 'bronze' },
            ],
        },
    ];
    gridApi!.setGridOption('columnDefs', columnDefs);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
