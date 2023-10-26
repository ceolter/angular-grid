import { createGrid, GridApi, GridOptions } from '@ag-grid-community/core';

let gridApi: GridApi;

const gridOptions: GridOptions = {

    rowData: [
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxter', price: 72000 }
    ],

    columnDefs: [
        { field: 'make' },
        { field: 'model' },
        { field: 'price' }
    ],

    defaultColDef: {
        filter: true, // TBC, remove if default to true change is implemented
        sortable: true, // TBC, remove if default to true change is implemented
        resizable: true
    }

}

document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
    gridApi.sizeColumnsToFit();

    fetch('https://www.ag-grid.com/example-assets/row-data.json')
        .then(response => response.json())
        .then((data: any) => gridApi.setRowData(data))
})