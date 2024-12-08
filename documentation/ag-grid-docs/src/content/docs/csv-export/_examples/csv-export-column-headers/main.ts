import type { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    CsvExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule /* Development Only */,
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
        { headerName: 'Brand', children: [{ field: 'make' }, { field: 'model' }] },
        {
            headerName: 'Value',
            children: [{ field: 'price' }],
        },
    ],

    rowData: [
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 },
    ],

    onGridReady: (params: GridReadyEvent) => {
        (document.getElementById('columnGroups') as HTMLInputElement).checked = true;
    },
};

function getBoolean(id: string) {
    const field = document.querySelector('#' + id) as HTMLInputElement;

    return !!field.checked;
}

function getParams() {
    return {
        skipColumnGroupHeaders: getBoolean('columnGroups'),
        skipColumnHeaders: getBoolean('skipHeader'),
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
