import { ClientSideRowModelModule } from 'ag-grid-community';
import type { CellValueChangedEvent, GridApi, GridOptions, RowValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';

import { NumericCellEditor } from './numericCellEditor_typescript';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, ColumnsToolPanelModule, MenuModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [
        {
            field: 'make',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
            },
        },
        { field: 'model' },
        { field: 'field4', headerName: 'Read Only', editable: false },
        { field: 'price', cellEditor: NumericCellEditor },
        {
            headerName: 'Suppress Navigable',
            field: 'field5',
            suppressNavigable: true,
            minWidth: 200,
        },
        { headerName: 'Read Only', field: 'field6', editable: false },
    ],
    defaultColDef: {
        flex: 1,
        editable: true,
        cellDataType: false,
    },
    editType: 'fullRow',
    rowData: getRowData(),

    onCellValueChanged: onCellValueChanged,
    onRowValueChanged: onRowValueChanged,
};

function onCellValueChanged(event: CellValueChangedEvent) {
    console.log('onCellValueChanged: ' + event.colDef.field + ' = ' + event.newValue);
}

function onRowValueChanged(event: RowValueChangedEvent) {
    const data = event.data;
    console.log('onRowValueChanged: (' + data.make + ', ' + data.model + ', ' + data.price + ', ' + data.field5 + ')');
}

function getRowData() {
    const rowData = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({
            make: 'Toyota',
            model: 'Celica',
            price: 35000 + i * 1000,
            field4: 'Sample XX',
            field5: 'Sample 22',
            field6: 'Sample 23',
        });
        rowData.push({
            make: 'Ford',
            model: 'Mondeo',
            price: 32000 + i * 1000,
            field4: 'Sample YY',
            field5: 'Sample 24',
            field6: 'Sample 25',
        });
        rowData.push({
            make: 'Porsche',
            model: 'Boxster',
            price: 72000 + i * 1000,
            field4: 'Sample ZZ',
            field5: 'Sample 26',
            field6: 'Sample 27',
        });
    }
    return rowData;
}

function onBtStopEditing() {
    gridApi!.stopEditing();
}

function onBtStartEditing() {
    gridApi!.setFocusedCell(1, 'make');
    gridApi!.startEditingCell({
        rowIndex: 1,
        colKey: 'make',
    });
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(eGridDiv, gridOptions);
});
