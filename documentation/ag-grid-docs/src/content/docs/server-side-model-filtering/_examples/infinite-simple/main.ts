import type { GridApi, GridOptions, IServerSideDatasource } from 'ag-grid-community';
import { ModuleRegistry, NumberFilterModule, TextFilterModule, ValidationModule, createGrid } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    ColumnMenuModule,
    ContextMenuModule,
    ServerSideRowModelModule,
    TextFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicData>;
const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            filter: 'agTextColumnFilter',
            minWidth: 220,
        },
        {
            field: 'year',
            filter: 'agNumberColumnFilter',
            filterParams: {
                buttons: ['reset'],
                debounceMs: 1000,
                maxNumConditions: 1,
            },
        },
        { field: 'gold', type: 'number' },
        { field: 'silver', type: 'number' },
        { field: 'bronze', type: 'number' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        suppressHeaderMenuButton: true,
        suppressHeaderContextMenu: true,
    },
    columnTypes: {
        number: { filter: 'agNumberColumnFilter' },
    },
    // use the server-side row model
    rowModelType: 'serverSide',
};

function getServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

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
            }, 500);
        },
    };
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
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
