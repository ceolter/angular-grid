import { AgChartsCommunityModule } from 'ag-charts-community';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { SparklinesModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, SparklinesModule.with(AgChartsCommunityModule)]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'symbol', maxWidth: 120 },
        { field: 'name', minWidth: 250 },
        {
            field: 'change',
            cellRenderer: 'agSparklineCellRenderer',
        },
        {
            field: 'volume',
            type: 'numericColumn',
            maxWidth: 140,
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    rowData: getData(),
    rowHeight: 50,
};

let intervalId: any;

function start() {
    if (intervalId) {
        return;
    }

    const updateData = () => {
        const itemsToUpdate: any[] = [];
        gridApi!.forEachNodeAfterFilterAndSort(function (rowNode) {
            const data = rowNode.data;
            if (!data) {
                return;
            }
            const n = data.change.length;
            const v = Math.random() > 0.5 ? Number(Math.random()) : -Number(Math.random());
            data.change = [...data.change.slice(1, n), v];
            itemsToUpdate.push(data);
        });
        gridApi!.applyTransaction({ update: itemsToUpdate });
    };

    intervalId = setInterval(updateData, 300);
}

function stop() {
    if (intervalId === undefined) {
        return;
    }
    clearInterval(intervalId);
    intervalId = undefined;
}

// setup the grid after the page has finished loading

document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
