import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, RowDragCallbackParams, RowDragEndEvent } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

const rowDrag = function (params: RowDragCallbackParams) {
    // only rows that are NOT groups should be draggable
    return !params.node.group;
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'athlete', rowDrag: rowDrag },
        { field: 'country', rowGroup: true },
        { field: 'year', width: 100 },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
    ],
    defaultColDef: {
        width: 170,
        filter: true,
    },
    groupDefaultExpanded: 1,
    onRowDragMove: onRowDragMove,
    onGridReady: (params) => {
        params.api.setGridOption('rowData', getData());
    },
};

function onRowDragMove(event: RowDragEndEvent) {
    const movingNode = event.node!;
    const overNode = event.overNode!;

    // find out what country group we are hovering over
    let groupCountry;
    if (overNode.group) {
        // if over a group, we take the group key (which will be the
        // country as we are grouping by country)
        groupCountry = overNode.key;
    } else {
        // if over a non-group, we take the country directly
        groupCountry = overNode.data.country;
    }

    const needToChangeParent = movingNode.data.country !== groupCountry;

    if (needToChangeParent) {
        const movingData = movingNode.data;
        movingData.country = groupCountry;
        gridApi!.applyTransaction({
            update: [movingData],
        });
        gridApi!.clearFocusedCell();
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
