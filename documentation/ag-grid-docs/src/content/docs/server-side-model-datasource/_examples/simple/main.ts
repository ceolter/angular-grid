import type { GridApi, GridOptions, IServerSideDatasource, IServerSideGetRowsRequest } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    ServerSideRowModelModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 220 },
        { field: 'country', minWidth: 200 },
        { field: 'year' },
        { field: 'sport', minWidth: 200 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ],

    defaultColDef: {
        flex: 1,
        minWidth: 100,
        sortable: false,
    },

    // use the server-side row model instead of the default 'client-side'
    rowModelType: 'serverSide',
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            // setup the fake server with entire dataset
            const fakeServer = createFakeServer(data);

            // create datasource with a reference to the fake server
            const datasource = createServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});

function createServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            // get data for request from our fake server
            const response = server.getData(params.request);

            // simulating real server call with a 500ms delay
            setTimeout(() => {
                if (response.success) {
                    // supply rows for requested block to grid
                    params.success({ rowData: response.rows });
                } else {
                    params.fail();
                }
            }, 500);
        },
    };
}

function createFakeServer(allData: any[]) {
    return {
        getData: (request: IServerSideGetRowsRequest) => {
            // in this simplified fake server all rows are contained in an array
            const requestedRows = allData.slice(request.startRow, request.endRow);

            return {
                success: true,
                rows: requestedRows,
            };
        },
    };
}
