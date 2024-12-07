import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, RowGroupingModule, SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year' },
        { field: 'total', aggFunc: 'sum', filter: 'agNumberColumnFilter' },
    ],
    defaultColDef: {
        flex: 1,
        floatingFilter: true,
    },
    autoGroupColumnDef: {
        field: 'athlete',
    },
    groupDefaultExpanded: -1,
    groupAggFiltering: true,

    onGridReady: (params) => {
        document.querySelector<HTMLInputElement>('#groupAggFiltering')!.checked = true;
        params.api.setFilterModel({
            total: {
                type: 'contains',
                filter: '192',
            },
        });
    },
};

function toggleProperty() {
    const enable = document.querySelector<HTMLInputElement>('#groupAggFiltering')!.checked;
    gridApi.setGridOption('groupAggFiltering', enable);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
