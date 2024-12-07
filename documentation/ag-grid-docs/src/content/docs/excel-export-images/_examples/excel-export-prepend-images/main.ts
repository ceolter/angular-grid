import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

import { logos } from './imageUtils';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    CsvExportModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete' },
    { field: 'country' },
    { field: 'age' },
    { field: 'year' },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        width: 150,
    },
    defaultExcelExportParams: {
        prependContent: [
            {
                cells: [
                    {
                        data: {
                            type: 'String',
                            value: logos.AgGrid, // see imageUtils
                        },
                        mergeAcross: 1,
                    },
                ],
            },
        ],
        rowHeight: (params) => (params.rowIndex === 1 ? 82 : 20),
        addImageToCell: (rowIndex, col, value) => {
            if (rowIndex !== 1 || col.getColId() !== 'athlete') {
                return;
            }

            return {
                image: {
                    id: 'logo',
                    base64: value,
                    imageType: 'png',
                    width: 295,
                    height: 100,
                    position: {
                        colSpan: 2,
                    },
                },
            };
        },
    },
    onGridReady: (params) => {
        fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
            .then((response) => response.json())
            .then((data) => params.api.setGridOption('rowData', data));
    },
};

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
