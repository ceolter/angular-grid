import type {
    ColDef,
    GridApi,
    GridOptions,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    SetFilterValuesFuncParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule, SetFilterModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    ServerSideRowModelModule,
    SetFilterModule,
]);

const colDefCountry: ColDef = { field: 'country', rowGroup: true };
const colDefYear: ColDef = { field: 'year', rowGroup: true };
const colDefAthlete: ColDef = {
    field: 'athlete',
    filter: 'agSetColumnFilter',
    filterParams: {
        values: getAthletesAsync,
    },
    suppressHeaderMenuButton: true,
    suppressHeaderContextMenu: true,
};
const colDefAge: ColDef = { field: 'age' };
const colDefSport: ColDef = { field: 'sport' };
const colDefGold: ColDef = { field: 'gold', aggFunc: 'sum' };
const colDefSilver: ColDef = { field: 'silver', aggFunc: 'sum' };
const colDefBronze: ColDef = { field: 'bronze', aggFunc: 'sum' };

const columnDefs: ColDef[] = [
    colDefAthlete,
    colDefAge,
    colDefCountry,
    colDefYear,
    colDefSport,
    colDefGold,
    colDefSilver,
    colDefBronze,
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        initialFlex: 1,
        minWidth: 120,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    maintainColumnOrder: true,
    // use the server-side row model
    rowModelType: 'serverSide',

    onGridReady: (params) => {
        (document.getElementById('athlete') as HTMLInputElement).checked = true;
        (document.getElementById('age') as HTMLInputElement).checked = true;
        (document.getElementById('country') as HTMLInputElement).checked = true;
        (document.getElementById('year') as HTMLInputElement).checked = true;
        (document.getElementById('sport') as HTMLInputElement).checked = true;
        (document.getElementById('gold') as HTMLInputElement).checked = true;
        (document.getElementById('silver') as HTMLInputElement).checked = true;
        (document.getElementById('bronze') as HTMLInputElement).checked = true;
    },

    suppressAggFuncInHeader: true,
    // debug: true,
};

function getAthletesAsync(params: SetFilterValuesFuncParams) {
    const countries = fakeServer.getAthletes();

    // simulating real server call with a 500ms delay
    setTimeout(() => {
        params.success(countries);
    }, 500);
}

function onBtApply() {
    const cols = [];
    if (getBooleanValue('#athlete')) {
        cols.push(colDefAthlete);
    }
    if (getBooleanValue('#age')) {
        cols.push(colDefAge);
    }
    if (getBooleanValue('#country')) {
        cols.push(colDefCountry);
    }
    if (getBooleanValue('#year')) {
        cols.push(colDefYear);
    }
    if (getBooleanValue('#sport')) {
        cols.push(colDefSport);
    }

    if (getBooleanValue('#gold')) {
        cols.push(colDefGold);
    }
    if (getBooleanValue('#silver')) {
        cols.push(colDefSilver);
    }
    if (getBooleanValue('#bronze')) {
        cols.push(colDefBronze);
    }

    gridApi!.setGridOption('columnDefs', cols);
}

function getBooleanValue(cssSelector: string) {
    return (document.querySelector(cssSelector) as HTMLInputElement).checked === true;
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
                    params.success({ rowData: response.rows, rowCount: response.lastRow });
                } else {
                    // inform the grid request failed
                    params.fail();
                }
            }, 200);
        },
    };
}

var fakeServer: any = undefined;

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            // setup the fake server with entire dataset
            fakeServer = new FakeServer(data);

            // create datasource with a reference to the fake server
            const datasource: IServerSideDatasource = getServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});
