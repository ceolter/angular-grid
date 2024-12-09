import type {
    ColDef,
    GridApi,
    GridOptions,
    IRichCellEditorParams,
    KeyCreatorParams,
    ValueFormatterParams,
    ValueParserParams,
} from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextEditorModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';
import { RichSelectModule } from 'ag-grid-enterprise';

import { colors } from './colors';

ModuleRegistry.registerModules([
    TextEditorModule,
    ClientSideRowModelModule,
    RichSelectModule,
    ValidationModule /* Development Only */,
]);

const columnDefs: ColDef[] = [
    {
        headerName: 'Color',
        field: 'color',
        valueFormatter: (params: ValueFormatterParams) => params.value.name,
        valueParser: (params: ValueParserParams) => colors.find((color) => color.name === params.newValue),
        keyCreator: (params: KeyCreatorParams) => params.value.name,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            values: colors,
            searchType: 'matchAny',
            formatValue: (value) => value.name,
            allowTyping: true,
            filterList: true,
            valueListMaxHeight: 220,
        } as IRichCellEditorParams,
    },
];

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        width: 200,
        editable: true,
    },
    columnDefs: columnDefs,
    rowData: [{ color: colors[0] }, { color: colors[1] }, { color: colors[2] }, { color: colors[3] }],
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
