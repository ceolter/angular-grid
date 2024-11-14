import {
    AllCommunityModule,
    ClientSideRowModelModule,
    GridApi,
    GridOptions,
    InitialGroupOrderComparatorParams,
    ModuleRegistry,
    createGrid,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, MenuModule, RowGroupingModule, SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'year', rowGroup: true, hide: true },
        { field: 'athlete' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    groupDisplayType: 'multipleColumns',
    initialGroupOrderComparator: (params: InitialGroupOrderComparatorParams) =>
        params.nodeA.allLeafChildren.length - params.nodeB.allLeafChildren.length,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
