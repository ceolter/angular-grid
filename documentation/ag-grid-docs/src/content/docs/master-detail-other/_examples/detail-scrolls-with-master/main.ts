import { ClientSideRowModelModule } from 'ag-grid-community';
import type { FirstDataRenderedEvent, GridApi, GridOptions, IDetailCellRendererParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    MenuModule,
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
        width: 300,
    },
    masterDetail: true,
    embedFullWidthRows: true,
    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                { field: 'callId' },
                { field: 'direction' },
                { field: 'number' },
                { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
                { field: 'switchCode' },
            ],
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
