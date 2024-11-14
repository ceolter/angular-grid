import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

import { CountryCellRenderer } from './countryCellRenderer_typescript';
import { createBase64FlagsFromResponse } from './imageUtils';
import type { FlagContext } from './interfaces';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, ExcelExportModule, MenuModule]);

const countryCodes: any = {};
const base64flags: any = {};

const columnDefs: ColDef[] = [
    {
        field: 'country',
        headerName: ' ',
        minWidth: 70,
        width: 70,
        maxWidth: 70,
        cellRenderer: CountryCellRenderer,
        cellRendererParams: {
            base64flags: base64flags,
            countryCodes: countryCodes,
        },
    },
    { field: 'athlete' },
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
                        offsetX: 30,
                        offsetY: 5.5,
                    },
                },
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
