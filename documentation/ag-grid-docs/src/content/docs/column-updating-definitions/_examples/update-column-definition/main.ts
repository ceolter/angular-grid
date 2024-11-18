import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const COL_DEFS: ColDef<IOlympicData>[] = [
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        initialWidth: 100,
        filter: true,
    },
    columnDefs: COL_DEFS,
};

function setHeaderNames() {
    COL_DEFS.forEach((colDef, index) => {
        colDef.headerName = 'C' + index;
    });
    gridApi!.setGridOption('columnDefs', COL_DEFS);
}

function removeHeaderNames() {
    COL_DEFS.forEach((colDef) => {
        colDef.headerName = undefined;
    });
    gridApi!.setGridOption('columnDefs', COL_DEFS);
}

function setValueFormatters() {
    COL_DEFS.forEach((colDef) => {
        colDef.valueFormatter = function (params) {
            return '[ ' + params.value + ' ]';
        };
    });
    gridApi!.setGridOption('columnDefs', COL_DEFS);
}

function removeValueFormatters() {
    COL_DEFS.forEach((colDef) => {
        colDef.valueFormatter = undefined;
    });
    gridApi!.setGridOption('columnDefs', COL_DEFS);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data) => {
            gridApi!.setGridOption('rowData', data);
        });
});
