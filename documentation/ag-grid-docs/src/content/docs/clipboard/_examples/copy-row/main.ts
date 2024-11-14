import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CellSelectionModule, ClipboardModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    MenuModule,
    CellSelectionModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 200 },
        { field: 'age' },
        { field: 'country', minWidth: 150 },
        { field: 'year' },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],

    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
    },

    rowSelection: {
        mode: 'multiRow',
        copySelectedRows: false,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});

function toggleCopyRows() {
    gridApi.setGridOption('rowSelection', {
        mode: 'multiRow',
        copySelectedRows: document.querySelector<HTMLInputElement>('#toggle-copy-rows')?.checked ?? false,
    });
}
