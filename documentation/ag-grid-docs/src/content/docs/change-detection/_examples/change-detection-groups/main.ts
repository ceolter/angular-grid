import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'group', rowGroup: true, editable: true },
        { field: 'a', type: 'valueColumn' },
        { field: 'b', type: 'valueColumn' },
        { field: 'c', type: 'valueColumn' },
        { field: 'd', type: 'valueColumn' },
        {
            headerName: 'Total',
            type: 'totalColumn',
            // we use getValue() instead of data.a so that it gets the aggregated values at the group level
            valueGetter: 'getValue("a") + getValue("b") + getValue("c") + getValue("d")',
        },
    ],
    defaultColDef: {
        flex: 1,
    },
    autoGroupColumnDef: {
        minWidth: 100,
    },
    columnTypes: {
        valueColumn: {
            minWidth: 90,
            editable: true,
            aggFunc: 'sum',
            valueParser: 'Number(newValue)',
            cellClass: 'number-cell',
            cellRenderer: 'agAnimateShowChangeCellRenderer',
            filter: 'agNumberColumnFilter',
        },
        totalColumn: {
            cellRenderer: 'agAnimateShowChangeCellRenderer',
            cellClass: 'number-cell',
        },
    },
    rowData: getRowData(),
    groupDefaultExpanded: 1,
    suppressAggFuncInHeader: true,
};

function getRowData() {
    const rowData = [];
    for (let i = 1; i <= 16; i++) {
        rowData.push({
            group: i < 8 ? 'A' : 'B',
            a: (i * 863) % 100,
            b: (i * 811) % 100,
            c: (i * 743) % 100,
            d: (i * 677) % 100,
        });
    }
    return rowData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
