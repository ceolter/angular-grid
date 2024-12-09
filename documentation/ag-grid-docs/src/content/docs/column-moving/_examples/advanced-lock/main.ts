import type { ColDef, ColumnPinnedEvent, GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ColumnApiModule,
    ModuleRegistry,
    NumberFilterModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { ControlsCellRenderer } from './controlsCellRenderer_typescript';

ModuleRegistry.registerModules([
    ColumnApiModule,
    TextFilterModule,
    NumberFilterModule,
    CellStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    {
        lockPosition: 'left',
        valueGetter: 'node.rowIndex',
        cellClass: 'locked-col',
        width: 60,
        suppressNavigable: true,
    },
    {
        lockPosition: 'left',
        cellRenderer: ControlsCellRenderer,
        cellClass: 'locked-col',
        width: 120,
        suppressNavigable: true,
    },
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'year' },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        width: 150,
    },
    onColumnPinned: onColumnPinned,
    suppressDragLeaveHidesColumns: true,
};

function onColumnPinned(event: ColumnPinnedEvent) {
    const allCols = event.api.getAllGridColumns();

    if (event.pinned !== 'right') {
        const allFixedCols = allCols.filter((col) => col.getColDef().lockPosition);
        event.api.setColumnsPinned(allFixedCols, event.pinned);
    }
}

function onPinAthleteLeft() {
    gridApi!.applyColumnState({
        state: [{ colId: 'athlete', pinned: 'left' }],
    });
}
function onPinAthleteRight() {
    gridApi!.applyColumnState({
        state: [{ colId: 'athlete', pinned: 'right' }],
    });
}

function onUnpinAthlete() {
    gridApi!.applyColumnState({
        state: [{ colId: 'athlete', pinned: null }],
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
