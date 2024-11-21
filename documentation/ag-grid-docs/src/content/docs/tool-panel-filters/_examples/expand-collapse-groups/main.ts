import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import { IFiltersToolPanel, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        groupId: 'athleteGroupId',
        headerName: 'Athlete',
        children: [
            {
                headerName: 'Name',
                field: 'athlete',
                minWidth: 200,
                filter: 'agTextColumnFilter',
            },
            { field: 'age' },
            {
                groupId: 'competitionGroupId',
                headerName: 'Competition',
                children: [{ field: 'year' }, { field: 'date', minWidth: 180 }],
            },
            { field: 'country', minWidth: 200 },
        ],
    },
    { colId: 'sport', field: 'sport', minWidth: 200 },
    {
        headerName: 'Medals',
        children: [{ field: 'gold' }, { field: 'silver' }, { field: 'bronze' }, { field: 'total' }],
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    sideBar: 'filters',
    onGridReady: (params) => {
        // initially collapse all filter groups
        params.api.getToolPanelInstance('filters')!.collapseFilterGroups();
    },
};

function collapseAll() {
    gridApi!.getToolPanelInstance('filters')!.collapseFilterGroups();
}

function expandAthleteAndCompetition() {
    gridApi!.getToolPanelInstance('filters')!.expandFilterGroups(['athleteGroupId', 'competitionGroupId']);
}

function collapseCompetition() {
    gridApi!.getToolPanelInstance('filters')!.collapseFilterGroups(['competitionGroupId']);
}

function expandAll() {
    gridApi!.getToolPanelInstance('filters')!.expandFilterGroups();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
