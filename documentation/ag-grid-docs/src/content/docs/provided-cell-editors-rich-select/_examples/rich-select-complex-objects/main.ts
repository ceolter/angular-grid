import type { ColDef, GridApi, GridOptions, IRichCellEditorParams } from 'ag-grid-community';
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
        headerName: 'Color (Column as String Type)',
        field: 'color',
        width: 250,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            formatValue: (v) => v.name,
            parseValue: (v) => v.name,
            values: colors,
            searchType: 'matchAny',
            allowTyping: true,
            filterList: true,
            valueListMaxHeight: 220,
        } as IRichCellEditorParams,
    },
    {
        headerName: 'Color (Column as Complex Object)',
        field: 'detailedColor',
        width: 290,
        valueFormatter: (p) => `${p.value.name} (${p.value.code})`,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            formatValue: (v) => v.name,
            values: colors,
            searchType: 'matchAny',
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
    rowData: colors.map((v) => ({ color: v.name, detailedColor: v })),
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
