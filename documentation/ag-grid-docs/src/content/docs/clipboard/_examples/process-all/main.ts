import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, ProcessDataFromClipboardParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    MenuModule,
    CellSelectionModule,
]);

const columnDefs: ColDef[] = [{ field: 'a' }, { field: 'b' }, { field: 'c' }, { field: 'd' }, { field: 'e' }];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    rowData: getData(),
    columnDefs: columnDefs,
    cellSelection: true,

    defaultColDef: {
        editable: true,
        minWidth: 120,
        flex: 1,

        cellClassRules: {
            'cell-green': 'value.startsWith("Green")',
            'cell-blue': 'value.startsWith("Blue")',
            'cell-red': 'value.startsWith("Red")',
            'cell-yellow': 'value.startsWith("Yellow")',
        },
    },

    processDataFromClipboard,
};

function processDataFromClipboard(params: ProcessDataFromClipboardParams): string[][] | null {
    let containsRed;
    let containsYellow;
    const data = params.data;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        for (let j = 0; j < row.length; j++) {
            const value = row[j];
            if (value) {
                if (value.startsWith('Red')) {
                    containsRed = true;
                } else if (value.startsWith('Yellow')) {
                    containsYellow = true;
                }
            }
        }
    }

    if (containsRed) {
        // replace the paste request with another
        return [
            ['Custom 1', 'Custom 2'],
            ['Custom 3', 'Custom 4'],
        ];
    }

    if (containsYellow) {
        // cancels the paste
        return null;
    }

    return data;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
