import { ClientSideRowModelModule } from 'ag-grid-community';
import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

import { DetailCellRenderer } from './detailCellRenderer_typescript';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    MenuModule,
]);

declare let window: any;
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
    masterDetail: true,
    detailRowHeight: 310,
    detailCellRenderer: DetailCellRenderer,
    onFirstDataRendered: onFirstDataRendered,
};

function expandCollapseAll() {
    gridApi!.forEachNode(function (node) {
        node.expanded = !!window.collapsed;
    });

    window.collapsed = !window.collapsed;
    gridApi!.onGroupExpandedOrCollapsed();
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    // arbitrarily expand a row for presentational purposes
    setTimeout(() => {
        params.api.getDisplayedRowAtIndex(1)!.setExpanded(true);
    }, 0);
}

function printDetailGridInfo() {
    console.log("Currently registered detail grid's: ");
    gridApi!.forEachDetailGridInfo(function (detailGridInfo) {
        console.log(detailGridInfo);
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
