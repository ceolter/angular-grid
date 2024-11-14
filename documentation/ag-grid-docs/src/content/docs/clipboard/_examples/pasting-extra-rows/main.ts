import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions, ProcessDataFromClipboardParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ClipboardModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { CellSelectionModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    MenuModule,
    CellSelectionModule,
]);

const columnDefs: ColDef[] = [
    { headerName: 'Athlete', field: 'athlete', width: 150 },
    { headerName: 'Age', field: 'age', width: 90 },
    { headerName: 'Country', field: 'country', width: 120 },
    { headerName: 'Year', field: 'year', width: 90 },
    { headerName: 'Date', field: 'date', width: 110 },
    { headerName: 'Sport', field: 'sport', width: 110 },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        editable: true,
    },
    columnDefs,
    rowSelection: {
        mode: 'multiRow',
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: true,
        copySelectedRows: true,
    },
    processDataFromClipboard,
};

function processDataFromClipboard(params: ProcessDataFromClipboardParams): string[][] | null {
    const data = [...params.data];
    const emptyLastRow = data[data.length - 1][0] === '' && data[data.length - 1].length === 1;

    if (emptyLastRow) {
        data.splice(data.length - 1, 1);
    }

    const lastIndex = params.api!.getDisplayedRowCount() - 1;
    const focusedCell = params.api!.getFocusedCell();
    const focusedIndex = focusedCell!.rowIndex;

    if (focusedIndex + data.length - 1 > lastIndex) {
        const resultLastIndex = focusedIndex + (data.length - 1);
        const numRowsToAdd = resultLastIndex - lastIndex;

        const rowsToAdd: any[] = [];
        for (let i = 0; i < numRowsToAdd; i++) {
            const index = data.length - 1;
            const row = data.slice(index, index + 1)[0];

            // Create row object
            const rowObject: any = {};
            let currentColumn: any = focusedCell!.column;
            row.forEach((item) => {
                if (!currentColumn) {
                    return;
                }
                rowObject[currentColumn.colDef.field] = item;
                currentColumn = params.api!.getDisplayedColAfter(currentColumn);
            });

            rowsToAdd.push(rowObject);
        }

        params.api!.applyTransaction({ add: rowsToAdd });
    }

    return data;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => gridApi!.setGridOption('rowData', data.slice(0, 8)));
});
