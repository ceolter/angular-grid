import { ClientSideRowModelModule } from 'ag-grid-community';
import { GridApi, GridOptions, KeyCreatorParams, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true, filter: true },
        { field: 'year', rowGroup: true, hide: true, filter: true },
        { field: 'athlete' },
        { field: 'sport' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        minWidth: 200,
        filter: true,
        floatingFilter: true,
        filterValueGetter: (params) => params.data?.athlete,
        filterParams: {
            treeList: true,
            keyCreator: (params: KeyCreatorParams) => (params.value ? params.value.join('#') : null),
        },
    },
    groupDefaultExpanded: 1,
    onGridReady: (params) => {
        params.api.showColumnFilter('ag-Grid-AutoColumn');
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
