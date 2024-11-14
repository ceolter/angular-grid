import type { ColDef, GridApi, GridOptions, IServerSideDatasource } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ColumnsToolPanelModule,
    MenuModule,
    RowGroupingModule,
    ServerSideRowModelModule,
]);

let gridApi: GridApi<IOlympicData>;
const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true },
        { field: 'sport', rowGroup: true },
        { field: 'year', pivot: true }, // pivot on 'year'
        { field: 'total', aggFunc: 'sum' },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
    ],
    defaultColDef: {
        width: 150,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },

    // use the server-side row model
    rowModelType: 'serverSide',

    // enable pivoting
    pivotMode: true,

    processPivotResultColDef: (colDef: ColDef) => {
        const pivotValueColumn = colDef.pivotValueColumn;

        if (!pivotValueColumn) return;

        // if column is not the total column, it should only be shown when expanded.
        // this will enable expandable column groups.
        if (pivotValueColumn.getColId() !== 'total') {
            colDef.columnGroupShow = 'open';
        }
    },
};

function expand(key?: string, open = false) {
    if (key) {
        gridApi!.setColumnGroupState([{ groupId: key, open: open }]);
        return;
    }

    const existingState = gridApi!.getColumnGroupState();
    const expandedState = existingState.map((s: { groupId: string; open: boolean }) => ({
        groupId: s.groupId,
        open: open,
    }));
    gridApi!.setColumnGroupState(expandedState);
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

function getServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            const request = params.request;

            console.log('[Datasource] - rows requested by grid: ', params.request);

            const response = server.getData(request);

            // simulating real server call with a 500ms delay
            setTimeout(() => {
                if (response.success) {
                    // supply data to grid
                    params.success({
                        rowData: response.rows,
                        rowCount: response.lastRow,
                        pivotResultFields: response.pivotFields,
                    });
                } else {
                    params.fail();
                }
            }, 500);
        },
    };
}
