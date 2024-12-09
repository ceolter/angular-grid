import type {
    GetDetailRowDataParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    IDetailCellRendererParams,
    IServerSideDatasource,
    RowHeightParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RenderApiModule,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    MasterDetailModule,
    ServerSideRowModelModule,
} from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    RenderApiModule,
    RowApiModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
    ServerSideRowModelModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;
const gridOptions: GridOptions = {
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        { field: 'accountId', maxWidth: 200, cellRenderer: 'agGroupCellRenderer' },
        { field: 'name' },
        { field: 'country' },
        { field: 'calls' },
        { field: 'totalDuration' },
    ],
    defaultColDef: {
        flex: 1,
    },

    // use the server-side row model
    rowModelType: 'serverSide',

    // enable master detail
    masterDetail: true,

    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                { field: 'callId' },
                { field: 'direction' },
                { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
                { field: 'switchCode' },
                { field: 'number' },
            ],
            domLayout: 'autoHeight',
            defaultColDef: {
                flex: 1,
            },
        },
        getDetailRowData: (params: GetDetailRowDataParams) => {
            // supply details records to detail cell renderer (i.e. detail grid)
            params.successCallback(params.data.callRecords);
        },
    } as IDetailCellRendererParams<IAccount, ICallRecord>,

    getRowHeight: (params: RowHeightParams) => {
        if (params.node && params.node.detail) {
            const offset = 60;
            const sizes = params.api.getSizesForCurrentTheme() || {};
            const allDetailRowHeight = params.data.callRecords.length * sizes.rowHeight;
            return allDetailRowHeight + (sizes.headerHeight || 0) + offset;
        }
    },
    onGridReady: (params: GridReadyEvent) => {
        setTimeout(() => {
            // expand some master row
            const someRow = params.api.getRowNode('1');
            if (someRow) {
                someRow.setExpanded(true);
            }
        }, 1000);
    },
};

function getServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            const response = server.getData(params.request);

            // adding delay to simulate real server call
            setTimeout(() => {
                if (response.success) {
                    // call the success callback
                    params.success({ rowData: response.rows, rowCount: response.lastRow });
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 200);
        },
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/call-data.json')
        .then((response) => response.json())
        .then(function (data) {
            // setup the fake server with entire dataset
            const fakeServer = new FakeServer(data);

            // create datasource with a reference to the fake server
            const datasource = getServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});
