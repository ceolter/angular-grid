import type {
    GridApi,
    GridOptions,
    IServerSideGetRowsParams,
    ServerSideTransaction,
    ServerSideTransactionResult,
} from 'ag-grid-community';
import { HighlightChangesModule, ModuleRegistry, ValidationModule, createGrid } from 'ag-grid-community';
import { RowGroupingModule, ServerSideRowModelApiModule, ServerSideRowModelModule } from 'ag-grid-enterprise';

import { createRowOnServer, data } from './data';
import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    HighlightChangesModule,
    RowGroupingModule,
    ServerSideRowModelModule,
    ServerSideRowModelApiModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'portfolio', hide: true, rowGroup: true },
        { field: 'book' },
        { field: 'previous' },
        { field: 'current' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        enableCellChangeFlash: true,
    },
    autoGroupColumnDef: {
        minWidth: 220,
        field: 'tradeId',
    },
    isServerSideGroupOpenByDefault: (params) => {
        return params.rowNode.key === 'Aggressive' || params.rowNode.key === 'Hybrid';
    },
    getRowId: (params) => {
        if (params.level === 0) {
            return params.data.portfolio;
        }
        return String(params.data.tradeId);
    },
    onGridReady: (params) => {
        // setup the fake server
        const server = FakeServer(data);

        // create datasource with a reference to the fake server
        const datasource = getServerSideDatasource(server);

        // register the datasource with the grid
        params.api.setGridOption('serverSideDatasource', datasource);
    },

    rowModelType: 'serverSide',

    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
    },
};

function getServerSideDatasource(server: any) {
    return {
        getRows: (params: IServerSideGetRowsParams) => {
            const response = server.getData(params.request);

            // adding delay to simulate real server call
            setTimeout(() => {
                if (response.success) {
                    // call the success callback
                    params.success({
                        rowData: response.rows,
                        rowCount: response.lastRow,
                    });
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 300);
        },
    };
}

function logResults(transaction: ServerSideTransaction, result?: ServerSideTransactionResult) {
    console.log('[Example] - Applied transaction:', transaction, 'Result:', result);
}

function createOneAggressive() {
    // NOTE: real applications would be better served listening to a stream of changes from the server instead
    const serverResponse: any = createRowOnServer('Aggressive', 'Aluminium', 'GL-1');
    if (!serverResponse.success) {
        console.warn('Nothing has changed on the server');
        return;
    }

    if (serverResponse.newGroupCreated) {
        // if a new group had to be created, reflect in the grid
        const transaction = {
            route: [],
            add: [{ portfolio: 'Aggressive' }],
        };
        const result = gridApi!.applyServerSideTransaction(transaction);
        logResults(transaction, result);
    } else {
        // if the group already existed, add rows to it
        const transaction = {
            route: ['Aggressive'],
            add: [serverResponse.newRecord],
        };
        const result = gridApi!.applyServerSideTransaction(transaction);
        logResults(transaction, result);
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
