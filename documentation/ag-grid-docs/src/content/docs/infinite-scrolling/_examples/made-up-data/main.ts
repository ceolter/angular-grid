import type { ColDef, GetRowIdParams, GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import {
    ColumnApiModule,
    InfiniteRowModelModule,
    ModuleRegistry,
    RowSelectionModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnApiModule,
    RowSelectionModule,
    InfiniteRowModelModule,
    ValidationModule /* Development Only */,
]);

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function getColumnDefs() {
    const columnDefs: ColDef[] = [{ headerName: '#', width: 80, valueGetter: 'node.rowIndex' }];

    ALPHABET.forEach((letter) => {
        columnDefs.push({
            headerName: letter.toUpperCase(),
            field: letter,
            width: 150,
        });
    });
    return columnDefs;
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: getColumnDefs(),
    rowModelType: 'infinite',
    rowSelection: { mode: 'multiRow', headerCheckbox: false },
    maxBlocksInCache: 2,
    getRowId: (params: GetRowIdParams) => {
        return params.data.a;
    },
    datasource: getDataSource(100),
    defaultColDef: {
        sortable: false,
    },
};

function getDataSource(count: number) {
    const dataSource: IDatasource = {
        rowCount: count,
        getRows: (params: IGetRowsParams) => {
            const rowsThisPage: any[] = [];

            for (var rowIndex = params.startRow; rowIndex < params.endRow; rowIndex++) {
                var record: Record<string, string> = {};
                ALPHABET.forEach(function (letter, colIndex) {
                    const randomNumber = 17 + rowIndex + colIndex;
                    const cellKey = letter.toUpperCase() + (rowIndex + 1);
                    record[letter] = cellKey + ' = ' + randomNumber;
                });
                rowsThisPage.push(record);
            }

            // to mimic server call, we reply after a short delay
            setTimeout(() => {
                // no need to pass the second 'rowCount' parameter as we have already provided it
                params.successCallback(rowsThisPage);
            }, 100);
        },
    };
    return dataSource;
}

document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
