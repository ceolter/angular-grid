import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    PivotModule,
    RowGroupingPanelModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
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
        rowGroupIndex: 1,
    },
    {
        field: 'year',
        enableRowGroup: true,
        enablePivot: true,
        pivotIndex: 1,
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
        rowGroupIndex: 2,
    },
    {
        field: 'gold',
        hide: true,
        enableValue: true,
    },
    {
        field: 'silver',
        hide: true,
        enableValue: true,
        aggFunc: 'sum',
    },
    {
        field: 'bronze',
        hide: true,
        enableValue: true,
        aggFunc: 'sum',
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
        minWidth: 150,
    },
    autoGroupColumnDef: {
        minWidth: 250,
    },
    pivotMode: true,
    sideBar: 'columns',
    rowGroupPanelShow: 'always',
    pivotPanelShow: 'always',
    functionsReadOnly: true,
    onGridReady: (params) => {
        (document.getElementById('read-only') as HTMLInputElement).checked = true;
    },
};

function setReadOnly() {
    gridApi!.setGridOption('functionsReadOnly', (document.getElementById('read-only') as HTMLInputElement).checked);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
