import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    GridApi,
    GridOptions,
    IDetailCellRendererParams,
    IServerSideDatasource,
    IServerSideGetRowsRequest,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    MenuModule,
    ServerSideRowModelModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        { field: 'accountId', cellRenderer: 'agGroupCellRenderer' },
        { field: 'name' },
        { field: 'country' },
        { field: 'calls' },
        { field: 'totalDuration' },
    ],
    defaultColDef: {
        flex: 1,
        sortable: false,
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
                { field: 'switchCode', minWidth: 150 },
                { field: 'number', minWidth: 180 },
            ],
            defaultColDef: {
                flex: 1,
            },
        },
        getDetailRowData: (params) => {
            // supply details records to detail cell renderer (i.e. detail grid)
            params.successCallback(params.data.callRecords);
        },
    } as IDetailCellRendererParams<IAccount, ICallRecord>,
    onGridReady: (params) => {
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
            // adding delay to simulate real server call
            setTimeout(() => {
                const response = server.getResponse(params.request);

                if (response.success) {
                    // call the success callback
                    params.success({ rowData: response.rows, rowCount: response.lastRow });
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 500);
        },
    };
}

function getFakeServer(allData: any) {
    return {
        getResponse: (request: IServerSideGetRowsRequest) => {
            console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);

            // take a slice of the total rows
            const rowsThisPage = allData.slice(request.startRow, request.endRow);

            // if row count is known, it's possible to skip over blocks
            const lastRow = allData.length;

            return {
                success: true,
                rows: rowsThisPage,
                lastRow: lastRow,
            };
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
            const server = getFakeServer(data);
            const datasource = getServerSideDatasource(server);
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});
