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
        { headerName: 'Index', valueGetter: 'node.rowIndex', minWidth: 100 },
        { field: 'athlete', minWidth: 150 },
        { field: 'country', minWidth: 150 },
        { field: 'year' },
        { field: 'sport', minWidth: 120 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ],

    defaultColDef: {
        flex: 1,
        minWidth: 80,
        sortable: false,
    },

    rowModelType: 'serverSide',
    serverSideInitialRowCount: 5500,
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

            // scroll the grid down until row 5000 is at the top of the viewport
            gridApi!.ensureIndexVisible(5000, 'top');
        });
});

function createServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            console.log(
                '[Datasource] - rows requested by grid: startRow = ' +
                    params.request.startRow +
                    ', endRow = ' +
                    params.request.endRow
            );

            // get data for request from our fake server
            const response = server.getData(params.request);

            // simulating real server call with a 500ms delay
            setTimeout(() => {
                if (response.success) {
                    // supply rows for requested block to grid
                    params.success({ rowData: response.rows, rowCount: response.lastRow });
                } else {
                    params.fail();
                }
            }, 1000);
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
                lastRow: allData.length,
            };
        },
    };
}
