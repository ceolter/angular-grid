import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    IServerSideGetRowsParams,
    ServerSideTransaction,
    ServerSideTransactionResult,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { data } from './data';
import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllCommunityModule, ServerSideRowModelModule]);

const columnDefs: ColDef[] = [{ field: 'tradeId' }, { field: 'portfolio' }, { field: 'book' }, { field: 'current' }];

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
    getRowId: (params: GetRowIdParams) => `${params.data.tradeId}`,
    onGridReady: (params: GridReadyEvent) => {
        // setup the fake server
        const server = new FakeServer(data);

        // create datasource with a reference to the fake server
        const datasource = getServerSideDatasource(server);

        // register the datasource with the grid
        params.api.setGridOption('serverSideDatasource', datasource);
    },
    rowSelection: { mode: 'singleRow' },
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

function addRow() {
    const selectedRows = gridApi!.getSelectedNodes();
    if (selectedRows.length === 0) {
        console.warn('[Example] No row selected.');
        return;
    }

    const rowIndex = selectedRows[0].rowIndex;
    const transaction: ServerSideTransaction = {
        addIndex: rowIndex != null ? rowIndex : undefined,
        add: [createRow()],
    };

    const result = gridApi!.applyServerSideTransaction(transaction);
    logResults(transaction, result);
}

function updateRow() {
    const selectedRows = gridApi!.getSelectedNodes();
    if (selectedRows.length === 0) {
        console.warn('[Example] No row selected.');
        return;
    }

    const transaction: ServerSideTransaction = {
        update: [{ ...selectedRows[0].data, current: getNewValue() }],
    };

    const result = gridApi!.applyServerSideTransaction(transaction);
    logResults(transaction, result);
}

function removeRow() {
    const selectedRows = gridApi!.getSelectedNodes();
    if (selectedRows.length === 0) {
        console.warn('[Example] No row selected.');
        return;
    }

    const transaction: ServerSideTransaction = { remove: [selectedRows[0].data] };
    const result = gridApi!.applyServerSideTransaction(transaction);
    logResults(transaction, result);
}

function logResults(transaction: ServerSideTransaction, result?: ServerSideTransactionResult) {
    console.log('[Example] - Applied transaction:', transaction, 'Result:', result);
}

function getNewValue() {
    return Math.floor(Math.random() * 100000) + 100;
}

let serverCurrentTradeId = data.length;
function createRow() {
    return {
        portfolio: 'Aggressive',
        product: 'Aluminium',
        book: 'GL-62472',
        tradeId: ++serverCurrentTradeId,
        current: getNewValue(),
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
