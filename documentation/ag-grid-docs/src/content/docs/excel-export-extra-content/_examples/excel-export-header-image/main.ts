import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

import { agGridLogo } from './logo';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 200 },
        { field: 'country', minWidth: 200 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        filter: true,
        minWidth: 100,
        flex: 1,
    },

    popupParent: document.body,

    defaultExcelExportParams: {
        headerFooterConfig: {
            all: {
                header: [
                    {
                        value: '&[Picture]',
                        image: {
                            id: 'logo',
                            base64: agGridLogo,
                            width: 720,
                            height: 250,
                            imageType: 'png',
                            recolor: 'Grayscale',
                        },
                        position: 'Center',
                    },
                ],
            },
        },
    },
};

function onBtExport() {
    gridApi!.exportDataAsExcel();
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data) =>
            gridApi!.setGridOption(
                'rowData',
                data.filter((rec: any) => rec.country != null)
            )
        );
});
