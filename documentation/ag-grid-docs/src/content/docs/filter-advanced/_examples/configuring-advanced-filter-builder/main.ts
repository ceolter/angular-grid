import type {
    AdvancedFilterBuilderVisibleChangedEvent,
    AdvancedFilterModel,
    GridApi,
    GridOptions,
    GridReadyEvent,
    IAdvancedFilterBuilderParams,
} from 'ag-grid-community';
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

const advancedFilterBuilderParams: IAdvancedFilterBuilderParams = {
    showMoveButtons: true,
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
    popupParent: document.getElementById('wrapper'),
    initialState: {
        filter: {
            advancedFilterModel: initialAdvancedFilterModel,
        },
    },
    advancedFilterBuilderParams: advancedFilterBuilderParams,
    onAdvancedFilterBuilderVisibleChanged: onAdvancedFilterBuilderVisibleChanged,
    onGridReady: (params: GridReadyEvent) => {
        // Could also be provided via grid option `advancedFilterParent`.
        // Setting the parent removes the Advanced Filter input from the grid,
        // allowing the Advanced Filter to be edited only via the Builder, launched via the API.
        params.api.setGridOption('advancedFilterParent', document.getElementById('advancedFilterParent'));
    },
    onFilterChanged: onFilterChanged,
};

function onAdvancedFilterBuilderVisibleChanged(event: AdvancedFilterBuilderVisibleChangedEvent<IOlympicData>) {
    const eButton = document.getElementById('advancedFilterBuilderButton')!;
    if (event.visible) {
        eButton.setAttribute('disabled', '');
    } else {
        eButton.removeAttribute('disabled');
    }
}

function onFilterChanged() {
    const advancedFilterApplied = !!gridApi!.getAdvancedFilterModel();
    document.getElementById('advancedFilterIcon')!.classList.toggle('filter-icon-disabled', !advancedFilterApplied);
}

function showBuilder() {
    gridApi!.showAdvancedFilterBuilder();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
