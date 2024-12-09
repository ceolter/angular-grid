import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    CellStyleModule,
    ClientSideRowModelModule,
    ICellRendererParams,
    ModuleRegistry,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { ColumnMenuModule, ContextMenuModule, ExcelExportModule } from 'ag-grid-enterprise';

import { CountryCellRenderer } from './countryCellRenderer_typescript';
import { createBase64FlagsFromResponse } from './imageUtils';
import type { FlagContext } from './interfaces';

ModuleRegistry.registerModules([
    CellStyleModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
    ValidationModule /* Development Only */,
]);

const countryCodes: any = {};
const base64flags: any = {};

const columnDefs: ColDef[] = [
    { field: 'athlete', width: 200 },
    {
        field: 'country',
        cellClass: 'countryCell',
        cellRenderer: CountryCellRenderer,
    },
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
    excelStyles: [
        {
            id: 'countryCell',
            alignment: {
                vertical: 'Center',
                indent: 4,
            },
        },
    ],
    defaultExcelExportParams: {
        addImageToCell: (rowIndex, col, value) => {
            if (col.getColId() !== 'country') {
                return;
            }

            const countryCode = countryCodes[value];
            return {
                image: {
                    id: countryCode,
                    base64: base64flags[countryCode],
                    imageType: 'png',
                    width: 20,
                    height: 11,
                    position: {
                        offsetX: 10,
                        offsetY: 5.5,
                    },
                },
                value,
            };
        },
    },
    context: {
        base64flags: base64flags,
        countryCodes: countryCodes,
    } as FlagContext,
    onGridReady: (params) => {
        fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
            .then((data) => createBase64FlagsFromResponse(data, countryCodes, base64flags))
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
