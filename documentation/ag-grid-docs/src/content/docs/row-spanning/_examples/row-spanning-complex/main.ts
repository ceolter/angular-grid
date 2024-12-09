import type { ColDef, GridApi, GridOptions, RowSpanParams } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { getData } from './data';
import { ShowCellRenderer } from './showCellRenderer_typescript';

ModuleRegistry.registerModules([CellStyleModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

function rowSpan(params: RowSpanParams) {
    if (params.data.show) {
        return 4;
    } else {
        return 1;
    }
}

const columnDefs: ColDef[] = [
    { field: 'localTime' },
    {
        field: 'show',
        cellRenderer: ShowCellRenderer,
        rowSpan: rowSpan,
        cellClassRules: {
            'show-cell': 'value !== undefined',
        },
        width: 200,
        cellDataType: false,
    },
    { field: 'a' },
    { field: 'b' },
    { field: 'c' },
    { field: 'd' },
    { field: 'e' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        width: 170,
        sortable: false,
    },
    rowData: getData(),
    suppressRowTransform: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
