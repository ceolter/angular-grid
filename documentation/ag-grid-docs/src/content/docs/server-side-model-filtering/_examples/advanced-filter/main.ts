import type { GridApi, GridOptions, IServerSideDatasource } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AdvancedFilterModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AllCommunityModule,
    AdvancedFilterModule,
    ColumnMenuModule,
    ContextMenuModule,
    ServerSideRowModelModule,
]);

let gridApi: GridApi<IOlympicData>;
const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'athlete',
            cellDataType: 'text',
            minWidth: 220,
        },
        {
            field: 'year',
            cellDataType: 'number',
        },
        {
            field: 'gold',
            cellDataType: 'number',
        },
        {
            field: 'silver',
            cellDataType: 'number',
        },
        {
            field: 'bronze',
            cellDataType: 'number',
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        suppressHeaderMenuButton: true,
        suppressHeaderContextMenu: true,
    },
    // use the server-side row model
    rowModelType: 'serverSide',

    enableAdvancedFilter: true,
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
