import type { ColDef, GridApi, GridOptions, HeaderValueGetterParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    PivotModule,
    RowGroupingPanelModule,
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
    RowGroupingPanelModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    {
        field: 'athlete',
        minWidth: 200,
        enableRowGroup: true,
        enablePivot: true,
    },
    {
        field: 'age',
        enableValue: true,
    },
    {
        field: 'country',
        minWidth: 200,
        enableRowGroup: true,
        enablePivot: true,
        headerValueGetter: countryHeaderValueGetter,
    },
    {
        field: 'year',
        enableRowGroup: true,
        enablePivot: true,
    },
    {
        field: 'date',
        minWidth: 180,
        enableRowGroup: true,
        enablePivot: true,
    },
    {
        field: 'sport',
        minWidth: 200,
        enableRowGroup: true,
        enablePivot: true,
    },
    {
        field: 'gold',
        hide: true,
        enableValue: true,
        toolPanelClass: 'tp-gold',
    },
    {
        field: 'silver',
        hide: true,
        enableValue: true,
        toolPanelClass: ['tp-silver'],
    },
    {
        field: 'bronze',
        hide: true,
        enableValue: true,
        toolPanelClass: (params) => {
            return 'tp-bronze';
        },
    },
    {
        headerName: 'Total',
        field: 'total',
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
    autoGroupColumnDef: {
        minWidth: 200,
    },
    sideBar: 'columns',
    rowGroupPanelShow: 'always',
};

function countryHeaderValueGetter(params: HeaderValueGetterParams) {
    switch (params.location) {
        case 'csv':
            return 'CSV Country';
        case 'columnToolPanel':
            return 'TP Country';
        case 'columnDrop':
            return 'CD Country';
        case 'header':
            return 'H Country';
        default:
            return 'Should never happen!';
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
