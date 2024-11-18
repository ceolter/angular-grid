import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { NumericEditor } from './numericEditor_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            headerName: 'Provided Text',
            field: 'name',
            width: 300,
        },
        {
            headerName: 'Custom Numeric',
            field: 'number',
            cellEditor: NumericEditor,
            editable: true,
            width: 280,
        },
    ],
    rowData: [
        { name: 'Bob', mood: 'Happy', number: 10 },
        { name: 'Harry', mood: 'Sad', number: 3 },
        { name: 'Sally', mood: 'Happy', number: 20 },
        { name: 'Mary', mood: 'Sad', number: 5 },
        { name: 'John', mood: 'Happy', number: 15 },
        { name: 'Jack', mood: 'Happy', number: 25 },
        { name: 'Sue', mood: 'Sad', number: 43 },
        { name: 'Sean', mood: 'Sad', number: 1335 },
        { name: 'Niall', mood: 'Happy', number: 2 },
        { name: 'Alberto', mood: 'Happy', number: 123 },
        { name: 'Fred', mood: 'Sad', number: 532 },
        { name: 'Jenny', mood: 'Happy', number: 34 },
        { name: 'Larry', mood: 'Happy', number: 13 },
    ],
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
