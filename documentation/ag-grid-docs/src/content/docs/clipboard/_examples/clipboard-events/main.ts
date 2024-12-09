import type {
    CellValueChangedEvent,
    CutEndEvent,
    CutStartEvent,
    GridApi,
    GridOptions,
    PasteEndEvent,
    PasteStartEvent,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { CellSelectionModule, ClipboardModule, ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnMenuModule,
    ContextMenuModule,
    CellSelectionModule,
    ValidationModule /* Development Only */,
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

    cellSelection: true,

    onCellValueChanged: onCellValueChanged,
    onCutStart: onCutStart,
    onCutEnd: onCutEnd,
    onPasteStart: onPasteStart,
    onPasteEnd: onPasteEnd,
};

function onCellValueChanged(params: CellValueChangedEvent) {
    console.log('Callback onCellValueChanged:', params);
}

function onCutStart(params: CutStartEvent) {
    console.log('Callback onCutStart:', params);
}

function onCutEnd(params: CutEndEvent) {
    console.log('Callback onCutEnd:', params);
}

function onPasteStart(params: PasteStartEvent) {
    console.log('Callback onPasteStart:', params);
}

function onPasteEnd(params: PasteEndEvent) {
    console.log('Callback onPasteEnd:', params);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
