import type {
    ColDef,
    GridApi,
    GridOptions,
    IServerSideDatasource,
    ISetFilterParams,
    IsServerSideGroupOpenByDefaultParams,
    KeyCreatorParams,
    SetFilterValuesFuncParams,
    ValueFormatterParams,
    ValueGetterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { TreeDataModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    TreeDataModule,
    ServerSideRowModelModule,
    SetFilterModule,
]);

const columnDefs: ColDef[] = [
    { field: 'employeeId', hide: true },
    { field: 'employeeName', hide: true },
    { field: 'employmentType' },
    {
        field: 'startDate',
        valueGetter: valueGetter,
        valueFormatter: cellValueFormatter,
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            excelMode: 'windows',
            keyCreator: dateKeyCreator,
            valueFormatter: floatingFilterValueFormatter,
            values: getDatesAsync,
        } as ISetFilterParams<any, Date>,
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        width: 240,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        flex: 1,
        sortable: false,
    },
    autoGroupColumnDef: {
        field: 'employeeName',
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            excelMode: 'windows',
            keyCreator: treeDataKeyCreator,
            values: getEmployeesAsync,
        } as ISetFilterParams<any, string[]>,
    },
    rowModelType: 'serverSide',
    treeData: true,
    columnDefs: columnDefs,
    isServerSideGroupOpenByDefault: (params: IsServerSideGroupOpenByDefaultParams) => {
        // open first level by default
        return params.rowNode.level === 0;
    },
    isServerSideGroup: (dataItem: any) => {
        // indicate if node is a group
        return dataItem.underlings;
    },
    getServerSideGroupKey: (dataItem: any) => {
        // specify which group key to use
        return dataItem.employeeName;
    },
};

function valueGetter(params: ValueGetterParams) {
    // server is returning a string, so need to convert to `Date`.
    // could instead do this inside `IServerSideDatasource.getRows`
    return params.data.startDate ? new Date(params.data.startDate) : null;
}

function cellValueFormatter(params: ValueFormatterParams) {
    return params.value ? params.value.toLocaleDateString() : null;
}

function floatingFilterValueFormatter(params: ValueFormatterParams) {
    return params.value ? params.value.toLocaleDateString() : '(Blanks)';
}

function dateKeyCreator(params: KeyCreatorParams) {
    // this is what is being sent in the Filter Model to the server, so want the matching format
    return params.value ? params.value.toISOString() : null;
}

function treeDataKeyCreator(params: KeyCreatorParams) {
    // tree data group filter value is a string[], so convert to a unique string
    return params.value ? params.value.join(',') : null;
}

let fakeServer: any;

function getServerSideDatasource(server: any): IServerSideDatasource {
    return {
        getRows: (params) => {
            console.log('[Datasource] - rows requested by grid: ', params.request);

            // simulating real server call with a 500ms delay
            setTimeout(() => {
                // get data for request from our fake server
                const response = server.getData(params.request);
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

function getDatesAsync(params: SetFilterValuesFuncParams<any, Date>) {
    if (!fakeServer) {
        // wait for init
        setTimeout(() => getDatesAsync(params), 500);
        return;
    }
    let dates = fakeServer.getDates();

    if (dates) {
        // values need to match the cell value (what the `valueGetter` returns)
        dates = dates.map((isoDateString: string) => (isoDateString ? new Date(isoDateString) : isoDateString));
    }

    // simulating real server call with a 500ms delay
    setTimeout(() => {
        params.success(dates);
    }, 500);
}

function getEmployeesAsync(params: SetFilterValuesFuncParams<any, string[]>) {
    if (!fakeServer) {
        // wait for init
        setTimeout(() => getEmployeesAsync(params), 500);
        return;
    }
    const employees = fakeServer.getEmployees();

    // simulating real server call with a 500ms delay
    setTimeout(() => {
        params.success(employees);
    }, 500);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/tree-data.json')
        .then((response) => response.json())
        .then(function (data) {
            // setup the fake server with entire dataset
            fakeServer = new FakeServer(data);

            // create datasource with a reference to the fake server
            const datasource = getServerSideDatasource(fakeServer);

            // register the datasource with the grid
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});
