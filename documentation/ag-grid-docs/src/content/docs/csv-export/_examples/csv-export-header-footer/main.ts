import type { GridApi, GridOptions } from 'ag-grid-community';
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

    columnDefs: [{ field: 'make' }, { field: 'model' }, { field: 'price' }],

    rowData: [
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 },
    ],
};

function getValue(inputSelector: string) {
    const text = (document.querySelector(inputSelector) as HTMLInputElement).value;
    switch (text) {
        case 'string':
            return (
                'Here is a comma, and a some "quotes". You can see them using the\n' +
                'api.getDataAsCsv() button but they will not be visible when the downloaded\n' +
                'CSV file is opened in Excel because string content passed to\n' +
                'prependContent and appendContent is not escaped.'
            );
        case 'array':
            return [
                [],
                [
                    {
                        data: {
                            value: 'Here is a comma, and a some "quotes".',
                            type: 'String',
                        },
                    },
                ],
                [
                    {
                        data: {
                            value: 'They are visible when the downloaded CSV file is opened in Excel because custom content is properly escaped (provided that suppressQuotes is not set to true)',
                            type: 'String',
                        },
                    },
                ],
                [
                    { data: { value: 'this cell:', type: 'String' }, mergeAcross: 1 },
                    {
                        data: {
                            value: 'is empty because the first cell has mergeAcross=1',
                            type: 'String',
                        },
                    },
                ],
                [],
            ];
        case 'none':
            return;
        default:
            return text;
    }
}

function getParams() {
    return {
        prependContent: getValue('#prependContent'),
        appendContent: getValue('#appendContent'),
        suppressQuotes: undefined,
        columnSeparator: undefined,
    };
}

function onBtnExport() {
    const params = getParams();
    if (params.suppressQuotes || params.columnSeparator) {
        alert(
            'NOTE: you are downloading a file with non-standard quotes or separators - it may not render correctly in Excel.'
        );
    }
    gridApi!.exportDataAsCsv(params);
}

function onBtnUpdate() {
    (document.querySelector('#csvResult') as any).value = gridApi!.getDataAsCsv(getParams());
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
