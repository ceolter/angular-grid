import type { ColGroupDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    PivotModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    NumberFilterModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    SetFilterModule,
    PivotModule,
    TextFilterModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColGroupDef[] = [
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
            {
                groupId: 'competitionGroupId',
                headerName: 'Competition',
                children: [{ field: 'year' }, { field: 'date', minWidth: 180 }],
            },
        ],
    },
    {
        groupId: 'medalsGroupId',
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
        // allow every column to be aggregated
        enableValue: true,
        // allow every column to be grouped
        enableRowGroup: true,
        // allow every column to be pivoted
        enablePivot: true,
        filter: true,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    sideBar: 'columns',
    onGridReady: (params) => {
        const columnToolPanel = params.api.getToolPanelInstance('columns')!;
        columnToolPanel.collapseColumnGroups();
    },
};

function expandAllGroups() {
    const columnToolPanel = gridApi!.getToolPanelInstance('columns')!;
    columnToolPanel.expandColumnGroups();
}

function collapseAllGroups() {
    const columnToolPanel = gridApi!.getToolPanelInstance('columns')!;
    columnToolPanel.collapseColumnGroups();
}

function expandAthleteAndCompetitionGroups() {
    const columnToolPanel = gridApi!.getToolPanelInstance('columns')!;
    columnToolPanel.expandColumnGroups(['athleteGroupId', 'competitionGroupId']);
}

function collapseCompetitionGroups() {
    const columnToolPanel = gridApi!.getToolPanelInstance('columns')!;
    columnToolPanel.collapseColumnGroups(['competitionGroupId']);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
