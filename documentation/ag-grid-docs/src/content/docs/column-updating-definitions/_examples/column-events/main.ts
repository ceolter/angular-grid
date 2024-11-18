import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    ColumnMovedEvent,
    ColumnPinnedEvent,
    ColumnPivotChangedEvent,
    ColumnResizedEvent,
    ColumnRowGroupChangedEvent,
    ColumnValueChangedEvent,
    ColumnVisibleEvent,
    GridApi,
    GridOptions,
    SortChangedEvent,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { PivotModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, PivotModule]);

function getColumnDefs(): ColDef[] {
    return [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ];
}

function onSortChanged(e: SortChangedEvent) {
    console.log('Event Sort Changed', e);
}

function onColumnResized(e: ColumnResizedEvent) {
    console.log('Event Column Resized', e);
}

function onColumnVisible(e: ColumnVisibleEvent) {
    console.log('Event Column Visible', e);
}

function onColumnPivotChanged(e: ColumnPivotChangedEvent) {
    console.log('Event Pivot Changed', e);
}

function onColumnRowGroupChanged(e: ColumnRowGroupChangedEvent) {
    console.log('Event Row Group Changed', e);
}

function onColumnValueChanged(e: ColumnValueChangedEvent) {
    console.log('Event Value Changed', e);
}

function onColumnMoved(e: ColumnMovedEvent) {
    console.log('Event Column Moved', e);
}

function onColumnPinned(e: ColumnPinnedEvent) {
    console.log('Event Column Pinned', e);
}

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        width: 150,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    },
    columnDefs: getColumnDefs(),
    rowData: null,
    onSortChanged: onSortChanged,
    onColumnResized: onColumnResized,
    onColumnVisible: onColumnVisible,
    onColumnPivotChanged: onColumnPivotChanged,
    onColumnRowGroupChanged: onColumnRowGroupChanged,
    onColumnValueChanged: onColumnValueChanged,
    onColumnMoved: onColumnMoved,
    onColumnPinned: onColumnPinned,
};

function onBtSortOn() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'age') {
            colDef.sort = 'desc';
        }
        if (colDef.field === 'athlete') {
            colDef.sort = 'asc';
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtSortOff() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.sort = null;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtWidthNarrow() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'age' || colDef.field === 'athlete') {
            colDef.width = 100;
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtWidthNormal() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.width = 200;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtHide() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'age' || colDef.field === 'athlete') {
            colDef.hide = true;
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtShow() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.hide = false;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtPivotOn() {
    gridApi!.setGridOption('pivotMode', true);

    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'country') {
            colDef.pivot = true;
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtPivotOff() {
    gridApi!.setGridOption('pivotMode', false);

    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.pivot = false;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtRowGroupOn() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'sport') {
            colDef.rowGroup = true;
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtRowGroupOff() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.rowGroup = false;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtAggFuncOn() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'gold' || colDef.field === 'silver' || colDef.field === 'bronze') {
            colDef.aggFunc = 'sum';
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtAggFuncOff() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.aggFunc = null;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtPinnedOn() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        if (colDef.field === 'athlete') {
            colDef.pinned = 'left';
        }
        if (colDef.field === 'age') {
            colDef.pinned = 'right';
        }
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtPinnedOff() {
    const columnDefs: ColDef[] = getColumnDefs();
    columnDefs.forEach((colDef) => {
        colDef.pinned = null;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
