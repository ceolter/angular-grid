import type { AdvancedFilterModel, FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    GridStateModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { AdvancedFilterModule, ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    TextFilterModule,
    NumberFilterModule,
    GridStateModule,
    AdvancedFilterModule,
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

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
    onFirstDataRendered: (params: FirstDataRenderedEvent) => {
        params.api.showAdvancedFilterBuilder();
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
