import type { GridApi, GridOptions, IServerSideDatasource, IServerSideGroupSelectionState } from 'ag-grid-community';
import { ModuleRegistry, NumberFilterModule, TextFilterModule, ValidationModule, createGrid } from 'ag-grid-community';
import {
    RowGroupingModule,
    RowGroupingPanelModule,
    ServerSideRowModelApiModule,
    ServerSideRowModelModule,
} from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    RowGroupingModule,
    ServerSideRowModelModule,
    ServerSideRowModelApiModule,
    RowGroupingPanelModule,
    TextFilterModule,
    NumberFilterModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IOlympicDataWithId>;
const gridOptions: GridOptions<IOlympicDataWithId> = {
    columnDefs: [
        { field: 'country', enableRowGroup: true, rowGroup: true, hide: true },
        { field: 'year', enableRowGroup: true, rowGroup: true, hide: true },
        { field: 'athlete', hide: true },
        { field: 'sport', enableRowGroup: true, filter: 'agTextColumnFilter' },
        { field: 'gold', aggFunc: 'sum', filter: 'agNumberColumnFilter' },
        { field: 'silver', aggFunc: 'sum', filter: 'agNumberColumnFilter' },
        { field: 'bronze', aggFunc: 'sum', filter: 'agNumberColumnFilter' },
    ],
    defaultColDef: {
        floatingFilter: true,
        flex: 1,
        minWidth: 120,
    },
    getRowId: (params) => {
        if (params.data.id != null) {
            return 'leaf-' + params.data.id;
        }
        const rowGroupCols = params.api.getRowGroupColumns();
        const rowGroupColIds = rowGroupCols.map((col) => col.getId()).join('-');
        const thisGroupCol = rowGroupCols[params.level];
        return (
            'group-' +
            rowGroupColIds +
            '-' +
            (params.parentKeys || []).join('-') +
            params.data[thisGroupCol.getColDef().field as keyof IOlympicDataWithId]
        );
    },
    isServerSideGroupOpenByDefault: (params) => {
        return params.rowNode.key === 'United States' || String(params.rowNode.key) === '2004';
    },
    onFirstDataRendered: (params) => {
        params.api.setServerSideSelectionState({
            selectAllChildren: true,
            toggledNodes: [
                {
                    nodeId: 'group-country-year-United States',
                    selectAllChildren: false,
                    toggledNodes: [
                        {
                            nodeId: 'group-country-year-United States2004',
                            selectAllChildren: true,
                        },
                    ],
                },
            ],
        });
    },
    autoGroupColumnDef: {
        field: 'athlete',
        flex: 1,
        minWidth: 240,
    },

    // use the server-side row model
    rowModelType: 'serverSide',

    // allow multiple row selections
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
    },
    rowGroupPanelShow: 'always',

    suppressAggFuncInHeader: true,
};

let selectionState: IServerSideGroupSelectionState = {
    selectAllChildren: false,
    toggledNodes: [],
};

function saveSelectionState() {
    selectionState = gridApi!.getServerSideSelectionState() as IServerSideGroupSelectionState;
    console.log(JSON.stringify(selectionState, null, 2));
}

function loadSelectionState() {
    gridApi!.setServerSideSelectionState(selectionState);
}

function clearSelectionState() {
    gridApi!.setServerSideSelectionState({
        selectAllChildren: false,
        toggledNodes: [],
    });
}

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

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            // assign a unique ID to each data item
            data.forEach(function (item: any, index: number) {
                item.id = index;
            });

            // setup the fake server with entire dataset
            const fakeServer = new FakeServer(data);

            // create datasource with a reference to the fake server
            const datasource = getServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});
