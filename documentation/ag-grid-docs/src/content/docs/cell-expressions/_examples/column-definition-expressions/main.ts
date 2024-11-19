import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellValueChangedEvent, ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: ColDef[] = [
    {
        headerName: 'String (editable)',
        field: 'simple',
        editable: true,
    },
    {
        headerName: 'Number (editable)',
        field: 'number',
        editable: true,
        valueFormatter: `"£" + Math.floor(value).toString().replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1,")`,
    },
    {
        headerName: 'Name (editable)',
        editable: true,
        valueGetter: 'data.firstName + " " + data.lastName',
        valueSetter:
            // an expression can span multiple lines!!!
            `var nameSplit = newValue.split(" ");
             var newFirstName = nameSplit[0];
             var newLastName = nameSplit[1];
             if (data.firstName !== newFirstName || data.lastName !== newLastName) {  
                data.firstName = newFirstName;  
                data.lastName = newLastName;  
                return true;
            } else {  
                return false;
            }`,
    },
    { headerName: 'A', field: 'a', width: 100 },
    { headerName: 'B', field: 'b', width: 100 },
    { headerName: 'A + B', valueGetter: 'data.a + data.b' },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        sortable: false,
    },
    rowData: getData(),
    onCellValueChanged: onCellValueChanged,
    autoSizeStrategy: { type: 'fitGridWidth' },
};

function onCellValueChanged(event: CellValueChangedEvent) {
    console.log('data after changes is: ', event.data);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
