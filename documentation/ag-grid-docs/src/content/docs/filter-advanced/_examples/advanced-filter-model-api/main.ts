import { ClientSideRowModelModule } from 'ag-grid-community';
import type { AdvancedFilterModel, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AdvancedFilterModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, AdvancedFilterModule, ClientSideRowModelModule, MenuModule]);

const initialAdvancedFilterModel: AdvancedFilterModel = {
    filterType: 'join',
    type: 'AND',
    conditions: [
        {
            filterType: 'join',
            type: 'OR',
            conditions: [
                {
                    filterType: 'number',
                    colId: 'age',
                    type: 'greaterThan',
                    filter: 23,
                },
                {
                    filterType: 'text',
                    colId: 'sport',
                    type: 'endsWith',
                    filter: 'ing',
                },
            ],
        },
        {
            filterType: 'text',
            colId: 'country',
            type: 'contains',
            filter: 'united',
        },
    ],
};

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'age', minWidth: 100 },
        { field: 'gold', minWidth: 100 },
        { field: 'silver', minWidth: 100 },
        { field: 'bronze', minWidth: 100 },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 180,
        filter: true,
    },
    enableAdvancedFilter: true,
    initialState: {
        filter: {
            advancedFilterModel: initialAdvancedFilterModel,
        },
    },
};

let savedFilterModel: AdvancedFilterModel | null = null;

function saveFilterModel() {
    savedFilterModel = gridApi!.getAdvancedFilterModel();
}

function restoreFilterModel() {
    gridApi!.setAdvancedFilterModel(savedFilterModel);
}

function restoreFromHardCoded() {
    gridApi!.setAdvancedFilterModel({
        filterType: 'number',
        colId: 'gold',
        type: 'greaterThanOrEqual',
        filter: 1,
    });
}

function clearFilter() {
    gridApi!.setAdvancedFilterModel(null);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
