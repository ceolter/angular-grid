import type {
    CellFocusedParams,
    ColDef,
    Column,
    ColumnGroup,
    FocusGridInnerElementParams,
    GridApi,
    GridOptions,
    HeaderFocusedParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { headerName: '#', colId: 'rowNum', valueGetter: 'node.id' },
    { field: 'athlete', minWidth: 170 },
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
let lastFocused: { column: string | Column | ColumnGroup | null; rowIndex?: number | null } | undefined;

const focusGridInnerElement = (params: FocusGridInnerElementParams) => {
    if (!lastFocused || !lastFocused.column) {
        return false;
    }

    if (lastFocused.rowIndex != null) {
        params.api.setFocusedCell(lastFocused.rowIndex, lastFocused.column as Column | string);
    } else {
        params.api.setFocusedHeader(lastFocused.column);
    }

    return true;
};

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    rowData: null,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    onCellFocused: (params: CellFocusedParams) => {
        lastFocused = { column: params.column, rowIndex: params.rowIndex };
    },
    onHeaderFocused: (params: HeaderFocusedParams) => {
        lastFocused = { column: params.column, rowIndex: null };
    },
    focusGridInnerElement: focusGridInnerElement,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
