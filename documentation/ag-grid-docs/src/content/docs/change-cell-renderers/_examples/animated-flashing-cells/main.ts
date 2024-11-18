import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi;

function formatNumber(number: number) {
    return Math.floor(number).toLocaleString();
}

const gridOptions: GridOptions = {
    columnDefs: [
        { field: 'a', enableCellChangeFlash: true },
        { field: 'b', enableCellChangeFlash: true },
        { field: 'c', cellRenderer: 'agAnimateShowChangeCellRenderer' },
        { field: 'd', cellRenderer: 'agAnimateShowChangeCellRenderer' },
        { field: 'e', cellRenderer: 'agAnimateSlideCellRenderer' },
        { field: 'f', cellRenderer: 'agAnimateSlideCellRenderer' },
    ],
    defaultColDef: {
        flex: 1,
        cellClass: 'align-right',
        valueFormatter: (params) => {
            return formatNumber(params.value);
        },
    },
    rowData: createRowData(),
    onGridReady: () => {
        const updateValues = () => {
            const rowCount = gridApi!.getDisplayedRowCount();
            // pick 2 cells at random to update
            for (let i = 0; i < 2; i++) {
                const row = Math.floor(Math.random() * rowCount);
                const rowNode = gridApi!.getDisplayedRowAtIndex(row)!;
                const col = ['a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 6)];
                rowNode.setDataValue(col, Math.floor(Math.random() * 10000));
            }
        };

        setInterval(updateValues, 250);
    },
};

function createRowData() {
    const rowData = [];

    for (let i = 0; i < 20; i++) {
        rowData.push({
            a: Math.floor(((i + 323) * 145045) % 10000),
            b: Math.floor(((i + 323) * 543020) % 10000),
            c: Math.floor(((i + 323) * 305920) % 10000),
            d: Math.floor(((i + 323) * 204950) % 10000),
            e: Math.floor(((i + 323) * 103059) % 10000),
            f: Math.floor(((i + 323) * 468276) % 10000),
        });
    }

    return rowData;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
