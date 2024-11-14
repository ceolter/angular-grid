import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellValueChangedEvent, GridApi, GridOptions, ValueParserParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        { headerName: 'Name', field: 'simple' },
        { headerName: 'Bad Number', field: 'numberBad' },
        {
            headerName: 'Good Number',
            field: 'numberGood',
            valueParser: numberParser,
        },
    ],
    defaultColDef: {
        flex: 1,
        editable: true,
        cellDataType: false,
    },
    rowData: getData(),
    onCellValueChanged: onCellValueChanged,
};

function onCellValueChanged(event: CellValueChangedEvent) {
    console.log('data after changes is: ', event.data);
}

function numberParser(params: ValueParserParams) {
    return Number(params.newValue);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
