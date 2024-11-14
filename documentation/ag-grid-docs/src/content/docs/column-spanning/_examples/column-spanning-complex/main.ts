import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellClassRules, ColDef, ColSpanParams, GridApi, GridOptions, RowHeightParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const cellClassRules: CellClassRules = {
    'header-cell': 'data.section === "big-title"',
    'quarters-cell': 'data.section === "quarters"',
};

const columnDefs: ColDef[] = [
    {
        headerName: 'Jan',
        field: 'jan',
        colSpan: (params: ColSpanParams) => {
            if (isHeaderRow(params)) {
                return 6;
            } else if (isQuarterRow(params)) {
                return 3;
            } else {
                return 1;
            }
        },
        cellClassRules: cellClassRules,
    },
    { headerName: 'Feb', field: 'feb' },
    { headerName: 'Mar', field: 'mar' },
    {
        headerName: 'Apr',
        field: 'apr',
        colSpan: (params: ColSpanParams) => {
            if (isQuarterRow(params)) {
                return 3;
            } else {
                return 1;
            }
        },
        cellClassRules: cellClassRules,
    },
    { headerName: 'May', field: 'may' },
    { headerName: 'Jun', field: 'jun' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    getRowHeight: (params: RowHeightParams) => {
        if (isHeaderRow(params)) {
            return 60;
        }
    },
    columnDefs: columnDefs,
    rowData: getData(),
    defaultColDef: {
        width: 100,
    },
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};

function isHeaderRow(params: RowHeightParams | ColSpanParams) {
    return params.data.section === 'big-title';
}

function isQuarterRow(params: ColSpanParams) {
    return params.data.section === 'quarters';
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
