import type {
    GetRowIdParams,
    GridApi,
    GridOptions,
    IServerSideDatasource,
    IsServerSideGroupOpenByDefaultParams,
    StoreRefreshedEvent,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, ServerSideRowModelModule]);

let gridApi: GridApi;
const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'country', hide: true, rowGroup: true },
        { field: 'year', hide: true, rowGroup: true },
        { field: 'version' },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        enableCellChangeFlash: true,
    },
    autoGroupColumnDef: {
        flex: 1,
        minWidth: 280,
        field: 'athlete',
    },
    getRowId: (params: GetRowIdParams) => {
        const data = params.data;
        const parts = [];
        if (data.country != null) {
            parts.push(data.country);
        }
        if (data.year != null) {
            parts.push(data.year);
        }
        if (data.id != null) {
            parts.push(data.id);
        }
        return parts.join('-');
    },
    isServerSideGroupOpenByDefault: (params: IsServerSideGroupOpenByDefaultParams) => {
        return params.rowNode.key === 'Canada' || params.rowNode.key!.toString() === '2002';
    },
    onStoreRefreshed: (event: StoreRefreshedEvent) => {
        console.log('Refresh finished for store with route:', event.route);
    },
    // use the server-side row model
    rowModelType: 'serverSide',
    suppressAggFuncInHeader: true,
};

let allData: any[];

let versionCounter = 1;

const updateChangeIndicator = () => {
    const el = document.querySelector('#version-indicator') as HTMLInputElement;
    el.textContent = `${versionCounter}`;
};

const beginPeriodicallyModifyingData = () => {
    setInterval(() => {
        versionCounter += 1;
        allData = allData.map((data) => ({
            ...data,
            version: versionCounter + ' - ' + versionCounter + ' - ' + versionCounter,
        }));
        updateChangeIndicator();
    }, 4000);
};

function refreshCache(route?: string[]) {
    const purge = !!(document.querySelector('#purge') as HTMLInputElement).checked;
    gridApi!.refreshServerSide({ route: route, purge: purge });
}

const getServerSideDatasource = (server: any): IServerSideDatasource => {
    return {
        getRows: (params) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            const response = server.getData(params.request);

            const dataWithVersionAndGroupProperties = response.rows.map((rowData: any) => {
                const rowProperties: any = {
                    ...rowData,
                    version: versionCounter + ' - ' + versionCounter + ' - ' + versionCounter,
                };

                // for unique-id purposes in the client, we also want to attach
                // the parent group keys
                const groupProperties = Object.fromEntries(
                    params.request.groupKeys.map((groupKey, index) => {
                        const col = params.request.rowGroupCols[index];
                        const field = col.id;
                        return [field, groupKey];
                    })
                );

                return {
                    ...rowProperties,
                    ...groupProperties,
                };
            });

            // adding delay to simulate real server call
            setTimeout(() => {
                if (response.success) {
                    // call the success callback
                    params.success({ rowData: dataWithVersionAndGroupProperties, rowCount: response.lastRow });
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 1000);
        },
    };
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            // give each data item an ID
            const dataWithId = data.map((d: any, idx: number) => ({
                ...d,
                id: idx,
            }));
            allData = dataWithId;

            // setup the fake server with entire dataset
            const fakeServer = new FakeServer(allData);

            // create datasource with a reference to the fake server
            const datasource = getServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
            beginPeriodicallyModifyingData();
        });
});
