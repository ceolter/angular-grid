import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { CustomHeader } from './customHeader_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    rowData: null,
    defaultColDef: {
        headerComponent: CustomHeader,
    },
};

function onBtUpperNames() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.headerName = c.field!.toUpperCase();
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtLowerNames() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.headerName = c.field;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtFilterOn() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.filter = true;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtFilterOff() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.filter = false;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtResizeOn() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.resizable = true;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

function onBtResizeOff() {
    const columnDefs: ColDef[] = [
        { field: 'athlete' },
        { field: 'age' },
        { field: 'country' },
        { field: 'year' },
        { field: 'date' },
        { field: 'sport' },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ];
    columnDefs.forEach((c) => {
        c.resizable = false;
    });
    gridApi!.setGridOption('columnDefs', columnDefs);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data);
        });
});
