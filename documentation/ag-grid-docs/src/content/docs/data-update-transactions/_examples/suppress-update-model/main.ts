import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    GetRowIdParams,
    IAggFuncParams,
    IDoesFilterPassParams,
    IFilterComp,
    IFilterParams,
    IFilterType,
    IsGroupOpenByDefaultParams,
    createGrid,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { createDataItem, getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RowGroupingModule]);

function getRowId(params) {
    return String(params.data.id);
}

let gridApi: GridApi;
const columnDefs: ColDef[] = [
    { field: 'name' },
    { field: 'laptop' },
    {
        field: 'fixed',
        enableCellChangeFlash: true,
    },
    {
        field: 'value',
        enableCellChangeFlash: true,
        sort: 'desc',
    },
];

function onBtnApply() {
    const updatedItems: any[] = [];
    gridApi.forEachNode((rowNode) => {
        const newValue = Math.floor(Math.random() * 100) + 10;
        const newBoolean = Boolean(Math.round(Math.random()));
        const newItem = createDataItem(rowNode.data.name, rowNode.data.laptop, newBoolean, newValue, rowNode.data.id);
        updatedItems.push(newItem);
    });

    gridApi.applyTransaction({ update: updatedItems });
}

function onBtnRefreshModel() {
    gridApi.refreshClientSideRowModel('filter');
}

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        filter: true,
        floatingFilter: true,
    },
    getRowId: getRowId,
    suppressModelUpdateAfterUpdateTransaction: true,
    onGridReady: (params) => {
        params.api
            .setColumnFilterModel('fixed', {
                filterType: 'set',
                values: ['true'],
            })
            .then(() => {
                gridApi.onFilterChanged();
            });
        params.api.setGridOption('rowData', getData());
    },
};

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
