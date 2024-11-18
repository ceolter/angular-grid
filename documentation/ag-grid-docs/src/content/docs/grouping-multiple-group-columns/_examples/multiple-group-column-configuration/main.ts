import { ClientSideRowModelModule } from 'ag-grid-community';
import { GridApi, GridOptions, HeaderValueGetterParams, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { headerName: 'Country', field: 'country', rowGroup: true, hide: true },
        { headerName: 'Year', field: 'year', rowGroup: true, hide: true },
        { field: 'athlete' },
        { field: 'sport' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        headerValueGetter: (params: HeaderValueGetterParams) => `${params.colDef.headerName} Group Column`,
        minWidth: 220,
        cellRendererParams: {
            suppressCount: true,
        },
    },
    groupDisplayType: 'multipleColumns',
    rowSelection: {
        mode: 'singleRow',
        checkboxLocation: 'autoGroupColumn',
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
