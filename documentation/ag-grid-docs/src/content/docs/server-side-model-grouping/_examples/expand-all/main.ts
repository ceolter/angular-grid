import type { GridApi, GridOptions, IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, ServerSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        {
            field: 'year',
            enableRowGroup: true,
            rowGroup: true,
            hide: true,
            minWidth: 100,
        },
        { field: 'country', enableRowGroup: true, rowGroup: true, hide: true },
        { field: 'sport', enableRowGroup: true, rowGroup: true, hide: true },
        { field: 'gold', aggFunc: 'sum', enableValue: true },
        { field: 'silver', aggFunc: 'sum', enableValue: true },
        { field: 'bronze', aggFunc: 'sum', enableValue: true },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 120,
    },
    autoGroupColumnDef: {
        flex: 1,
        minWidth: 280,
    },
    maxConcurrentDatasourceRequests: 1,
    rowModelType: 'serverSide',
};

function onBtExpandAll() {
    gridApi!.expandAll();
}

function onBtCollapseAll() {
    gridApi!.collapseAll();
}

function onBtExpandTopLevel() {
    gridApi!.forEachNode(function (node) {
        if (node.group && node.level == 0) {
            node.setExpanded(true);
        }
    });
}

function getServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params: IServerSideGetRowsParams) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            const response = server.getData(params.request);

            // adding delay to simulate real server call
            setTimeout(() => {
                if (response.success) {
                    // call the success callback
                    params.success({
                        rowData: response.rows,
                        rowCount: response.lastRow,
                        groupLevelInfo: {
                            lastLoadedTime: new Date().toLocaleString(),
                            randomValue: Math.random(),
                        },
                    });
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
