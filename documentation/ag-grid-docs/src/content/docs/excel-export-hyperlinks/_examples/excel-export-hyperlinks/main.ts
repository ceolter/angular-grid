import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'company' }, { field: 'url', cellClass: 'hyperlinks' }],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    defaultExcelExportParams: {
        autoConvertFormulas: true,
        processCellCallback: (params) => {
            const field = params.column.getColDef().field;
            return field === 'url' ? `=HYPERLINK("${params.value}")` : params.value;
        },
    },
    excelStyles: [
        {
            id: 'hyperlinks',
            font: {
                underline: 'Single',
                color: '#358ccb',
            },
        },
    ],

    rowData: [
        { company: 'Google', url: 'https://www.google.com' },
        { company: 'Adobe', url: 'https://www.adobe.com' },
        { company: 'The New York Times', url: 'https://www.nytimes.com' },
        { company: 'Twitter', url: 'https://www.twitter.com' },
        { company: 'StackOverflow', url: 'https://stackoverflow.com/' },
        { company: 'Reddit', url: 'https://www.reddit.com' },
        { company: 'Github', url: 'https://www.github.com' },
        { company: 'Microsoft', url: 'https://www.microsoft.com' },
        { company: 'Gizmodo', url: 'https://www.gizmodo.com' },
        { company: 'LinkedIN', url: 'https://www.linkedin.com' },
    ],
};

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
