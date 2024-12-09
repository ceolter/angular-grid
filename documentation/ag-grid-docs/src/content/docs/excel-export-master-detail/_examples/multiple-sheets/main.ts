import type {
    FirstDataRenderedEvent,
    GetRowIdParams,
    GridApi,
    GridOptions,
    IDetailCellRendererParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import {
    ClipboardModule,
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    ExcelExportModule,
    MasterDetailModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    RowApiModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IAccount>;

const gridOptions: GridOptions<IAccount> = {
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        { field: 'name', cellRenderer: 'agGroupCellRenderer' },
        { field: 'account' },
        { field: 'calls' },
        { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
    ],
    defaultColDef: {
        flex: 1,
    },
    getRowId: (params: GetRowIdParams) => {
        return params.data.name;
    },
    groupDefaultExpanded: 1,
    rowBuffer: 100,
    masterDetail: true,
    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                { field: 'callId' },
                { field: 'direction' },
                { field: 'number', minWidth: 150 },
                { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
                { field: 'switchCode', minWidth: 150 },
            ],
            defaultColDef: {
                flex: 1,
            },
        },
        getDetailRowData: (params) => {
            params.successCallback(params.data.callRecords);
        },
    } as IDetailCellRendererParams<IAccount, ICallRecord>,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.forEachNode(function (node) {
        node.setExpanded(true);
    });
}

function onBtExport() {
    const spreadsheets = [];

    const mainSheet = gridApi!.getSheetDataForExcel();
    if (mainSheet) {
        spreadsheets.push(mainSheet);
    }

    gridApi!.forEachDetailGridInfo(function (node) {
        const sheet = node.api!.getSheetDataForExcel({
            sheetName: node.id.replace('detail_', ''),
        });
        if (sheet) {
            spreadsheets.push(sheet);
        }
    });

    gridApi!.exportMultipleSheetsAsExcel({
        data: spreadsheets,
        fileName: 'ag-grid.xlsx',
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/master-detail-data.json')
        .then((response) => response.json())
        .then((data: IAccount[]) => {
            gridApi!.setGridOption('rowData', data);
        });
});
