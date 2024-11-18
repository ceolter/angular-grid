import type {
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererParams,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    IsServerSideGroupOpenByDefaultParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { TreeDataModule } from 'ag-grid-enterprise';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ColumnsToolPanelModule,
    MenuModule,
    TreeDataModule,
    ServerSideRowModelModule,
]);

const columnDefs: ColDef[] = [
    { field: 'employeeId', hide: true },
    { field: 'employeeName', hide: true },
    { field: 'jobTitle' },
    { field: 'employmentType' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        width: 240,
        flex: 1,
        sortable: false,
    },
    autoGroupColumnDef: {
        field: 'employeeName',
        cellRendererParams: {
            innerRenderer: (params: ICellRendererParams) => {
                // display employeeName rather than group key (employeeId)
                return params.data.employeeName;
            },
        },
    },
    rowModelType: 'serverSide',
    treeData: true,
    columnDefs: columnDefs,
    isServerSideGroupOpenByDefault: (params: IsServerSideGroupOpenByDefaultParams) => {
        // open first two levels by default
        return params.rowNode.level < 2;
    },
    isServerSideGroup: (dataItem: any) => {
        // indicate if node is a group
        return dataItem.group;
    },
    getServerSideGroupKey: (dataItem: any) => {
        // specify which group key to use
        return dataItem.employeeId;
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-tree-data.json')
        .then((response) => response.json())
        .then(function (data) {
            const fakeServer = createFakeServer(data);
            const datasource = createServerSideDatasource(fakeServer);
            gridApi!.setGridOption('serverSideDatasource', datasource);
        });
});

function createFakeServer(fakeServerData: any[]) {
    const fakeServer = {
        data: fakeServerData,
        getData: function (request: IServerSideGetRowsRequest) {
            function extractRowsFromData(groupKeys: string[], data: any[]): any {
                if (groupKeys.length === 0) {
                    return data.map(function (d) {
                        return {
                            group: !!d.children,
                            employeeId: d.employeeId,
                            employeeName: d.employeeName,
                            employmentType: d.employmentType,
                            jobTitle: d.jobTitle,
                        };
                    });
                }

                const key = groupKeys[0];
                for (let i = 0; i < data.length; i++) {
                    if (data[i].employeeId === key) {
                        return extractRowsFromData(groupKeys.slice(1), data[i].children.slice());
                    }
                }
            }

            return extractRowsFromData(request.groupKeys, this.data);
        },
    };

    return fakeServer;
}

function createServerSideDatasource(fakeServer: any) {
    const dataSource: IServerSideDatasource = {
        getRows: (params: IServerSideGetRowsParams) => {
            console.log('ServerSideDatasource.getRows: params = ', params);

            const allRows = fakeServer.getData(params.request);

            const request = params.request;
            const doingInfinite = request.startRow != null && request.endRow != null;
            const result = doingInfinite
                ? {
                      rowData: allRows.slice(request.startRow, request.endRow),
                      rowCount: allRows.length,
                  }
                : { rowData: allRows };
            console.log('getRows: result = ', result);
            setTimeout(() => {
                params.success(result);
            }, 200);
        },
    };

    return dataSource;
}
