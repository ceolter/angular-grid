import type {
    FirstDataRenderedEvent,
    GetRowIdParams,
    GridApi,
    GridOptions,
    IDetailCellRendererParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ColumnsToolPanelModule, ContextMenuModule, MasterDetailModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    RowApiModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    masterDetail: true,
    isRowMaster: (dataItem: any) => {
        return dataItem ? dataItem.callRecords.length > 0 : false;
    },
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
    getRowId: (params: GetRowIdParams) => String(params.data.account),
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
    onFirstDataRendered: onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    // arbitrarily expand a row for presentational purposes
    setTimeout(() => {
        params.api.getDisplayedRowAtIndex(1)!.setExpanded(true);
    }, 0);
}

function onBtClearMilaCalls() {
    const milaSmithRowNode = gridApi!.getRowNode('177001')!;
    const milaSmithData = milaSmithRowNode.data;
    milaSmithData.callRecords = [];
    gridApi!.applyTransaction({ update: [milaSmithData] });
}

function onBtSetMilaCalls() {
    const milaSmithRowNode = gridApi!.getRowNode('177001')!;
    const milaSmithData = milaSmithRowNode.data;
    milaSmithData.callRecords = [
        {
            name: 'susan',
            callId: 579,
            duration: 23,
            switchCode: 'SW5',
            direction: 'Out',
            number: '(02) 47485405',
        },
        {
            name: 'susan',
            callId: 580,
            duration: 52,
            switchCode: 'SW3',
            direction: 'In',
            number: '(02) 32367069',
        },
    ];
    gridApi!.applyTransaction({ update: [milaSmithData] });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/master-detail-dynamic-data.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
