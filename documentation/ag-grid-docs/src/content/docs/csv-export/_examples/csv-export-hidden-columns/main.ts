import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CsvExportModule } from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        editable: true,
        minWidth: 100,
        flex: 1,
    },

    suppressExcelExport: true,
    popupParent: document.body,

    columnDefs: [
        { field: 'athlete' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'gold', hide: true },
        { field: 'silver', hide: true },
        { field: 'bronze', hide: true },
        { field: 'total' },
    ],

    rowData: getData(),
};

function getBoolean(id: string) {
    const field: any = document.querySelector('#' + id);

    return !!field.checked;
}

function getParams() {
    return {
        allColumns: getBoolean('allColumns'),
    };
}

function onBtnExport() {
    gridApi!.exportDataAsCsv(getParams());
}

function onBtnUpdate() {
    (document.querySelector('#csvResult') as any).value = gridApi!.getDataAsCsv(getParams());
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
