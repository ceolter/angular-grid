import type { FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { MasterDetailModule } from 'ag-grid-enterprise';

import { DetailCellRenderer } from './detailCellRenderer_typescript';

ModuleRegistry.registerModules([
    RowApiModule,
    ClientSideRowModelModule,
    MasterDetailModule,
    ValidationModule /* Development Only */,
]);

let gridApi: GridApi<IAccount>;

const gridOptions: GridOptions<IAccount> = {
    masterDetail: true,
    detailCellRenderer: DetailCellRenderer,
    detailRowHeight: 150,
    columnDefs: [
        // group cell renderer needed for expand / collapse icons
        { field: 'name', cellRenderer: 'agGroupCellRenderer', pinned: 'left' },
        { field: 'account' },
        { field: 'calls' },
        { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
        { headerName: 'Extra Col 1', valueGetter: '"AAA"' },
        { headerName: 'Extra Col 2', valueGetter: '"BBB"' },
        { headerName: 'Extra Col 3', valueGetter: '"CCC"' },
        { headerName: 'Pinned Right', pinned: 'right' },
    ],
    defaultColDef: {},
    embedFullWidthRows: true,
    onFirstDataRendered: onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
    setTimeout(() => {
        params.api.forEachNode(function (node) {
            node.setExpanded(node.id === '1');
        });
    }, 1000);
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
