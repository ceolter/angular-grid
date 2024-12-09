import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowDragModule,
    RowStyleModule,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { getData } from './data';
import { DragSourceRenderer } from './dragSourceRenderer_typescript';

ModuleRegistry.registerModules([
    TextFilterModule,
    RowDragModule,
    RowStyleModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const rowClassRules = {
    'red-row': 'data.color == "Red"',
    'green-row': 'data.color == "Green"',
    'blue-row': 'data.color == "Blue"',
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        width: 80,
        filter: true,
    },
    rowClassRules: rowClassRules,
    rowData: getData(),
    rowDragManaged: true,
    columnDefs: [
        { cellRenderer: DragSourceRenderer, minWidth: 100 },
        { field: 'id' },
        { field: 'color' },
        { field: 'value1' },
        { field: 'value2' },
    ],
};

function onDragOver(event: any) {
    const types = event.dataTransfer.types;

    const dragSupported = types.length;

    if (dragSupported) {
        event.dataTransfer.dropEffect = 'move';
    }

    event.preventDefault();
}

function onDrop(event: any) {
    event.preventDefault();

    const textData = event.dataTransfer.getData('text/plain');
    const eJsonRow = document.createElement('div');
    eJsonRow.classList.add('json-row');
    eJsonRow.innerText = textData;

    const eJsonDisplay = document.querySelector('#eJsonDisplay')!;
    eJsonDisplay.appendChild(eJsonRow);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
