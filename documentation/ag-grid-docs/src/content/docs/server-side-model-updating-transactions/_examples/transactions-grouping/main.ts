import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    IServerSideGetRowsParams,
    IsServerSideGroupOpenByDefaultParams,
    ServerSideTransaction,
    ServerSideTransactionResult,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { changePortfolioOnServer, createRowOnServer, data, deletePortfolioOnServer } from './data';
import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, ServerSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'tradeId' },
    { field: 'portfolio', hide: true, rowGroup: true },
    { field: 'book' },
    { field: 'previous' },
    { field: 'current' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        enableCellChangeFlash: true,
    },
    autoGroupColumnDef: {
        minWidth: 220,
    },
    isServerSideGroupOpenByDefault: (params: IsServerSideGroupOpenByDefaultParams) => {
        return params.rowNode.key === 'Aggressive' || params.rowNode.key === 'Hybrid';
    },
    getRowId: (params: GetRowIdParams) => {
        if (params.level === 0) {
            return params.data.portfolio;
        }
        return String(params.data.tradeId);
    },
    onGridReady: (params: GridReadyEvent) => {
        // setup the fake server
        const server = new FakeServer(data);

        // create datasource with a reference to the fake server
        const datasource = getServerSideDatasource(server);

        // register the datasource with the grid
        params.api.setGridOption('serverSideDatasource', datasource);
    },

    rowModelType: 'serverSide',
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

function deleteAllHybrid() {
    // NOTE: real applications would be better served listening to a stream of changes from the server instead
    const serverResponse: any = deletePortfolioOnServer('Hybrid');
    if (!serverResponse.success) {
        console.warn('Nothing has changed on the server');
        return;
    }

    if (serverResponse) {
        // apply tranaction to keep grid in sync
        const transaction = {
            remove: [{ portfolio: 'Hybrid' }],
        };
        const result = gridApi!.applyServerSideTransaction(transaction);
        logResults(transaction, result);
    }
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

function updateAggressiveToHybrid() {
    // NOTE: real applications would be better served listening to a stream of changes from the server instead
    const serverResponse: any = changePortfolioOnServer('Aggressive', 'Hybrid');
    if (!serverResponse.success) {
        console.warn('Nothing has changed on the server');
        return;
    }

    const transaction = {
        remove: [{ portfolio: 'Aggressive' }],
    };
    // aggressive group no longer exists, so delete the group
    const result = gridApi!.applyServerSideTransaction(transaction);
    logResults(transaction, result);

    if (serverResponse.newGroupCreated) {
        // hybrid group didn't exist, so just create the new group
        const t = {
            route: [],
            add: [{ portfolio: 'Hybrid' }],
        };
        const r = gridApi!.applyServerSideTransaction(t);
        logResults(t, r);
    } else {
        // hybrid group already existed, add rows to it
        const t = {
            route: ['Hybrid'],
            add: serverResponse.updatedRecords,
        };
        const r = gridApi!.applyServerSideTransaction(t);
        logResults(t, r);
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
