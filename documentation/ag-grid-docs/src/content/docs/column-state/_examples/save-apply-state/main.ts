import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnsToolPanelModule, PivotModule, RowGroupingPanelModule } from 'ag-grid-enterprise';

declare let window: any;

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    PivotModule,
    RowGroupingPanelModule,
    ColumnApiModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 100,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    sideBar: {
        toolPanels: ['columns'],
    },
    rowGroupPanelShow: 'always',
    pivotPanelShow: 'always',
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
};

function saveState() {
    window.colState = gridApi!.getColumnState();
    console.log('column state saved');
}

function restoreState() {
    if (!window.colState) {
        console.log('no columns state to restore by, you must save state first');
        return;
    }
    gridApi!.applyColumnState({
        state: window.colState,
        applyOrder: true,
    });
    console.log('column state restored');
}

function resetState() {
    gridApi!.resetColumnState();
    console.log('column state reset');
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
