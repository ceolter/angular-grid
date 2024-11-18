import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    ValueFormatterParams,
    ValueGetterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

let callCount = 1;

const totalValueGetter = function (params: ValueGetterParams) {
    const q1 = params.getValue('q1');
    const q2 = params.getValue('q2');
    const q3 = params.getValue('q3');
    const q4 = params.getValue('q4');
    const result = q1 + q2 + q3 + q4;
    console.log(
        `Total Value Getter (${callCount}, ${params.column.getId()}): ${[q1, q2, q3, q4].join(', ')} = ${result}`
    );
    callCount++;
    return result;
};
const total10ValueGetter = function (params: ValueGetterParams) {
    const total = params.getValue('total');
    return total * 10;
};

const columnDefs: ColDef[] = [
    { field: 'q1', type: 'quarterFigure' },
    { field: 'q2', type: 'quarterFigure' },
    { field: 'q3', type: 'quarterFigure' },
    { field: 'q4', type: 'quarterFigure' },
    { field: 'year', rowGroup: true, hide: true },
    {
        headerName: 'Total',
        colId: 'total',
        cellClass: ['number-cell', 'total-col'],
        aggFunc: 'sum',
        valueFormatter: formatNumber,
        valueGetter: totalValueGetter,
    },
    {
        headerName: 'Total x 10',
        cellClass: ['number-cell', 'total-col'],
        aggFunc: 'sum',
        minWidth: 120,
        valueFormatter: formatNumber,
        valueGetter: total10ValueGetter,
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        enableCellChangeFlash: true,
    },
    autoGroupColumnDef: {
        minWidth: 130,
    },
    columnTypes: {
        quarterFigure: {
            editable: true,
            cellClass: 'number-cell',
            aggFunc: 'sum',
            valueFormatter: formatNumber,
            valueParser: function numberParser(params) {
                return Number(params.newValue);
            },
        },
    },
    rowData: getData(),
    suppressAggFuncInHeader: true,
    groupDefaultExpanded: 1,
    valueCache: true,
    getRowId: (params: GetRowIdParams) => {
        return String(params.data.id);
    },
    onCellValueChanged: () => {
        console.log('onCellValueChanged');
    },
};

function formatNumber(params: ValueFormatterParams) {
    const number = params.value;
    return Math.floor(number).toLocaleString();
}

function onExpireValueCache() {
    console.log('onInvalidateValueCache -> start');
    gridApi!.expireValueCache();
    console.log('onInvalidateValueCache -> end');
}

function onRefreshCells() {
    console.log('onRefreshCells -> start');
    gridApi!.refreshCells();
    console.log('onRefreshCells -> end');
}

function onUpdateOneValue() {
    const randomId = Math.floor(Math.random() * 10) + '';
    const rowNode = gridApi!.getRowNode(randomId);
    if (rowNode) {
        const randomCol = ['q1', 'q2', 'q3', 'q4'][Math.floor(Math.random() * 4)];
        const newValue = Math.floor(Math.random() * 1000);
        console.log('onUpdateOneValue -> start');
        rowNode.setDataValue(randomCol, newValue);
        console.log('onUpdateOneValue -> end');
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
