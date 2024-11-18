import type { GridApi, GridOptions, IServerSideDatasource, IServerSideGetRowsRequest } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule, ServerSideRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ServerSideRowModelModule, RowGroupingModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', flex: 4 },
        { field: 'sport', flex: 4 },
        { field: 'year', flex: 3 },
        { field: 'gold', aggFunc: 'sum', flex: 2 },
        { field: 'silver', aggFunc: 'sum', flex: 2 },
        { field: 'bronze', aggFunc: 'sum', flex: 2 },
    ],
    defaultColDef: {
        minWidth: 75,
    },

    // use the server-side row model
    rowModelType: 'serverSide',
    // suppress the default full width loading behaviour
    suppressServerSideFullWidthLoadingRow: true,

    cacheBlockSize: 5,
    maxBlocksInCache: 0,
    rowBuffer: 0,
    maxConcurrentDatasourceRequests: 1,
    blockLoadDebounceMillis: 200,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            // add id to data
            let idSequence = 0;
            data.forEach((item: any) => {
                item.id = idSequence++;
            });

            const server: any = getFakeServer(data);
            const datasource: IServerSideDatasource = getServerSideDatasource(server);
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});

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
            }, 4000);
        },
    };
}

function getFakeServer(allData: any[]): any {
    return {
        getResponse: (request: IServerSideGetRowsRequest) => {
            console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);

            // take a slice of the total rows
            const rowsThisPage = allData.slice(request.startRow, request.endRow);
            const lastRow = allData.length;

            return {
                success: true,
                rows: rowsThisPage,
                lastRow: lastRow,
            };
        },
    };
}
