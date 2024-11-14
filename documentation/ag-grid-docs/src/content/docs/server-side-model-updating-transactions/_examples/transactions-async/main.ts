import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    IServerSideGetRowsParams,
    ServerSideTransaction,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { data, dataObservers, randomUpdates } from './data';
import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllCommunityModule, ServerSideRowModelModule]);

const columnDefs: ColDef[] = [
    { field: 'tradeId' },
    { field: 'portfolio' },
    { field: 'book' },
    { field: 'previous' },
    { field: 'current' },
    {
        field: 'lastUpdated',
        wrapHeaderText: true,
        autoHeaderHeight: true,
        valueFormatter: (params) => {
            const ts = params.data!.lastUpdated;
            if (ts) {
                const hh_mm_ss = ts.toLocaleString().split(' ')[1];
                const SSS = ts.getMilliseconds();
                return `${hh_mm_ss}:${SSS}`;
            }
            return '';
        },
    },
    { field: 'updateCount' },
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
    getRowId: (params: GetRowIdParams) => {
        let rowId = '';
        if (params.parentKeys && params.parentKeys.length) {
            rowId += params.parentKeys.join('-') + '-';
        }
        if (params.data.tradeId != null) {
            rowId += params.data.tradeId;
        }
        return rowId;
    },
    onGridReady: (params: GridReadyEvent) => {
        disable('#stopUpdates', true);

        // setup the fake server
        const server = FakeServer(data);

        // create datasource with a reference to the fake server
        const datasource = getServerSideDatasource(server);

        // register the datasource with the grid
        params.api.setGridOption('serverSideDatasource', datasource);

        // register interest in data changes
        dataObservers.push((t: ServerSideTransaction) => {
            params.api.applyServerSideTransactionAsync(t);
        });
    },
    asyncTransactionWaitMillis: 1000,
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

let interval: any;

function startUpdates() {
    interval = setInterval(() => randomUpdates({ numUpdate: 10, numAdd: 1, numRemove: 1 }), 10);
    disable('#stopUpdates', false);
    disable('#startUpdates', true);
}

function stopUpdates() {
    if (interval !== undefined) {
        clearInterval(interval);
    }
    disable('#stopUpdates', true);
    disable('#startUpdates', false);
}

function disable(id: string, disabled: boolean) {
    document.querySelector<HTMLInputElement>(id)!.disabled = disabled;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
