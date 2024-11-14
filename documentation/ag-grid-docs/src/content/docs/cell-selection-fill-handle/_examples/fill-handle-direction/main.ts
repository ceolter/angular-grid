import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CellSelectionModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, CellSelectionModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 150 },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        editable: true,
        cellDataType: false,
    },
    cellSelection: {
        handle: {
            mode: 'fill',
            direction: 'x',
        },
    },
};

function fillHandleAxis(direction: 'x' | 'y' | 'xy') {
    const buttons = Array.prototype.slice.call(document.querySelectorAll('.ag-fill-direction'));
    const button = document.querySelector('.ag-fill-direction.' + direction)!;

    buttons.forEach((btn) => {
        btn.classList.remove('selected');
    });

    button.classList.add('selected');

    gridApi.setGridOption('cellSelection', {
        handle: {
            mode: 'fill',
            direction,
        },
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
